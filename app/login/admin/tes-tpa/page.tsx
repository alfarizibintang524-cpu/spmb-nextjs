import pool from "@/lib/db";
import EmptyState from "@/app/ui/EmptyState";

export default async function KelolaTesTpaPage() {
  const [results] = await pool.execute(
    `SELECT u.nama, u.email, t.nilai, t.benar, t.total, t.waktu_selesai
     FROM tes_tpa t JOIN users u ON u.id = t.user_id ORDER BY t.nilai DESC, t.waktu_selesai`
  );
  return <><h1 className="page-title">Hasil Tes TPA</h1><p className="page-sub">Nilai tes seluruh calon siswa.</p>
    <div className="panel"><table className="table"><thead><tr><th>Nama</th><th>Email</th><th>Nilai</th><th>Benar</th><th>Waktu Selesai</th></tr></thead>
      <tbody>{results.length ? results.map((item) => <tr key={item.email}><td>{item.nama}</td><td>{item.email}</td><td>{item.nilai}</td>
        <td>{item.benar}/{item.total}</td><td>{new Date(item.waktu_selesai).toLocaleString("id-ID")}</td></tr>) : <tr><td colSpan={5}><EmptyState message="Belum ada hasil tes." /></td></tr>}</tbody></table></div></>;
}
