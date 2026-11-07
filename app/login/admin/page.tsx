import pool from "@/lib/db";
import { formatTanggal } from "@/lib/data";
import { requireRole } from "@/lib/session";
import DashboardStat from "@/app/ui/DashboardStat";
import MiniBars from "@/app/ui/MiniBars";
import EmptyState from "@/app/ui/EmptyState";

export default async function DashboardAdminPage() {
  const user = await requireRole("admin");
  const [[totals], [recent], [majors], [payments]] = await Promise.all([
    pool.execute(
      `SELECT (SELECT COUNT(*) FROM users WHERE role = 'calon_siswa') AS pendaftar,
        (SELECT COUNT(*) FROM dokumen WHERE status = 'menunggu') AS dokumen_menunggu,
        (SELECT COUNT(*) FROM pembayaran WHERE status IN ('menunggu', 'menunggu_verifikasi')) AS pembayaran_menunggu,
        (SELECT COUNT(*) FROM pembayaran WHERE status IN ('diterima', 'lunas')) AS pembayaran_diterima,
        (SELECT COUNT(*) FROM pembayaran WHERE status = 'ditolak') AS pembayaran_ditolak`
    ),
    pool.execute("SELECT id, nama, email, created_at FROM users WHERE role = 'calon_siswa' ORDER BY created_at DESC, id DESC LIMIT 5"),
    pool.execute(
      `SELECT COALESCE(j.nama, p.jurusan_1, 'Belum dipilih') AS label, COUNT(*) AS value
       FROM users u LEFT JOIN pendaftaran p ON p.user_id = u.id
       LEFT JOIN jurusan j ON j.kode = p.jurusan_1
       WHERE u.role = 'calon_siswa' GROUP BY p.jurusan_1, j.nama ORDER BY value DESC LIMIT 5`
    ),
    pool.execute(
      `SELECT CASE WHEN status IN ('diterima', 'lunas') THEN 'Diterima'
                   WHEN status = 'ditolak' THEN 'Ditolak' ELSE 'Menunggu / Belum' END AS label,
              COUNT(*) AS value
       FROM pembayaran GROUP BY label ORDER BY label`
    ),
  ]);
  const stats = [
    ["Total Pendaftar", totals[0].pendaftar], ["Dokumen Menunggu", totals[0].dokumen_menunggu],
    ["Pembayaran Menunggu", totals[0].pembayaran_menunggu],
    ["Pembayaran Diterima", totals[0].pembayaran_diterima],
    ["Pembayaran Ditolak", totals[0].pembayaran_ditolak],
  ];
  return <><h1 className="page-title">Dashboard Admin</h1><p className="page-sub">Selamat datang, {user.nama}. Kelola proses penerimaan siswa baru.</p>
    <div className="stat-grid">{stats.map(([label, value], index) => <DashboardStat key={label} label={label} value={Number(value)} icon={index} />)}</div>
    <div className="chart-grid">
      <MiniBars title="Pendaftar per Jurusan" data={majors.map((row) => ({ label: String(row.label), value: Number(row.value) }))} />
      <MiniBars title="Status Pembayaran" data={payments.map((row) => ({ label: String(row.label), value: Number(row.value) }))} />
    </div>
    <div className="panel"><h3 className="panel-title">Pendaftar Terbaru</h3><table className="table"><thead><tr><th>Nama</th><th>Email</th><th>Tanggal Daftar</th></tr></thead>
      <tbody>{recent.length ? recent.map((student) => <tr key={student.id}><td>{student.nama}</td><td>{student.email}</td><td>{formatTanggal(student.created_at)}</td></tr>) :
        <tr><td colSpan={3}><EmptyState message="Belum ada pendaftar baru." action="Lihat pendaftar" href="/login/admin/data-pendaftar" /></td></tr>}</tbody></table></div></>;
}
