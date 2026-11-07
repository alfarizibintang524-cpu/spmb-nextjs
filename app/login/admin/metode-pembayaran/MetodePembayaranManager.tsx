"use client";

import { useRef, useState, type FormEvent } from "react";
import { showToast } from "@/app/ui/Toast";

export type PaymentMethod = {
  id: number;
  nama: string;
  tipe: "transfer_bank" | "qris" | "tunai" | "ewallet";
  nama_bank: string | null;
  nomor_rekening: string | null;
  atas_nama: string | null;
  qr_image: string | null;
  petunjuk: string | null;
  aktif: number;
  urutan: number;
};

type MethodForm = {
  nama: string;
  tipe: PaymentMethod["tipe"];
  nama_bank: string;
  nomor_rekening: string;
  atas_nama: string;
  petunjuk: string;
  urutan: string;
  aktif: string;
};

const emptyForm: MethodForm = {
  nama: "",
  tipe: "transfer_bank",
  nama_bank: "",
  nomor_rekening: "",
  atas_nama: "",
  petunjuk: "",
  urutan: "0",
  aktif: "1",
};

const typeLabels: Record<PaymentMethod["tipe"], string> = {
  transfer_bank: "Transfer Bank",
  tunai: "Tunai (Cash)",
  qris: "QRIS",
  ewallet: "E-Wallet",
};

const maxQrSize = 2 * 1024 * 1024;
const allowedQrTypes = new Set(["image/jpeg", "image/png"]);

function formFromMethod(method: PaymentMethod): MethodForm {
  return {
    nama: method.nama,
    tipe: method.tipe,
    nama_bank: method.nama_bank || "",
    nomor_rekening: method.nomor_rekening || "",
    atas_nama: method.atas_nama || "",
    petunjuk: method.petunjuk || "",
    urutan: String(method.urutan),
    aktif: method.aktif ? "1" : "0",
  };
}

