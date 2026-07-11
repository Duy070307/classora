import assert from "node:assert/strict";
import { generateLatexFromImage } from "../lib/ai/image-to-latex";
import { getConfiguredProvider, normalizeProviderName } from "../lib/ai/provider";

process.env.AI_VISION_PROVIDER = "grok";
process.env.AI_TEXT_PROVIDER = "grok";
process.env.AI_PROVIDER = "grok";
process.env.GROK_API_KEY = "test-key-never-sent";
process.env.GROK_BASE_URL = "https://vision.invalid/v1";
process.env.GROK_MODEL = "test-vision-model";

const originalFetch = globalThis.fetch;
const requests: Array<Record<string, unknown>> = [];
globalThis.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
  requests.push(body);
  const messages = body.messages as Array<{ content?: Array<{ type?: string }> }>;
  const isGeometry = JSON.stringify(messages).includes("pointOnSegment");
  const content = isGeometry
    ? JSON.stringify({ points: [{ label: "A" }, { label: "B" }, { label: "C" }], segments: [{ from: "A", to: "B", style: "solid" }, { from: "B", to: "C", style: "solid" }, { from: "C", to: "A", style: "solid" }], pointOnSegment: [], perpendicularRelations: [], parallelRelations: [], equalLengthRelations: [], visibleLabels: ["A", "B", "C"], warnings: [] })
    : `\`\`\`json\n${JSON.stringify({ mode: "formula", latex: "\\frac{1}{\\sqrt{x}}", confidence: 0.95, warnings: [] })}\n\`\`\``;
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "content-type": "application/json" } });
};

async function run() {
  try {
    assert.equal(normalizeProviderName(), "grok");
    assert.equal(getConfiguredProvider().name, "grok");
    const formula = await generateLatexFromImage({ imageBase64: "AA==", mimeType: "image/png", mode: "formula" });
    assert.equal(formula.latex, "\\frac{1}{\\sqrt{x}}");
    assert.equal(formula.confidence, "high");

    const geometry = await generateLatexFromImage({ imageBase64: "AA==", mimeType: "image/png", mode: "geometry" });
    assert.match(geometry.tikzCode || "", /\\begin\{tikzpicture\}/);
    assert.match(geometry.standaloneLatex || "", /\\documentclass/);

    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: "\\sqrt{x+1}" } }] }), { status: 200, headers: { "content-type": "application/json" } });
    const plainFormula = await generateLatexFromImage({ imageBase64: "AA==", mimeType: "image/png", mode: "formula" });
    assert.equal(plainFormula.latex, "\\sqrt{x+1}");

    const firstMessages = requests[0].messages as Array<{ role: string; content: unknown }>;
    const userContent = firstMessages.find((message) => message.role === "user")?.content as Array<Record<string, unknown>>;
    assert.equal(userContent[0].type, "text");
    assert.equal(userContent[1].type, "image_url");
    const imageUrl = (userContent[1].image_url as { url: string }).url;
    assert.equal(imageUrl, "data:image/png;base64,AA==");
    assert.ok(!JSON.stringify(requests).includes(process.env.GROK_API_KEY || "missing"));
    console.log("Grok provider: text selection, formula, TikZ, multimodal payload và secret isolation đều đạt.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void run();
