export default function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const className =
    ["diterima", "valid", "lunas", "terverifikasi", "aktif", "lolos"].includes(normalized)
      ? "status-accepted"
      : normalized === "ditolak"
        ? "status-rejected"
        : ["menunggu", "diajukan"].includes(normalized)
          ? "status-waiting"
          : "status-default";
  return <span className={`status-badge ${className}`}>{value}</span>;
}
