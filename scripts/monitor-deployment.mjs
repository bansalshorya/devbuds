import { appendFileSync } from "node:fs";

const base = new URL(process.env.MONITOR_URL || "https://devbuds-five.vercel.app");
if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname)) throw new Error("Use HTTPS for deployment monitoring.");
const limit = Number(process.env.MONITOR_SLOW_MS || 5000);
const checks = [
  { path: "/login", valid: (r, body) => r.status === 200 && body.includes("DevBuds") },
  { path: "/api/health", valid: (r, body) => { try { const data = JSON.parse(body); return r.status === 200 && data.ok === true && data.checks?.schema === true; } catch { return false; } } },
  { path: "/api/auth/login", init: { method: "POST", headers: { "Content-Type": "application/json", Origin: base.origin }, body: "{}" }, valid: (r) => r.status === 400 },
];
const failures = [];
for (const check of checks) {
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    const started = Date.now();
    try {
      const response = await fetch(new URL(check.path, base), { ...check.init, redirect: "manual", signal: AbortSignal.timeout(15000) });
      const body = await response.text(); const elapsed = Date.now() - started;
      result = !check.valid(response, body) ? `${check.path}: unexpected HTTP ${response.status} or readiness response` : elapsed > limit ? `${check.path}: ${elapsed} ms exceeds ${limit} ms` : null;
    } catch { result = `${check.path}: timed out or could not connect`; }
    if (!result) break;
  }
  if (result) failures.push(result);
}
const failed = failures.length > 0;
const summary = failed ? failures.join("; ") : "Login page, login validation, and database/schema readiness checks passed.";
console.log(summary);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed}\nsummary=${summary}\n`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### DevBuds deployment monitor\n${summary}\n`);
if (failed) process.exitCode = 1;
