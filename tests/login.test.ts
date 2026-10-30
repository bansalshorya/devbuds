import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), limit: vi.fn(), session: vi.fn(), audit: vi.fn(), after: vi.fn() }));
vi.mock("@/server/db/client", () => ({ prisma: { user: { findUnique: mocks.user } } }));
vi.mock("@/server/security/rate-limit", () => ({ allowRequest: mocks.limit }));
vi.mock("@/server/auth/session", () => ({ createSession: mocks.session }));
vi.mock("@/server/audit", () => ({ audit: mocks.audit }));
vi.mock("next/server", () => ({ after: mocks.after }));
import { POST } from "../src/app/api/auth/login/route";

const request = (otp = "123456", origin = "https://devbuds-five.vercel.app") => new Request("https://devbuds-five.vercel.app/api/auth/login", {
  method: "POST", headers: { Origin: origin, Host: "devbuds-five.vercel.app", "Content-Type": "application/json" }, body: JSON.stringify({ mobile: "9000000001", otp }),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("DEMO_MODE", "true"); vi.stubEnv("DEMO_OTP", "123456"); vi.stubEnv("JWT_SECRET", "a-secret-at-least-32-characters-long");
  mocks.limit.mockResolvedValue(true);
  mocks.user.mockResolvedValue({ id: "m1", role: "MENTOR" });
  mocks.audit.mockResolvedValue(undefined); mocks.session.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("deployed login", () => {
  it("returns an actionable schema error for the observed missing rate-limit table without issuing a session", async () => {
    mocks.limit.mockRejectedValue({ code: "P2021", message: "Sensitive DATABASE_URL or request data" });
    const response = await POST(request());
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("AUTH_SCHEMA_MISSING"); expect(body.error).toContain("database needs an update");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("server-timing")).toMatch(/^login;dur=/);
    expect(mocks.user).not.toHaveBeenCalled(); expect(mocks.session).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("Sensitive");
  });
  it("fails closed on a rate-limit outage rather than bypassing it", async () => {
    mocks.limit.mockRejectedValue({ code: "P1001" });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it("reports invalid session configuration before doing database work", async () => {
    vi.stubEnv("JWT_SECRET", "short");
    expect((await (await POST(request())).json()).code).toBe("AUTH_CONFIGURATION_MISSING");
    expect(mocks.limit).not.toHaveBeenCalled();
  });
  it("reports a missing OTP configuration", async () => {
    vi.stubEnv("DEMO_OTP", "");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.limit).not.toHaveBeenCalled();
  });
  it("preserves invalid-credential and lockout responses", async () => {
    expect((await POST(request("000000"))).status).toBe(401);
    expect(mocks.session).not.toHaveBeenCalled();
    mocks.limit.mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(429); expect(response.headers.get("retry-after")).toBe("900");
  });
  it("rejects cross-origin requests and disabled demo login without database work", async () => {
    expect((await POST(request("123456", "https://other.example"))).status).toBe(403);
    vi.stubEnv("DEMO_MODE", "false");
    expect((await POST(request())).status).toBe(403);
    expect(mocks.limit).not.toHaveBeenCalled();
  });
  it("audits and establishes a session only after checking credentials", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ role: "MENTOR" });
    expect(mocks.limit).toHaveBeenCalledWith("login", "9000000001", 10, 900, expect.any(Date), mocks.after);
    expect(mocks.user).toHaveBeenCalledWith({ where: { mobile: "9000000001" }, select: { id: true, role: true } });
    expect(mocks.audit).toHaveBeenCalledWith("m1", "session.login", "m1");
    expect(mocks.session).toHaveBeenCalledWith("m1");
  });
  it("does not set a session cookie if the audit table is missing", async () => {
    mocks.audit.mockRejectedValue({ code: "P2021" });
    expect((await (await POST(request())).json()).code).toBe("AUTH_SCHEMA_MISSING");
    expect(mocks.session).not.toHaveBeenCalled();
  });
});
