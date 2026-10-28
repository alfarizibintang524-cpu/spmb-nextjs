"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./siswa.css";
import LogoutButton from "../LogoutButton";
import { initialsFromName } from "@/lib/roles";

type Menu = { label: string; href: string };

const menuPendaftaran: Menu[] = [
  { label: "Dashboard", href: "/login/students" },
  { label: "Biodata", href: "/login/students/biodata" },
  { label: "Pilihan Jurusan", href: "/login/students/jurusan" },
  { label: "Dokumen", href: "/login/students/dokumen" },
  { label: "Tes TPA", href: "/login/students/tes-tpa" },
];

const menuProses: Menu[] = [
  { label: "Pembayaran", href: "/login/students/pembayaran" },
  { label: "Status Seleksi", href: "/login/students/status-seleksi" },
];

export default function StudentsShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();

  function renderMenu(items: Menu[]) {
    return items.map((m) => (
      <Link
        key={m.href}
        href={m.href}
        className={pathname === m.href ? "side-link active" : "side-link"}
      >
        {m.label}
      </Link>
    ));
  }

  return (
    <div className="siswa-shell">
      <aside className="sidebar">
        <Link href="/" className="sidebar-logo">
          SPM<span>B</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 10px 20px" }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", background: "#0a82d4", color: "#fff", fontSize: 10, fontWeight: 700 }}>
            {initialsFromName(name)}
          </span>
          <span title={name} style={{ minWidth: 0, overflowWrap: "anywhere", fontSize: 10, fontWeight: 600 }}>
            {name}
          </span>
        </div>

        <p className="side-title">PENDAFTARAN</p>
        {renderMenu(menuPendaftaran)}

        <p className="side-title">PROSES</p>
        {renderMenu(menuProses)}
        <p className="side-title">AKUN</p>
        <LogoutButton />
      </aside>

      <main className="siswa-main">
        <header aria-label="Akun pengguna" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 20, color: "#0b2a5b", fontSize: 12, fontWeight: 600 }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", background: "#0a82d4", color: "#fff", fontSize: 10 }}>
            {initialsFromName(name)}
          </span>
          <span>{name}</span>
        </header>
        <div className="role-content">{children}</div>
      </main>
    </div>
  );
}