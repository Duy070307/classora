import { existsSync, readFileSync } from "node:fs";
import { OpenAICompatibleError, requestOpenAICompatibleText } from "../lib/ai/providers/openai-provider";

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

async function run() {
  loadLocalEnv();
  if (!process.env.OPENAI_API_KEY) return console.log("SKIP: OPENAI_API_KEY chưa được cấu hình.");
  try {
    const result = await requestOpenAICompatibleText("Chỉ trả lời đúng một từ: OK");
    if (result.trim().toUpperCase() !== "OK") throw new OpenAICompatibleError("parser_failed");
    console.log("success: OK");
  } catch (error) {
    const code = error instanceof OpenAICompatibleError ? error.diagnostic : "parser_failed";
    console.error(`failed: ${code}`);
    process.exitCode = 1;
  }
}

void run();
