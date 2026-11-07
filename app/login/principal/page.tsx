import pool from "@/lib/db";
import DashboardStat from "@/app/ui/DashboardStat";
import MiniBars from "@/app/ui/MiniBars";
import EmptyState from "@/app/ui/EmptyState";
import { requireRole } from "@/lib/session";

export default async function DashboardKepalaSekolahPage() {
  const user = await requireRole("kepsek");
  const [[stats], [recent], [majors], [selection], [daily], [payments]] = await Promise.all([
    pool.execute(
      `SELECT (SELECT COUNT(*) FROM users WHERE role = 'calon_siswa') AS siswa,
        (SELECT COUNT(*) FROM tes_tpa) AS tes,
        (SELECT COUNT(*) FROM pendaftaran WHERE status = 'diterima') AS diterima,
        (SELECT COUNT(*) FROM pendaftaran WHERE status = 'ditolak') AS ditolak,
        (SELECT COUNT(*) FROM pembayaran WHERE status IN ('lunas', 'diterima')) AS lunas,
        (SELECT COALESCE(SUM(COALESCE(nominal, jumlah)), 0) FROM pembayaran WHERE status IN ('lunas', 'diterima')) AS pemasukan`
    ),
    pool.execute("SELECT nama, email FROM users WHERE role = 'calon_siswa' ORDER BY created_at DESC, id DESC LIMIT 5"),
    pool.execute(
      `SELECT COALESCE(j.nama, p.jurusan_1, 'Belum dipilih') AS label, COUNT(*) AS value
       FROM users u LEFT JOIN pendaftaran p ON p.user_id = u.id
       LEFT JOIN jurusan j ON j.kode = p.jurusan_1
       WHERE u.role = 'calon_siswa' GROUP BY p.jurusan_1, j.nama ORDER BY value DESC LIMIT 5`
    ),
    pool.execute("SELECT status AS label, COUNT(*) AS value FROM pendaftaran GROUP BY status ORDER BY status"),
    pool.execute(
      `SELECT DATE_FORMAT(created_at, '%d/%m') AS label, COUNT(*) AS value
       FROM users WHERE role = 'calon_siswa'
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(created_at) ORDER BY DATE(created_at)`
    ),
    pool.execute(
      `SELECT status AS label, COUNT(*) AS value
       FROM pembayaran GROUP BY status ORDER BY status`
    ),
  ]);
  const cards = [
    ["Total Calon Siswa", Number(stats[0].siswa)],
    ["Sudah Tes TPA", Number(stats[0].tes)],
    ["Diterima", Number(stats[0].diterima)],
    ["Ditolak", Number(stats[0].ditolak)],
    ["Pembayaran Lunas", Number(stats[0].lunas)],
    ["Uang Masuk", Number(stats[0].pemasukan)],
  ] as const;
  return <><h1 className="page-title">Dashboard Kepala Sekolah</h1><p className="page-sub">Selamat datang, {user.nama}. Ringkasan sistem penerimaan murid baru.</p>
    <div className="stat-grid">{cards.map(([label, value], index) => <DashboardStat key={label} label={label} value={value} icon={index} prefix={index === 5 ? "Rp " : undefined} />)}</div>
    <div className="chart-grid">
      <MiniBars title="Pendaftar per Hari (14 Hari Terakhir)" data={daily.map((row) => ({ label: String(row.label), value: Number(row.value) }))} />
      <MiniBars title="Pendaftar per Jurusan" data={majors.map((row) => ({ label: String(row.label), value: Number(row.value) }))} />
      <MiniBars title="Status Seleksi" data={selection.map((row) => ({ label: String(row.label), value: Number(row.value) }))} />
      <MiniBars title="Status Pembayaran" data={payments.map((row) => ({ label: String(row.label), value: Number(row.value) }))} />
    </div>
    <div className="panel"><h3 className="panel-title">Pendaftar Terbaru</h3><table className="table"><thead><tr><th>Nama</th><th>Email</th></tr></thead>
      <tbody>{recent.length ? recent.map((row) => <tr key={row.email}><td>{row.nama}</td><td>{row.email}</td></tr>) : <tr><td colSpan={2}><EmptyState message="Belum ada pendaftar untuk ditampilkan." action="Lihat laporan siswa" href="/login/principal/laporan-siswa" /></td></tr>}</tbody></table></div></>;
}
