import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import KomponenBiayaManager, { type CostComponent, type Deadline } from "./KomponenBiayaManager";

type ComponentRow = RowDataPacket & CostComponent;
type DeadlineRow = RowDataPacket & Deadline;

export default async function KelolaKomponenBiayaPage() {
  await requireRole("admin");
  const [componentResult, deadlineResult] = await Promise.all([
    pool.execute<ComponentRow[]>(
      `SELECT id, tahap, nama, nominal, keterangan, wajib, aktif, urutan
       FROM komponen_biaya ORDER BY tahap, urutan, id`
    ),
    pool.execute<DeadlineRow[]>(
      "SELECT tahap, DATE_FORMAT(batas_waktu, '%Y-%m-%d') AS batas_waktu FROM tenggat_pembayaran"
    ),
  ]);
  const components = componentResult[0].map((row) => ({
    id: Number(row.id),
    tahap: row.tahap,
    nama: row.nama,
    nominal: Number(row.nominal),
    keterangan: row.keterangan,
    wajib: Number(row.wajib),
    aktif: Number(row.aktif),
    urutan: Number(row.urutan),
  }));
  const deadlines = deadlineResult[0].map((row) => ({
    tahap: row.tahap,
    batas_waktu: row.batas_waktu,
  }));
  return <>
    <h1 className="page-title">Komponen Biaya</h1>
    <p className="page-sub">Kelola rincian biaya, nominal, status, urutan, dan batas waktu tiap tahap.</p>
    <KomponenBiayaManager initialComponents={components} initialDeadlines={deadlines} />
  </>;
}
