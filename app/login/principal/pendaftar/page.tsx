import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import EmptyState from "@/app/ui/EmptyState";
import SelectionManager, { type RankedApplicant } from "./SelectionManager";

type SearchParams = Record<string, string | string[] | undefined>;
type ApplicantRow = RowDataPacket & RankedApplicant;
type MajorRow = RowDataPacket & { kode: string; nama: string };
const pageSize = 25;

function pageHref(page: number, query: string, status: string, major: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  if (major) params.set("jurusan", major);
  params.set("page", String(page));
  return `/login/principal/pendaftar?${params.toString()}`;
}

export default async function PrincipalPendaftarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = String(params.q || "").trim().slice(0, 100);
  const statuses = ["draft", "diajukan", "diterima", "ditolak"];
  const requestedStatus = String(params.status || "");
  const status = statuses.includes(requestedStatus) ? requestedStatus : "";
  const major = String(params.jurusan || "").trim().slice(0, 10);
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [majorRows] = await pool.execute<MajorRow[]>("SELECT kode, nama FROM jurusan ORDER BY urutan, id");
  const filter = `(? = '' OR nama LIKE ? OR email LIKE ?)
    AND (? = '' OR status = ?)
    AND (? = '' OR jurusan_kode = ?)`;
  const filterValues = [query, `%${query}%`, `%${query}%`, status, status, major, major];
  const base = `WITH ranked AS (
    SELECT u.id, u.nama, u.email, p.jurusan_1 AS jurusan_kode,
           COALESCE(j.nama, p.jurusan_1) AS jurusan,
           COALESCE(p.status, 'draft') AS status,
           t.nilai, t.benar, t.total, t.waktu_selesai,
           CASE WHEN t.nilai IS NULL THEN NULL ELSE RANK() OVER (ORDER BY t.nilai DESC) END AS peringkat
    FROM users u
    LEFT JOIN pendaftaran p ON p.user_id = u.id
    LEFT JOIN jurusan j ON j.kode = p.jurusan_1
    LEFT JOIN tes_tpa t ON t.user_id = u.id
    WHERE u.role = 'calon_siswa'
  )`;
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `${base} SELECT COUNT(*) AS total FROM ranked WHERE ${filter}`,
    filterValues
  );
  const total = Number(countRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const [applicants] = await pool.execute<ApplicantRow[]>(
    `${base}
     SELECT id, nama, email, jurusan, jurusan_kode, status, nilai, benar, total, waktu_selesai, peringkat
     FROM ranked WHERE ${filter}
     ORDER BY (nilai IS NULL), nilai DESC, nama ASC
     LIMIT ? OFFSET ?`,
    [...filterValues, pageSize, (currentPage - 1) * pageSize]
  );
  const rows = applicants.map((row) => ({
    ...row,
    id: Number(row.id),
    nilai: row.nilai === null ? null : Number(row.nilai),
    benar: row.benar === null ? null : Number(row.benar),
    total: row.total === null ? null : Number(row.total),
    peringkat: row.peringkat === null ? null : Number(row.peringkat),
  }));

  return <>
    <div className="page-head">
      <div><h1 className="page-title">Pendaftar & Peringkat</h1><p className="page-sub">Tinjau nilai TPA, peringkat, dan tetapkan hasil seleksi satuan atau massal.</p></div>
      <form action="/api/laporan/seleksi"><button className="btn-blue">Ekspor CSV</button></form>
    </div>
    <section className="panel">
      <form className="admin-filter-form" method="get">
        <label>Cari pendaftar<input name="q" maxLength={100} defaultValue={query} placeholder="Nama atau email" /></label>
        <label>Status<select name="status" defaultValue={status}>
          <option value="">Semua status</option>{statuses.map((value) => <option value={value} key={value}>{value}</option>)}
        </select></label>
        <label>Jurusan<select name="jurusan" defaultValue={major}>
          <option value="">Semua jurusan</option>{majorRows.map((item) => <option value={item.kode} key={item.kode}>{item.nama} ({item.kode})</option>)}
        </select></label>
        <button className="btn-blue">Terapkan</button>
      </form>
      <p className="page-sub">Menampilkan {rows.length} dari {total} pendaftar. Peringkat diurutkan berdasarkan nilai TPA.</p>
      {rows.length ? <SelectionManager applicants={rows} /> : <EmptyState message={total ? "Tidak ada pendaftar yang sesuai." : "Belum ada pendaftar untuk ditampilkan."} />}
      {total > 0 && <nav className="admin-pagination" aria-label="Halaman daftar peringkat">
        <span>Halaman {currentPage} dari {totalPages}</span>
        {currentPage > 1 && <a className="payment-admin-secondary" href={pageHref(currentPage - 1, query, status, major)}>Sebelumnya</a>}
        {currentPage < totalPages && <a className="payment-admin-secondary" href={pageHref(currentPage + 1, query, status, major)}>Berikutnya</a>}
      </nav>}
    </section>
  </>;
}
