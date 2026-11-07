import pool from "@/lib/db";
import { apiSession, failure } from "@/lib/api-auth";

const reports = {
  seleksi: {
    roles: ["admin", "kepsek"],
    sql: `SELECT u.nama, u.email, COALESCE(j.nama, p.jurusan_1) AS jurusan, p.status, p.catatan, t.nilai
          FROM pendaftaran p JOIN users u ON u.id = p.user_id
          LEFT JOIN jurusan j ON j.kode = p.jurusan_1
          LEFT JOIN tes_tpa t ON t.user_id = u.id ORDER BY u.nama`,
  },
  pembayaran: {
    roles: ["admin", "kepsek"],
    sql: `SELECT u.nama, u.email, pay.tahap, COALESCE(pay.nominal, pay.jumlah) AS nominal,
                 pay.status, pay.catatan, pay.created_at
          FROM pembayaran pay JOIN users u ON u.id = pay.user_id ORDER BY pay.created_at DESC`,
  },
  siswa: {
    roles: ["kepsek"],
    sql: `SELECT u.nama, u.email, b.nisn, COALESCE(j.nama, p.jurusan_1) AS jurusan, p.status
          FROM users u LEFT JOIN biodata b ON b.user_id = u.id
          LEFT JOIN pendaftaran p ON p.user_id = u.id
          LEFT JOIN jurusan j ON j.kode = p.jurusan_1
          WHERE u.role = 'calon_siswa' ORDER BY u.nama`,
  },
  pendaftar: {
    roles: ["admin"],
    sql: `SELECT u.nama, u.email, u.created_at, COALESCE(p.status, 'draft') AS status,
                 COALESCE(j.nama, p.jurusan_1) AS jurusan
          FROM users u LEFT JOIN pendaftaran p ON p.user_id = u.id
          LEFT JOIN jurusan j ON j.kode = p.jurusan_1
          WHERE u.role = 'calon_siswa' ORDER BY u.created_at DESC`,
  },
};

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_request, { params }) {
  const { jenis } = await params;
  const report = reports[jenis];
  if (!report) return Response.json({ message: "Laporan tidak ditemukan." }, { status: 404 });
  const auth = await apiSession(report.roles);
  if (auth.error) return auth.error;
  try {
    const [rows] = await pool.execute(report.sql);
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const csv = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
      .map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-${jenis}.csv"`,
      },
    });
  } catch (error) { return failure(error, "Unduh laporan"); }
}
