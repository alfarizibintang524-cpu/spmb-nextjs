import Link from "next/link";
import pool from "@/lib/db";
import { requireRole } from "@/lib/session";
import DashboardStat from "@/app/ui/DashboardStat";
import EmptyState from "@/app/ui/EmptyState";
import type { CSSProperties } from "react";

const links = [
  ["Biodata", "/login/students/biodata"], ["Pilihan Jurusan", "/login/students/jurusan"],
  ["Dokumen", "/login/students/dokumen"], ["Tes TPA", "/login/students/tes-tpa"],
  ["Pembayaran", "/login/students/pembayaran"], ["Status Seleksi", "/login/students/status-seleksi"],
];

export default async function DashboardSiswaPage() {
  const user = await requireRole("calon_siswa");
  const [rows] = await pool.execute(
    `SELECT b.nisn, b.tempat_lahir, b.tanggal_lahir, b.nomor_hp, b.alamat, b.asal_sekolah, b.nama_ortu,
            p.jurusan_1, p.jurusan_2, p.status, p.catatan,
            (SELECT COUNT(*) FROM dokumen d WHERE d.user_id = u.id) AS dokumen_count,
            (SELECT COUNT(*) FROM tes_tpa t WHERE t.user_id = u.id) AS tes_count,
            pay.status AS payment_status
     FROM users u LEFT JOIN biodata b ON b.user_id = u.id
     LEFT JOIN pendaftaran p ON p.user_id = u.id LEFT JOIN pembayaran pay ON pay.user_id = u.id
     WHERE u.id = ?`, [Number(user.id)]
  );
  const data = rows[0] || {};
  const biodata = Boolean(data.nisn && data.tempat_lahir && data.tanggal_lahir && data.nomor_hp && data.alamat && data.asal_sekolah && data.nama_ortu);
  const steps = [
    { label: "Biodata", done: biodata, value: biodata ? "Lengkap" : "Belum lengkap" },
    { label: "Jurusan", done: Boolean(data.jurusan_1 && data.jurusan_2), value: data.jurusan_1 ? `${data.jurusan_1} / ${data.jurusan_2}` : "Belum dipilih" },
    { label: "Dokumen", done: Number(data.dokumen_count) === 5, value: `${Number(data.dokumen_count || 0)}/5 diunggah` },
    { label: "Tes TPA", done: Number(data.tes_count) > 0, value: Number(data.tes_count) > 0 ? "Selesai" : "Belum dikerjakan" },
    { label: "Pembayaran", done: ["menunggu", "lunas"].includes(data.payment_status), value: data.payment_status || "Belum dibayar" },
    { label: "Status Seleksi", done: ["diajukan", "diterima", "ditolak"].includes(data.status), value: data.status || "draft" },
  ];
  const progress = Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  const nextStep = steps.findIndex((step) => !step.done);
  return <>
    <h1 className="page-title">Dashboard Siswa</h1><p className="page-sub">Selamat datang, {user.nama}.</p>
    <div className="stat-grid">
      <DashboardStat label="Jurusan Pilihan" value={data.jurusan_1 || "Belum dipilih"} icon={0} />
      <DashboardStat label="Dokumen Diunggah" value={Number(data.dokumen_count || 0)} icon={2} />
      <DashboardStat label="Status Seleksi" value={data.status || "draft"} icon={3} />
    </div>
    <div className="panel"><h3 className="panel-title">Progres Pendaftaran</h3>
      <div className="progress-track" role="progressbar" aria-label="Progres pendaftaran" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ "--progress": progress / 100 } as CSSProperties} />
      </div>
      <p className="page-sub">{progress}% selesai</p>
      <div className="steps">
      {steps.map((step, index) => <div className="step" key={step.label}><div className={`step-circle${step.done ? " step-done" : index === nextStep ? " step-next" : ""}`}>{step.done ? "✓" : index + 1}</div>
        <strong>{step.label}</strong><small>{step.value}</small><div><Link href={links[index][1]}>Buka</Link></div></div>)}
    </div></div>
    <div className="panel"><h3 className="panel-title">Status Seleksi</h3>
      <p>{data.status === "diterima" ? "Diterima" : data.status === "ditolak" ? "Ditolak" : data.status === "diajukan" ? "Menunggu hasil seleksi" : "Pendaftaran belum diajukan"}</p>
      <p>{data.catatan || ""}</p>
      {!data.status && <EmptyState message="Status pendaftaran akan tampil di sini setelah datamu tersedia." action="Lengkapi biodata" href="/login/students/biodata" />}
    </div>
  </>;
}
