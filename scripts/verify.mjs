import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { platform, release } from "node:os";

const checks = {
  unit: ["단위 테스트", "test:unit"],
  integration: ["통합 테스트", "test:integration"],
  e2e: ["브라우저 E2E", "test:e2e"],
};
const key = process.argv[2];
if (!Object.hasOwn(checks, key) || !process.env.npm_execpath) {
  console.error("Usage: npm run verify -- unit|integration|e2e");
  process.exit(2);
}

const [label, script] = checks[key];
const exitCode = await new Promise((resolve) => {
  const child = spawn(process.execPath, [process.env.npm_execpath, "run", script], { stdio: "inherit" });
  child.on("error", () => resolve(null));
  child.on("exit", resolve);
});

const directory = ".review";
const path = directory + "/results.json";
await mkdir(directory, { recursive: true });
let history = [];
try {
  history = JSON.parse(await readFile(path, "utf8"));
} catch {
  // No previous run is required.
}
const browser = key === "e2e" ? ` · ${process.env.WTN_BROWSER_CHANNEL || "Playwright Chromium"}` : "";
const report = {
  label,
  command: `npm run ${script}`,
  time: new Date().toISOString(),
  environment: `${platform()} ${release()} · Node ${process.version}${browser}`,
  exitCode,
};
await writeFile(path, JSON.stringify([report, ...history.filter((item) => item.label !== label)], null, 2));
process.exitCode = exitCode ?? 1;
