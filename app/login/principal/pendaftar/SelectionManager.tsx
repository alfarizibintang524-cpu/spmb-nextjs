"use client";

import { useState } from "react";
import { SelectionAction } from "@/app/login/admin/Actions";

export type RankedApplicant = {
  id: number;
  nama: string;
  email: string;
  jurusan: string | null;
  status: string;
  nilai: number | null;
  benar: number | null;
  total: number | null;
  waktu_selesai: string | null;
  peringkat: number | null;
};

export default function SelectionManager({ applicants }: { applicants: RankedApplicant[] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [pendingStatus, setPendingStatus] = useState<"diterima" | "ditolak" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const eligible = applicants.filter((applicant) => applicant.status !== "draft");

  function toggleSelected(id: number) {
    setSelected((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  }

  function togglePage() {
    const allSelected = eligible.length > 0 && eligible.every((applicant) => selected.includes(applicant.id));
    setSelected((current) => allSelected
      ? current.filter((id) => !eligible.some((applicant) => applicant.id === id))
      : [...new Set([...current, ...eligible.map((applicant) => applicant.id)])]);
  }

  async function applyBulkStatus() {
    if (!pendingStatus || selected.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/seleksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: selected, status: pendingStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan hasil seleksi.");
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan hasil seleksi.");
      setPendingStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return <>
    {error && <p className="payment-admin-error" role="alert">{error}</p>}
    <div className="selection-bulk-actions">
      <button type="button" className="payment-admin-secondary" onClick={togglePage} disabled={eligible.length === 0 || busy}>
        {eligible.length > 0 && eligible.every((applicant) => selected.includes(applicant.id)) ? "Batalkan pilih halaman" : "Pilih semua di halaman"}
      </button>
      <span>{selected.length} pendaftar dipilih</span>
      <button type="button" className="btn-blue" disabled={selected.length === 0 || busy} onClick={() => setPendingStatus("diterima")}>Tetapkan lulus</button>
      <button type="button" className="payment-admin-danger" disabled={selected.length === 0 || busy} onClick={() => setPendingStatus("ditolak")}>Tetapkan tidak lulus</button>
    </div>
    <div className="admin-table-wrap">
      <table className="table">
        <thead><tr><th><span className="sr-only">Pilih</span></th><th>Peringkat</th><th>Calon siswa</th><th>Jurusan</th><th>Nilai TPA</th><th>Status seleksi</th><th>Penetapan</th></tr></thead>
        <tbody>{applicants.map((applicant) => <tr key={applicant.id}>
          <td><input
            type="checkbox"
            aria-label={`Pilih ${applicant.nama}`}
            checked={selected.includes(applicant.id)}
            disabled={applicant.status === "draft" || busy}
            onChange={() => toggleSelected(applicant.id)}
          /></td>
          <td>{applicant.peringkat ? `#${applicant.peringkat}` : "-"}</td>
          <td>{applicant.nama}<small className="admin-cell-secondary">{applicant.email}</small></td>
          <td>{applicant.jurusan || "-"}</td>
          <td>{applicant.nilai === null ? "-" : Number(applicant.nilai).toLocaleString("id-ID")}</td>
          <td>{applicant.status}</td>
          <td><SelectionAction userId={applicant.id} status={applicant.status} principalMode /></td>
        </tr>)}</tbody>
      </table>
    </div>
    {pendingStatus && <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="mass-selection-confirm">
        <h2 id="mass-selection-confirm">Konfirmasi penetapan massal</h2>
        <p>Anda akan menetapkan {selected.length} pendaftar sebagai {pendingStatus === "diterima" ? "lulus" : "tidak lulus"}.</p>
        <div className="modal-actions">
          <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => setPendingStatus(null)}>Batal</button>
          <button type="button" className="btn-blue" disabled={busy} onClick={() => void applyBulkStatus()}>{busy ? "Memproses..." : "Ya, tetapkan"}</button>
        </div>
      </section>
    </div>}
  </>;
}
