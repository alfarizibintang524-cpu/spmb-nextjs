import pool from "@/lib/db";
import EmptyState from "@/app/ui/EmptyState";
import PrintReportButton from "../PrintReportButton";

export default async function LaporanSeleksiPage() {
  const [rows] = await pool.execute(
    `SELECT COALESCE(j.nama, p.jurusan_1, 'Belum memilih') AS jurusan,
       COUNT(*) AS total,
       SUM(p.status = 'diterima') AS diterima,
       SUM(p.status = 'ditolak') AS ditolak,
       SUM(p.status = 'diajukan') AS menunggu
     FROM pendaftaran p LEFT JOIN jurusan j ON j.kode = p.jurusan_1
     GROUP BY p.jurusan_1, j.nama ORDER BY j.nama, p.jurusan_1`
  );
  return <div className="principal-report"><div className="page-head"><div><h1 className="page-title">Laporan Seleksi</h1><p className="page-sub">Rekap hasil seleksi per jurusan.</p></div>
    <div className="report-actions"><PrintReportButton /><form action="/api/laporan/seleksi"><button className="btn-blue">Unduh CSV</button></form></div></div>
    <div className="panel"><table className="table"><thead><tr><th>Jurusan</th><th>Total</th><th>Diterima</th><th>Ditolak</th><th>Menunggu</th></tr></thead>
      <tbody>{rows.length ? rows.map((row) => <tr key={row.jurusan}><td>{row.jurusan}</td><td>{row.total}</td><td>{row.diterima}</td><td>{row.ditolak}</td><td>{row.menunggu}</td></tr>) :
        <tr><td colSpan={5}><EmptyState message="Belum ada data seleksi." /></td></tr>}</tbody></table></div></div>;
}
