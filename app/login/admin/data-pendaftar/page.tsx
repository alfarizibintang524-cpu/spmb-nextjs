import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { formatTanggal } from "@/lib/data";
import EmptyState from "@/app/ui/EmptyState";

type SearchParams = Record<string, string | string[] | undefined>;
type ApplicantRow = RowDataPacket & {
  id: number;
  nama: string;
  email: string;
  nisn: string | null;
  jurusan: string | null;
  jurusan_kode: string | null;
  status: string;
  created_at: Date | string;
};
type MajorRow = RowDataPacket & { kode: string; nama: string };

const pageSize = 25;

function pageHref(page: number, query: string, status: string, major: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  if (major) params.set("jurusan", major);
  params.set("page", String(page));
  return `/login/admin/data-pendaftar?${params.toString()}`;
}

export default async function DataPendaftarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = String(params.q || "").trim().slice(0, 100);
  const allowedStatuses = ["draft", "diajukan", "diterima", "ditolak"];
  const requestedStatus = String(params.status || "");
  const status = allowedStatuses.includes(requestedStatus) ? requestedStatus : "";
  const major = String(params.jurusan || "").trim().slice(0, 10);
  const requestedPage = Number(params.page);
  const requestedPageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [majorRows] = await pool.execute<MajorRow[]>("SELECT kode, nama FROM jurusan ORDER BY urutan, id");
  const filters = `u.role = 'calon_siswa'
    AND (? = '' OR u.nama LIKE ? OR u.email LIKE ? OR b.nisn LIKE ?)
    AND (? = '' OR COALESCE(p.status, 'draft') = ?)
    AND (? = '' OR p.jurusan_1 = ?)`;
  const filterValues = [query, `%${query}%`, `%${query}%`, `%${query}%`, status, status, major, major];
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users u
     LEFT JOIN biodata b ON b.user_id = u.id
     LEFT JOIN pendaftaran p ON p.user_id = u.id WHERE ${filters}`,
    filterValues
  );
  const total = Number(countRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPageNumber, totalPages);
  const [students] = await pool.execute<ApplicantRow[]>(
    `SELECT u.id, u.nama, u.email, u.created_at, b.nisn,
            COALESCE(j.nama, p.jurusan_1) AS jurusan, p.jurusan_1 AS jurusan_kode,
            COALESCE(p.status, 'draft') AS status
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id
     LEFT JOIN pendaftaran p ON p.user_id = u.id
     LEFT JOIN jurusan j ON j.kode = p.jurusan_1
     WHERE ${filters}
     ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`,
    [...filterValues, pageSize, (page - 1) * pageSize]
  );

  return <>
    <div className="page-head">
      <div><h1 className="page-title">Data Pendaftar</h1><p className="page-sub">Cari, filter, dan tinjau profil calon siswa.</p></div>
      <form action="/api/laporan/pendaftar"><button className="btn-blue">Ekspor CSV</button></form>
    </div>
    <section className="panel">
      <form className="admin-filter-form" method="get">
        <label>Cari nama, email, atau NISN<input name="q" maxLength={100} defaultValue={query} placeholder="Masukkan kata kunci" /></label>
        <label>Status<select name="status" defaultValue={status}>
          <option value="">Semua status</option>{allowedStatuses.map((value) => <option value={value} key={value}>{value}</option>)}
        </select></label>
        <label>Jurusan<select name="jurusan" defaultValue={major}>
          <option value="">Semua jurusan</option>{majorRows.map((item) => <option value={item.kode} key={item.kode}>{item.nama} ({item.kode})</option>)}
        </select></label>
        <button className="btn-blue">Terapkan</button>
      </form>
      <p className="page-sub">Menampilkan {students.length} dari {total} pendaftar.</p>
      {students.length === 0 ? <EmptyState message={total ? "Tidak ada pendaftar yang sesuai dengan filter." : "Belum ada calon siswa yang terdaftar."} /> :
        <div className="admin-table-wrap"><table className="table">
          <thead><tr><th>Nomor Daftar</th><th>Nama / Email</th><th>NISN</th><th>Jurusan</th><th>Status</th><th>Tanggal Daftar</th><th>Detail</th></tr></thead>
          <tbody>{students.map((student) => <tr key={student.id}>
            <td>SPMB-{String(student.id).padStart(5, "0")}</td>
            <td>{student.nama}<small className="admin-cell-secondary">{student.email}</small></td>
            <td>{student.nisn || "-"}</td><td>{student.jurusan || "-"}</td><td>{student.status}</td>
            <td>{formatTanggal(student.created_at)}</td>
            <td><Link href={`/login/admin/data-siswa/${student.id}`}>Lihat detail</Link></td>
          </tr>)}</tbody>
        </table></div>}
      {total > 0 && <nav className="admin-pagination" aria-label="Halaman daftar pendaftar">
        <span>Halaman {Math.min(page, totalPages)} dari {totalPages}</span>
        {page > 1 && <Link className="payment-admin-secondary" href={pageHref(page - 1, query, status, major)}>Sebelumnya</Link>}
        {page < totalPages && <Link className="payment-admin-secondary" href={pageHref(page + 1, query, status, major)}>Berikutnya</Link>}
      </nav>}
    </section>
  </>;
}
