import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ daftar?: string | string[] }>;
}) {
  const { daftar } = await searchParams;
  return <LoginForm registrationSuccess={daftar === "sukses"} />;
}
