"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import LogoutButton from "./LogoutButton";
import { initialsFromName } from "@/lib/roles";
import "./students/siswa.css";

type MenuItem = { label: string; href: string };
type MenuGroup = { label: string; items: MenuItem[] };

export default function RoleShell({
  children,
  name,
  groups,
}: {
  children: ReactNode;
  name: string;
  groups: MenuGroup[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="siswa-shell">
      {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
      <aside id="role-navigation" className={`sidebar${menuOpen ? " is-open" : ""}`}>
        <Link href="/" className="sidebar-logo">
          SPM<span>B</span>
        </Link>
        <div className="sidebar-user">
          <span aria-hidden="true" className="sidebar-avatar">{initialsFromName(name)}</span>
          <span title={name} className="sidebar-user-name">{name}</span>
        </div>

        <nav aria-label="Navigasi utama">
          {groups.map((group) => (
            <section key={group.label}>
              <p className="side-title">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? "side-link active" : "side-link"}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </section>
          ))}
        </nav>
        <p className="side-title">AKUN</p>
        <LogoutButton />
      </aside>

      <main className="siswa-main">
        <header className="siswa-main-header" aria-label="Akun pengguna">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="role-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <span aria-hidden="true" className="header-avatar">{initialsFromName(name)}</span>
          <span className="header-user-name">{name}</span>
        </header>
        <div className="role-content">{children}</div>
      </main>
    </div>
  );
}
