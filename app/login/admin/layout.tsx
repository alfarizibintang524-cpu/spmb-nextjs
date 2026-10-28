import { requireRole } from "@/lib/session";
import Shell from "./Shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");

  return <Shell name={user.nama}>{children}</Shell>;
}