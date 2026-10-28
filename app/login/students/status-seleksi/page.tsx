import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ApplyButton } from "../Forms";
import StatusBadge from "@/app/ui/StatusBadge";

export default async function StatusSeleksiPage() {
  const user = await requireRole("calon_siswa");
  const [rows] = await pool.execute(
    `SELECT p.status, p.catatan, p.jurusan_1, p.jurusan_2,
      (SELECT COUNT(*) FROM biodata b WHERE b.user_id = u.id AND b.nisn IS NOT NULL AND b.tempat_lahir IS NOT NULL
       AND b.tanggal_lahir IS NOT NULL AND b.nomor_hp IS NOT NULL AND b.alamat IS NOT NULL AND b.asal_sekolah IS NOT NULL AND b.nama_ortu IS NOT NULL) AS biodata_lengkap,
      (SELECT COUNT(*) FROM dokumen d WHERE d.user_id = u.id) AS dokumen_count,
      (SELECT COUNT(*) FROM tes_tpa t WHERE t.user_id = u.id) AS tes_count,
      (SELECT COUNT(*) FROM pembayaran pay WHERE pay.user_id = u.id AND pay.status IN ('menunggu','lunas')) AS pembayaran_count
     FROM users u LEFT JOIN pendaftaran p ON p.user_id = u.id WHERE u.id = ?`, [Number(user.id)]
  );
  const data = rows[0] || {};
  const eligible = Boolean(data.biodata_lengkap && data.jurusan_1 && data.jurusan_2 &&
    Number(data.dokumen_count) === 5 && data.tes_count && data.pembayaran_count);
  const status = data.status || "draft";
  return <><h1 className="page-title">Status Seleksi</h1><p className="page-sub">Pantau pengajuan dan hasil seleksi.</p>
    <div className="panel center-box"><div className="center-circle">{status === "diterima" ? "✓" : "•"}</div>
      <h3>{status === "diterima" ? "Diterima" : status === "ditolak" ? "Ditolak" : status === "diajukan" ? "Menunggu Hasil Seleksi" : "Pendaftaran Belum Diajukan"}</h3>
      <StatusBadge value={status} />
      <p>Jurusan: {data.jurusan_1 || "-"} / {data.jurusan_2 || "-"}</p><p>{data.catatan || "Lengkapi persyaratan untuk mengajukan pendaftaran."}</p>
      <ApplyButton eligible={eligible} status={status} /></div></>;
}
