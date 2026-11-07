"use client";

import { useEffect } from "react";

export default function PembayaranError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Gagal memuat halaman pembayaran:", error);
  }, [error]);

  return (
    <div className="panel panel-pad" role="alert">
      <h1 className="page-title">Pembayaran tidak dapat dimuat</h1>
      <p className="page-sub">Terjadi kendala saat mengambil data pembayaran. Silakan coba lagi.</p>
      <button className="btn-blue" onClick={retry}>Coba lagi</button>
    </div>
  );
}
