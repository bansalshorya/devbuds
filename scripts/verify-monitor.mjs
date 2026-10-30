import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
let mode = "healthy";
const server = createServer((req, res) => {
  if (req.url === "/api/health") { res.writeHead(mode === "unhealthy" ? 503 : 200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: mode !== "unhealthy", checks: { schema: true } })); }
  else if (req.url === "/api/auth/login") { res.writeHead(400, { "Content-Type": "application/json" }); res.end('{"error":"Enter details"}'); }
  else { const finish = () => { res.writeHead(200); res.end("DevBuds login"); }; if (mode === "slow") setTimeout(finish, 30); else finish(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
async function probe(slowLimit = "5000") {
  const env = { ...process.env, MONITOR_URL: `http://127.0.0.1:${port}`, MONITOR_SLOW_MS: slowLimit };
  delete env.GITHUB_OUTPUT; delete env.GITHUB_STEP_SUMMARY;
  try { const result = await exec(process.execPath, ["scripts/monitor-deployment.mjs"], { env }); return { code: 0, output: result.stdout }; }
  catch (error) { return { code: error.code, output: error.stdout }; }
}
try {
  assert.equal((await probe()).code, 0); console.log("PASS healthy deployment");
  mode = "unhealthy"; const down = await probe(); assert.equal(down.code, 1); assert.match(down.output, /api\/health/); console.log("PASS failed readiness is reported");
  mode = "healthy"; assert.equal((await probe()).code, 0); console.log("PASS recovery is reported");
  mode = "slow"; const slow = await probe("10"); assert.equal(slow.code, 1); assert.match(slow.output, /exceeds/); console.log("PASS slow responses are reported");
} finally { await new Promise((resolve) => server.close(resolve)); }
