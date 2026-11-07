"use client";

import { useState, type FormEvent } from "react";

export type TpaQuestion = {
  id: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  jawaban: "a" | "b" | "c" | "d";
};

export type TpaSchedule = {
  id: number;
  judul: string;
  mulai_at: string | null;
  selesai_at: string | null;
  keterangan: string | null;
  aktif: number;
};

type QuestionForm = Omit<TpaQuestion, "id">;
type ScheduleForm = Omit<TpaSchedule, "id" | "aktif"> & { aktif: string };

const emptyQuestion: QuestionForm = {
  pertanyaan: "",
  opsi_a: "",
  opsi_b: "",
  opsi_c: "",
  opsi_d: "",
  jawaban: "a",
};
const emptySchedule: ScheduleForm = {
  judul: "",
  mulai_at: "",
  selesai_at: "",
  keterangan: "",
  aktif: "1",
};

function scheduleForm(schedule: TpaSchedule): ScheduleForm {
  return {
    judul: schedule.judul,
    mulai_at: schedule.mulai_at || "",
    selesai_at: schedule.selesai_at || "",
    keterangan: schedule.keterangan || "",
    aktif: schedule.aktif ? "1" : "0",
  };
}

export default function TesTpaManager({
  initialQuestions,
  initialSchedules,
}: {
  initialQuestions: TpaQuestion[];
  initialSchedules: TpaSchedule[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestion);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [scheduleFormState, setScheduleFormState] = useState<ScheduleForm>(emptySchedule);
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tes-tpa/soal", {
        method: editingQuestion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...questionForm, id: editingQuestion }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan soal.");
      const saved = result.soal as TpaQuestion;
      setQuestions((current) => editingQuestion
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((left, right) => left.id - right.id));
      setQuestionForm(emptyQuestion);
      setEditingQuestion(null);
      setMessage(result.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan soal.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tes-tpa/jadwal", {
        method: editingSchedule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scheduleFormState, id: editingSchedule }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan jadwal.");
      const saved = result.jadwal as TpaSchedule;
      setSchedules((current) => {
        const next = current.map((item) => item.id === saved.id || saved.aktif ? { ...item, aktif: 0 } : item);
        const withoutSaved = next.filter((item) => item.id !== saved.id);
        return [...withoutSaved, saved].sort((left, right) =>
          (right.mulai_at || "").localeCompare(left.mulai_at || "") || right.id - left.id);
      });
      setScheduleFormState(emptySchedule);
      setEditingSchedule(null);
      setMessage(result.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan jadwal.");
    } finally {
      setBusy(false);
    }
  }

  function editQuestion(question: TpaQuestion) {
    const { id, ...form } = question;
    setEditingQuestion(id);
    setQuestionForm(form);
    setError("");
    setMessage("");
  }

  return <div className="admin-management">
    {error && <p className="payment-admin-error" role="alert">{error}</p>}
    {message && <p className="payment-admin-message" role="status">{message}</p>}
    <section className="panel">
      <h2 className="panel-title">Jadwal Tes TPA</h2>
      <form className="admin-form-grid" onSubmit={saveSchedule}>
        <label>Nama jadwal<input value={scheduleFormState.judul} maxLength={150} onChange={(event) => setScheduleFormState({ ...scheduleFormState, judul: event.target.value })} required disabled={busy} /></label>
        <label>Mulai<input type="datetime-local" value={scheduleFormState.mulai_at || ""} onChange={(event) => setScheduleFormState({ ...scheduleFormState, mulai_at: event.target.value })} disabled={busy} /></label>
        <label>Selesai<input type="datetime-local" value={scheduleFormState.selesai_at || ""} onChange={(event) => setScheduleFormState({ ...scheduleFormState, selesai_at: event.target.value })} disabled={busy} /></label>
        <label>Status<select value={scheduleFormState.aktif} onChange={(event) => setScheduleFormState({ ...scheduleFormState, aktif: event.target.value })} disabled={busy}>
          <option value="1">Aktif</option><option value="0">Tidak aktif</option>
        </select></label>
        <label className="admin-form-full">Keterangan<textarea rows={3} maxLength={2000} value={scheduleFormState.keterangan || ""} onChange={(event) => setScheduleFormState({ ...scheduleFormState, keterangan: event.target.value })} disabled={busy} /></label>
        <div className="admin-form-full admin-action-row">
          <button className="btn-blue" disabled={busy}>{busy ? "Menyimpan..." : editingSchedule ? "Simpan Jadwal" : "Tambah Jadwal"}</button>
          {editingSchedule && <button type="button" className="payment-admin-secondary" onClick={() => { setEditingSchedule(null); setScheduleFormState(emptySchedule); }} disabled={busy}>Batal</button>}
        </div>
      </form>
      {schedules.length === 0 ? <p className="admin-empty">Belum ada jadwal tes.</p> :
        <div className="admin-card-list">{schedules.map((schedule) => <article className="admin-record-card" key={schedule.id}>
          <strong>{schedule.judul}</strong><span>{schedule.aktif ? "Aktif" : "Tidak aktif"}</span>
          <p>{schedule.mulai_at || "Waktu mulai belum diatur"}{schedule.selesai_at ? ` — ${schedule.selesai_at}` : ""}</p>
          <p>{schedule.keterangan || "Tidak ada keterangan."}</p>
          <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => { setEditingSchedule(schedule.id); setScheduleFormState(scheduleForm(schedule)); }}>Ubah jadwal</button>
        </article>)}</div>}
    </section>

    <section className="panel">
      <h2 className="panel-title">{editingQuestion ? "Ubah Soal TPA" : "Tambah Soal TPA"}</h2>
      <form className="admin-form-grid" onSubmit={saveQuestion}>
        <label className="admin-form-full">Pertanyaan<textarea rows={3} maxLength={5000} value={questionForm.pertanyaan} onChange={(event) => setQuestionForm({ ...questionForm, pertanyaan: event.target.value })} required disabled={busy} /></label>
        {(["a", "b", "c", "d"] as const).map((letter) => <label key={letter}>Opsi {letter.toUpperCase()}
          <input maxLength={500} value={questionForm[`opsi_${letter}`]} onChange={(event) => setQuestionForm({ ...questionForm, [`opsi_${letter}`]: event.target.value })} required disabled={busy} />
        </label>)}
        <label>Jawaban benar<select value={questionForm.jawaban} onChange={(event) => setQuestionForm({ ...questionForm, jawaban: event.target.value as QuestionForm["jawaban"] })} disabled={busy}>
          {(["a", "b", "c", "d"] as const).map((letter) => <option value={letter} key={letter}>{letter.toUpperCase()}</option>)}
        </select></label>
        <div className="admin-action-row">
          <button className="btn-blue" disabled={busy}>{busy ? "Menyimpan..." : editingQuestion ? "Simpan Soal" : "Tambah Soal"}</button>
          {editingQuestion && <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => { setEditingQuestion(null); setQuestionForm(emptyQuestion); }}>Batal</button>}
        </div>
      </form>
      <h3 className="panel-title">Daftar Soal ({questions.length})</h3>
      {questions.length === 0 ? <p className="admin-empty">Belum ada soal TPA.</p> :
        <div className="admin-card-list">{questions.map((question) => <article className="admin-record-card" key={question.id}>
          <strong>Soal #{question.id}</strong><p>{question.pertanyaan}</p>
          <ol type="a">{(["a", "b", "c", "d"] as const).map((letter) =>
            <li key={letter}>{question[`opsi_${letter}`]}{letter === question.jawaban && " (jawaban benar)"}</li>)}</ol>
          <button type="button" className="payment-admin-secondary" disabled={busy} onClick={() => editQuestion(question)}>Ubah soal</button>
        </article>)}</div>}
    </section>
  </div>;
}
