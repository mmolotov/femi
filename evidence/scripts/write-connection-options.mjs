import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

async function loadDotEnv() {
  const envPath = new URL("../../.env", import.meta.url);
  const envFile = await readFile(envPath, "utf8");

  for (const rawLine of envFile.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (line === "" || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(name) || process.env[name]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[name] = value;
  }
}

await loadDotEnv();

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
