import { buildStandaloneTikzDocument, requiredTikzLibraries, sanitizeTikzCode } from "@/lib/ai/extract-tikz";
import { inspectTikzSafety } from "@/lib/tikz/safety";
import type { TikzCompilationResult } from "@/lib/tikz/types";

function lineOf(code: string, index: number) { return code.slice(0, Math.max(0, index)).split(/\r?\n/).length; }

export function inspectTikzSyntax(raw: string): TikzCompilationResult {
  const startedAt = Date.now();
  const code = sanitizeTikzCode(raw);
  const errors: TikzCompilationResult["errors"] = [];
  const safety = inspectTikzSafety(code);
  for (const issue of safety.issues) errors.push({ code: issue.code, message: issue.message });
  const begins = (code.match(/\\begin\{tikzpicture\}/g) || []).length;
  const ends = (code.match(/\\end\{tikzpicture\}/g) || []).length;
  if (begins !== 1 || ends !== 1) errors.push({ code: "environment", message: "Mã cần đúng một khối tikzpicture hoàn chỉnh.", suggestion: "Giữ một cặp begin/end tikzpicture." });
  let braces = 0;
  for (let index = 0; index < code.length; index += 1) {
    if (code[index] === "{" && code[index - 1] !== "\\") braces += 1;
    if (code[index] === "}" && code[index - 1] !== "\\") braces -= 1;
    if (braces < 0) { errors.push({ code: "unmatched_brace", line: lineOf(code, index), message: "Có dấu ngoặc đóng không khớp.", suggestion: "Kiểm tra cặp ngoặc tại dòng được chỉ ra." }); break; }
  }
  if (braces > 0) errors.push({ code: "unmatched_brace", message: "Còn dấu ngoặc mở chưa được đóng.", suggestion: "Bổ sung dấu ngoặc đóng còn thiếu." });
  code.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (/^\\(?:draw|path|node|fill|coordinate)\b/.test(trimmed) && !/[;{}]$/.test(trimmed) && !trimmed.endsWith("%")) {
      errors.push({ code: "missing_semicolon", line: index + 1, message: "Lệnh TikZ có thể thiếu dấu chấm phẩy.", suggestion: "Thêm dấu ; ở cuối lệnh." });
    }
    if (/^\\draw(?:\[[^\]]*\])?\s*;$/.test(trimmed)) errors.push({ code: "empty_draw", line: index + 1, message: "Lệnh vẽ đang rỗng.", suggestion: "Xóa lệnh hoặc thêm đường vẽ hợp lệ." });
  });
  const nodeNames = [...code.matchAll(/\\coordinate\s*\(([^)]+)\)|\\node(?:\[[^\]]*\])?\s*\(([^)]+)\)/g)].map((match) => match[1] || match[2]).filter(Boolean);
  const duplicates = [...new Set(nodeNames.filter((name, index) => nodeNames.indexOf(name) !== index))];
  for (const name of duplicates) errors.push({ code: "duplicate_node", message: `Tên nút “${name}” xuất hiện nhiều lần.`, suggestion: "Đổi tên hoặc xóa định nghĩa nút bị trùng." });
  return {
    available: false,
    success: false,
    engine: "deterministic_preview",
    warnings: errors.length ? [] : ["Đã vượt qua kiểm tra cú pháp và an toàn. Môi trường hiện tại chưa có trình biên dịch TeX nên đây chưa phải xác nhận biên dịch LaTeX."],
    errors,
    compileTimeMs: Date.now() - startedAt,
  };
}

export function repairTikzSyntax(raw: string) {
  const proposed: Array<{ code: string; message: string }> = [];
  let code = sanitizeTikzCode(raw).replace(/\r\n/g, "\n");
  const lines = code.split("\n").map((line) => {
    const trimmed = line.trim();
    if (/^\\(?:draw|path|node|fill|coordinate)\b/.test(trimmed) && !/[;{}]$/.test(trimmed)) {
      proposed.push({ code: "add_semicolon", message: `Thêm dấu ; cho lệnh: ${trimmed.slice(0, 50)}` });
      return `${line};`;
    }
    return line;
  });
  code = lines.join("\n");
  const opens = (code.match(/\{/g) || []).length; const closes = (code.match(/\}/g) || []).length;
  if (opens === closes + 1) { code += "}"; proposed.push({ code: "close_brace", message: "Đóng một dấu ngoặc còn thiếu ở cuối mã." }); }
  if (!code.includes("\\begin{tikzpicture}")) { code = `\\begin{tikzpicture}\n${code}\n\\end{tikzpicture}`; proposed.push({ code: "wrap_picture", message: "Bổ sung môi trường tikzpicture." }); }
  const standalone = buildStandaloneTikzDocument(code);
  return { code, standalone, libraries: requiredTikzLibraries(code), proposed, safe: inspectTikzSafety(code).safe };
}
