import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import { PaymentForm } from "../Forms";

type PaymentRecord = RowDataPacket & { jumlah: number; status: string; bukti_path: string | null; catatan: string | null };

export default async function PembayaranPage() {
  const user = await requireRole("calon_siswa");
  const [rows] = await pool.execute<PaymentRecord[]>("SELECT jumlah, bukti_path, status, catatan FROM pembayaran WHERE user_id = ?", [Number(user.id)]);
  const initialData = rows[0] || { jumlah: 150000, status: "belum", bukti_path: null, catatan: null };
  return <><h1 className="page-title">Pembayaran</h1><p className="page-sub">Biaya pendaftaran sebesar Rp150.000.</p>
    <PaymentForm initialData={initialData} /></>;
}
