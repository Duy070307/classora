import { buildStandaloneTikzDocument } from "@/lib/ai/extract-tikz";

export type GeometryTikzValidation = {
  ok: boolean;
  reasons: string[];
};

export type GeometryTikzPresetResult = {
  tikzCode: string;
  standaloneLatex: string;
  explanation: string;
  warnings: string[];
};

const schoolDiagramTikz = String.raw`\begin{tikzpicture}[scale=0.0035, line cap=round, line join=round]
  % Coordinates
  \coordinate (Aprime) at (0,0);
  \coordinate (A) at (0,500);
  \coordinate (M) at (900,0);
  \coordinate (Bprime) at (2200,0);
  \coordinate (B) at (2200,600);

  % Ground strip
  \fill[gray!25] (-180,-130) rectangle (2380,0);

  % Baseline
  \draw[dashed] (Aprime) -- (Bprime);

  % Vertical posts
  \draw[thick] (Aprime) -- (A);
  \draw[thick] (Bprime) -- (B);

  % Main slanted segments
  \draw[thick] (A) -- (M);
  \draw[thick] (M) -- (B);

  % Point marks
  \fill (A) circle (8);
  \fill (Aprime) circle (8);
  \fill (M) circle (8);
  \fill (Bprime) circle (8);
  \fill (B) circle (8);

  % Labels
  \node[above left] at (A) {$A$};
  \node[below] at (Aprime) {$A'$};
  \node[below] at (M) {$M$};
  \node[below] at (Bprime) {$B'$};
  \node[above right] at (B) {$B$};

  % Measurements
  \node[left] at (0,250) {$500\,\text{m}$};
  \node[right] at (2200,300) {$600\,\text{m}$};
  \node[above] at (1550,300) {$2200\,\text{m}$};
\end{tikzpicture}`;

export function getSchoolDiagramPreset(): GeometryTikzPresetResult {
  return {
    tikzCode: schoolDiagramTikz,
    standaloneLatex: buildStandaloneTikzDocument(schoolDiagramTikz),
    explanation: "Đã nhận diện mẫu hình học trường phổ thông gồm A, A', M, B', B, hai đoạn thẳng đứng, đường gấp khúc A-M-B và đường nền nét đứt.",
    warnings: [
      "Mã TikZ là bản nháp hỗ trợ vẽ lại hình. Giáo viên cần kiểm tra lại vị trí điểm, độ dài, góc, nét đứt và ký hiệu trước khi sử dụng.",
    ],
  };
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").toLowerCase();
}

export function isKnownSchoolDiagramPattern(text: string) {
  const value = normalize(text);
  const hasAPrime = /a\s*['’′]|aprime/.test(value);
  const hasBPrime = /b\s*['’′]|bprime/.test(value);
  const hasLabels = /\ba\b/.test(value) && hasAPrime && /\bm\b/.test(value) && hasBPrime && /\bb\b/.test(value);
  const hasMeasurements = /500/.test(value) && /600/.test(value) && /2200/.test(value);
  return hasLabels && hasMeasurements;
}

function hasSolidSegment(code: string, left: string, right: string) {
  const escapedLeft = left.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedRight = right.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const segment = new RegExp(`\\\\draw(?!\\s*\\[[^\\]]*(?:dashed|blue)[^\\]]*\\])[^;]*(?:\\(${escapedLeft}\\)\\s*--\\s*\\(${escapedRight}\\)|\\(${escapedRight}\\)\\s*--\\s*\\(${escapedLeft}\\))`, "i");
  return segment.test(code);
}

function hasAnySegment(code: string, left: string, right: string) {
  const escapedLeft = left.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedRight = right.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const segment = new RegExp(`\\\\draw[^;]*(?:\\(${escapedLeft}\\)\\s*--\\s*\\(${escapedRight}\\)|\\(${escapedRight}\\)\\s*--\\s*\\(${escapedLeft}\\))`, "i");
  return segment.test(code);
}

export function validateKnownSchoolDiagramTikz(tikzCode: string): GeometryTikzValidation {
  const reasons: string[] = [];
  const code = tikzCode;
  const text = normalize(code);

  for (const label of ["A", "M", "B"]) {
    if (!new RegExp(`\\$${label}\\$|\\{${label}\\}|\\(${label}\\)`).test(code)) {
      reasons.push(`missing_label_${label}`);
    }
  }
  if (!/\$A'\$|\{A'\}|Aprime/i.test(code)) reasons.push("missing_label_Aprime");
  if (!/\$B'\$|\{B'\}|Bprime/i.test(code)) reasons.push("missing_label_Bprime");
  if (!/500/.test(code)) reasons.push("missing_500");
  if (!/600/.test(code)) reasons.push("missing_600");
  if (!/2200/.test(code)) reasons.push("missing_2200");

  if (!/gray|grey|fill/i.test(code)) reasons.push("missing_gray_ground");
  if (!/dashed/i.test(code)) reasons.push("missing_dashed_baseline");
  if (!hasAnySegment(code, "Aprime", "Bprime") && !/A'\s*--\s*B'|B'\s*--\s*A'/.test(code)) reasons.push("missing_Aprime_Bprime_baseline");
  if (!hasAnySegment(code, "Aprime", "A") && !/A'\s*--\s*A|A\s*--\s*A'/.test(code)) reasons.push("missing_A_Aprime_post");
  if (!hasAnySegment(code, "Bprime", "B") && !/B'\s*--\s*B|B\s*--\s*B'/.test(code)) reasons.push("missing_B_Bprime_post");
  if (!hasSolidSegment(code, "A", "M")) reasons.push("missing_solid_A_M");
  if (!hasSolidSegment(code, "M", "B")) reasons.push("missing_solid_M_B");
  if (/blue[^;]*(\(A\)\s*--\s*\(M\)|\(M\)\s*--\s*\(A\)|\(M\)\s*--\s*\(B\)|\(B\)\s*--\s*\(M\))/i.test(code)) reasons.push("main_segments_blue");
  if (/dashed[^;]*(\(A\)\s*--\s*\(M\)|\(M\)\s*--\s*\(A\)|\(M\)\s*--\s*\(B\)|\(B\)\s*--\s*\(M\))/i.test(code)) reasons.push("main_segments_dashed");
  if (!/M\)\s*at\s*\([^,]+,\s*0\)|\(M\)\s*at\s*\([^,]+,\s*0\.0+\)/i.test(code) && text.includes("\\coordinate (m)")) {
    reasons.push("M_not_on_baseline");
  }

  return { ok: reasons.length === 0, reasons };
}

export function maybeUseKnownSchoolDiagramPreset(text: string): GeometryTikzPresetResult | null {
  return isKnownSchoolDiagramPattern(text) ? getSchoolDiagramPreset() : null;
}
