import Link from "next/link";
import pool from "@/lib/db";

export default async function DataCalonSiswaPage({ searchParams }: PageProps<"/login/admin/data-siswa">) {
  const params = await searchParams;
  const search = String(params.q || "").trim().slice(0, 100);
  const status = ["draft", "diajukan", "diterima", "ditolak"].includes(String(params.status)) ? String(params.status) : "";
  const [students] = await pool.execute(
    `SELECT u.id, u.nama, u.email, b.nisn, p.jurusan_1, p.jurusan_2, COALESCE(p.status, 'draft') AS status
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id LEFT JOIN pendaftaran p ON p.user_id = u.id
     WHERE u.role = 'calon_siswa' AND (? = '' OR u.nama LIKE ? OR u.email LIKE ?)
       AND (? = '' OR COALESCE(p.status, 'draft') = ?)
     ORDER BY u.created_at DESC, u.id DESC`,
    [search, `%${search}%`, `%${search}%`, status, status]
  );
  return <><div className="page-head"><div><h1 className="page-title">Data Calon Siswa</h1><p className="page-sub">Cari dan lihat status seluruh calon siswa.</p></div></div>
    <div className="panel"><form method="get"><input name="q" placeholder="Cari nama atau email" defaultValue={search} />
      <select name="status" defaultValue={status}><option value="">Semua status</option>{["draft", "diajukan", "diterima", "ditolak"].map((value) => <option key={value}>{value}</option>)}</select>
      <button className="btn-blue">Cari</button></form>
      <table className="table"><thead><tr><th>Nama</th><th>Email</th><th>NISN</th><th>Jurusan</th><th>Status</th><th>Detail</th></tr></thead>
        <tbody>{students.length ? students.map((student) => <tr key={student.id}><td>{student.nama}</td><td>{student.email}</td><td>{student.nisn || "-"}</td>
          <td>{student.jurusan_1 || "-"} / {student.jurusan_2 || "-"}</td><td>{student.status}</td><td><Link href={`/login/admin/data-siswa/${student.id}`}>Lihat</Link></td></tr>) :
          <tr><td colSpan={6}>Tidak ada calon siswa yang sesuai.</td></tr>}</tbody></table></div></>;
}
