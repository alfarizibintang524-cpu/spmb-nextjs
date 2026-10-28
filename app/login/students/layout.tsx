import { requireRole } from "@/lib/session";
import Shell from "./Shell";

export default async function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("calon_siswa");

  return <Shell name={user.nama}>{children}</Shell>;
}