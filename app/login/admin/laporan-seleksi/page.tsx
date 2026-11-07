import pool from "@/lib/db";
import EmptyState from "@/app/ui/EmptyState";

export default async function LaporanSeleksiPage() {
  const [rows] = await pool.execute(
    `SELECT COALESCE(j.nama, p.jurusan_1, 'Belum memilih') AS jurusan, COUNT(*) AS peserta,
      SUM(p.status = 'diterima') AS diterima, SUM(p.status = 'ditolak') AS ditolak,
      SUM(p.status = 'diajukan') AS menunggu
     FROM pendaftaran p LEFT JOIN jurusan j ON j.kode = p.jurusan_1
     GROUP BY p.jurusan_1, j.nama ORDER BY j.nama, p.jurusan_1`
  );
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS peserta, SUM(status = 'diterima') AS diterima,
      SUM(status = 'ditolak') AS ditolak FROM pendaftaran`
  );
  return <><div className="page-head"><div><h1 className="page-title">Laporan Seleksi</h1><p className="page-sub">Rekap hasil seleksi calon siswa.</p></div>
    <form action="/api/laporan/seleksi"><button className="btn-blue">Unduh CSV</button></form></div>
    <div className="stat-grid">{[["Peserta", summary.peserta], ["Diterima", summary.diterima || 0], ["Ditolak", summary.ditolak || 0]].map(([label, value]) =>
      <div className="panel stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="panel"><h3 className="panel-title">Rekap per Jurusan</h3><table className="table"><thead><tr><th>Jurusan</th><th>Peserta</th><th>Diterima</th><th>Ditolak</th><th>Menunggu</th></tr></thead>
      <tbody>{rows.length ? rows.map((row) => <tr key={row.jurusan}><td>{row.jurusan}</td><td>{row.peserta}</td><td>{row.diterima}</td><td>{row.ditolak}</td><td>{row.menunggu}</td></tr>) :
        <tr><td colSpan={5}><EmptyState message="Belum ada data seleksi." /></td></tr>}</tbody></table></div></>;
}
