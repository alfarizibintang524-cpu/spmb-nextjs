"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { showToast } from "@/app/ui/Toast";
import StatusBadge from "@/app/ui/StatusBadge";

type Biodata = {
  nama: string; email: string; nisn: string; tempat_lahir: string; tanggal_lahir: string;
  nomor_hp: string; alamat: string; asal_sekolah: string; nama_ortu: string;
};

export function BiodataForm({ initialData }: { initialData: Biodata }) {
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/biodata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan biodata.");
      setMessage(result.message || "Biodata berhasil disimpan.");
      showToast("Biodata tersimpan");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan biodata.";
      setMessage(text);
      showToast(text, "error");
    }
    finally { setSaving(false); }
  }
  const fields: Array<[keyof Biodata, string, string]> = [
    ["nama", "Nama Lengkap", "text"], ["email", "Email", "email"], ["nisn", "NISN", "text"],
    ["tempat_lahir", "Tempat Lahir", "text"], ["tanggal_lahir", "Tanggal Lahir", "date"],
    ["nomor_hp", "Nomor HP", "tel"], ["asal_sekolah", "Asal Sekolah", "text"], ["nama_ortu", "Nama Orang Tua", "text"],
  ];
  return <form onSubmit={submit}><div className="form-grid">
    {fields.map(([key, label, type]) => <div key={key}><label htmlFor={key}>{label}</label>
      <input id={key} type={type} value={data[key]} readOnly={key === "nama" || key === "email"}
        style={key === "nama" || key === "email" ? { background: "#f1f5f9" } : undefined}
        required={key !== "nama" && key !== "email"} pattern={key === "nisn" ? "[0-9]{10}" : key === "nomor_hp" ? "[0-9]{8,15}" : undefined}
        onChange={(event) => setData({ ...data, [key]: event.target.value })} /></div>)}
  </div><label htmlFor="alamat">Alamat</label><input id="alamat" value={data.alamat} onChange={(event) => setData({ ...data, alamat: event.target.value })} required />
  {message && <p className="page-sub" role="status">{message}</p>}<button className="btn-save" disabled={saving}>{saving ? <><span className="spinner" aria-hidden="true" /> Menyimpan...</> : "Simpan Biodata"}</button></form>;
}

