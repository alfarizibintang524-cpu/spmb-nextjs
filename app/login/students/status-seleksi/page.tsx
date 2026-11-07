import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ApplyButton } from "../Forms";
import StatusBadge from "@/app/ui/StatusBadge";

export default async function StatusSeleksiPage() {
  const user = await requireRole("calon_siswa");
  const [rows] = await pool.execute(
    `SELECT p.status, p.catatan, p.jurusan_1, COALESCE(j.nama, p.jurusan_1) AS jurusan_nama,
      (SELECT COUNT(*) FROM biodata b WHERE b.user_id = u.id AND b.nisn IS NOT NULL AND b.tempat_lahir IS NOT NULL
       AND b.tanggal_lahir IS NOT NULL AND b.nomor_hp IS NOT NULL AND b.alamat IS NOT NULL AND b.asal_sekolah IS NOT NULL AND b.nama_ortu IS NOT NULL) AS biodata_lengkap,
      (SELECT COUNT(*) FROM dokumen d WHERE d.user_id = u.id) AS dokumen_count,
      (SELECT COUNT(*) FROM tes_tpa t WHERE t.user_id = u.id) AS tes_count,
      (SELECT pay.status FROM pembayaran pay
       WHERE pay.user_id = u.id AND pay.tahap = 'pendaftaran'
       ORDER BY pay.created_at DESC, pay.id DESC LIMIT 1) AS pembayaran_status
     FROM users u LEFT JOIN pendaftaran p ON p.user_id = u.id
     LEFT JOIN jurusan j ON j.kode = p.jurusan_1 WHERE u.id = ?`, [Number(user.id)]
  );
  const data = rows[0] || {};
  const eligible = Boolean(data.biodata_lengkap && data.jurusan_1 &&
    Number(data.dokumen_count) === 5 && data.tes_count && ["menunggu", "menunggu_verifikasi", "lunas", "diterima"].includes(data.pembayaran_status));
  const status = data.status || "draft";
  return <><h1 className="page-title">Status Seleksi</h1><p className="page-sub">Pantau pengajuan dan hasil seleksi.</p>
    <div className="panel center-box"><div className="center-circle">{status === "diterima" ? "✓" : "•"}</div>
      <h3>{status === "diterima" ? "Diterima" : status === "ditolak" ? "Ditolak" : status === "diajukan" ? "Menunggu Hasil Seleksi" : "Pendaftaran Belum Diajukan"}</h3>
      <StatusBadge value={status} />
      <p>Jurusan yang dipilih: {data.jurusan_nama || "-"}</p><p>{data.catatan || "Lengkapi persyaratan untuk mengajukan pendaftaran."}</p>
      <ApplyButton eligible={eligible} status={status} /></div></>;
}
