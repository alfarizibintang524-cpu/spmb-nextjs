import { notFound } from "next/navigation";
import pool from "@/lib/db";

export default async function DetailSiswaPage({ params }: PageProps<"/login/admin/data-siswa/[id]">) {
  const { id: rawId } = await params; const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [rows] = await pool.execute(
    `SELECT u.nama, u.email, b.nisn, b.tempat_lahir, b.tanggal_lahir, b.nomor_hp, b.alamat, b.asal_sekolah, b.nama_ortu,
      p.jurusan_1, p.jurusan_2, p.status, p.catatan
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id LEFT JOIN pendaftaran p ON p.user_id = u.id
     WHERE u.id = ? AND u.role = 'calon_siswa'`, [id]
  );
  if (!rows.length) notFound();
  const student = rows[0];
  return <><h1 className="page-title">Detail Calon Siswa</h1><div className="panel"><h3>{student.nama}</h3><p>{student.email}</p>
    <p>NISN: {student.nisn || "-"}</p><p>Tempat, tanggal lahir: {student.tempat_lahir || "-"}, {student.tanggal_lahir || "-"}</p>
    <p>Nomor HP: {student.nomor_hp || "-"}</p><p>Alamat: {student.alamat || "-"}</p><p>Asal sekolah: {student.asal_sekolah || "-"}</p>
    <p>Orang tua: {student.nama_ortu || "-"}</p><p>Jurusan: {student.jurusan_1 || "-"} / {student.jurusan_2 || "-"}</p>
    <p>Status seleksi: {student.status || "draft"}</p><p>Catatan: {student.catatan || "-"}</p></div></>;
}
