import pool from "@/lib/db";
import StatusBadge from "@/app/ui/StatusBadge";
import EmptyState from "@/app/ui/EmptyState";

export default async function LaporanCalonSiswaPage() {
  const [students] = await pool.execute(
    `SELECT u.nama, u.email, u.created_at, b.nisn, p.jurusan_1, p.jurusan_2, COALESCE(p.status, 'draft') AS status
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id LEFT JOIN pendaftaran p ON p.user_id = u.id
     WHERE u.role = 'calon_siswa' ORDER BY u.created_at DESC`
  );
  return <><div className="page-head"><div><h1 className="page-title">Laporan Calon Siswa</h1><p className="page-sub">Data seluruh calon siswa terdaftar.</p></div>
    <form action="/api/laporan/siswa"><button className="btn-blue">Unduh CSV</button></form></div>
    <div className="stat-grid"><div className="panel stat-card stat-blue"><span>Total Calon Siswa</span><strong>{students.length}</strong></div></div>
    <div className="panel"><table className="table"><thead><tr><th>Nama</th><th>Email</th><th>NISN</th><th>Jurusan</th><th>Status</th><th>Tanggal Daftar</th></tr></thead>
      <tbody>{students.length ? students.map((student) => <tr key={student.email}><td>{student.nama}</td><td>{student.email}</td><td>{student.nisn || "-"}</td>
        <td>{student.jurusan_1 || "-"} / {student.jurusan_2 || "-"}</td><td><StatusBadge value={student.status} /></td><td>{new Date(student.created_at).toLocaleDateString("id-ID")}</td></tr>) :
        <tr><td colSpan={6}><EmptyState message="Belum ada calon siswa yang terdaftar." /></td></tr>}</tbody></table></div></>;
}
