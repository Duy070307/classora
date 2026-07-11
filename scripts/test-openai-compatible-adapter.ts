import assert from "node:assert/strict";
import { generateLatexFromImage } from "../lib/ai/image-to-latex";
import { getConfiguredProvider, normalizeProviderName } from "../lib/ai/provider";

process.env.AI_PROVIDER = "openai";
process.env.AI_TEXT_PROVIDER = "openai";
process.env.AI_VISION_PROVIDER = "openai";
process.env.OPENAI_API_KEY = "test-key-never-sent";
process.env.OPENAI_BASE_URL = "https://compatible.invalid/v1";
process.env.OPENAI_MODEL = "test-text-model";
process.env.OPENAI_VISION_MODEL = "test-vision-model";

const originalFetch = globalThis.fetch;
const requests: Array<Record<string, unknown>> = [];
globalThis.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
  requests.push(body);
  const isGeometry = JSON.stringify(body.messages).includes("pointOnSegment");
  const content = isGeometry
    ? JSON.stringify({ points: [{ label: "A" }, { label: "B" }, { label: "C" }], segments: [{ from: "A", to: "B", style: "solid" }, { from: "B", to: "C", style: "solid" }, { from: "C", to: "A", style: "solid" }], pointOnSegment: [], perpendicularRelations: [], parallelRelations: [], equalLengthRelations: [], visibleLabels: ["A", "B", "C"], warnings: [] })
    : `\`\`\`json\n${JSON.stringify({ latex: "\\frac{a}{b}", confidence: 0.95, warnings: [] })}\n\`\`\``;
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
};

async function run() {
  try {
    assert.equal(normalizeProviderName(), "openai");
    assert.equal(getConfiguredProvider().name, "openai");
    const formula = await generateLatexFromImage({ imageBase64: "AA==", mimeType: "image/png", mode: "formula" });
    assert.equal(formula.latex, "\\frac{a}{b}");

    const geometry = await generateLatexFromImage({ imageBase64: "AA==", mimeType: "image/png", mode: "geometry" });
    assert.match(geometry.tikzCode || "", /\\begin\{tikzpicture\}/);
    assert.match(geometry.standaloneLatex || "", /\\documentclass/);

    const payload = requests[0];
    assert.equal(payload.model, "test-vision-model");
    const messages = payload.messages as Array<{ content: Array<Record<string, unknown>> }>;
    assert.equal(messages[0].content[1].type, "image_url");
    assert.equal((messages[0].content[1].image_url as { url: string }).url, "data:image/png;base64,AA==");
    assert.ok(!JSON.stringify(requests).includes(process.env.OPENAI_API_KEY || "missing"));
    console.log("OpenAI-compatible adapter: công thức, hình học có cấu trúc, data URL, model vision và tách secret đều đạt.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void run();
