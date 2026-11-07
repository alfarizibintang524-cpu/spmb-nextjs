"use client";

import { useState, type FormEvent } from "react";
import { showToast } from "@/app/ui/Toast";

export type Major = {
  id: number;
  kode: string;
  nama: string;
  keterangan: string | null;
  kuota: number | null;
  aktif: number;
  urutan: number;
  terisi: number;
};

type MajorForm = {
  kode: string;
  nama: string;
  keterangan: string;
  kuota: string;
  aktif: string;
  urutan: string;
};

const emptyForm: MajorForm = { kode: "", nama: "", keterangan: "", kuota: "", aktif: "1", urutan: "0" };

function toForm(major: Major): MajorForm {
  return {
    kode: major.kode,
    nama: major.nama,
    keterangan: major.keterangan || "",
    kuota: major.kuota === null ? "" : String(major.kuota),
    aktif: major.aktif ? "1" : "0",
    urutan: String(major.urutan),
  };
}

export default function JurusanManager({ initialMajors }: { initialMajors: Major[] }) {
  const [majors, setMajors] = useState(initialMajors);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/jurusan", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingId, kuota: form.kuota || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan jurusan.");
      const saved = result.jurusan as Major;
      setMajors((current) => {
        const next = current.filter((major) => major.id !== saved.id);
        next.push({ ...saved, id: Number(saved.id), aktif: Number(saved.aktif), urutan: Number(saved.urutan), terisi: Number(saved.terisi) });
        return next.sort((left, right) => left.urutan - right.urutan || left.id - right.id);
      });
      setMessage(result.message);
      setForm(emptyForm);
      setEditingId(null);
      setError("");
      showToast(result.message);
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "Gagal menyimpan jurusan.";
      setError(text);
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(major: Major) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/jurusan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: major.id, aktif: major.aktif ? 0 : 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengubah status jurusan.");
      setMajors((current) => current.map((item) => item.id === major.id ? {
        ...result.jurusan,
        id: Number(result.jurusan.id),
        aktif: Number(result.jurusan.aktif),
        urutan: Number(result.jurusan.urutan),
        terisi: Number(result.jurusan.terisi),
      } : item));
      setMessage(result.message);
      showToast(result.message);
    } catch (toggleError) {
      const text = toggleError instanceof Error ? toggleError.message : "Gagal mengubah status jurusan.";
      setError(text);
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  }

  return <div className="payment-admin-grid">
    <section className="panel payment-admin-form">
      <h2>{editingId ? "Ubah Jurusan" : "Tambah Jurusan"}</h2>
      <form onSubmit={submit}>
        <label htmlFor="major-code">Kode jurusan</label>
        <input id="major-code" value={form.kode} onChange={(event) => setForm({ ...form, kode: event.target.value.toUpperCase() })} maxLength={10} required disabled={busy || Boolean(editingId)} />
        <label htmlFor="major-name">Nama jurusan</label>
        <input id="major-name" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={100} required disabled={busy} />
        <label htmlFor="major-description">Keterangan</label>
        <textarea id="major-description" value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} maxLength={2000} rows={3} disabled={busy} />
        <div className="payment-admin-form-row">
          <div>
            <label htmlFor="major-quota">Kuota (kosongkan jika tidak dibatasi)</label>
            <input id="major-quota" type="number" min="0" step="1" value={form.kuota} onChange={(event) => setForm({ ...form, kuota: event.target.value })} disabled={busy} />
          </div>
          <div>
            <label htmlFor="major-order">Urutan</label>
            <input id="major-order" type="number" min="0" step="1" value={form.urutan} onChange={(event) => setForm({ ...form, urutan: event.target.value })} disabled={busy} />
          </div>
        </div>
        <label htmlFor="major-active">Status</label>
        <select id="major-active" value={form.aktif} onChange={(event) => setForm({ ...form, aktif: event.target.value })} disabled={busy}>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>
        {error && <p className="payment-admin-error" role="alert">{error}</p>}
        {message && <p className="payment-admin-message" role="status">{message}</p>}
        <div className="payment-admin-actions">
          <button className="btn-blue" disabled={busy}>{busy ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Jurusan"}</button>
          {editingId && <button type="button" className="payment-admin-secondary" onClick={reset} disabled={busy}>Batal</button>}
        </div>
      </form>
    </section>
    <section className="panel payment-admin-list">
      <h2>Daftar Jurusan</h2>
      {majors.length === 0 ? <div className="payment-admin-empty" role="status">Belum ada jurusan untuk ditampilkan.</div> :
        <div className="payment-admin-method-list">{majors.map((major) => <article className="payment-admin-method" key={major.id}>
          <div className="payment-admin-method-heading">
            <div><h3>{major.nama}</h3><span className={major.aktif ? "payment-admin-status active" : "payment-admin-status"}>{major.aktif ? "Aktif" : "Nonaktif"}</span></div>
            <span className="payment-admin-order">{major.kode} · Urutan {major.urutan}</span>
          </div>
          <p>{major.keterangan || "Tidak ada keterangan."}</p>
          <p>Kuota: {major.kuota === null ? "Tidak dibatasi" : `${major.terisi}/${major.kuota} terisi`}</p>
          <div className="payment-admin-actions">
            <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => { setEditingId(major.id); setForm(toForm(major)); setError(""); setMessage(""); }}>Ubah</button>
            <button type="button" className={major.aktif ? "payment-admin-danger" : "payment-admin-secondary"} disabled={busy} onClick={() => void toggleActive(major)}>{major.aktif ? "Nonaktifkan" : "Aktifkan"}</button>
          </div>
        </article>)}</div>}
    </section>
  </div>;
}
