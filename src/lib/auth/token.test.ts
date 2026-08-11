import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/token";

describe("signed session", () => {
  it("accepts a valid signed token", () => {
    const now = Date.UTC(2026, 7, 11);
    expect(verifySessionToken(createSessionToken("secret", now), "secret", now + 1000)).toBe(true);
  });

  it("rejects tampering, wrong secrets, missing secrets and expired tokens", () => {
    const now = Date.UTC(2026, 7, 11);
    const token = createSessionToken("secret", now);
    expect(verifySessionToken(`${token}x`, "secret", now)).toBe(false);
    expect(verifySessionToken(token, "wrong", now)).toBe(false);
    expect(verifySessionToken(token, undefined, now)).toBe(false);
    expect(verifySessionToken(token, "secret", now + 15 * 24 * 60 * 60 * 1000)).toBe(false);
  });
});
