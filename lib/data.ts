import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export type CalonSiswa = {
  id: number;
  nama: string;
  email: string;
  created_at: Date;
};

export async function getCalonSiswa(limit?: number): Promise<CalonSiswa[]> {
  const query = `SELECT id, nama, email, created_at FROM users
     WHERE role = 'calon_siswa' ORDER BY created_at DESC, id DESC${limit ? " LIMIT ?" : ""}`;
  const [rows] = await pool.execute<RowDataPacket[]>(query, limit ? [Math.max(1, Math.floor(limit))] : []);

  return rows as unknown as CalonSiswa[];
}

export async function countCalonSiswa(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users WHERE role = 'calon_siswa'`
  );

  return Number(rows[0].total);
}

export function formatTanggal(tanggal: Date | string): string {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}