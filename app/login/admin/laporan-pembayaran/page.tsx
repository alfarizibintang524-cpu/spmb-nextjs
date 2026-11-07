import pool from "@/lib/db";

export default async function LaporanPembayaranPage() {
  const [[summary], [items]] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS transaksi, SUM(status IN ('lunas', 'diterima')) AS lunas,
      SUM(status = 'belum') AS belum, SUM(status IN ('menunggu', 'menunggu_verifikasi')) AS menunggu,
      COALESCE(SUM(CASE WHEN status IN ('lunas', 'diterima') THEN COALESCE(nominal, jumlah) ELSE 0 END), 0) AS pemasukan FROM pembayaran`),
    pool.execute(`SELECT p.id, u.nama, u.email, p.tahap, COALESCE(p.nominal, p.jumlah) AS nominal, p.status, p.updated_at
      FROM pembayaran p JOIN users u ON u.id = p.user_id ORDER BY p.updated_at DESC`),
  ]);
  return <><div className="page-head"><div><h1 className="page-title">Laporan Pembayaran</h1><p className="page-sub">Rekap pembayaran pendaftaran.</p></div>
    <form action="/api/laporan/pembayaran"><button className="btn-blue">Unduh CSV</button></form></div>
    <div className="stat-grid stat-4">{[
      ["Total Transaksi", summary[0].transaksi], ["Lunas", summary[0].lunas || 0],
      ["Belum Bayar", summary[0].belum || 0], ["Total Pemasukan", `Rp ${Number(summary[0].pemasukan).toLocaleString("id-ID")}`],
    ].map(([label, value]) => <div className="panel stat-card stat-blue" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="panel"><h3 className="panel-title">Riwayat Pembayaran</h3><table className="table"><thead><tr><th>Nomor Daftar</th><th>Nama</th><th>Email</th><th>Tahap</th><th>Nominal</th><th>Status</th><th>Tanggal</th></tr></thead>
      <tbody>{items.length ? items.map((row) => <tr key={row.id}><td>SPMB-{String(row.id).padStart(5, "0")}</td><td>{row.nama}</td><td>{row.email}</td>
        <td>{row.tahap === "daftar_ulang" ? "Daftar Ulang" : "Pendaftaran"}</td><td>Rp {Number(row.nominal).toLocaleString("id-ID")}</td>
        <td>{row.status}</td><td>{new Date(row.updated_at).toLocaleDateString("id-ID")}</td></tr>) :
        <tr><td colSpan={7}>Belum ada pembayaran.</td></tr>}</tbody></table></div></>;
}
