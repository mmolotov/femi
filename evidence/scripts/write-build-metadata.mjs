import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const generatedAt = new Date().toISOString();

const output = `export const reportGeneratedAt = ${JSON.stringify(generatedAt)};\n`;
const outputPath = path.join("components", "generated", "report-build-metadata.js");

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, output, "utf8");