const documentTypes = [
  ["ijazah_skl", "Ijazah / SKL"], ["kk", "Kartu Keluarga"], ["akta", "Akta Kelahiran"],
  ["pas_foto", "Pas Foto"], ["rapor", "Rapor"],
];
type DocumentRow = { jenis: string; file_path: string; status: string; catatan: string | null };
export function DocumentsForm({ initialData }: { initialData: DocumentRow[] }) {
  const [docs, setDocs] = useState(initialData); const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  async function upload(event: FormEvent<HTMLFormElement>, jenis: string) {
    event.preventDefault(); const form = event.currentTarget; const input = form.elements.namedItem("file");
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    const body = new FormData(); body.set("jenis", jenis); body.set("file", input.files[0]); setMessage("");
    setUploading(true);
    try {
      const response = await fetch("/api/dokumen", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengunggah.");
      setMessage(result.message || "Dokumen berhasil diunggah.");
      showToast("Dokumen terunggah");
      const latest = await fetch("/api/dokumen");
      if (!latest.ok) throw new Error("Dokumen terunggah, tetapi daftar dokumen gagal diperbarui.");
      setDocs(await latest.json());
      form.reset();
      setSelectedFiles((current) => ({ ...current, [jenis]: "" }));
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal mengunggah dokumen.";
      setMessage(text);
      showToast(text, "error");
    } finally {
      setUploading(false);
    }
  }
  return <><div className="panel"><table className="table"><thead><tr><th>Dokumen</th><th>Status</th><th>Catatan</th><th>Aksi</th></tr></thead>
    <tbody>{documentTypes.map(([jenis, label]) => { const doc = docs.find((item) => item.jenis === jenis); return <tr key={jenis}>
      <td>{label}</td><td><StatusBadge value={doc?.status || "Belum diunggah"} /></td><td>{doc?.catatan || "-"}</td><td>
        {doc?.status === "valid" ? <a href={doc.file_path} target="_blank" rel="noreferrer">Lihat</a> :
          <form onSubmit={(event) => upload(event, jenis)}>
            <label
              className={`dropzone${dragging === jenis ? " is-dragging" : ""}`}
              onDragOver={(event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(jenis); }}
              onDragLeave={() => setDragging("")}
              onDrop={(event: DragEvent<HTMLLabelElement>) => {
                event.preventDefault();
                setDragging("");
                const file = event.dataTransfer.files[0];
                const input = event.currentTarget.querySelector('input[type="file"]');
                if (file && input instanceof HTMLInputElement) {
                  const transfer = new DataTransfer();
                  transfer.items.add(file);
                  input.files = transfer.files;
                  setSelectedFiles((current) => ({ ...current, [jenis]: file.name }));
                }
              }}
            >
              <span>{selectedFiles[jenis] || "Tarik file ke sini atau pilih file"}</span>
              <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required
                onChange={(event) => setSelectedFiles((current) => ({ ...current, [jenis]: event.target.files?.[0]?.name || "" }))} />
            </label>
            {uploading && <div className="upload-progress" aria-label="Sedang mengunggah"><span /></div>}
            <button className="btn-blue" disabled={uploading}>{uploading ? <><span className="spinner" aria-hidden="true" /> Mengunggah...</> : doc ? "Unggah Ulang" : "Unggah"}</button>
          </form>}
      </td></tr>; })}</tbody></table>{message && <p className="page-sub" role="status">{message}</p>}</div>
    <p className="page-sub">Format PDF/JPG/PNG, maksimal 2 MB per file.</p></>;
}

type Question = { id: number; pertanyaan: string; opsi_a: string; opsi_b: string; opsi_c: string; opsi_d: string };
export function TpaForm({ questions, result }: { questions: Question[]; result: { nilai: number; benar: number; total: number } | null }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(result); const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true);
    try {
      const response = await fetch("/api/tes-tpa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jawaban: answers, questionIds: questions.map((item) => item.id) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mengirim jawaban.");
      setMessage(data.message || "Jawaban berhasil dikirim.");
      if (data.hasil) setScore(data.hasil);
      showToast("Jawaban tes berhasil dikirim");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal mengirim jawaban.";
      setMessage(text); showToast(text, "error");
    } finally { setSubmitting(false); }
  }
  if (score) return <div className="panel panel-pad"><h3>Hasil Tes TPA</h3><p>Nilai: <strong>{score.nilai}</strong> — {score.benar} dari {score.total} benar.</p></div>;
  return <form className="panel" onSubmit={submit}>{questions.map((question, index) => <fieldset key={question.id} style={{ border: 0, padding: 0, marginBottom: 18 }}>
    <legend>{index + 1}. {question.pertanyaan}</legend>
    {(["a", "b", "c", "d"] as const).map((key) => <label key={key} style={{ display: "block", marginTop: 6 }}>
      <input type="radio" name={`q-${question.id}`} required value={key} onChange={() => setAnswers({ ...answers, [question.id]: key })} />
      {` ${question[`opsi_${key}`]}`}
    </label>)}
  </fieldset>)}{message && <p className="page-sub">{message}</p>}<button className="btn-blue" disabled={submitting}>{submitting ? <><span className="spinner" aria-hidden="true" /> Mengirim...</> : "Kirim Jawaban"}</button></form>;
}

type PaymentMethod = {
  id: number;
  nama: string;
  tipe: "transfer_bank" | "qris" | "tunai" | "ewallet";
  nama_bank: string | null;
  nomor_rekening: string | null;
  atas_nama: string | null;
  qr_image: string | null;
  petunjuk: string | null;
  aktif: number;
};

export type PaymentStage = "pendaftaran" | "daftar_ulang";
export type PaymentComponent = {
  id: number;
  tahap: PaymentStage;
  nama: string;
  nominal: number;
  keterangan: string | null;
  wajib: number;
  aktif: number;
  urutan: number;
};
export type PaymentDeadline = { tahap: PaymentStage; batas_waktu: string | null };

