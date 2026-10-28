import { requireRole } from "@/lib/session";
import Shell from "./Shell";

export default async function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("kepsek");

  return <Shell name={user.nama}>{children}</Shell>;
}