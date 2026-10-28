import { jwtVerify } from "jose";

export { dashboardPath } from "./roles";

export async function getSession(token) {
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    return payload;
  } catch {
    return null;
  }
}