"use client";

export default function PrincipalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel" role="alert">
      <h1 className="page-title">Halaman belum dapat dimuat</h1>
      <p className="page-sub">Terjadi kendala saat memuat laporan. Silakan coba lagi.</p>
      <button className="btn-blue" onClick={reset}>Coba lagi</button>
    </div>
  );
}
