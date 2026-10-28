export default function Loading() {
  return (
    <div className="role-content" aria-label="Memuat dasbor kepala sekolah">
      <div className="skeleton skeleton-line short" />
      <div className="stat-grid">
        {Array.from({ length: 5 }, (_, index) => <div className="skeleton skeleton-card" key={index} />)}
      </div>
      <div className="panel skeleton-table">
        <div className="skeleton skeleton-line short" />
        {Array.from({ length: 4 }, (_, index) => <div className="skeleton-row" key={index} />)}
      </div>
    </div>
  );
}
