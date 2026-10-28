"use client";

import { useState } from "react";
import { showToast } from "@/app/ui/Toast";

function ActionConfirmation({
  action,
  busy,
  onCancel,
  onConfirm,
}: {
  action: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="action-confirm-title">
        <h2 id="action-confirm-title">Konfirmasi {action.toLowerCase()}?</h2>
        <p>Aksi ini akan memperbarui status pendaftar.</p>
        <div className="modal-actions">
          <button type="button" className="btn-blue modal-cancel" disabled={busy} onClick={onCancel}>Batal</button>
          <button type="button" className="btn-blue" disabled={busy} onClick={onConfirm}>
            {busy ? <><span className="spinner" aria-hidden="true" /> Memproses...</> : `Ya, ${action}`}
          </button>
        </div>
      </section>
    </div>
  );
}

export function ReviewAction({ id, type, currentStatus }: { id: number; type: "dokumen" | "pembayaran"; currentStatus: string }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  async function update(status: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, status, catatan: note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan.");
      setMessage(data.message || "Status berhasil diperbarui.");
      showToast("Status berhasil diperbarui");
      window.location.reload();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan.";
      setMessage(text); showToast(text, "error");
    } finally {
      setBusy(false);
      setPending("");
    }
  }
  function requestUpdate(status: string) {
    if (status === "ditolak") setPending(status);
    else void update(status);
  }
  return <div>
    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan (opsional)" aria-label="Catatan verifikasi" />
    <button className="btn-blue" disabled={busy} onClick={() => requestUpdate(type === "dokumen" ? "valid" : "lunas")}>
      {busy && !pending ? <><span className="spinner" aria-hidden="true" /> Memproses...</> : type === "dokumen" ? "Valid" : "Lunas"}
    </button>{" "}
    <button className="btn-blue" disabled={busy} onClick={() => requestUpdate("ditolak")}>Tolak</button>
    {message && <small role="status">{message}</small>}
    {currentStatus !== "menunggu" && <small>{currentStatus}</small>}
    {pending && <ActionConfirmation action="Tolak" busy={busy} onCancel={() => setPending("")} onConfirm={() => void update(pending)} />}
  </div>;
}

export function SelectionAction({ userId, status }: { userId: number; status: string }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  async function update(nextStatus: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/seleksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: nextStatus, catatan: note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan.");
      setMessage(data.message || "Status berhasil diperbarui.");
      showToast("Status seleksi diperbarui");
      window.location.reload();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan.";
      setMessage(text); showToast(text, "error");
    } finally {
      setBusy(false);
      setPending("");
    }
  }
  function requestUpdate(nextStatus: string) {
    if (nextStatus === "ditolak" || nextStatus === "draft") setPending(nextStatus);
    else void update(nextStatus);
  }
  return <div>
    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan seleksi" aria-label="Catatan seleksi" />
    {status === "diajukan" ? <><button className="btn-blue" disabled={busy} onClick={() => requestUpdate("diterima")}>Terima</button>{" "}
      <button className="btn-blue" disabled={busy} onClick={() => requestUpdate("ditolak")}>Tolak</button></> :
      <button className="btn-blue" disabled={busy} onClick={() => requestUpdate("draft")}>Batalkan</button>}
    {busy && !pending && <span className="spinner" aria-label="Memproses" />}
    {message && <small role="status">{message}</small>}
    {pending && <ActionConfirmation action={pending === "draft" ? "Batalkan" : "Tolak"} busy={busy} onCancel={() => setPending("")} onConfirm={() => void update(pending)} />}
  </div>;
}
