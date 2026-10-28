"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/app/ui/Toast";

export default function LogoutButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout gagal.");
      showToast("Berhasil logout");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Logout gagal.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }
  return <>
    <button type="button" className="side-link" style={{ width: "100%", textAlign: "left", background: "transparent", border: 0 }} onClick={() => setConfirming(true)}>Keluar</button>
    {error && <span role="alert" className="logout-error">{error}</span>}
    {confirming && (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) setConfirming(false);
      }}>
        <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <h2 id="logout-title">Keluar dari akun?</h2>
          <p>Sesi kamu akan diakhiri.</p>
          <div className="modal-actions">
            <button type="button" className="btn-blue modal-cancel" disabled={loading} onClick={() => setConfirming(false)}>Batal</button>
            <button type="button" className="btn-blue" disabled={loading} onClick={logout}>
              {loading ? <><span className="spinner" aria-hidden="true" /> Memproses...</> : "Keluar"}
            </button>
          </div>
        </section>
      </div>
    )}
  </>;
}
