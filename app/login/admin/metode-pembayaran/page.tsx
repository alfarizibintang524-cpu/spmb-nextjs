import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";
import MetodePembayaranManager, { type PaymentMethod } from "./MetodePembayaranManager";

type PaymentMethodRow = RowDataPacket & PaymentMethod;

export default async function MetodePembayaranPage() {
  const schema = await getPaymentSchemaStatus();
  let methods: PaymentMethod[] = [];
  if (schema.methodsReady) {
    const [rows] = await pool.execute<PaymentMethodRow[]>(
      `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
              petunjuk, aktif, urutan
       FROM metode_pembayaran ORDER BY urutan, id`
    );
    methods = rows;
  }

  return <>
    <h1 className="page-title">Metode Pembayaran</h1>
    <p className="page-sub">Tambah dan kelola rekening, e-wallet, serta kode QRIS yang ditampilkan kepada siswa.</p>
    {!schema.methodsReady && <div className="panel payment-admin-alert" role="alert">{schema.methodsMessage}</div>}
    <MetodePembayaranManager initialMethods={methods} setupMessage={schema.methodsMessage} />
  </>;
}
