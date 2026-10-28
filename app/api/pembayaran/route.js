import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

const mimeExt = new Map([["application/pdf", ".pdf"], ["image/jpeg", ".jpg"], ["image/png", ".png"]]);

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [rows] = await pool.execute("SELECT jumlah, bukti_path, status, catatan, updated_at FROM pembayaran WHERE user_id = ?", [auth.session.id]);
    return Response.json(rows[0] || { jumlah: 150000, status: "belum", bukti_path: null, catatan: null });
  } catch (error) { return failure(error, "Pembayaran GET"); }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !mimeExt.has(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) {
      return Response.json({ message: "Bukti harus PDF/JPG/PNG dan maksimal 2 MB." }, { status: 400 });
    }
    const contents = Buffer.from(await file.arrayBuffer());
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
      `INSERT INTO pembayaran (user_id, jumlah, bukti_path, status, catatan) VALUES (?, 150000, ?, 'menunggu', NULL)
       ON DUPLICATE KEY UPDATE bukti_path = VALUES(bukti_path), status = 'menunggu', catatan = NULL, updated_at = CURRENT_TIMESTAMP`,
      [auth.session.id, `/uploads/${name}`]
    );
    return Response.json({ message: "Bukti pembayaran berhasil dikirim." });
  } catch (error) { return failure(error, "Pembayaran POST"); }
}
