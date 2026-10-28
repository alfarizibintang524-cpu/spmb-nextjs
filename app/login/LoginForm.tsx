"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { dashboardPath } from "@/lib/roles";
import { showToast } from "@/app/ui/Toast";
import "./login.css";

export default function LoginPage({
  registrationSuccess = false,
}: {
  registrationSuccess?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] =
    useState(registrationSuccess);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");
    setShowRegistrationSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesan(data.message || "Login gagal.");
        return;
      }

      const tujuan = dashboardPath(data.user.role);

      if (tujuan === "/login") {
        setPesan("Role akun tidak dikenali.");
        return;
      }

      showToast("Berhasil login");
      router.push(tujuan);
      router.refresh();
    } catch {
      setPesan("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-left">
        <Link href="/" className="login-logo">
          SPM<span>B</span>
        </Link>
        <div className="login-left-text">
          <h1>
            Selamat
            <br />
            Datang Kembali.
          </h1>
          <p>Masuk ke sistem SPMB menggunakan akun yang sudah terdaftar.</p>
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <h2>Login</h2>
          <p className="login-sub">Masukkan email dan password kamu.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {showRegistrationSuccess && (
              <p className="login-error" style={{ color: "#15803d" }} role="status">
                Pendaftaran berhasil, silakan login
              </p>
            )}
            {pesan && <p className="login-error" role="alert">{pesan}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <><span className="spinner" aria-hidden="true" /> Memproses...</> : "Masuk"}
            </button>
          </form>

          <p className="login-footer">
            Belum punya akun? <Link href="/register">Daftar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}