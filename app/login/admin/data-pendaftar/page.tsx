import pool from "@/lib/db";
import { formatTanggal } from "@/lib/data";

export default async function DataPendaftarPage() {
  const [students] = await pool.execute(
    `SELECT u.id, u.nama, u.email, u.created_at, COALESCE(p.status, 'draft') AS status, p.jurusan_1, p.jurusan_2
     FROM users u LEFT JOIN pendaftaran p ON p.user_id = u.id WHERE u.role = 'calon_siswa' ORDER BY u.created_at DESC`
  );
  return <><div className="page-head"><div><h1 className="page-title">Data Pendaftar</h1><p className="page-sub">Daftar seluruh calon siswa.</p></div>
    <form action="/api/laporan/pendaftar"><button className="btn-blue">Unduh Data CSV</button></form></div>
    <div className="panel"><table className="table"><thead><tr><th>Nomor Daftar</th><th>Nama</th><th>Email</th><th>Jurusan</th><th>Status</th><th>Tanggal</th><th>Detail</th></tr></thead>
      <tbody>{students.map((student) => <tr key={student.id}><td>SPMB-{String(student.id).padStart(5, "0")}</td><td>{student.nama}</td><td>{student.email}</td>
        <td>{student.jurusan_1 || "-"} / {student.jurusan_2 || "-"}</td><td>{student.status}</td><td>{formatTanggal(student.created_at)}</td>
        <td><a href={`/login/admin/data-siswa/${student.id}`}>Lihat</a></td></tr>)}</tbody></table></div></>;
}
