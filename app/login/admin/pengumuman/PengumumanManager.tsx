"use client";

import { useState, type FormEvent } from "react";

export type Announcement = {
  id: number;
  judul: string;
  isi: string;
  status: "draft" | "terbit";
  published_at: string | Date | null;
};

type AnnouncementForm = Pick<Announcement, "judul" | "isi" | "status">;
const emptyForm: AnnouncementForm = { judul: "", isi: "", status: "draft" };

export default function PengumumanManager({ initialItems }: { initialItems: Announcement[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/pengumuman", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan pengumuman.");
      const saved = result.pengumuman as Announcement;
      setItems((current) => {
        const next = current.filter((item) => item.id !== saved.id);
        next.unshift(saved);
        return next;
      });
      setForm(emptyForm);
      setEditingId(null);
      setMessage(result.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan pengumuman.");
    } finally {
      setBusy(false);
    }
  }

  function edit(item: Announcement) {
    setEditingId(item.id);
    setForm({ judul: item.judul, isi: item.isi, status: item.status });
    setError("");
    setMessage("");
  }

  return <div className="admin-management">
    <section className="panel">
      <h2 className="panel-title">{editingId ? "Ubah Pengumuman" : "Buat Pengumuman"}</h2>
      <form className="admin-form-grid" onSubmit={submit}>
        <label className="admin-form-full">Judul<input value={form.judul} maxLength={200} required onChange={(event) => setForm({ ...form, judul: event.target.value })} disabled={busy} /></label>
        <label className="admin-form-full">Isi<textarea rows={6} maxLength={20000} value={form.isi} required onChange={(event) => setForm({ ...form, isi: event.target.value })} disabled={busy} /></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AnnouncementForm["status"] })} disabled={busy}>
          <option value="draft">Simpan sebagai draf</option><option value="terbit">Terbitkan</option>
        </select></label>
        <div className="admin-action-row">
          <button className="btn-blue" disabled={busy}>{busy ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Pengumuman"}</button>
          {editingId && <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => { setEditingId(null); setForm(emptyForm); }}>Batal</button>}
        </div>
      </form>
      {error && <p className="payment-admin-error" role="alert">{error}</p>}
      {message && <p className="payment-admin-message" role="status">{message}</p>}
    </section>
    <section className="panel">
      <h2 className="panel-title">Daftar Pengumuman</h2>
      {items.length === 0 ? <p className="admin-empty">Belum ada pengumuman. Buat pengumuman pertama melalui formulir.</p> :
        <div className="admin-card-list">{items.map((item) => <article className="admin-record-card" key={item.id}>
          <div className="admin-record-heading"><strong>{item.judul}</strong><span>{item.status === "terbit" ? "Terbit" : "Draf"}</span></div>
          <p className="announcement-copy">{item.isi}</p>
          {item.published_at && <small>Terbit: {new Date(item.published_at).toLocaleString("id-ID")}</small>}
          <div><button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => edit(item)}>Ubah</button></div>
        </article>)}</div>}
    </section>
  </div>;
}
