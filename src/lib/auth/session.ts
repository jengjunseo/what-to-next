import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export async function hasSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET);
}

export async function requireSession() {
  if (!(await hasSession())) redirect("/login");
}