export type PaymentData = {
  id: number | null;
  jumlah: number;
  nominal: number;
  tahap: PaymentStage;
  status: string;
  bukti_path: string | null;
  catatan: string | null;
  metode_id: number | null;
  metode_nama: string | null;
  metode_tipe: string | null;
  nama_bank: string | null;
  nomor_rekening: string | null;
  atas_nama: string | null;
  qr_image: string | null;
  petunjuk: string | null;
  created_at: string | null;
};

const maximumPaymentFileSize = 2 * 1024 * 1024;
const allowedPaymentTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const stageLabels: Record<PaymentStage, string> = {
  pendaftaran: "Pendaftaran",
  daftar_ulang: "Daftar Ulang",
};

function isMethodReady(method: PaymentMethod | undefined) {
  if (!method || method.aktif !== 1) return false;
  if (method.tipe === "transfer_bank") {
    return Boolean(method.nama_bank && method.nomor_rekening && method.atas_nama);
  }
  return method.tipe === "qris" || method.tipe === "tunai";
}

function stageStatus(status: string | undefined) {
  if (status === "lunas" || status === "diterima") return "Lunas";
  if (status === "ditolak") return "Ditolak";
  if (status === "menunggu" || status === "menunggu_verifikasi") return "Menunggu Verifikasi";
  return "Belum dibayar";
}

