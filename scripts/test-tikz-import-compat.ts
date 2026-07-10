import assert from "node:assert/strict";
import { File } from "node:buffer";
import JSZip from "jszip";
import { readManifest } from "../components/tikz/TikzBankImportModal";
import { validateTikzImportItem } from "../lib/tikz-bank/import-validation";

const tikzCode = "\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}";
const fullLatex = `\\documentclass{standalone}\n\\usepackage{tikz}\n\\begin{document}\n${tikzCode}\n\\end{document}`;
const items = Array.from({ length: 60 }, (_, index) => index % 2 === 0 ? {
  slug: `hinh-${index + 1}`,
  title: `Hình ${index + 1}`,
  category: "Hình học phẳng",
  subject: "Toán",
  tags: ["tikz", "hình học"],
  tikz_code: tikzCode.replace("(1,1)", `(${index + 1},1)`),
  full_latex: fullLatex,
  package_dependencies: ["tikz"],
  source_name: "SOẠN LAB",
  source_license: "MIT",
} : {
  slug: `hinh-${index + 1}`,
  title: `Hình ${index + 1}`,
  category: "Hình học phẳng",
  subject: "Toán",
  tags: ["tikz", "hình học"],
  tikzCode: tikzCode.replace("(1,1)", `(${index + 1},1)`),
  fullLatex,
  packageDependencies: ["tikz"],
  sourceName: "SOẠN LAB",
  sourceLicense: "MIT",
  needsReview: true,
});

async function run() {
  const manifest = { version: "1.0", product: "SOẠN LAB", items };
  const manifestFile = new File([JSON.stringify(manifest)], "tikz-bank.json", { type: "application/json" });
  const rawFile = new File([JSON.stringify(items)], "tikz-bank-array.json", { type: "application/json" });
  const zip = new JSZip();
  zip.file("tikz-bank.json", JSON.stringify(manifest));
  zip.file("tex/example.tex", fullLatex);
  const zipFile = new File([await zip.generateAsync({ type: "uint8array" })], "tikz-bank.zip", { type: "application/zip" });
  const wrappedZip = new JSZip();
  wrappedZip.file("soan-lab-v1/tikz-bank.json", JSON.stringify(manifest));
  const wrappedZipFile = new File([await wrappedZip.generateAsync({ type: "uint8array" })], "tikz-bank-wrapped.zip", { type: "application/zip" });

  const [manifestResult, rawResult, zipResult, wrappedZipResult] = await Promise.all([readManifest(manifestFile), readManifest(rawFile), readManifest(zipFile), readManifest(wrappedZipFile)]);
  assert.equal(manifestResult.items.length, 60);
  assert.equal(rawResult.items.length, 60);
  assert.equal(zipResult.items.length, 60);
  assert.equal(wrappedZipResult.items.length, 60);
  assert.equal(items.filter((item, index) => validateTikzImportItem(item, index).status === "error").length, 0);
  assert.equal(validateTikzImportItem({ slug: "unsafe", title: "Unsafe", tikz_code: `\\begin{tikzpicture}\\write18{bad}\\end{tikzpicture}` }, 11).status, "error");
  assert.notEqual(validateTikzImportItem({ slug: "safe", title: "Safe", tikz_code: "\\begin{tikzpicture}\\foreach \\x in {1,2}{\\draw (\\x,0)--(\\x,1);}\\end{tikzpicture}" }).status, "error");
  assert.equal(validateTikzImportItem({ slug: "missing-title", tikz_code: tikzCode }, 11).message, "Mục số 12 thiếu title.");
  console.log("Manifest JSON: 60/60; Raw array JSON: 60/60; ZIP root manifest: 60/60; ZIP one-level manifest: 60/60; aliases: đạt; safety: đạt; precise errors: đạt.");
}

void run();
