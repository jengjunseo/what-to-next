"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/token";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function loginAction(formData: FormData) {
  const configuredPassword = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!configuredPassword || !secret) redirect("/login?error=config");

  const password = String(formData.get("password") ?? "");
  if (!safeEqual(password, configuredPassword)) redirect("/login?error=invalid");

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(secret), sessionCookieOptions());
  redirect("/");
}
