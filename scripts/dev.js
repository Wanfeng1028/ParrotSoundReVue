const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const services = [
  { name: "backend", cwd: path.join(rootDir, "parrot-backend"), args: ["run", "dev"] },
  { name: "frontend", cwd: path.join(rootDir, "parrot-frontend"), args: ["run", "dev"] },
];

const children = [];
let shuttingDown = false;

const stopAll = (signal = "SIGTERM") => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

for (const service of services) {
  const child = spawn(npmCommand, service.args, {
    cwd: service.cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${service.name}] exited with code ${code}`);
      stopAll();
      process.exitCode = code || 1;
    }
  });

  children.push(child);
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
