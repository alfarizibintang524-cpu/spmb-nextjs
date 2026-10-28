export const HALAMAN_ROLE = {
  calon_siswa: "/login/students",
  admin: "/login/admin",
  kepsek: "/login/principal",
};

export function dashboardPath(role) {
  return HALAMAN_ROLE[role] || "/login";
}

export function initialsFromName(name) {
  const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0].toUpperCase()).join("") || "?";
}