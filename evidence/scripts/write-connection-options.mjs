import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const requiredEnv = [
  "EVIDENCE_DB_HOST",
  "EVIDENCE_DB_PORT",
  "EVIDENCE_DB_NAME",
  "EVIDENCE_DB_USER",
  "EVIDENCE_DB_PASSWORD"
];

const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(
    `Missing required Evidence database environment variables: ${missing.join(", ")}`
  );
}

const rawPort = Number(process.env.EVIDENCE_DB_PORT);

if (!Number.isInteger(rawPort) || rawPort < 0 || rawPort > 65535) {
  throw new Error(
    `EVIDENCE_DB_PORT must be a valid TCP port, received: ${process.env.EVIDENCE_DB_PORT}`
  );
}

const sslValue = process.env.EVIDENCE_DB_SSL;

const options = {
  host: process.env.EVIDENCE_DB_HOST,
  port: rawPort,
  database: process.env.EVIDENCE_DB_NAME,
  user: process.env.EVIDENCE_DB_USER,
  password: process.env.EVIDENCE_DB_PASSWORD
};

if (sslValue) {
  if (sslValue === "true") {
    options.ssl = true;
  } else if (sslValue === "false") {
    options.ssl = false;
  } else if (sslValue === "no-verify") {
    options.ssl = "no-verify";
  } else {
    throw new Error(
      `EVIDENCE_DB_SSL must be one of "true", "false", or "no-verify", received: ${sslValue}`
    );
  }
}

const formatValue = (value) => {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
};

const output = [
  "name: femi",
  "type: postgres",
  "options:",
  ...Object.entries(options).map(([key, value]) => `  ${key}: ${formatValue(value)}`)
].join("\n");

const outputPath = path.join("sources", "femi", "connection.yaml");
const legacyOptionsPath = path.join("sources", "femi", "connection.options.yaml");

await mkdir(path.dirname(outputPath), { recursive: true });
await rm(legacyOptionsPath, { force: true });
await writeFile(outputPath, `${output}\n`, "utf8");
