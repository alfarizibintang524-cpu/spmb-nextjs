import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import { JurusanForm } from "../Forms";

export default async function JurusanPage() {
  const user = await requireRole("calon_siswa");
  const [rows] = await pool.execute("SELECT jurusan_1, jurusan_2 FROM pendaftaran WHERE user_id = ?", [Number(user.id)]);
  const initialData = { jurusan_1: rows[0]?.jurusan_1 || "", jurusan_2: rows[0]?.jurusan_2 || "" };
  return <><h1 className="page-title">Pilihan Jurusan</h1><p className="page-sub">Pilih dua jurusan berbeda yang kamu inginkan.</p>
    <JurusanForm initialData={initialData} /></>;
}
