import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();

    const nama = body.nama?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!nama || !email || typeof password !== "string") {
      return Response.json(
        { message: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    if (nama.length > 100 || email.length > 150) {
      return Response.json(
        { message: "Nama atau email terlalu panjang." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return Response.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }
    const nisn = String(body.nisn || "").trim();
    if (!/^\d{10}$/.test(nisn)) {
      return Response.json({ message: "NISN harus terdiri dari 10 digit." }, { status: 400 });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return Response.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Role ditentukan oleh server, bukan oleh form.
    await pool.execute(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, 'calon_siswa')`,
      [nama, email, hashedPassword]
    );

    return Response.json(
      { message: "Registrasi calon siswa berhasil." },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    console.error("Register error:", error);

    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}