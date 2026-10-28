"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./register.css";
import { showToast } from "@/app/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [nisn, setNisn] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPesan("");

    if (
      !nama.trim() ||
      !nisn.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !konfirmasi
    ) {
      setPesan("Semua kolom wajib diisi.");
      return;
    }

    if (password.length < 8) {
      setPesan("Password minimal 8 karakter.");
      return;
    }

    if (password !== konfirmasi) {
      setPesan("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: nama.trim(),
          nisn: nisn.trim(),
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesan(data.message || "Registrasi gagal.");
        return;
      }

      showToast("Pendaftaran berhasil, silakan login");
      router.push("/login?daftar=sukses");
    } catch {
      setPesan("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-left">
        <div className="register-logo">
          SPMB <span>SMK Citra Negara</span>
        </div>

        <div className="register-left-text">
          <h1>Mulai Langkahmu Menuju Masa Depan.</h1>
          <p>
            Daftarkan akunmu untuk mengikuti Sistem
            Penerimaan Murid Baru SMK Citra Negara.
          </p>
        </div>

        <p className="register-left-footer">
          © 2026 SMK Citra Negara
        </p>
      </section>

      <section className="register-right">
        <div className="register-card">
          <h2>Daftar Akun</h2>
          <p className="register-sub">
            Buat akun calon siswa SPMB
          </p>

          <form onSubmit={handleRegister}>
            <div className="register-grid">
              <div className="register-field">
                <label htmlFor="nama">Nama Lengkap</label>
                <input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="nisn">NISN</label>
                <input
                  id="nisn"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Masukkan NISN"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Buat username"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="konfirmasi">
                  Konfirmasi Password
                </label>
                <input
                  id="konfirmasi"
                  type="password"
                  value={konfirmasi}
                  onChange={(e) =>
                    setKonfirmasi(e.target.value)
                  }
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {pesan && (
              <p className="register-error" role="alert">
                {pesan}
              </p>
            )}

            <button
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading ? <><span className="spinner" aria-hidden="true" /> Memproses...</> : "Daftar Sekarang"}
            </button>
          </form>

          <p className="register-login">
            Sudah punya akun? <a href="/login">Login</a>
          </p>
        </div>
      </section>
    </main>
  );
}