import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import { DocumentsForm } from "../Forms";

type DocumentRecord = RowDataPacket & { jenis: string; file_path: string; status: string; catatan: string | null };

export default async function DokumenPage() {
  const user = await requireRole("calon_siswa");
  const [initialData] = await pool.execute<DocumentRecord[]>("SELECT jenis, file_path, status, catatan FROM dokumen WHERE user_id = ?", [Number(user.id)]);
  return <><h1 className="page-title">Dokumen</h1><p className="page-sub">Unggah lima dokumen persyaratan.</p>
    <DocumentsForm initialData={initialData} /></>;
}
