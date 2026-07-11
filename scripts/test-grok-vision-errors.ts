import assert from "node:assert/strict";
import { GrokRequestError, requestGrokVision } from "../lib/ai/providers/grok";

process.env.GROK_API_KEY = "test-key";
process.env.GROK_BASE_URL = "https://vision.invalid/v1";
process.env.GROK_MODEL = "test-model";
const originalFetch = globalThis.fetch;

async function expectReason(responseFactory: () => Promise<Response>, reason: GrokRequestError["reason"]) {
  globalThis.fetch = responseFactory as typeof fetch;
  await assert.rejects(
    () => requestGrokVision({ prompt: "test", imageBase64: "AA==", mimeType: "image/png" }),
    (error) => error instanceof GrokRequestError && error.reason === reason,
  );
}

async function run() {
  try {
    await expectReason(async () => new Response("unsupported image input", { status: 400 }), "unsupported_vision");
    await expectReason(async () => new Response("invalid model", { status: 400 }), "invalid_model");
    await expectReason(async () => new Response("", { status: 401 }), "unauthorized");
    await expectReason(async () => new Response("", { status: 403 }), "unauthorized");
    await expectReason(async () => new Response("", { status: 404 }), "invalid_model");
    await expectReason(async () => new Response("", { status: 413 }), "image_too_large");
    await expectReason(async () => new Response("", { status: 429 }), "rate_limited");
    await expectReason(async () => new Response("", { status: 500 }), "upstream");
    await expectReason(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }), "empty_response");
    globalThis.fetch = async () => { throw new DOMException("aborted", "AbortError"); };
    await assert.rejects(
      () => requestGrokVision({ prompt: "test", imageBase64: "AA==", mimeType: "image/png" }),
      (error) => error instanceof GrokRequestError && error.reason === "timeout",
    );
    console.log("Grok vision errors: 400/401/403/404/413/429/5xx/timeout/empty response đều được phân loại an toàn.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void run();