function rupiah(amount: number) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatDeadline(value: string | null | undefined) {
  if (!value) return "Belum ditentukan; hubungi panitia.";
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PaymentForm({
  initialData,
  payments: initialPayments,
  components,
  deadlines,
  methods: initialMethods,
  accepted,
  setupMessage,
}: {
  initialData: PaymentData;
  payments: PaymentData[];
  components: PaymentComponent[];
  deadlines: PaymentDeadline[];
  methods: PaymentMethod[];
  accepted: boolean;
  setupMessage: string | null;
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [stage, setStage] = useState<PaymentStage>("pendaftaran");
  const [methods, setMethods] = useState(initialMethods);
  const activeMethods = methods.filter((method) => method.aktif === 1 && method.tipe !== "ewallet");
  const [selectedMethodId, setSelectedMethodId] = useState(
    initialData.metode_id ? String(initialData.metode_id) : ""
  );
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const data = payments.find((payment) => payment.tahap === stage)
    || (stage === "pendaftaran" ? initialData : { ...initialData, tahap: stage, id: null, jumlah: 0, nominal: 0, status: "belum", bukti_path: null, catatan: null, metode_id: null, metode_nama: null, metode_tipe: null, nama_bank: null, nomor_rekening: null, atas_nama: null, qr_image: null, petunjuk: null, created_at: null });
  const selectedMethod = methods.find((method) => String(method.id) === selectedMethodId);
  const canUpload = !["menunggu_verifikasi", "lunas", "diterima"].includes(data.status)
    && (data.status !== "menunggu" || !data.bukti_path);
  const stageComponents = components.filter((component) => component.tahap === stage);
  const requiredTotal = stageComponents.filter((component) => component.wajib === 1)
    .reduce((sum, component) => sum + Number(component.nominal), 0);
  const locked = stage === "daftar_ulang" && !accepted;
  const deadlineByStage = (paymentStage: PaymentStage) => deadlines.find((item) => item.tahap === paymentStage)?.batas_waktu || null;

  function chooseStage(nextStage: PaymentStage) {
    setStage(nextStage);
    const nextPayment = payments.find((payment) => payment.tahap === nextStage);
    setSelectedMethodId(nextPayment?.metode_id ? String(nextPayment.metode_id) : "");
    setMessage("");
  }

  async function copyAccountNumber() {
    if (!selectedMethod?.nomor_rekening) return;
    try {
      await navigator.clipboard.writeText(selectedMethod.nomor_rekening);
      setMessage("Nomor tujuan berhasil disalin.");
    } catch {
      const text = "Nomor tujuan tidak dapat disalin. Silakan salin secara manual.";
      setMessage(text);
      showToast(text, "error");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file || !allowedPaymentTypes.has(file.type) || file.size === 0 || file.size > maximumPaymentFileSize) {
      setMessage("Pilih bukti PDF/JPG/PNG dengan ukuran maksimal 2 MB.");
      return;
    }
    if (!selectedMethodId || !isMethodReady(selectedMethod)) {
      setMessage("Pilih metode dengan detail tujuan pembayaran yang tersedia.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("metode_id", selectedMethodId);
    body.set("tahap", stage);
    setUploading(true);
    setMessage("");
    try {
      const response = await fetch("/api/pembayaran", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengirim bukti pembayaran.");
      setMessage(result.message);
      setPayments(result.riwayat);
      setMethods(result.metode_pembayaran);
      setSelectedMethodId(String(result.pembayaran.metode_id || ""));
      form.reset();
      showToast("Bukti pembayaran terunggah");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal mengunggah bukti pembayaran.";
      setMessage(text); showToast(text, "error");
    } finally { setUploading(false); }
  }
  const activeMethodSelected = selectedMethod?.aktif === 1 && selectedMethod.tipe !== "ewallet";

  return <div className="panel panel-pad payment-panel">
    {setupMessage && <p className="payment-notice" role="alert">{setupMessage}</p>}
    <div className="payment-stage-grid">
      {(["pendaftaran", "daftar_ulang"] as const).map((paymentStage) => {
        const stagePayment = payments.find((payment) => payment.tahap === paymentStage);
        const items = components.filter((component) => component.tahap === paymentStage);
        const subtotal = items.reduce((sum, component) => sum + Number(component.nominal), 0);
        const total = items.filter((component) => component.wajib === 1)
          .reduce((sum, component) => sum + Number(component.nominal), 0);
        const isLocked = paymentStage === "daftar_ulang" && !accepted;
        return <article className={`payment-stage-card${isLocked ? " is-locked" : ""}`} key={paymentStage}>
          <div className="payment-stage-heading">
            <h2>{stageLabels[paymentStage]}</h2>
            <StatusBadge value={isLocked ? "Terkunci" : stageStatus(stagePayment?.status)} />
          </div>
          {paymentStage === "pendaftaran" && <p className="payment-stage-active">Tahap aktif saat ini</p>}
          {items.length === 0 ? <p className="payment-notice">Belum ada komponen biaya aktif pada tahap ini.</p> :
            <ul className="payment-cost-list">{items.map((item) => <li key={item.id}>
              <span>{item.nama}{item.wajib ? "" : " (opsional)"}</span><strong>{rupiah(Number(item.nominal))}</strong>
            </li>)}</ul>}
          <p className="payment-stage-deadline"><strong>Batas waktu:</strong> {formatDeadline(deadlineByStage(paymentStage))}</p>
          <div className="payment-stage-total"><span>Subtotal seluruh komponen</span><strong>{rupiah(subtotal)}</strong></div>
          <div className="payment-stage-total"><span>Total yang harus dibayar</span><strong>{rupiah(total)}</strong></div>
          {subtotal !== total && <p className="payment-history">Komponen opsional tidak termasuk total wajib.</p>}
          {isLocked ? <p className="payment-lock-note">Terkunci sampai status seleksi menyatakan kamu lulus.</p> :
            <button type="button" className={stage === paymentStage ? "payment-stage-select active" : "payment-stage-select"} onClick={() => chooseStage(paymentStage)} disabled={uploading}>
              {stage === paymentStage ? "Tahap dipilih" : "Pilih tahap ini"}
            </button>}
        </article>;
      })}
    </div>
    <section className="payment-current-stage">
      <div className="payment-stage-heading">
        <h2>Pembayaran Tahap {stageLabels[stage]}</h2>
        <StatusBadge value={locked ? "Terkunci" : stageStatus(data.status)} />
      </div>
      {data.catatan && <p className="payment-notice"><strong>Catatan admin:</strong> {data.catatan}</p>}
      {data.bukti_path && <p><a href={data.bukti_path} target="_blank" rel="noreferrer">Lihat bukti pembayaran</a></p>}
      {data.metode_nama && <p className="payment-history">Metode sebelumnya: <strong>{data.metode_nama}</strong></p>}
    </section>
    <section className="payment-method">
      <h2>Metode Pembayaran</h2>
      {activeMethods.length === 0 && !selectedMethod ? (
        <p className="payment-notice" role="status">
          Belum ada metode pembayaran yang tersedia. Hubungi panitia untuk melengkapi metode pembayaran.
        </p>
      ) : <>
        {activeMethods.length === 0 && <p className="payment-notice" role="status">Tidak ada metode aktif untuk pembayaran atau unggah ulang saat ini.</p>}
        <label htmlFor="payment-method">Pilih metode</label>
        <select id="payment-method" value={selectedMethodId} onChange={(event) => setSelectedMethodId(event.target.value)} disabled={uploading}>
          <option value="">Pilih metode pembayaran</option>
          {selectedMethod && !activeMethodSelected && <option value={selectedMethodId} disabled>{selectedMethod.nama} (tidak aktif)</option>}
          {activeMethods.map((method) => <option key={method.id} value={method.id}>{method.nama}</option>)}
        </select>
        {!selectedMethod && activeMethods.length > 0 && <p className="payment-notice" role="status">Pilih salah satu metode sebelum mengirim bukti pembayaran.</p>}
        {selectedMethod && <div className="payment-details">
          <div>
            {selectedMethod.nama_bank && <p><span>Bank</span><strong>{selectedMethod.nama_bank}</strong></p>}
            {selectedMethod.nomor_rekening && <div className="payment-number">
              <p><span>Nomor rekening</span><strong>{selectedMethod.nomor_rekening}</strong></p>
              <button type="button" className="btn-copy" onClick={copyAccountNumber}>Salin nomor</button>
            </div>}
            {selectedMethod.atas_nama && <p><span>Atas nama</span><strong>{selectedMethod.atas_nama}</strong></p>}
            {(selectedMethod.petunjuk || selectedMethod.tipe === "tunai") && <p><span>Petunjuk</span><strong>{selectedMethod.petunjuk || "Lakukan pembayaran tunai kepada panitia dan minta bukti pembayaran."}</strong></p>}
          </div>
          {selectedMethod.tipe === "qris" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="payment-qr" src={selectedMethod.qr_image || "/qris-contoh.png"} width={180} height={180} alt={selectedMethod.qr_image ? "Kode QRIS pembayaran" : "QRIS contoh, ganti dengan QRIS resmi sekolah"} />
          )}
          {!isMethodReady(selectedMethod) && <p className="payment-notice" role="status">
            Detail tujuan metode ini belum tersedia. Pembayaran dengan metode ini belum dapat dilakukan.
          </p>}
        </div>}
      </>}
    </section>
    {locked && <p className="payment-notice" role="status">Tahap daftar ulang terkunci sampai kamu dinyatakan lulus seleksi.</p>}
    {!locked && requiredTotal <= 0 && <p className="payment-notice" role="status">Belum ada total biaya wajib untuk tahap ini. Hubungi panitia.</p>}
    {canUpload && !locked && requiredTotal > 0 && !setupMessage && <form className="payment-form" onSubmit={submit}>
      <h2>Kirim Bukti Pembayaran</h2>
      <input type="hidden" name="tahap" value={stage} />
      <p>Total yang harus dibayar: <strong>{rupiah(requiredTotal)}</strong></p>
      <label htmlFor="payment-file">Bukti pembayaran (PDF/JPG/PNG, maks. 2 MB)</label>
      <input id="payment-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required disabled={uploading || activeMethods.length === 0 || !isMethodReady(selectedMethod) || !activeMethodSelected} />
      <button className="btn-blue" disabled={uploading || activeMethods.length === 0 || !isMethodReady(selectedMethod) || !activeMethodSelected}>
        {uploading ? <><span className="spinner" aria-hidden="true" /> Mengunggah...</> : "Kirim Bukti Pembayaran"}
      </button>
    </form>}
    {!setupMessage && !locked && data.status === "ditolak" && <p className="payment-notice" role="status">
      Pembayaran ditolak. Periksa catatan admin, lalu unggah ulang bukti setelah detail metode tersedia.
    </p>}
    {!setupMessage && !locked && !canUpload && data.status !== "ditolak" && <p className="payment-notice" role="status">
      Bukti pembayaran sedang diverifikasi atau pembayaran tahap ini sudah lunas.
    </p>}
    {message && <p className="payment-message" role="status">{message}</p>}
    <section className="payment-history-section">
      <h2>Riwayat Pembayaran</h2>
      {payments.length === 0 ? <p className="payment-notice" role="status">Belum ada riwayat pembayaran.</p> :
        <div className="payment-review-table-wrap"><table className="table payment-history-table">
          <thead><tr><th>Tahap</th><th>Nominal</th><th>Status</th></tr></thead>
          <tbody>{payments.map((payment) => <tr key={payment.id}>
            <td>{stageLabels[payment.tahap]}</td>
            <td>{rupiah(Number(payment.nominal || payment.jumlah || 0))}</td>
            <td><StatusBadge value={stageStatus(payment.status)} /></td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}

export function ApplyButton({ eligible, status }: { eligible: boolean; status: string }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function apply() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/pendaftaran", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mengajukan pendaftaran.");
      setMessage(data.message); showToast("Pendaftaran berhasil diajukan"); window.location.reload();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal mengajukan pendaftaran.";
      setMessage(text); showToast(text, "error");
    } finally { setSubmitting(false); }
  }
  return <><button className="btn-blue" disabled={!eligible || status === "diajukan" || submitting} onClick={apply}>{submitting ? <><span className="spinner" aria-hidden="true" /> Memproses...</> : status === "diajukan" ? "Pendaftaran Diajukan" : "Ajukan Pendaftaran"}</button>{message && <p className="page-sub" role="status">{message}</p>}</>;
}

type MajorOption = {
  kode: string;
  nama: string;
  keterangan: string | null;
  kuota: number | null;
  aktif: number;
  terisi: number;
};

export function JurusanForm({ initialChoice, majors }: { initialChoice: string; majors: MajorOption[] }) {
  const [choice, setChoice] = useState(initialChoice);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!choice) {
      setMessage("Pilih satu jurusan sebelum menyimpan.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/jurusan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kode: choice }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan pilihan.");
      setMessage(data.message || "Jurusan yang dipilih berhasil disimpan."); showToast("Jurusan yang dipilih berhasil disimpan");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan pilihan.";
      setMessage(text); showToast(text, "error");
    } finally { setSaving(false); }
  }
  return <form className="panel major-form" onSubmit={submit}>
    <label htmlFor="jurusan-dipilih">Jurusan yang dipilih</label>
    <select id="jurusan-dipilih" className="major-select" value={choice} onChange={(event) => setChoice(event.target.value)} required disabled={saving || majors.length === 0}>
      <option value="">Pilih jurusan</option>
      {majors.map((major) => <option key={major.kode} value={major.kode} disabled={!major.aktif || (major.kuota !== null && major.terisi >= major.kuota && major.kode !== initialChoice)}>
        {major.nama} ({major.kode}){major.kuota !== null ? ` — Kuota ${major.terisi}/${major.kuota}` : ""}
        {major.keterangan ? ` — ${major.keterangan}` : ""}
      </option>)}
    </select>
    {choice && majors.find((major) => major.kode === choice)?.keterangan && (
      <p className="major-description">{majors.find((major) => major.kode === choice)?.keterangan}</p>
    )}
    {message && <p className="page-sub" role="status">{message}</p>}
    <button className="btn-blue major-save" disabled={saving || majors.length === 0}>
      {saving ? <><span className="spinner" aria-hidden="true" /> Menyimpan...</> : "Simpan Pilihan"}
    </button>
  </form>;
}
