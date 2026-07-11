import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OpenAICompatibleError, requestOpenAICompatibleVision } from "../lib/ai/providers/openai-provider";

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
    const result = await requestOpenAICompatibleVision({
      prompt: "Quan sát ảnh tam giác. Chỉ trả về các nhãn điểm nhìn thấy, cách nhau bằng dấu phẩy.",
      imageBase64: readFileSync(resolve("tests/fixtures/triangle-abc.png")).toString("base64"),
      mimeType: "image/png",
    });
    if (!["A", "B", "C"].every((label) => new RegExp(`\\b${label}\\b`, "i").test(result))) {
      throw new OpenAICompatibleError("image_ignored");
    }
    console.log("success: A, B, C");
  } catch (error) {
    const code = error instanceof OpenAICompatibleError ? error.diagnostic : "parser_failed";
    console.error(`failed: ${code}`);
    process.exitCode = 1;
  }
}

void run();
