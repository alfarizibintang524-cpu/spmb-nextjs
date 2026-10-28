import bcrypt from "bcryptjs";
import pool from "@/lib/db";

const DEFAULT_USERS = [
  {
    role: "admin",
    nama: "Admin SPMB",
    email: process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.DEFAULT_ADMIN_PASSWORD,
  },
  {
    role: "kepsek",
    nama: "Kepala Sekolah",
    email: process.env.DEFAULT_KEPSEK_EMAIL?.trim().toLowerCase(),
    password: process.env.DEFAULT_KEPSEK_PASSWORD,
  },
];

export async function ensureDefaultUsers() {
  const validUsers = DEFAULT_USERS.filter(
    (user) => user.email && user.password && user.password.length >= 8
  );

  if (!validUsers.length) {
    return false;
  }

  try {
    for (const user of validUsers) {
      const [rows] = await pool.execute(
        "SELECT id, role, nama, password FROM users WHERE email = ?",
        [user.email]
      );

      if (rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 12);

        await pool.execute(
          "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
          [user.nama, user.email, hashedPassword, user.role]
        );

        continue;
      }

      const currentUser = rows[0];
      const roleNeedsUpdate = currentUser.role !== user.role;
      const nameNeedsUpdate = currentUser.nama !== user.nama;

      if (roleNeedsUpdate || nameNeedsUpdate) {
        await pool.execute(
          "UPDATE users SET nama = ?, role = ? WHERE id = ?",
          [user.nama, user.role, currentUser.id]
        );
      }
    }

    return true;
  } catch (error) {
    console.warn("Skipping default user seed:", error.message || error);
    return false;
  }
}
