"use client";

import RoleShell from "../RoleShell";

type Menu = { label: string; href: string };

const groups: Array<{ label: string; items: Menu[] }> = [
  {
    label: "PENDAFTARAN",
    items: [
      { label: "Dashboard", href: "/login/students" },
      { label: "Biodata", href: "/login/students/biodata" },
      { label: "Pilihan Jurusan", href: "/login/students/jurusan" },
      { label: "Dokumen", href: "/login/students/dokumen" },
      { label: "Tes TPA", href: "/login/students/tes-tpa" },
    ],
  },
  {
    label: "PROSES",
    items: [
      { label: "Pembayaran", href: "/login/students/pembayaran" },
      { label: "Status Seleksi", href: "/login/students/status-seleksi" },
    ],
  },
];

export default function StudentsShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  return <RoleShell name={name} groups={groups}>{children}</RoleShell>;
}