import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import { PaymentForm, type PaymentData } from "../Forms";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";

type PaymentRecord = RowDataPacket & PaymentData & {
  id: number;
  tahap: "pendaftaran" | "daftar_ulang";
  nominal: number;
  created_at: string;
};
type PaymentMethod = RowDataPacket & {
  id: number;
  nama: string;
  tipe: "transfer_bank" | "qris" | "tunai" | "ewallet";
  nama_bank: string | null;
  nomor_rekening: string | null;
  atas_nama: string | null;
  qr_image: string | null;
  petunjuk: string | null;
  aktif: number;
  urutan: number;
};
type CostComponent = RowDataPacket & {
  id: number;
  tahap: "pendaftaran" | "daftar_ulang";
  nama: string;
  nominal: number;
  keterangan: string | null;
  wajib: number;
  aktif: number;
  urutan: number;
};
type Deadline = RowDataPacket & {
  tahap: "pendaftaran" | "daftar_ulang";
  batas_waktu: string | null;
};

const emptyPayment: PaymentData = {
  id: null,
  jumlah: 0,
  nominal: 0,
  tahap: "pendaftaran",
  status: "belum",
  bukti_path: null,
  catatan: null,
  metode_id: null,
  metode_nama: null,
  metode_tipe: null,
  nama_bank: null,
  nomor_rekening: null,
  atas_nama: null,
  qr_image: null,
  petunjuk: null,
  created_at: null,
};

export default async function PembayaranPage() {
  const user = await requireRole("calon_siswa");
  const schema = await getPaymentSchemaStatus();
  let payments: PaymentRecord[] = [];
  let methods: PaymentMethod[] = [];
  let components: CostComponent[] = [];
  let deadlines: Deadline[] = [];
  let accepted = false;

  if (schema.ready) {
    const [paymentResult, methodResult, componentResult, deadlineResult, selectionResult] = await Promise.all([
      pool.execute<PaymentRecord[]>(
        `SELECT p.id, p.jumlah, p.nominal, p.tahap, p.bukti_path, p.status, p.catatan,
                p.metode_id,
                DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                m.nama AS metode_nama, m.tipe AS metode_tipe,
                m.nama_bank, m.nomor_rekening, m.atas_nama, m.qr_image, m.petunjuk
         FROM pembayaran p LEFT JOIN metode_pembayaran m ON m.id = p.metode_id
         WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC`,
        [Number(user.id)]
      ),
      pool.execute<PaymentMethod[]>(
        `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
                petunjuk, aktif, urutan
         FROM metode_pembayaran ORDER BY urutan, id`
      ),
      pool.execute<CostComponent[]>(
        `SELECT id, tahap, nama, nominal, keterangan, wajib, aktif, urutan
         FROM komponen_biaya WHERE aktif = 1 ORDER BY tahap, urutan, id`
      ),
      pool.execute<Deadline[]>(
        "SELECT tahap, DATE_FORMAT(batas_waktu, '%Y-%m-%d') AS batas_waktu FROM tenggat_pembayaran"
      ),
      pool.execute<RowDataPacket[]>(
        "SELECT status FROM pendaftaran WHERE user_id = ?",
        [Number(user.id)]
      ),
    ]);
    payments = paymentResult[0];
    methods = methodResult[0];
    components = componentResult[0];
    deadlines = deadlineResult[0];
    accepted = selectionResult[0][0]?.status === "diterima";
  }

  const initialData = payments.find((payment) => payment.tahap === "pendaftaran") || emptyPayment;
  return <>
    <h1 className="page-title">Pembayaran</h1>
    <p className="page-sub">Rincian biaya, batas waktu, dan status pembayaran per tahap pendaftaran.</p>
    <PaymentForm
      initialData={initialData}
      payments={payments}
      components={components}
      deadlines={deadlines}
      methods={methods}
      accepted={accepted}
      setupMessage={schema.message}
    />
  </>;
}
