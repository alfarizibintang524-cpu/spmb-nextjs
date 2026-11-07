import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import { JurusanForm } from "../Forms";
import type { RowDataPacket } from "mysql2";

type MajorRow = RowDataPacket & {
  kode: string;
  nama: string;
  keterangan: string | null;
  kuota: number | null;
  aktif: number;
  terisi: number;
};
type StudentMajor = {
  kode: string;
  nama: string;
  keterangan: string | null;
  kuota: number | null;
  aktif: number;
  terisi: number;
};

export default async function JurusanPage() {
  const user = await requireRole("calon_siswa");
  const [selectedRows, majorRows] = await Promise.all([
    pool.execute<RowDataPacket[]>(
      "SELECT jurusan_1 FROM pendaftaran WHERE user_id = ?",
      [Number(user.id)]
    ),
    pool.execute<MajorRow[]>(
      `SELECT j.kode, j.nama, j.keterangan, j.kuota, j.aktif,
              (SELECT COUNT(*) FROM pendaftaran p WHERE p.jurusan_1 = j.kode) AS terisi
       FROM jurusan j
       WHERE (j.aktif = 1 AND j.kode IN ('PPLG', 'TJKT', 'PM', 'DKV', 'PH')) OR j.kode = (
         SELECT p.jurusan_1 FROM pendaftaran p WHERE p.user_id = ?
       )
       ORDER BY j.urutan, j.id`,
      [Number(user.id)]
    ),
  ]);
  const selected = selectedRows[0][0]?.jurusan_1 || "";
  const majors: StudentMajor[] = majorRows[0].map((major) => ({
    kode: major.kode,
    nama: major.nama,
    keterangan: major.keterangan,
    aktif: Number(major.aktif),
    terisi: Number(major.terisi),
    kuota: major.kuota === null ? null : Number(major.kuota),
  }));
  if (selected && !majors.some((major) => major.kode === selected)) {
    majors.unshift({
      kode: selected,
      nama: `${selected} (pilihan lama; pilih jurusan aktif untuk mengganti)`,
      keterangan: null,
      kuota: null,
      aktif: 0,
      terisi: 1,
    });
  }
  return <>
    <h1 className="page-title">Jurusan yang Dipilih</h1>
    <p className="page-sub">Pilih satu jurusan yang kamu inginkan.</p>
    {majors.length === 0 && <div className="panel" role="status">
      Belum ada jurusan yang tersedia. Silakan hubungi panitia.
    </div>}
    <JurusanForm initialChoice={selected} majors={majors} />
  </>;
}
