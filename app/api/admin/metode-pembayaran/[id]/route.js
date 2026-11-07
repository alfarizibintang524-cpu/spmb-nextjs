import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";
import { getPaymentSchemaStatus } from "@/lib/payment-schema";
import { databaseErrorResponse, readPaymentMethodForm, saveQrImage } from "@/lib/payment-methods";

async function getMethodId(params) {
  const { id } = await params;
  const methodId = Number(id);
  return Number.isSafeInteger(methodId) && methodId > 0 ? methodId : null;
}

async function ensureMethodSchema() {
  const schema = await getPaymentSchemaStatus();
  if (!schema.methodsReady) {
    return Response.json({ message: schema.methodsMessage }, { status: 503 });
  }
  return null;
}

export async function PATCH(request, { params }) {
  const auth = await apiSession(["admin"]);
  if (auth.error) return auth.error;
  try {
    const schemaError = await ensureMethodSchema();
    if (schemaError) return schemaError;
    const id = await getMethodId(params);
    if (!id) return Response.json({ message: "ID metode pembayaran tidak valid." }, { status: 400 });
    const [existingRows] = await pool.execute(
      `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
              petunjuk, aktif, urutan
       FROM metode_pembayaran WHERE id = ?`,
      [id]
    );
    const existing = existingRows[0];
    if (!existing) return Response.json({ message: "Metode pembayaran tidak ditemukan." }, { status: 404 });

    if (request.headers.get("content-type")?.includes("application/json")) {
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ message: "Data status metode tidak valid." }, { status: 400 });
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return Response.json({ message: "Data status metode tidak valid." }, { status: 400 });
      }
      if (body.aktif !== 0 && body.aktif !== 1 && body.aktif !== false && body.aktif !== true) {
        return Response.json({ message: "Status aktif tidak valid." }, { status: 400 });
      }
      const aktif = body.aktif === 1 || body.aktif === true ? 1 : 0;
      await pool.execute("UPDATE metode_pembayaran SET aktif = ? WHERE id = ?", [aktif, id]);
      return Response.json({
        message: aktif ? "Metode pembayaran diaktifkan." : "Metode pembayaran dinonaktifkan.",
        method: { ...existing, aktif },
      });
    }

    const form = await request.formData();
    const result = await readPaymentMethodForm(form, existing.qr_image);
    if (result.error) return Response.json({ message: result.error }, { status: 400 });
    const method = result.method;
    const [duplicateRows] = await pool.execute(
      "SELECT id FROM metode_pembayaran WHERE nama = ? AND id <> ?",
      [method.nama, id]
    );
    if (duplicateRows.length) {
      return Response.json({ message: "Nama metode pembayaran tersebut sudah digunakan." }, { status: 409 });
    }
    if (result.qrFile) method.qr_image = await saveQrImage(result.qrFile);
    await pool.execute(
      `UPDATE metode_pembayaran
       SET nama = ?, tipe = ?, nama_bank = ?, nomor_rekening = ?, atas_nama = ?,
           qr_image = ?, petunjuk = ?, aktif = ?, urutan = ?
       WHERE id = ?`,
      [method.nama, method.tipe, method.nama_bank, method.nomor_rekening, method.atas_nama,
        method.qr_image, method.petunjuk, method.aktif, method.urutan, id]
    );
    const [rows] = await pool.execute(
      `SELECT id, nama, tipe, nama_bank, nomor_rekening, atas_nama, qr_image,
              petunjuk, aktif, urutan
       FROM metode_pembayaran WHERE id = ?`,
      [id]
    );
    return Response.json({ message: "Metode pembayaran berhasil diperbarui.", method: rows[0] });
  } catch (error) {
    const duplicateError = databaseErrorResponse(error);
    if (duplicateError) return duplicateError;
    return failure(error, "Metode pembayaran admin PATCH");
  }
}
