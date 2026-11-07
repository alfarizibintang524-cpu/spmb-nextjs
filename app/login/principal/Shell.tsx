"use client";

import "./principal.css";
import RoleShell from "../RoleShell";

type Menu = { label: string; href: string };

const groups: Array<{ label: string; items: Menu[] }> = [
  {
    label: "KEPALA SEKOLAH",
    items: [
      { label: "Dashboard", href: "/login/principal" },
      { label: "Laporan Calon Siswa", href: "/login/principal/laporan-siswa" },
      { label: "Laporan Seleksi", href: "/login/principal/laporan-seleksi" },
      { label: "Laporan Pembayaran", href: "/login/principal/laporan-pembayaran" },
    ],
  },
];

export default function PrincipalShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  return <RoleShell name={name} groups={groups}>{children}</RoleShell>;
}