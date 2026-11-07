export default function Loading() {
  return (
    <div className="role-content" aria-label="Memuat halaman pembayaran">
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line" />
      <div className="panel skeleton-table">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    </div>
  );
}
