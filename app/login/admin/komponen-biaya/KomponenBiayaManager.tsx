"use client";

import { useState, type FormEvent } from "react";
import { showToast } from "@/app/ui/Toast";

export type PaymentStage = "pendaftaran" | "daftar_ulang";
export type CostComponent = {
  id: number;
  tahap: PaymentStage;
  nama: string;
  nominal: number;
  keterangan: string | null;
  wajib: number;
  aktif: number;
  urutan: number;
};
export type Deadline = { tahap: PaymentStage; batas_waktu: string | null };

type ComponentForm = {
  tahap: PaymentStage;
  nama: string;
  nominal: string;
  keterangan: string;
  wajib: string;
  aktif: string;
  urutan: string;
};
const emptyForm: ComponentForm = {
  tahap: "pendaftaran", nama: "", nominal: "", keterangan: "", wajib: "1", aktif: "1", urutan: "0",
};
const stageLabels: Record<PaymentStage, string> = {
  pendaftaran: "Pendaftaran",
  daftar_ulang: "Daftar Ulang",
};
const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

function componentForm(component: CostComponent): ComponentForm {
  return {
    tahap: component.tahap,
    nama: component.nama,
    nominal: String(component.nominal),
    keterangan: component.keterangan || "",
    wajib: component.wajib ? "1" : "0",
    aktif: component.aktif ? "1" : "0",
    urutan: String(component.urutan),
  };
}

