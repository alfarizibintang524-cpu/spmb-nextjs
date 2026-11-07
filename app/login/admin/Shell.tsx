"use client";

import "./admin.css";
import RoleShell from "../RoleShell";

type Menu = { label: string; href: string };

const groups: Array<{ label: string; items: Menu[] }> = [
  {
    label: "ADMIN",
    items: [
      { label: "Dashboard", href: "/login/admin" },
      { label: "Data Calon Siswa", href: "/login/admin/data-siswa" },
      { label: "Tes TPA", href: "/login/admin/tes-tpa" },
      { label: "Seleksi", href: "/login/admin/seleksi" },
      { label: "Verifikasi Dokumen", href: "/login/admin/verifikasi" },
      { label: "Verifikasi Pembayaran", href: "/login/admin/pembayaran" },
      { label: "Metode Pembayaran", href: "/login/admin/metode-pembayaran" },
      { label: "Komponen Biaya", href: "/login/admin/komponen-biaya" },
      { label: "Jurusan", href: "/login/admin/jurusan" },
    ],
  },
  {
    label: "LAPORAN",
    items: [
      { label: "Data Pendaftar", href: "/login/admin/data-pendaftar" },
      { label: "Laporan Seleksi", href: "/login/admin/laporan-seleksi" },
      { label: "Laporan Pembayaran", href: "/login/admin/laporan-pembayaran" },
    ],
  },
];

export default function AdminShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  return <RoleShell name={name} groups={groups}>{children}</RoleShell>;
}