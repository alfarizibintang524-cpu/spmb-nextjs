import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";
import { databaseErrorResponse, readPaymentMethodForm, saveQrImage } from "@/lib/payment-methods";

async function ensureMethodSchema() {
  const schema = await getPaymentSchemaStatus();
  if (!schema.methodsReady) {
    return Response.json({ message: schema.methodsMessage }, { status: 503 });
  }
  return null;
}

export async function GET() {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const schemaError = await ensureMethodSchema();
    if (schemaError) return schemaError;
    const [methods] = await pool.execute(
      `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
              petunjuk, aktif, urutan
       FROM metode_pembayaran ORDER BY urutan, id`
    );
    return Response.json({ methods });
  } catch (error) {
    return failure(error, "Metode pembayaran admin GET");
  }
}

export async function POST(request) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const schemaError = await ensureMethodSchema();
    if (schemaError) return schemaError;
    const form = await request.formData();
    const result = await readPaymentMethodForm(form);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const method = result.method;
    const [existingRows] = await pool.execute(
      "SELECT id FROM metode_pembayaran WHERE nama = ?",
      [method.nama]
    );
    if (existingRows.length) {
      return Response.json({ message: "Nama metode pembayaran tersebut sudah digunakan." }, { status: 409 });
    }
    if (result.qrFile) method.qr_image = await saveQrImage(result.qrFile);
    const [insert] = await pool.execute(
      `INSERT INTO metode_pembayaran
         (nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image, petunjuk, aktif, urutan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [method.nama, method.tipe, method.nama_bank, method.nomor_rekening, method.atas_nama,
        method.qr_image, method.petunjuk, method.aktif, method.urutan]
    );
    const [rows] = await pool.execute(
      `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
              petunjuk, aktif, urutan
       FROM metode_pembayaran WHERE id = ?`,
      [insert.insertId]
    );
    return Response.json({ message: "Metode pembayaran berhasil ditambahkan.", method: rows[0] }, { status: 201 });
  } catch (error) {
    const duplicateError = databaseErrorResponse(error);
    if (duplicateError) return duplicateError;
    return failure(error, "Metode pembayaran admin POST");
  }
}
