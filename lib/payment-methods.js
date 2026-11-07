import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const qrImageExtensions = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);
const maximumQrImageSize = 2 * 1024 * 1024;
const allowedTypes = new Set(["transfer_bank", "qris", "tunai", "ewallet"]);

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function readPaymentMethodForm(form, existingQrImage = null) {
  const nama = cleanText(form.get("nama"));
  const tipe = cleanText(form.get("tipe"));
  const namaBank = cleanText(form.get("nama_bank"));
  const nomorRekening = cleanText(form.get("nomor_rekening"));
  const atasNama = cleanText(form.get("atas_nama"));
  const petunjuk = cleanText(form.get("petunjuk"));
  const urutanValue = cleanText(form.get("urutan"));
  const urutan = urutanValue ? Number(urutanValue) : 0;
  const activeValue = cleanText(form.get("aktif"));
  const aktif = activeValue === "0" ? 0 : 1;
  const file = form.get("qr_image");
  const qrFile = file instanceof File && file.size > 0 ? file : null;

  if (!nama || nama.length > 100) return { error: "Nama metode wajib diisi, maksimal 100 karakter." };
  if (!allowedTypes.has(tipe)) return { error: "Tipe metode pembayaran tidak valid." };
  if (namaBank.length > 100) return { error: "Nama bank maksimal 100 karakter." };
  if (nomorRekening.length > 100) return { error: "Nomor rekening atau akun maksimal 100 karakter." };
  if (atasNama.length > 150) return { error: "Nama pemilik maksimal 150 karakter." };
  if (petunjuk.length > 2000) return { error: "Petunjuk pembayaran maksimal 2.000 karakter." };
  if (activeValue && activeValue !== "0" && activeValue !== "1") {
    return { error: "Status aktif metode tidak valid." };
  }
  if (!Number.isSafeInteger(urutan) || urutan < 0 || urutan > 2147483647) {
    return { error: "Urutan harus berupa bilangan bulat nol atau lebih." };
  }
  if (tipe === "transfer_bank" && (!namaBank || !nomorRekening || !atasNama)) {
    return { error: "Nama bank, nomor rekening, dan nama pemilik wajib diisi." };
  }
  if (tipe === "tunai" && !petunjuk) {
    return { error: "Petunjuk pembayaran tunai wajib diisi." };
  }
  if (tipe === "ewallet" && (!nomorRekening || !atasNama)) {
    return { error: "Nomor akun dan nama pemilik e-wallet wajib diisi." };
  }
  if (tipe === "qris" && !qrFile && !existingQrImage) {
    return { error: "Gambar QRIS wajib diunggah." };
  }
  if (qrFile && (!qrImageExtensions.has(qrFile.type) || qrFile.size > maximumQrImageSize)) {
    return { error: "Gambar QRIS harus JPG/PNG dan maksimal 2 MB." };
  }

  return {
    method: {
      nama,
      tipe,
      nama_bank: tipe === "transfer_bank" ? namaBank : null,
      nomor_rekening: tipe === "qris" || tipe === "tunai" ? null : nomorRekening,
      atas_nama: tipe === "qris" || tipe === "tunai" ? null : atasNama,
      qr_image: tipe === "qris" ? existingQrImage : null,
      petunjuk: petunjuk || null,
      aktif,
      urutan,
    },
    qrFile,
  };
}

export async function saveQrImage(file) {
  const contents = Buffer.from(await file.arrayBuffer());
  if (contents.length === 0 || contents.length > maximumQrImageSize) {
    throw new Error("Ukuran gambar QRIS tidak valid. Maksimal 2 MB.");
  }

  const signatureValid = file.type === "image/jpeg"
    ? contents.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!signatureValid) throw new Error("Isi gambar QRIS tidak sesuai dengan tipe file.");

  const directory = path.join(process.cwd(), "public", "uploads", "metode-pembayaran");
  await mkdir(directory, { recursive: true });
  const name = `${randomUUID()}${qrImageExtensions.get(file.type)}`;
  await writeFile(path.join(directory, name), contents);
  return `/uploads/metode-pembayaran/${name}`;
}

export function databaseErrorResponse(error) {
  if (error?.code === "ER_DUP_ENTRY") {
    return Response.json({ message: "Nama metode pembayaran tersebut sudah digunakan." }, { status: 409 });
  }
  return null;
}