export default function MetodePembayaranManager({
  initialMethods,
  setupMessage,
}: {
  initialMethods: PaymentMethod[];
  setupMessage: string | null;
}) {
  const [methods, setMethods] = useState(initialMethods);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
    formRef.current?.reset();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetForm = event.currentTarget;
    setError("");
    setMessage("");
    const qrFile = (targetForm.elements.namedItem("qr_image") as HTMLInputElement).files?.[0];
    if (qrFile && (!allowedQrTypes.has(qrFile.type) || qrFile.size === 0 || qrFile.size > maxQrSize)) {
      setError("Gambar QRIS harus JPG/PNG dan maksimal 2 MB.");
      return;
    }
    if (form.tipe === "qris" && !qrFile && !methods.find((method) => method.id === editingId)?.qr_image) {
      setError("Gambar QRIS wajib diunggah.");
      return;
    }
    if (form.tipe === "transfer_bank" && (!form.nama_bank.trim() || !form.nomor_rekening.trim() || !form.atas_nama.trim())) {
      setError("Nama bank, nomor rekening, dan nama pemilik wajib diisi.");
      return;
    }
    if (form.tipe === "ewallet" && (!form.nomor_rekening.trim() || !form.atas_nama.trim())) {
      setError("Nomor akun dan nama pemilik e-wallet wajib diisi.");
      return;
    }

    const body = new FormData(targetForm);
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/admin/metode-pembayaran/${editingId}` : "/api/admin/metode-pembayaran",
        { method: editingId ? "PATCH" : "POST", body }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan metode pembayaran.");
      setMethods((current) => {
        const next = current.filter((method) => method.id !== result.method.id);
        next.push(result.method);
        return next.sort((left, right) => left.urutan - right.urutan || left.id - right.id);
      });
      setMessage(result.message);
      setForm(emptyForm);
      setEditingId(null);
      targetForm.reset();
      showToast(result.message);
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "Gagal menyimpan metode pembayaran.";
      setError(text);
      showToast(text, "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(method: PaymentMethod) {
    setError("");
    setMessage("");
    setDeactivatingId(method.id);
    try {
      const response = await fetch(`/api/admin/metode-pembayaran/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: method.aktif ? 0 : 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengubah status metode.");
      setMethods((current) => current.map((item) => item.id === method.id ? result.method : item));
      setMessage(result.message);
      showToast(result.message);
    } catch (toggleError) {
      const text = toggleError instanceof Error ? toggleError.message : "Gagal mengubah status metode.";
      setError(text);
      showToast(text, "error");
    } finally {
      setDeactivatingId(null);
    }
  }

  return <div className="payment-admin-grid">
    <section className="panel payment-admin-form">
      <h2>{editingId ? "Ubah Metode Pembayaran" : "Tambah Metode Pembayaran"}</h2>
      {setupMessage && <p className="payment-admin-alert" role="alert">{setupMessage}</p>}
      <form ref={formRef} onSubmit={submit}>
        <label htmlFor="method-name">Nama metode</label>
        <input id="method-name" name="nama" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={100} required disabled={saving || Boolean(setupMessage)} />

        <label htmlFor="method-type">Tipe</label>
        <select id="method-type" name="tipe" value={form.tipe} onChange={(event) => setForm({ ...form, tipe: event.target.value as PaymentMethod["tipe"] })} disabled={saving || Boolean(setupMessage)}>
          {Object.entries(typeLabels)
            .filter(([value]) => value !== "ewallet" || (editingId !== null && methods.some((method) => method.id === editingId && method.tipe === "ewallet")))
            .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        {form.tipe === "transfer_bank" && <>
          <label htmlFor="method-bank">Nama bank</label>
          <input id="method-bank" name="nama_bank" value={form.nama_bank} onChange={(event) => setForm({ ...form, nama_bank: event.target.value })} maxLength={100} required disabled={saving || Boolean(setupMessage)} />
        </>}
        {form.tipe !== "qris" && form.tipe !== "tunai" && <>
          <label htmlFor="method-account">{form.tipe === "ewallet" ? "Nomor akun" : "Nomor rekening"}</label>
          <input id="method-account" name="nomor_rekening" value={form.nomor_rekening} onChange={(event) => setForm({ ...form, nomor_rekening: event.target.value })} maxLength={100} required disabled={saving || Boolean(setupMessage)} />
          <label htmlFor="method-owner">Atas nama</label>
          <input id="method-owner" name="atas_nama" value={form.atas_nama} onChange={(event) => setForm({ ...form, atas_nama: event.target.value })} maxLength={150} required disabled={saving || Boolean(setupMessage)} />
        </>}
        {form.tipe === "qris" && <>
          <label htmlFor="method-qr">Gambar QRIS (JPG/PNG, maks. 2 MB)</label>
          <input id="method-qr" name="qr_image" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" required={!methods.find((method) => method.id === editingId)?.qr_image} disabled={saving || Boolean(setupMessage)} />
          {methods.find((method) => method.id === editingId)?.qr_image && <p className="payment-admin-current-qr">Gambar saat ini: {methods.find((method) => method.id === editingId)?.qr_image}</p>}
        </>}

        <label htmlFor="method-instructions">Petunjuk pembayaran</label>
        <textarea id="method-instructions" name="petunjuk" value={form.petunjuk} onChange={(event) => setForm({ ...form, petunjuk: event.target.value })} maxLength={2000} rows={3} required={form.tipe === "tunai"} disabled={saving || Boolean(setupMessage)} />

        <div className="payment-admin-form-row">
          <div>
            <label htmlFor="method-order">Urutan tampil</label>
            <input id="method-order" name="urutan" type="number" min="0" step="1" value={form.urutan} onChange={(event) => setForm({ ...form, urutan: event.target.value })} disabled={saving || Boolean(setupMessage)} />
          </div>
          <div>
            <label htmlFor="method-active">Status</label>
            <select id="method-active" name="aktif" value={form.aktif} onChange={(event) => setForm({ ...form, aktif: event.target.value })} disabled={saving || Boolean(setupMessage)}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>
        </div>
        {error && <p className="payment-admin-error" role="alert">{error}</p>}
        {message && <p className="payment-admin-message" role="status">{message}</p>}
        <div className="payment-admin-actions">
          <button className="btn-blue" disabled={saving || Boolean(setupMessage)}>
            {saving ? <><span className="spinner" aria-hidden="true" /> Menyimpan...</> : editingId ? "Simpan Perubahan" : "Tambah Metode"}
          </button>
          {editingId && <button type="button" className="payment-admin-secondary" onClick={resetForm} disabled={saving}>Batal Ubah</button>}
        </div>
      </form>
    </section>

    <section className="panel payment-admin-list">
      <h2>Daftar Metode Pembayaran</h2>
      {methods.length === 0 ? (
        <div className="payment-admin-empty" role="status">Belum ada metode pembayaran. Tambahkan metode menggunakan formulir ini.</div>
      ) : <div className="payment-admin-method-list">
        {methods.map((method) => <article className="payment-admin-method" key={method.id}>
          <div className="payment-admin-method-heading">
            <div>
              <h3>{method.nama}</h3>
              <span className={method.aktif ? "payment-admin-status active" : "payment-admin-status"}>{method.aktif ? "Aktif" : "Nonaktif"}</span>
              <span className="payment-admin-type">{typeLabels[method.tipe] || method.tipe}</span>
            </div>
            <span className="payment-admin-order">Urutan {method.urutan}</span>
          </div>
          <p>{method.tipe === "transfer_bank"
            ? [method.nama_bank, method.nomor_rekening].filter(Boolean).join(" · ")
            : method.tipe === "tunai" ? "Pembayaran tunai" : "QRIS"}
            {method.atas_nama ? ` · ${method.atas_nama}` : ""}
          </p>
          {method.tipe === "qris" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="payment-admin-qr" src={method.qr_image || "/qris-contoh.png"} width={120} height={120} alt={`QRIS ${method.nama}`} />
          )}
          {method.petunjuk && <p className="payment-admin-instructions">{method.petunjuk}</p>}
          <div className="payment-admin-actions">
            <button type="button" className="payment-admin-secondary" disabled={saving || deactivatingId !== null} onClick={() => {
              formRef.current?.reset();
              setEditingId(method.id);
              setForm(formFromMethod(method));
              setError("");
              setMessage("");
            }}>Ubah</button>
            <button type="button" className={method.aktif ? "payment-admin-danger" : "payment-admin-secondary"} disabled={saving || deactivatingId !== null} onClick={() => void toggleActive(method)}>
              {deactivatingId === method.id ? "Memproses..." : method.aktif ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
