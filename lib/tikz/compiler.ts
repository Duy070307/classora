import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectTikzSafety } from "@/lib/tikz/safety";
import type { TikzCompilationResult } from "@/lib/tikz/types";

const COMPILERS = ["pdflatex", "lualatex", "xelatex"] as const;
const MAX_SOURCE_SIZE = 60_000;
const MAX_OUTPUT_SIZE = 20 * 1024 * 1024;
let discoveryPromise: Promise<{ compiler?: typeof COMPILERS[number]; dvisvgm: boolean }> | undefined;

function runFixed(executable: string, args: string[], options: { cwd?: string; timeoutMs: number }) {
  return new Promise<{ code: number | null; timedOut: boolean }>((resolve) => {
    let settled = false; const child = spawn(executable, args, { cwd: options.cwd, shell: false, windowsHide: true, stdio: "ignore", env: { ...process.env, openin_any: "p", openout_any: "p", shell_escape: "f", SOURCE_DATE_EPOCH: "0" } });
    const timer = setTimeout(() => { if (!settled) { child.kill("SIGKILL"); settled = true; resolve({ code: null, timedOut: true }); } }, options.timeoutMs);
    child.once("error", () => { if (!settled) { clearTimeout(timer); settled = true; resolve({ code: null, timedOut: false }); } });
    child.once("exit", (code) => { if (!settled) { clearTimeout(timer); settled = true; resolve({ code, timedOut: false }); } });
  });
}

async function discover() {
  for (const compiler of COMPILERS) {
    const result = await runFixed(compiler, ["--version"], { timeoutMs: 2_000 });
    if (result.code === 0) {
      const dvisvgm = (await runFixed("dvisvgm", ["--version"], { timeoutMs: 2_000 })).code === 0;
      return { compiler, dvisvgm };
    }
  }
  return { dvisvgm: false };
}

export async function getTikzCompilerStatus() {
  discoveryPromise ||= discover();
  const discovered = await discoveryPromise;
  return { available: Boolean(discovered.compiler), supportsPdf: Boolean(discovered.compiler), supportsSvg: Boolean(discovered.compiler && discovered.dvisvgm) };
}

export async function compileTikzDocument(standaloneSource: string, timeoutMs = 15_000): Promise<{ result: TikzCompilationResult; pdf?: Buffer }> {
  const startedAt = Date.now(); const safety = inspectTikzSafety(standaloneSource); const discovered = await (discoveryPromise ||= discover());
  if ((!safety.safe || standaloneSource.length > MAX_SOURCE_SIZE) && !discovered.compiler) return { result: { available: false, success: false, engine: "none", verifiedOutput: false, supportsPdf: false, supportsSvg: false, warnings: [], errors: [{ code: safety.safe ? "source_too_large" : "unsafe_tex", message: safety.safe ? "Mã TikZ vượt quá dung lượng biên dịch an toàn." : "Mã TikZ chứa lệnh không được phép trong môi trường an toàn." }], compileTimeMs: Date.now() - startedAt } };
  if (!safety.safe || standaloneSource.length > MAX_SOURCE_SIZE) return { result: { available: true, success: false, engine: "latex", verifiedOutput: false, supportsPdf: false, supportsSvg: false, warnings: [], errors: safety.issues.map((issue) => ({ code: issue.code, message: "Mã TikZ chứa lệnh không được phép trong môi trường an toàn." })), compileTimeMs: Date.now() - startedAt } };
  if (!discovered.compiler) return { result: { available: false, success: false, engine: "none", verifiedOutput: false, supportsPdf: false, supportsSvg: false, warnings: ["Máy chủ hiện chưa có trình biên dịch TeX. SOẠN LAB vẫn tạo mã TikZ và bản SVG để thầy cô kiểm tra."], errors: [], compileTimeMs: Date.now() - startedAt } };
  const directory = await mkdtemp(join(tmpdir(), "soanlab-tikz-"));
  try {
    await writeFile(join(directory, "diagram.tex"), standaloneSource, { encoding: "utf8", flag: "wx" });
    const executed = await runFixed(discovered.compiler, ["-interaction=nonstopmode", "-halt-on-error", "-no-shell-escape", "-output-directory", directory, "diagram.tex"], { cwd: directory, timeoutMs: Math.min(30_000, Math.max(2_000, timeoutMs)) });
    if (executed.timedOut) return { result: { available: true, success: false, engine: "latex", verifiedOutput: false, supportsPdf: true, supportsSvg: discovered.dvisvgm, warnings: [], errors: [{ code: "timeout", message: "Quá thời gian biên dịch TeX an toàn." }], compileTimeMs: Date.now() - startedAt } };
    const pdfPath = join(directory, "diagram.pdf");
    const info = executed.code === 0 ? await stat(pdfPath).catch(() => null) : null;
    if (!info?.isFile() || !info.size || info.size > MAX_OUTPUT_SIZE) return { result: { available: true, success: false, engine: "latex", verifiedOutput: false, supportsPdf: true, supportsSvg: discovered.dvisvgm, warnings: [], errors: [{ code: "compile_failed", message: "Biên dịch TeX thất bại. Vui lòng kiểm tra mã TikZ." }], compileTimeMs: Date.now() - startedAt } };
    const pdf = await readFile(pdfPath);
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) return { result: { available: true, success: false, engine: "latex", verifiedOutput: false, supportsPdf: true, supportsSvg: discovered.dvisvgm, warnings: [], errors: [{ code: "invalid_output", message: "Trình biên dịch không tạo được tệp PDF hợp lệ." }], compileTimeMs: Date.now() - startedAt } };
    return { pdf, result: { available: true, success: true, engine: "latex", verifiedOutput: true, supportsPdf: true, supportsSvg: discovered.dvisvgm, warnings: [], errors: [], renderedAsset: { type: "pdf" }, compileTimeMs: Date.now() - startedAt } };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function resetTikzCompilerDiscoveryForTests() {
  discoveryPromise = undefined;
}
