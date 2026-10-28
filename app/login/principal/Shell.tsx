"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "../students/siswa.css";
import "./principal.css";
import LogoutButton from "../LogoutButton";
import { initialsFromName } from "@/lib/roles";

type Menu = { label: string; href: string };

const menu: Menu[] = [
  { label: "Dashboard", href: "/login/principal" },
  { label: "Laporan Calon Siswa", href: "/login/principal/laporan-siswa" },
  { label: "Laporan Seleksi", href: "/login/principal/laporan-seleksi" },
  { label: "Laporan Pembayaran", href: "/login/principal/laporan-pembayaran" },
];

export default function PrincipalShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();

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

        <p className="side-title">KEPALA SEKOLAH</p>
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={pathname === m.href ? "side-link active" : "side-link"}
          >
            {m.label}
          </Link>
        ))}
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