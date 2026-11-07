"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="panel" role="alert">
    <p>Daftar jurusan gagal dimuat. Silakan coba kembali.</p>
    <button className="btn-blue" onClick={reset}>Coba lagi</button>
  </div>;
}
