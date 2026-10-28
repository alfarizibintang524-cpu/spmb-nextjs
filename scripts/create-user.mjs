import pool from "../lib/db.js";
import bcrypt from "bcryptjs";

async function createUser() {
  const nama = process.argv[2];
  const email = process.argv[3]?.toLowerCase();
  const role = process.argv[4];
  const password = process.env.INITIAL_USER_PASSWORD;

  if (
    !nama ||
    !email ||
    !["admin", "kepsek"].includes(role) ||
    !password ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      "Isi nama, email, role admin/kepsek, dan password yang valid."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await pool.execute(
    `INSERT INTO users (nama, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [nama, email, hashedPassword, role]
  );

  console.log(`Akun ${role} berhasil dibuat.`);
}

createUser()
  .catch((error) => {
    console.error("Gagal membuat akun:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());