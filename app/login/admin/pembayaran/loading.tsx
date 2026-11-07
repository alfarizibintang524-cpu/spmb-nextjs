export default function Loading() {
  return (
    <div className="role-content" aria-label="Memuat verifikasi pembayaran">
      <div className="skeleton skeleton-line short" />
      <div className="panel skeleton-table">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    </div>
  );
}
