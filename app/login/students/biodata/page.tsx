import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import { BiodataForm } from "../Forms";

export default async function BiodataPage() {
  const user = await requireRole("calon_siswa");
  const [rows] = await pool.execute(
    `SELECT u.nama, u.email, b.nisn, b.tempat_lahir,
            DATE_FORMAT(b.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
            b.nomor_hp, b.alamat, b.asal_sekolah, b.nama_ortu
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id WHERE u.id = ?`,
    [Number(user.id)]
  );
  const initialData = {
    nama: rows[0]?.nama || user.nama, email: rows[0]?.email || "", nisn: rows[0]?.nisn || "",
    tempat_lahir: rows[0]?.tempat_lahir || "", tanggal_lahir: rows[0]?.tanggal_lahir || "",
    nomor_hp: rows[0]?.nomor_hp || "", alamat: rows[0]?.alamat || "",
    asal_sekolah: rows[0]?.asal_sekolah || "", nama_ortu: rows[0]?.nama_ortu || "",
  };
  return <><h1 className="page-title">Biodata</h1><p className="page-sub">Lengkapi data diri calon siswa.</p>
    <div className="panel"><BiodataForm initialData={initialData} /></div></>;
}
