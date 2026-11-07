import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import pool from "@/lib/db";
import PengumumanManager, { type Announcement } from "./PengumumanManager";

type AnnouncementRow = RowDataPacket & Announcement;

export default async function PengumumanAdminPage() {
  await requireRole("admin");
  const [items] = await pool.execute<AnnouncementRow[]>(
    "SELECT id, judul, isi, status, published_at FROM pengumuman ORDER BY created_at DESC, id DESC"
  );
  return <>
    <h1 className="page-title">Pengumuman</h1>
    <p className="page-sub">Buat, ubah, dan terbitkan informasi penerimaan.</p>
    <PengumumanManager initialItems={items} />
  </>;
}
