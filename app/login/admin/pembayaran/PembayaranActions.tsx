"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/app/ui/Toast";

export default function PembayaranActions({
  id,
  tahap,
  nominal,
}: {
  id: number;
  tahap: "pendaftaran" | "daftar_ulang";
  nominal: number;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  async function submit(status: "diterima" | "ditolak") {
    if (status === "ditolak" && !note.trim()) {
      setError("Catatan alasan penolakan wajib diisi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "pembayaran", status, catatan: note.trim(), tahap, nominal }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan verifikasi.");
      showToast(result.message || "Verifikasi pembayaran tersimpan.");
      setConfirmReject(false);
      router.refresh();
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "Gagal menyimpan verifikasi.";
      setError(text);
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  }

  return <div className="payment-review-actions">
    <label htmlFor={`payment-note-${id}`}>Catatan admin</label>
    <textarea
      id={`payment-note-${id}`}
      value={note}
      onChange={(event) => setNote(event.target.value)}
      maxLength={1000}
      rows={2}
      placeholder="Wajib untuk penolakan"
      disabled={busy}
    />
    {error && <small className="payment-admin-error" role="alert">{error}</small>}
    {!confirmReject ? <div className="payment-admin-actions">
      <button type="button" className="btn-blue" disabled={busy} onClick={() => void submit("diterima")}>
        {busy ? "Memproses..." : "Terima"}
      </button>
      <button type="button" className="payment-admin-danger" disabled={busy} onClick={() => {
        if (!note.trim()) {
          setError("Catatan alasan penolakan wajib diisi.");
          return;
        }
        setError("");
        setConfirmReject(true);
      }}>Tolak</button>
    </div> : <div className="payment-review-confirm" role="group" aria-label="Konfirmasi penolakan">
      <p>Tolak pembayaran ini dengan catatan di atas?</p>
      <div className="payment-admin-actions">
        <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => setConfirmReject(false)}>Batal</button>
        <button type="button" className="payment-admin-danger" disabled={busy} onClick={() => void submit("ditolak")}>{busy ? "Memproses..." : "Konfirmasi Tolak"}</button>
      </div>
    </div>}
  </div>;
}
