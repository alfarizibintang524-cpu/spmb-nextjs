import pool from "@/lib/db";

const requiredColumns = {
  pembayaran: [
    "user_id",
    "jumlah",
    "bukti_path",
    "status",
    "catatan",
    "updated_at",
    "metode_id",
    "tahap",
    "nominal",
  ],
  metode_pembayaran: [
    "id",
    "nama",
    "tipe",
    "nama_bank",
    "nomor_rekening",
    "atas_nama",
    "qr_image",
    "petunjuk",
    "aktif",
    "urutan",
  ],
  komponen_biaya: [
    "id",
    "tahap",
    "nama",
    "nominal",
    "keterangan",
    "wajib",
    "aktif",
    "urutan",
  ],
  tenggat_pembayaran: ["tahap", "batas_waktu"],
};

const legacyPaymentColumns = ["user_id", "jumlah", "bukti_path", "status", "catatan", "updated_at"];

export async function getPaymentSchemaStatus() {
  const [rows] = await pool.execute(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?, ?, ?, ?)` ,
    ["pembayaran", "metode_pembayaran", "komponen_biaya", "tenggat_pembayaran"]
  );
  const columns = new Map(Object.keys(requiredColumns).map((table) => [table, new Set()]));
  for (const row of rows) {
    columns.get(row.TABLE_NAME)?.add(row.COLUMN_NAME);
  }

  const missingMethods = [];
  const methodColumns = columns.get("metode_pembayaran");
  if (methodColumns.size === 0) {
    missingMethods.push("tabel metode_pembayaran");
  } else {
    const absentColumns = requiredColumns.metode_pembayaran.filter((column) => !methodColumns.has(column));
    if (absentColumns.length > 0) {
      missingMethods.push(`kolom metode_pembayaran.${absentColumns.join(", ")}`);
    }
  }

  const missingPayments = [];
  const paymentColumns = columns.get("pembayaran");
  if (paymentColumns.size === 0) {
    missingPayments.push("tabel pembayaran");
  } else {
    const absentColumns = requiredColumns.pembayaran.filter((column) => !paymentColumns.has(column));
    if (absentColumns.length > 0) {
      missingPayments.push(`kolom pembayaran.${absentColumns.join(", ")}`);
    }
  }

  const paymentStatus = rows.find(
    (row) => row.TABLE_NAME === "pembayaran" && row.COLUMN_NAME === "status"
  )?.COLUMN_TYPE || "";
  if (!paymentStatus.includes("'menunggu_verifikasi'") || !paymentStatus.includes("'diterima'")) {
    missingPayments.push("nilai status pembayaran menunggu_verifikasi dan diterima");
  }

  const missingCosts = [];
  for (const table of ["komponen_biaya", "tenggat_pembayaran"]) {
    const tableColumns = columns.get(table);
    if (tableColumns.size === 0) {
      missingCosts.push(`tabel ${table}`);
    } else {
      const absentColumns = requiredColumns[table].filter((column) => !tableColumns.has(column));
      if (absentColumns.length > 0) {
        missingCosts.push(`kolom ${table}.${absentColumns.join(", ")}`);
      }
    }
  }

  const missing = [...missingMethods, ...missingPayments, ...missingCosts];
  return {
    ready: missing.length === 0,
    methodsReady: missingMethods.length === 0,
    canReadLegacyPayment: legacyPaymentColumns.every((column) => paymentColumns.has(column)),
    message: missing.length === 0
      ? null
      : `Skema database pembayaran belum lengkap (${missing.join("; ")}). Jalankan npm run migrate pada database spmb, lalu muat ulang halaman.`,
    methodsMessage: missingMethods.length === 0
      ? null
      : `Skema metode pembayaran belum lengkap (${missingMethods.join("; ")}). Jalankan migrations/001_metode_pembayaran.sql pada database spmb.`,
  };
}
