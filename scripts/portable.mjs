// Keep source on external volumes while dependencies and build caches use the OS temp drive.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const id = createHash("sha256").update(source).digest("hex").slice(0, 12);
const tempRoot = realpathSync(tmpdir());
const runtime = join(tempRoot, `skulena-${id}`);
const task = process.argv[2] || "dev";
if (!["dev", "build", "lint", "typecheck", "start"].includes(task)) {
  throw new Error(`Unsupported portable task: ${task}`);
}
if (resolve(runtime) === source) throw new Error("The runtime must be separate from source.");
const ownerFile = join(runtime, ".skulena-source");
if (existsSync(runtime) && !existsSync(ownerFile) && readdirSync(runtime).length) {
  throw new Error(`Refusing to replace the existing, unowned runtime directory: ${runtime}`);
}
mkdirSync(runtime, { recursive: true });
if (realpathSync(runtime) !== runtime) throw new Error("Refusing to use a symlink as the runtime directory.");
if (existsSync(ownerFile) && readFileSync(ownerFile, "utf8") !== source) throw new Error("This runtime belongs to another workspace.");
writeFileSync(ownerFile, source);
let stopping = false;
function syncSource(fatal = true) {
  const result = spawnSync("rsync", ["-a", "--delete", "--exclude=node_modules", "--exclude=.next", "--exclude=.git", "--exclude=._*", "--exclude=*.tsbuildinfo", "--exclude=.dependency-hash", "--exclude=.skulena-source", `${source}/`, `${runtime}/`], { stdio: "inherit" });
  if (result.status !== 0) {
    if (fatal) throw new Error("Unable to copy source into the local runtime (rsync is required).");
    if (!stopping) console.error("Source sync failed; the next development sync will retry.");
  }
}
syncSource();
const packageHash = createHash("sha256").update(readFileSync(join(source, "package.json"))).update(existsSync(join(source, "package-lock.json")) ? readFileSync(join(source, "package-lock.json")) : "").digest("hex");
const stamp = join(runtime, ".dependency-hash");
if (!existsSync(join(runtime, "node_modules/next/package.json")) || !existsSync(stamp) || readFileSync(stamp, "utf8") !== packageHash) {
  const install = spawnSync("npm", [existsSync(join(runtime, "package-lock.json")) ? "ci" : "install", "--no-audit", "--no-fund", "--prefer-offline"], { cwd: runtime, stdio: "inherit" });
  if (install.status !== 0) process.exit(install.status || 1);
  writeFileSync(stamp, packageHash);
}
console.log(`Skulena source: ${source}\nLocal runtime: ${runtime}`);
const child = spawn("npm", ["run", task, "--", ...process.argv.slice(3)], { cwd: runtime, stdio: "inherit" });
// Next watches the mirror; sync source changes without copying dependency/build trees.
const watcher = task === "dev" ? setInterval(() => syncSource(false), 2000) : undefined;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  if (stopping) return;
  stopping = true;
  if (watcher) clearInterval(watcher);
  child.kill(signal);
});
child.on("error", (error) => { if (watcher) clearInterval(watcher); console.error(error.message); process.exit(1); });
child.on("exit", (code, signal) => { if (watcher) clearInterval(watcher); process.exit(code ?? (signal ? 1 : 0)); });
