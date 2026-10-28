import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dashboardPath } from "@/lib/roles";

// Memastikan pengguna sudah login dan role-nya sesuai.
// Belum login -> ke /login. Role salah -> ke dashboard role-nya sendiri.
export async function requireRole(role: string) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);

  if (!session) redirect("/login");
  if (session.role !== role) redirect(dashboardPath(String(session.role)));

  return {
    id: String(session.sub ?? ""),
    nama: String(session.nama ?? ""),
    role: String(session.role),
  };
}