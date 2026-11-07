import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";

const mimeExt = new Map([["application/pdf", ".pdf"], ["image/jpeg", ".jpg"], ["image/png", ".png"]]);
const maximumFileSize = 2 * 1024 * 1024;
const paymentStages = new Set(["pendaftaran", "daftar_ulang"]);
const defaultPayment = {
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

async function getPaymentData(userId, preferredStage = "pendaftaran") {
  const [paymentResult, methodResult, componentResult, deadlineResult, selectionResult] = await Promise.all([
    pool.execute(
      `SELECT p.id, p.jumlah, p.nominal, p.tahap, p.bukti_path, p.status, p.catatan,
              p.updated_at, p.metode_id,
              DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              m.nama AS metode_nama, m.tipe AS metode_tipe,
              m.nama_bank, m.nomor_rekening, m.atas_nama, m.qr_image, m.petunjuk
       FROM pembayaran p
       LEFT JOIN metode_pembayaran m ON m.id = p.metode_id
       WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC`,
      [userId]
    ),
    pool.execute(
      `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
              petunjuk, aktif, urutan
       FROM metode_pembayaran ORDER BY urutan, id`
    ),
    pool.execute(
      `SELECT id, tahap, nama, nominal, keterangan, wajib, aktif, urutan
       FROM komponen_biaya WHERE aktif = 1 ORDER BY tahap, urutan, id`
    ),
    pool.execute(
      "SELECT tahap, DATE_FORMAT(batas_waktu, '%Y-%m-%d') AS batas_waktu FROM tenggat_pembayaran"
    ),
    pool.execute(
      "SELECT status FROM pendaftaran WHERE user_id = ?",
      [userId]
    ),
  ]);
  const payments = paymentResult[0];
  const latest = payments.find((payment) => payment.tahap === preferredStage);
  return {
    pembayaran: latest || { ...defaultPayment, tahap: preferredStage },
    riwayat: payments,
    metode_pembayaran: methodResult[0],
    komponen_biaya: componentResult[0],
    tenggat: deadlineResult[0],
    diterima: selectionResult[0][0]?.status === "diterima",
  };
}

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const schema = await getPaymentSchemaStatus();
    if (!schema.ready) {
      const legacyRows = schema.canReadLegacyPayment
        ? (await pool.execute(
          "SELECT jumlah, bukti_path, status, catatan, updated_at FROM pembayaran WHERE user_id = ? ORDER BY created_at DESC, id DESC",
          [auth.session.id]
        ))[0]
        : [];
      const legacyPayments = legacyRows.map((payment) => ({
        ...defaultPayment,
        ...payment,
        id: null,
        nominal: Number(payment.jumlah),
        tahap: "pendaftaran",
        created_at: payment.updated_at ? new Date(payment.updated_at).toISOString().slice(0, 19).replace("T", " ") : null,
      }));
      return Response.json({
        pembayaran: legacyPayments[0] || defaultPayment,
        riwayat: legacyPayments,
        metode_pembayaran: [],
        komponen_biaya: [],
        tenggat: [],
        diterima: false,
        setup_message: schema.message,
      });
    }
    return Response.json(await getPaymentData(auth.session.id));
  } catch (error) {
    return failure(error, "Pembayaran GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const schema = await getPaymentSchemaStatus();
    if (!schema.ready) {
      return Response.json({ message: schema.message, code: "PAYMENT_SCHEMA_NOT_READY" }, { status: 503 });
    }
    const form = await request.formData();
    const file = form.get("file");
    const stageValue = form.get("tahap");
    const stage = typeof stageValue === "string" ? stageValue : "";
    if (!paymentStages.has(stage)) {
      return Response.json({ message: "Pilih tahap pembayaran yang valid." }, { status: 400 });
    }
    if (!(file instanceof File) || !mimeExt.has(file.type) || file.size === 0 || file.size > maximumFileSize) {
      return Response.json({ message: "Bukti harus PDF/JPG/PNG dan maksimal 2 MB." }, { status: 400 });
    }
    if (stage === "daftar_ulang") {
      const [selectionRows] = await pool.execute(
        "SELECT status FROM pendaftaran WHERE user_id = ?",
        [auth.session.id]
      );
      if (selectionRows[0]?.status !== "diterima") {
        return Response.json({ message: "Tahap daftar ulang terkunci sampai kamu dinyatakan lulus." }, { status: 403 });
      }
    }
    const [feeRows] = await pool.execute(
      `SELECT nominal FROM komponen_biaya
       WHERE tahap = ? AND aktif = 1 AND wajib = 1`,
      [stage]
    );
    const nominal = feeRows.reduce((total, fee) => total + Number(fee.nominal), 0);
    if (feeRows.length === 0 || !Number.isSafeInteger(nominal) || nominal <= 0 || nominal > 2147483647) {
      return Response.json({ message: "Belum ada total biaya wajib yang dapat dibayarkan pada tahap ini. Hubungi panitia." }, { status: 409 });
    }

    const methodIdValue = form.get("metode_id");
    const methodId = typeof methodIdValue === "string" ? Number(methodIdValue) : NaN;
    if (!Number.isSafeInteger(methodId) || methodId <= 0) {
      return Response.json({ message: "Pilih metode pembayaran yang tersedia." }, { status: 400 });
    }
    const [methodRows] = await pool.execute(
      `SELECT id, tipe, nama_bank, nomor_rekening, atas_nama, qr_image
       FROM metode_pembayaran WHERE id = ? AND aktif = 1`,
      [methodId]
    );
    const method = methodRows[0];
    if (!method) return Response.json({ message: "Metode pembayaran tidak tersedia." }, { status: 400 });
    const methodIsReady = method.tipe === "transfer_bank"
      ? Boolean(method.nama_bank && method.nomor_rekening && method.atas_nama)
      : method.tipe === "qris"
        ? true
        : method.tipe === "tunai";
    if (!methodIsReady) {
      return Response.json({ message: "Detail tujuan metode ini belum tersedia. Silakan pilih metode lain atau hubungi panitia." }, { status: 400 });
    }
    const [existingRows] = await pool.execute(
      `SELECT status, bukti_path FROM pembayaran
       WHERE user_id = ? AND tahap = ? ORDER BY created_at DESC, id DESC LIMIT 1`,
      [auth.session.id, stage]
    );
    const latest = existingRows[0];
    if (["lunas", "diterima"].includes(latest?.status)) {
      return Response.json({ message: "Pembayaran tahap ini sudah lunas dan tidak dapat diunggah ulang." }, { status: 409 });
    }
    if (["menunggu", "menunggu_verifikasi"].includes(latest?.status) && latest.bukti_path) {
      return Response.json({ message: "Bukti pembayaran tahap ini sedang menunggu verifikasi." }, { status: 409 });
    }
    const contents = Buffer.from(await file.arrayBuffer());
    if (contents.length === 0 || contents.length > maximumFileSize) {
      return Response.json({ message: "Ukuran bukti tidak valid. Maksimal 2 MB." }, { status: 400 });
    }
    const signatureValid = file.type === "application/pdf"
      ? contents.subarray(0, 5).toString() === "%PDF-"
      : file.type === "image/jpeg"
        ? contents.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        : contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!signatureValid) return Response.json({ message: "Isi file tidak sesuai dengan tipe bukti." }, { status: 400 });
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const name = `${auth.session.id}-pembayaran-${randomUUID()}${mimeExt.get(file.type)}`;
    await writeFile(path.join(directory, name), contents);
    await pool.execute(
      `INSERT INTO pembayaran
         (user_id, jumlah, bukti_path, status, catatan, metode_id, tahap, nominal)
       VALUES (?, ?, ?, 'menunggu_verifikasi', NULL, ?, ?, ?)`,
      [auth.session.id, nominal, `/uploads/${name}`, methodId, stage, nominal]
    );
    return Response.json({
      message: "Bukti pembayaran berhasil dikirim dan menunggu verifikasi.",
      ...await getPaymentData(auth.session.id, stage),
    });
  } catch (error) {
    return failure(error, "Pembayaran POST");
  }
}
