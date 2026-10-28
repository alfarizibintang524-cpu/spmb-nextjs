import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import { TpaForm } from "../Forms";

type TpaQuestion = RowDataPacket & { id: number; pertanyaan: string; opsi_a: string; opsi_b: string; opsi_c: string; opsi_d: string };
type TpaResult = RowDataPacket & { nilai: number; benar: number; total: number };

export default async function TesTpaPage() {
  const user = await requireRole("calon_siswa");
  const [[questions], [results]] = await Promise.all([
    pool.execute<TpaQuestion[]>("SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d FROM soal_tpa ORDER BY RAND() LIMIT 10"),
    pool.execute<TpaResult[]>("SELECT nilai, benar, total FROM tes_tpa WHERE user_id = ?", [Number(user.id)]),
  ]);
  const result = results[0] || null;
  return <><h1 className="page-title">Tes TPA</h1><p className="page-sub">Jawab seluruh soal. Tes hanya dapat dikerjakan satu kali.</p>
    <TpaForm questions={result ? [] : questions} result={result} /></>;
}
