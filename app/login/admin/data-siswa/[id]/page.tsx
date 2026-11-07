import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import EmptyState from "@/app/ui/EmptyState";

type ApplicantDetail = RowDataPacket & {
  id: number;
  nama: string;
  email: string;
  created_at: Date | string;
  nisn: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: Date | string | null;
  nomor_hp: string | null;
  alamat: string | null;
  asal_sekolah: string | null;
  nama_ortu: string | null;
  jurusan: string | null;
  status: string;
  catatan: string | null;
};
type DocumentRow = RowDataPacket & {
  jenis: string;
  file_path: string;
  status: string;
  catatan: string | null;
  uploaded_at: Date | string;
};
type PaymentRow = RowDataPacket & {
  id: number;
  tahap: string;
  nominal: number | null;
  jumlah: number;
  status: string;
  catatan: string | null;
  bukti_path: string | null;
  updated_at: Date | string;
  metode_nama: string | null;
};
type TpaRow = RowDataPacket & {
  nilai: number;
  benar: number;
  total: number;
  waktu_selesai: Date | string;
};

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}

export default async function DetailSiswaPage({ params }: PageProps<"/login/admin/data-siswa/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [rows] = await pool.execute<ApplicantDetail[]>(
    `SELECT u.id, u.nama, u.email, u.created_at, b.nisn, b.tempat_lahir, b.tanggal_lahir,
            b.nomor_hp, b.alamat, b.asal_sekolah, b.nama_ortu,
            COALESCE(j.nama, p.jurusan_1) AS jurusan, COALESCE(p.status, 'draft') AS status, p.catatan
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id LEFT JOIN pendaftaran p ON p.user_id = u.id
     LEFT JOIN jurusan j ON j.kode = p.jurusan_1
     WHERE u.id = ? AND u.role = 'calon_siswa'`, [id]
  );
  if (!rows.length) notFound();
  const student = rows[0];
  const [[documents], [payments], [tests]] = await Promise.all([
    pool.execute<DocumentRow[]>(
      "SELECT jenis, file_path, status, catatan, uploaded_at FROM dokumen WHERE user_id = ? ORDER BY jenis",
      [id]
    ),
    pool.execute<PaymentRow[]>(
      `SELECT p.id, p.tahap, p.nominal, p.jumlah, p.status, p.catatan, p.bukti_path, p.updated_at,
              m.nama AS metode_nama
       FROM pembayaran p LEFT JOIN metode_pembayaran m ON m.id = p.metode_id
       WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC`,
      [id]
    ),
    pool.execute<TpaRow[]>(
      "SELECT nilai, benar, total, waktu_selesai FROM tes_tpa WHERE user_id = ? ORDER BY waktu_selesai DESC",
      [id]
    ),
  ]);
  return <>
    <h1 className="page-title">Detail Calon Siswa</h1>
    <p className="page-sub">Informasi pendaftaran, dokumen, pembayaran, dan hasil tes.</p>
    <section className="panel">
      <h2 className="panel-title">{student.nama}</h2>
      <div className="admin-detail-grid">
        <p><strong>Email</strong><span>{student.email}</span></p>
        <p><strong>Nomor pendaftaran</strong><span>SPMB-{String(student.id).padStart(5, "0")}</span></p>
        <p><strong>Tanggal daftar</strong><span>{formatDate(student.created_at)}</span></p>
        <p><strong>NISN</strong><span>{student.nisn || "-"}</span></p>
        <p><strong>Tempat, tanggal lahir</strong><span>{student.tempat_lahir || "-"}, {formatDate(student.tanggal_lahir)}</span></p>
        <p><strong>Nomor HP</strong><span>{student.nomor_hp || "-"}</span></p>
        <p><strong>Alamat</strong><span>{student.alamat || "-"}</span></p>
        <p><strong>Asal sekolah</strong><span>{student.asal_sekolah || "-"}</span></p>
        <p><strong>Nama orang tua</strong><span>{student.nama_ortu || "-"}</span></p>
        <p><strong>Jurusan pilihan</strong><span>{student.jurusan || "-"}</span></p>
        <p><strong>Status seleksi</strong><span>{student.status}</span></p>
        <p><strong>Catatan seleksi</strong><span>{student.catatan || "-"}</span></p>
      </div>
    </section>
    <section className="panel">
      <h2 className="panel-title">Dokumen</h2>
      {documents.length === 0 ? <EmptyState message="Belum ada dokumen yang diunggah." /> :
        <div className="admin-table-wrap"><table className="table"><thead><tr><th>Jenis</th><th>Berkas</th><th>Status</th><th>Catatan</th><th>Diunggah</th></tr></thead>
          <tbody>{documents.map((document) => <tr key={document.jenis}>
            <td>{document.jenis}</td><td><a href={document.file_path} target="_blank" rel="noreferrer">Buka berkas</a></td>
            <td>{document.status}</td><td>{document.catatan || "-"}</td><td>{formatDate(document.uploaded_at)}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
    <section className="panel">
      <h2 className="panel-title">Riwayat Pembayaran</h2>
      {payments.length === 0 ? <EmptyState message="Belum ada pembayaran." /> :
        <div className="admin-table-wrap"><table className="table"><thead><tr><th>Tahap</th><th>Nominal</th><th>Metode</th><th>Status</th><th>Bukti</th><th>Catatan</th><th>Tanggal</th></tr></thead>
          <tbody>{payments.map((payment) => <tr key={payment.id}>
            <td>{payment.tahap === "daftar_ulang" ? "Daftar ulang" : "Pendaftaran"}</td>
            <td>Rp {Number(payment.nominal ?? payment.jumlah).toLocaleString("id-ID")}</td>
            <td>{payment.metode_nama || "-"}</td><td>{payment.status}</td>
            <td>{payment.bukti_path ? <a href={payment.bukti_path} target="_blank" rel="noreferrer">Buka bukti</a> : "-"}</td>
            <td>{payment.catatan || "-"}</td><td>{formatDate(payment.updated_at)}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
    <section className="panel">
      <h2 className="panel-title">Hasil Tes TPA</h2>
      {tests.length === 0 ? <EmptyState message="Belum ada hasil tes TPA." /> :
        <div className="admin-table-wrap"><table className="table"><thead><tr><th>Nilai</th><th>Jawaban benar</th><th>Selesai</th></tr></thead>
          <tbody>{tests.map((test, index) => <tr key={`${test.waktu_selesai}-${index}`}>
            <td>{Number(test.nilai).toLocaleString("id-ID")}</td><td>{test.benar}/{test.total}</td><td>{formatDate(test.waktu_selesai)}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </>;
}
