import pool from "@/lib/db";
import { SelectionAction } from "../Actions";

export default async function SeleksiPage() {
  const [students] = await pool.execute(
    `SELECT u.id, u.nama, u.email, p.jurusan_1, p.status, t.nilai
     FROM pendaftaran p JOIN users u ON u.id = p.user_id
     LEFT JOIN tes_tpa t ON t.user_id = u.id WHERE p.status IN ('diajukan','diterima','ditolak')
     ORDER BY CASE p.status WHEN 'diajukan' THEN 0 ELSE 1 END, t.nilai DESC`
  );
  return <><h1 className="page-title">Seleksi Calon Siswa</h1><p className="page-sub">Tinjau pengajuan dan tetapkan hasil seleksi.</p>
    <div className="panel"><table className="table"><thead><tr><th>Nama</th><th>Jurusan</th><th>Nilai TPA</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{students.length ? students.map((student) => <tr key={student.id}><td>{student.nama}<br />{student.email}</td><td>{student.jurusan_1 || "-"}</td>
        <td>{student.nilai ?? "-"}</td><td>{student.status}</td><td><SelectionAction userId={Number(student.id)} status={student.status} /></td></tr>) :
        <tr><td colSpan={5}>Belum ada pendaftaran yang diajukan.</td></tr>}</tbody></table></div></>;
}
