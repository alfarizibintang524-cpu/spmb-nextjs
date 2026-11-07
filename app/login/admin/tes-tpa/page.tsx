import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import EmptyState from "@/app/ui/EmptyState";
import TesTpaManager, { type TpaQuestion, type TpaSchedule } from "./TesTpaManager";
import type { RowDataPacket } from "mysql2";

type QuestionRow = RowDataPacket & TpaQuestion;
type ScheduleRow = RowDataPacket & TpaSchedule;
type ResultRow = RowDataPacket & {
  user_id: number;
  nama: string;
  email: string;
  nilai: number;
  benar: number;
  total: number;
  waktu_selesai: Date | string;
};

export default async function KelolaTesTpaPage() {
  await requireRole("admin");
  const [[results], [questions], [schedules]] = await Promise.all([
    pool.execute<ResultRow[]>(
    `SELECT u.nama, u.email, t.nilai, t.benar, t.total, t.waktu_selesai
     FROM tes_tpa t JOIN users u ON u.id = t.user_id ORDER BY t.nilai DESC, t.waktu_selesai`
    ),
    pool.execute<QuestionRow[]>(
      "SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban FROM soal_tpa ORDER BY id"
    ),
    pool.execute<ScheduleRow[]>(
      `SELECT id, judul, DATE_FORMAT(mulai_at, '%Y-%m-%dT%H:%i') AS mulai_at,
              DATE_FORMAT(selesai_at, '%Y-%m-%dT%H:%i') AS selesai_at, keterangan, aktif
       FROM jadwal_tes_tpa ORDER BY mulai_at DESC, id DESC`
    ),
  ]);
  return <><h1 className="page-title">Kelola Tes TPA</h1><p className="page-sub">Atur jadwal dan soal, serta tinjau hasil tes calon siswa.</p>
    <TesTpaManager initialQuestions={questions} initialSchedules={schedules} />
    <h2 className="panel-title">Hasil Tes TPA</h2>
    <div className="panel"><table className="table"><thead><tr><th>Nama</th><th>Email</th><th>Nilai</th><th>Benar</th><th>Waktu Selesai</th></tr></thead>
      <tbody>{results.length ? results.map((item) => <tr key={item.email}><td>{item.nama}</td><td>{item.email}</td><td>{item.nilai}</td>
        <td>{item.benar}/{item.total}</td><td>{new Date(item.waktu_selesai).toLocaleString("id-ID")}</td></tr>) : <tr><td colSpan={5}><EmptyState message="Belum ada hasil tes." /></td></tr>}</tbody></table></div></>;
}