export default function KomponenBiayaManager({
  initialComponents,
  initialDeadlines,
}: {
  initialComponents: CostComponent[];
  initialDeadlines: Deadline[];
}) {
  const [components, setComponents] = useState(initialComponents);
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/komponen-biaya", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, nominal: Number(form.nominal), id: editingId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan komponen biaya.");
      const saved = result.komponen as CostComponent;
      setComponents((current) => {
        const next = current.filter((item) => item.id !== Number(saved.id));
        next.push({ ...saved, id: Number(saved.id), nominal: Number(saved.nominal), wajib: Number(saved.wajib), aktif: Number(saved.aktif), urutan: Number(saved.urutan) });
        return next.sort((left, right) => left.tahap.localeCompare(right.tahap) || left.urutan - right.urutan || left.id - right.id);
      });
      setMessage(result.message);
      setForm(emptyForm);
      setEditingId(null);
      showToast(result.message);
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "Gagal menyimpan komponen biaya.";
      setError(text);
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveDeadline(tahap: PaymentStage, batas_waktu: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/komponen-biaya/tenggat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahap, batas_waktu: batas_waktu || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan batas waktu.");
      setDeadlines((current) => current.map((item) => item.tahap === tahap ? { tahap, batas_waktu: batas_waktu || null } : item));
      setMessage(result.message);
      showToast(result.message);
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : "Gagal menyimpan batas waktu.";
      setError(text);
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(component: CostComponent) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/komponen-biaya", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...component, aktif: component.aktif ? 0 : 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengubah status komponen.");
      const saved = result.komponen as CostComponent;
      setComponents((current) => current.map((item) => item.id === component.id ? {
        ...saved,
        id: Number(saved.id),
        nominal: Number(saved.nominal),
        wajib: Number(saved.wajib),
        aktif: Number(saved.aktif),
        urutan: Number(saved.urutan),
      } : item));
      setMessage(result.message);
      showToast(result.message);
    } catch (toggleError) {
      const text = toggleError instanceof Error ? toggleError.message : "Gagal mengubah status komponen.";
      setError(text);
      showToast(text, "error");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="panel payment-admin-grid">
      {(["pendaftaran", "daftar_ulang"] as const).map((stage) => {
        const deadline = deadlines.find((item) => item.tahap === stage);
        return <DeadlineInput key={stage} stage={stage} value={deadline?.batas_waktu || ""} disabled={busy} onSave={saveDeadline} />;
      })}
    </div>
    {message && <p className="payment-admin-message" role="status">{message}</p>}
    {error && <p className="payment-admin-error" role="alert">{error}</p>}
    <div className="payment-admin-grid">
      <section className="panel payment-admin-form">
        <h2>{editingId ? "Ubah Komponen Biaya" : "Tambah Komponen Biaya"}</h2>
        <form onSubmit={submit}>
          <label htmlFor="cost-stage">Tahap</label>
          <select id="cost-stage" value={form.tahap} onChange={(event) => setForm({ ...form, tahap: event.target.value as PaymentStage })} disabled={busy}>
            {Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor="cost-name">Nama komponen</label>
          <input id="cost-name" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={150} required disabled={busy} />
          <label htmlFor="cost-amount">Nominal (Rupiah)</label>
          <input id="cost-amount" type="number" min="0" step="1" value={form.nominal} onChange={(event) => setForm({ ...form, nominal: event.target.value })} required disabled={busy} />
          <label htmlFor="cost-description">Keterangan</label>
          <textarea id="cost-description" value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} maxLength={2000} rows={3} disabled={busy} />
          <div className="payment-admin-form-row">
            <div><label htmlFor="cost-required">Kewajiban</label><select id="cost-required" value={form.wajib} onChange={(event) => setForm({ ...form, wajib: event.target.value })} disabled={busy}><option value="1">Wajib</option><option value="0">Opsional</option></select></div>
            <div><label htmlFor="cost-active">Status</label><select id="cost-active" value={form.aktif} onChange={(event) => setForm({ ...form, aktif: event.target.value })} disabled={busy}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></div>
          </div>
          <label htmlFor="cost-order">Urutan</label>
          <input id="cost-order" type="number" min="0" step="1" value={form.urutan} onChange={(event) => setForm({ ...form, urutan: event.target.value })} disabled={busy} />
          {error && <p className="payment-admin-error" role="alert">{error}</p>}
          <div className="payment-admin-actions">
            <button className="btn-blue" disabled={busy}>{busy ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Komponen"}</button>
            {editingId && <button type="button" className="payment-admin-secondary" onClick={reset} disabled={busy}>Batal</button>}
          </div>
        </form>
      </section>
      <section className="panel payment-admin-list">
        <h2>Daftar Komponen Biaya</h2>
        {components.length === 0 ? <div className="payment-admin-empty" role="status">Belum ada komponen biaya. Tambahkan melalui formulir ini.</div> :
          <div className="payment-admin-method-list">{components.map((component) => <article className="payment-admin-method" key={component.id}>
            <div className="payment-admin-method-heading">
              <div><h3>{component.nama}</h3><span className={component.aktif ? "payment-admin-status active" : "payment-admin-status"}>{component.aktif ? "Aktif" : "Nonaktif"}</span><span className="payment-admin-type">{component.wajib ? "Wajib" : "Opsional"}</span></div>
              <span className="payment-admin-order">Urutan {component.urutan}</span>
            </div>
            <p>{stageLabels[component.tahap]} · <strong>{rupiah(component.nominal)}</strong></p>
            {component.keterangan && <p>{component.keterangan}</p>}
            <div className="payment-admin-actions">
              <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => { setEditingId(component.id); setForm(componentForm(component)); setError(""); setMessage(""); }}>Ubah</button>
              <button type="button" className={component.aktif ? "payment-admin-danger" : "payment-admin-secondary"} disabled={busy} onClick={() => void toggleActive(component)}>{component.aktif ? "Nonaktifkan" : "Aktifkan"}</button>
            </div>
          </article>)}</div>}
      </section>
    </div>
  </>;
}

function DeadlineInput({
  stage,
  value,
  disabled,
  onSave,
}: {
  stage: PaymentStage;
  value: string;
  disabled: boolean;
  onSave: (stage: PaymentStage, value: string) => void;
}) {
  const [date, setDate] = useState(value);
  return <section className="payment-admin-form">
    <h2>Batas Waktu {stageLabels[stage]}</h2>
    <label htmlFor={`deadline-${stage}`}>Tanggal batas pembayaran</label>
    <input id={`deadline-${stage}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={disabled} />
    <button type="button" className="btn-blue" disabled={disabled} onClick={() => onSave(stage, date)}>Simpan Batas Waktu</button>
  </section>;
}
