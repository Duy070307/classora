import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GrokRequestError, requestGrokVision } from "../lib/ai/providers/grok";

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
  const fixture = resolve("public/icon.png");
  if (!existsSync(fixture)) {
    console.log("unsupported vision");
    return;
  }
  try {
    await requestGrokVision({
      prompt: "Return JSON only: {\"mode\":\"formula\",\"latex\":\"x\",\"confidence\":0.0,\"warnings\":[]}",
      imageBase64: readFileSync(fixture).toString("base64"),
      mimeType: "image/png",
    });
    console.log("success");
  } catch (error) {
    if (!(error instanceof GrokRequestError)) return console.log("unsupported vision");
    const labels: Record<GrokRequestError["reason"], string> = {
      unauthorized: "unauthorized",
      unsupported_vision: "unsupported vision",
      invalid_model: "invalid model",
      timeout: "timeout",
      rate_limited: "timeout",
      image_too_large: "unsupported vision",
      upstream: "timeout",
      empty_response: "unsupported vision",
    };
    console.log(labels[error.reason]);
  }
}

void run();
