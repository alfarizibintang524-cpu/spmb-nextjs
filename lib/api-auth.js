import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export async function apiSession(roles) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);
  if (!session) return { error: Response.json({ message: "Silakan login." }, { status: 401 }) };
  if (!roles.includes(String(session.role))) {
    return { error: Response.json({ message: "Akses ditolak." }, { status: 403 }) };
  }
  return { session: { id: Number(session.sub), role: String(session.role), nama: String(session.nama || "") } };
}

export function failure(error, label) {
  console.error(`${label}:`, error);
  return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
}
