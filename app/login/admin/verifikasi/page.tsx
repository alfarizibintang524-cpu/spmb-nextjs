import pool from "@/lib/db";
import { ReviewAction } from "../Actions";
import StatusBadge from "@/app/ui/StatusBadge";
import EmptyState from "@/app/ui/EmptyState";

export default async function VerifikasiDokumenPage() {
  const [items] = await pool.execute(
    `SELECT d.id, 'dokumen' AS type, u.nama, u.email, d.jenis AS item, d.file_path, d.status, d.catatan, d.uploaded_at AS created_at
       FROM dokumen d JOIN users u ON u.id = d.user_id WHERE d.status = 'menunggu'
     UNION ALL
     SELECT p.id, 'pembayaran' AS type, u.nama, u.email, 'Bukti Pembayaran' AS item, p.bukti_path AS file_path, p.status, p.catatan, p.updated_at AS created_at
       FROM pembayaran p JOIN users u ON u.id = p.user_id WHERE p.status = 'menunggu'
     ORDER BY created_at DESC`
  );
  return <><h1 className="page-title">Verifikasi Dokumen & Pembayaran</h1><p className="page-sub">Periksa file unggahan dan berikan catatan.</p>
    <div className="panel"><table className="table"><thead><tr><th>Nama</th><th>Email</th><th>Jenis</th><th>File</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{items.length ? items.map((item) => <tr key={`${item.type}-${item.id}`}><td>{item.nama}</td><td>{item.email}</td><td>{item.item}</td>
        <td><a href={item.file_path} target="_blank" rel="noreferrer">Lihat file</a></td><td><StatusBadge value={item.status} /></td>
        <td><ReviewAction id={Number(item.id)} type={item.type} currentStatus={item.status} /></td></tr>) :
        <tr><td colSpan={6}><EmptyState message="Semua berkas sudah diperiksa. Belum ada yang menunggu." /></td></tr>}</tbody></table></div></>;
}
