import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import JurusanManager, { type Major } from "./JurusanManager";
import EmptyState from "@/app/ui/EmptyState";

type MajorRow = RowDataPacket & Major;

export default async function KelolaJurusanPage() {
  await requireRole("admin");
  const [rows] = await pool.execute<MajorRow[]>(
    `SELECT j.id, j.kode, j.nama, j.keterangan, j.kuota, j.aktif, j.urutan,
            (SELECT COUNT(*) FROM pendaftaran p WHERE p.jurusan_1 = j.kode) AS terisi
     FROM jurusan j ORDER BY j.urutan, j.id`
  );
  const majors = rows.map((row) => ({
    id: Number(row.id),
    kode: row.kode,
    nama: row.nama,
    keterangan: row.keterangan,
    kuota: row.kuota === null ? null : Number(row.kuota),
    aktif: Number(row.aktif),
    urutan: Number(row.urutan),
    terisi: Number(row.terisi),
  }));
  return <>
    <h1 className="page-title">Kelola Jurusan</h1>
    <p className="page-sub">Atur jurusan, keterangan, kuota, status aktif, dan urutan tampilan.</p>
    {majors.length === 0 && <div className="panel"><EmptyState message="Belum ada jurusan. Tambahkan jurusan melalui formulir." /></div>}
    <JurusanManager initialMajors={majors} />
  </>;
}
