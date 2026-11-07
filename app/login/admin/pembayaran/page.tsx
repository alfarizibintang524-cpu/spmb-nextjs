import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";
import StatusBadge from "@/app/ui/StatusBadge";
import EmptyState from "@/app/ui/EmptyState";
import PembayaranActions from "./PembayaranActions";

const paymentStatuses = ["belum", "menunggu", "menunggu_verifikasi", "diterima", "lunas", "ditolak"];
const statusLabels: Record<string, string> = {
  belum: "Belum Bayar",
  menunggu: "Menunggu (Lama)",
  menunggu_verifikasi: "Menunggu Verifikasi",
  diterima: "Diterima",
  lunas: "Diterima (Lama)",
  ditolak: "Ditolak",
};

type PaymentRow = RowDataPacket & {
  id: number;
  user_id: number;
  nama: string;
  email: string;
  jumlah: number;
  nominal: number;
  tahap: "pendaftaran" | "daftar_ulang";
  status: string;
  bukti_path: string | null;
  catatan: string | null;
  metode_nama: string | null;
  updated_at: Date | string;
};

export default async function AdminPembayaranPage({
  searchParams,
}: PageProps<"/login/admin/pembayaran">) {
  const params = await searchParams;
  const requestedStatus = String(params.status || "");
  const status = paymentStatuses.includes(requestedStatus) ? requestedStatus : "";
  const schema = await getPaymentSchemaStatus();
  let rows: PaymentRow[] = [];

  if (schema.ready) {
    const [results] = await pool.execute<PaymentRow[]>(
      `SELECT p.id, p.user_id, u.nama, u.email, p.jumlah, p.nominal, p.tahap, p.status, p.bukti_path, p.catatan,
              m.nama AS metode_nama, p.updated_at
       FROM pembayaran p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN metode_pembayaran m ON m.id = p.metode_id
       WHERE (? = '' OR p.status = ?)
       ORDER BY p.updated_at DESC, p.id DESC`,
      [status, status]
    );
    rows = results;
  }

  return <>
    <h1 className="page-title">Verifikasi Pembayaran</h1>
    <p className="page-sub">Periksa bukti transfer, lalu terima atau tolak dengan catatan yang sesuai.</p>
    {!schema.ready && <div className="panel payment-admin-alert" role="alert">{schema.message}</div>}
    <div className="panel payment-review-panel">
      <form className="payment-review-filter" method="get">
        <label htmlFor="payment-status-filter">Filter status</label>
        <select id="payment-status-filter" name="status" defaultValue={status}>
          <option value="">Semua status</option>
          {paymentStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
        </select>
        <button className="btn-blue">Terapkan</button>
      </form>
      {schema.ready && rows.length === 0 && (
        <EmptyState message={status ? "Tidak ada pembayaran dengan status ini." : "Belum ada data pembayaran."} />
      )}
      {schema.ready && rows.length > 0 && <div className="payment-review-table-wrap">
        <table className="table payment-review-table">
          <thead><tr>
            <th>Pendaftar</th><th>Tahap</th><th>Nominal</th><th>Metode</th>
            <th>Bukti</th><th>Status</th><th>Catatan / Aksi</th>
          </tr></thead>
          <tbody>{rows.map((payment) => {
            const pending = ["menunggu", "menunggu_verifikasi"].includes(payment.status) && Boolean(payment.bukti_path);
            return <tr key={payment.id}>
              <td><strong>{payment.nama}</strong><small>{payment.email}</small><small>ID siswa: {payment.user_id}</small></td>
              <td>{payment.tahap === "daftar_ulang" ? "Daftar Ulang" : "Pendaftaran"}</td>
              <td>Rp {Number(payment.nominal ?? payment.jumlah).toLocaleString("id-ID")}</td>
              <td>{payment.metode_nama || "-"}</td>
              <td>{payment.bukti_path
                ? <a href={payment.bukti_path} target="_blank" rel="noreferrer">Lihat bukti</a>
                : <span className="payment-review-no-proof">Belum ada bukti</span>}</td>
              <td><StatusBadge value={statusLabels[payment.status] || payment.status} /></td>
              <td>
                {payment.catatan && <p className="payment-review-note"><strong>Catatan:</strong> {payment.catatan}</p>}
                {pending
                  ? <PembayaranActions id={payment.id} tahap={payment.tahap} nominal={Number(payment.nominal ?? payment.jumlah)} />
                  : <span className="payment-review-locked">Tidak ada aksi</span>}
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </div>
  </>;
}
