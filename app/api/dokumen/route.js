import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

const jenisValid = ["ijazah_skl", "kk", "akta", "pas_foto", "rapor"];
const mimeExt = new Map([["application/pdf", ".pdf"], ["image/jpeg", ".jpg"], ["image/png", ".png"]]);

export async function GET() {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const [rows] = await pool.execute(
      "SELECT id, jenis, file_path, status, catatan, uploaded_at FROM dokumen WHERE user_id = ? ORDER BY jenis",
      [auth.session.id]
    );
    return Response.json(rows);
  } catch (error) { return failure(error, "Dokumen GET"); }
}

export async function POST(request) {
  const auth = await apiSession(["calon_siswa"]);
  if (auth.error) return auth.error;
  try {
    const form = await request.formData();
    const jenis = String(form.get("jenis") || "");
    const file = form.get("file");
    if (!jenisValid.includes(jenis) || !(file instanceof File)) {
      return Response.json({ message: "Jenis dokumen dan file wajib dipilih." }, { status: 400 });
    }
    if (!mimeExt.has(file.type) || file.size === 0 || file.size > 2 * 1024 * 1024) {
      return Response.json({ message: "File harus berupa PDF/JPG/PNG dan maksimal 2 MB." }, { status: 400 });
    }
    const contents = Buffer.from(await file.arrayBuffer());
    const signatureValid = file.type === "application/pdf"
      ? contents.subarray(0, 5).toString() === "%PDF-"
      : file.type === "image/jpeg"
        ? contents.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        : contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!signatureValid) return Response.json({ message: "Isi file tidak sesuai dengan tipe dokumen." }, { status: 400 });
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const name = `${auth.session.id}-${jenis}-${randomUUID()}${mimeExt.get(file.type)}`;
    await writeFile(path.join(directory, name), contents);
    const filePath = `/uploads/${name}`;
    await pool.execute(
      `INSERT INTO dokumen (user_id, jenis, file_path, status, catatan) VALUES (?, ?, ?, 'menunggu', NULL)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'menunggu', catatan = NULL, uploaded_at = CURRENT_TIMESTAMP`,
      [auth.session.id, jenis, filePath]
    );
    return Response.json({ message: "Dokumen berhasil diunggah dan menunggu verifikasi.", file_path: filePath });
  } catch (error) { return failure(error, "Dokumen POST"); }
}
