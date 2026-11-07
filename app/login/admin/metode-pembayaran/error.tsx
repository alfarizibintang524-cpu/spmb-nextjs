"use client";

import { useEffect } from "react";

export default function MetodePembayaranError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Gagal memuat halaman metode pembayaran admin:", error);
  }, [error]);

  return (
    <div className="panel panel-pad" role="alert">
      <h1 className="page-title">Metode pembayaran tidak dapat dimuat</h1>
      <p className="page-sub">Terjadi kendala saat mengambil data. Silakan coba lagi.</p>
      <button className="btn-blue" onClick={retry}>Coba lagi</button>
    </div>
  );
}
