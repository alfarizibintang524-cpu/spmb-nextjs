import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { ensureDefaultUsers } from "@/lib/default-users";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || typeof password !== "string" || !password) {
      return Response.json(
        { message: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      await ensureDefaultUsers();
    }

    const [rows] = await pool.execute(
      `SELECT id, nama, email, password, role
       FROM users
       WHERE email = ?`,
      [email]
    );

    const user = rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return Response.json(
        { message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return Response.json(
        { message: "Konfigurasi sesi belum tersedia." },
        { status: 500 }
      );
    }

    const token = await new SignJWT({
      nama: user.nama,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(secret));

    const cookie = [
      `spmb_session=${token}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
    ];

    if (process.env.NODE_ENV === "production") {
      cookie.push("Secure");
    }

    const response = Response.json({
      message: "Login berhasil.",
      user: {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
    });

    response.headers.append("Set-Cookie", cookie.join("; "));

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}