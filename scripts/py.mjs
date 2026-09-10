// Runs a Python script with apps/ml's virtualenv interpreter when it exists,
// so `npm run ml:*` works whether or not the venv is activated. Falls back to
// `python` / `python3` on PATH.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const venvCandidates = [
  path.join(repoRoot, "apps", "ml", ".venv", "Scripts", "python.exe"), // Windows
  path.join(repoRoot, "apps", "ml", ".venv", "bin", "python"), // macOS/Linux
];

const interpreter =
  venvCandidates.find(existsSync) ??
  (process.platform === "win32" ? "python" : "python3");

if (!venvCandidates.some(existsSync)) {
  console.warn(
    "[py] apps/ml/.venv not found — using system Python. " +
      "Set it up: cd apps/ml && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt",
  );
}

const result = spawnSync(interpreter, process.argv.slice(2), {
  stdio: "inherit",
  cwd: repoRoot,
});
process.exit(result.status ?? 1);
