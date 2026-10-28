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

export function PaymentForm({ initialData }: { initialData: { jumlah: number; status: string; bukti_path: string | null; catatan: string | null } }) {
  const [data, setData] = useState(initialData); const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return;
    const body = new FormData(); body.set("file", file);
    setUploading(true);
    try {
      const response = await fetch("/api/pembayaran", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengirim bukti pembayaran.");
      setMessage(result.message);
      const latest = await fetch("/api/pembayaran");
      if (!latest.ok) throw new Error("Bukti terkirim, tetapi status gagal diperbarui.");
      setData(await latest.json()); form.reset(); showToast("Bukti pembayaran terunggah");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal mengunggah bukti pembayaran.";
      setMessage(text); showToast(text, "error");
    } finally { setUploading(false); }
  }
  return <div className="panel panel-pad"><div className="box-grid">
    <div className="box"><span>Biaya Pendaftaran</span><strong>Rp {data.jumlah.toLocaleString("id-ID")}</strong></div>
    <div className="box"><span>Status</span><StatusBadge value={data.status} /></div>
    <div className="box"><span>Catatan Admin</span><strong>{data.catatan || "-"}</strong></div>
  </div>{data.bukti_path && <p><a href={data.bukti_path} target="_blank" rel="noreferrer">Lihat bukti pembayaran</a></p>}
    {data.status !== "lunas" && <form onSubmit={submit}><label htmlFor="payment-file">Bukti pembayaran (PDF/JPG/PNG, maks. 2 MB)</label>
      <input id="payment-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required />
      <button className="btn-blue" disabled={uploading}>{uploading ? <><span className="spinner" aria-hidden="true" /> Mengunggah...</> : "Kirim Bukti Pembayaran"}</button></form>}{message && <p className="page-sub">{message}</p>}</div>;
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

const majors = [
  ["PPLG", "Pengembangan Perangkat Lunak dan Gim."],
  ["TJKT", "Teknik Jaringan Komputer dan Telekomunikasi."],
  ["PM", "Pemasaran."], ["DKV", "Desain Komunikasi Visual."], ["PH", "Perhotelan."],
];
export function JurusanForm({ initialData }: { initialData: { jurusan_1: string; jurusan_2: string } }) {
  const [first, setFirst] = useState(initialData.jurusan_1 || "");
  const [second, setSecond] = useState(initialData.jurusan_2 || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/jurusan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jurusan_1: first, jurusan_2: second }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan pilihan.");
      setMessage(data.message || "Pilihan jurusan tersimpan."); showToast("Pilihan jurusan tersimpan");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan pilihan.";
      setMessage(text); showToast(text, "error");
    } finally { setSaving(false); }
  }
  return <form className="panel" onSubmit={submit}>
    <div className="form-grid"><div><label htmlFor="jurusan_1">Pilihan Jurusan 1</label><select id="jurusan_1" value={first} onChange={(event) => setFirst(event.target.value)} required>
      <option value="">Pilih jurusan</option>{majors.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></div>
    <div><label htmlFor="jurusan_2">Pilihan Jurusan 2</label><select id="jurusan_2" value={second} onChange={(event) => setSecond(event.target.value)} required>
      <option value="">Pilih jurusan</option>{majors.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></div></div>
    {message && <p className="page-sub" role="status">{message}</p>}<button className="btn-blue" disabled={saving}>{saving ? <><span className="spinner" aria-hidden="true" /> Menyimpan...</> : "Simpan Pilihan"}</button>
  </form>;
}
