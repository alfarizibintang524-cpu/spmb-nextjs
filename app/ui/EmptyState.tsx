import Link from "next/link";

export default function EmptyState({
  message,
  action,
  href,
}: {
  message: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true">
        <path d="M8 8h48v32H8z" stroke="currentColor" strokeWidth="2" />
        <path d="m10 12 22 17 22-17" stroke="currentColor" strokeWidth="2" />
        <path d="M18 37h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p>{message}</p>
      {action && href && <Link className="btn-blue" href={href}>{action}</Link>}
    </div>
  );
}
