import { buildStandaloneTikzDocument } from "@/lib/ai/extract-tikz";

export type GeometryTikzValidation = {
  ok: boolean;
  reasons: string[];
};

export type GeometryTikzPresetResult = {
  name: string;
  tikzCode: string;
  standaloneLatex: string;
  explanation: string;
  warnings: string[];
};

const draftWarning = "Mã TikZ là bản nháp hỗ trợ vẽ lại hình. Giáo viên cần kiểm tra lại vị trí điểm, độ dài, góc, nét đứt và ký hiệu trước khi sử dụng.";

function preset(name: string, tikzCode: string, explanation: string): GeometryTikzPresetResult {
  return {
    name,
    tikzCode,
    standaloneLatex: buildStandaloneTikzDocument(tikzCode),
    explanation,
    warnings: [draftWarning],
  };
}

const twoVerticalPostsTikz = String.raw`\begin{tikzpicture}[scale=0.15, line cap=round, line join=round]
  \coordinate (Aprime) at (0,0);
  \coordinate (A) at (0,5);
  \coordinate (M) at (4,0);
  \coordinate (Bprime) at (12,0);
  \coordinate (B) at (12,6);

  \fill[gray!25] (-1,-1) rectangle (13,0);
  \draw[dashed] (Aprime) -- (Bprime);
  \draw[thick] (Aprime) -- (A);
  \draw[thick] (Bprime) -- (B);
  \draw[thick] (A) -- (M);
  \draw[thick] (M) -- (B);

  \fill (A) circle (1.5pt);
  \fill (Aprime) circle (1.5pt);
  \fill (M) circle (1.5pt);
  \fill (Bprime) circle (1.5pt);
  \fill (B) circle (1.5pt);

  \node[above left] at (A) {$A$};
  \node[below] at (Aprime) {$A'$};
  \node[below] at (M) {$M$};
  \node[below] at (Bprime) {$B'$};
  \node[above right] at (B) {$B$};

  \node[left] at ($(Aprime)!0.5!(A)$) {$500(\mathrm{m})$};
  \node[right] at ($(Bprime)!0.5!(B)$) {$600(\mathrm{m})$};
  \node[above] at ($(M)!0.5!(B)$) {$2200(\mathrm{m})$};
\end{tikzpicture}`;

const simpleTriangleTikz = String.raw`\begin{tikzpicture}[scale=1, line cap=round, line join=round]
  \coordinate (A) at (0,2.8);
  \coordinate (B) at (-2,0);
  \coordinate (C) at (2,0);

  \draw[thick] (A) -- (B) -- (C) -- cycle;
  \fill (A) circle (1.5pt);
  \fill (B) circle (1.5pt);
  \fill (C) circle (1.5pt);

  \node[above] at (A) {$A$};
  \node[below left] at (B) {$B$};
  \node[below right] at (C) {$C$};
\end{tikzpicture}`;

const triangleAltitudeTikz = String.raw`\begin{tikzpicture}[scale=1, line cap=round, line join=round]
  \coordinate (A) at (0,3);
  \coordinate (B) at (-2.2,0);
  \coordinate (C) at (2.2,0);
  \coordinate (H) at (0,0);

  \draw[thick] (A) -- (B) -- (C) -- cycle;
  \draw[dashed] (A) -- (H);
  \draw ($(H)+(0,0.22)$) -- ($(H)+(0.22,0.22)$) -- ($(H)+(0.22,0)$);
  \fill (A) circle (1.5pt);
  \fill (B) circle (1.5pt);
  \fill (C) circle (1.5pt);
  \fill (H) circle (1.5pt);

  \node[above] at (A) {$A$};
  \node[below left] at (B) {$B$};
  \node[below right] at (C) {$C$};
  \node[below] at (H) {$H$};
\end{tikzpicture}`;

const circleCenterTikz = String.raw`\begin{tikzpicture}[scale=1, line cap=round, line join=round]
  \coordinate (O) at (0,0);
  \coordinate (A) at (2,0);

  \draw[thick] (O) circle (2);
  \draw[thick] (O) -- (A);
  \fill (O) circle (1.5pt);
  \fill (A) circle (1.5pt);

  \node[below left] at (O) {$O$};
  \node[right] at (A) {$A$};
\end{tikzpicture}`;

const coordinateAxesTikz = String.raw`\begin{tikzpicture}[scale=0.8, line cap=round, line join=round]
  \draw[->] (-3,0) -- (3.4,0) node[right] {$x$};
  \draw[->] (0,-2.5) -- (0,3.2) node[above] {$y$};
  \coordinate (O) at (0,0);
  \coordinate (A) at (2,1.5);
  \fill (O) circle (1.3pt) node[below left] {$O$};
  \fill (A) circle (1.5pt) node[above right] {$A$};
  \draw[dashed] (A) -- (2,0);
  \draw[dashed] (A) -- (0,1.5);
\end{tikzpicture}`;

const quadrilateralTikz = String.raw`\begin{tikzpicture}[scale=1, line cap=round, line join=round]
  \coordinate (A) at (-1.8,1.4);
  \coordinate (B) at (1.4,1.2);
  \coordinate (C) at (2,-1);
  \coordinate (D) at (-1.5,-1.3);

  \draw[thick] (A) -- (B) -- (C) -- (D) -- cycle;
  \fill (A) circle (1.5pt);
  \fill (B) circle (1.5pt);
  \fill (C) circle (1.5pt);
  \fill (D) circle (1.5pt);

  \node[above left] at (A) {$A$};
  \node[above right] at (B) {$B$};
  \node[below right] at (C) {$C$};
  \node[below left] at (D) {$D$};
\end{tikzpicture}`;

function normalize(text: string) {
  return text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function hasLabel(value: string, label: string) {
  return new RegExp(`(?:\\$|\\{|\\(|\\b)${label}(?:\\$|\\}|\\)|\\b)`, "i").test(value);
}

function hasPrimeLabel(value: string, label: "a" | "b") {
  return new RegExp(`${label}\\s*['’′]|${label}prime`, "i").test(value);
}

export function isKnownSchoolDiagramPattern(text: string) {
  const value = normalize(text);
  const hasLabels = hasLabel(value, "a") && hasPrimeLabel(value, "a") && hasLabel(value, "m") && hasPrimeLabel(value, "b") && hasLabel(value, "b");
  const hasMeasurements = /500/.test(value) && /600/.test(value) && /2200/.test(value);
  const hasSchoolShapeWords = /baseline|ground|vertical|aprime|bprime|500|600|2200|dashed/.test(value);
  return hasLabels && hasMeasurements && hasSchoolShapeWords;
}

export function detectTwoVerticalPostsDiagram(text: string) {
  return isKnownSchoolDiagramPattern(text);
}

export function detectSimpleTriangleDiagram(text: string) {
  const value = normalize(text);
  return hasLabel(value, "a") && hasLabel(value, "b") && hasLabel(value, "c") && /triangle|tam giac|tam giác|segment|draw|--/.test(value) && !hasLabel(value, "h") && !/circle|duong tron|đường tròn/.test(value);
}

export function detectTriangleWithAltitude(text: string) {
  const value = normalize(text);
  return hasLabel(value, "a") && hasLabel(value, "b") && hasLabel(value, "c") && hasLabel(value, "h") && /altitude|height|duong cao|duong vuong goc|perpendicular|right angle|goc vuong|dashed/.test(value);
}

export function detectCircleWithCenter(text: string) {
  const value = normalize(text);
  return hasLabel(value, "o") && /circle|duong tron|đường tròn|radius|ban kinh|bán kính|\\circle/.test(value);
}

export function detectCoordinateAxes(text: string) {
  const value = normalize(text);
  return /axis|axes|coordinate|toa do|tọa độ|truc x|truc y|\\draw\[->\]|node\[right\].*\$x\$|node\[above\].*\$y\$/.test(value);
}

export function detectQuadrilateral(text: string) {
  const value = normalize(text);
  return hasLabel(value, "a") && hasLabel(value, "b") && hasLabel(value, "c") && hasLabel(value, "d") && /quadrilateral|tu giac|tứ giác|polygon|cycle|--/.test(value);
}

export function getGeometryPreset(text: string): GeometryTikzPresetResult | null {
  if (detectTwoVerticalPostsDiagram(text)) {
    return preset("two-vertical-posts", twoVerticalPostsTikz, "Đã nhận diện mẫu hai đoạn thẳng đứng, đường nền nét đứt và điểm M trên nền.");
  }
  if (detectTriangleWithAltitude(text)) {
    return preset("triangle-altitude", triangleAltitudeTikz, "Đã nhận diện tam giác có đường cao hoặc đoạn vuông góc.");
  }
  if (detectCircleWithCenter(text)) {
    return preset("circle-center", circleCenterTikz, "Đã nhận diện đường tròn có tâm và bán kính.");
  }
  if (detectCoordinateAxes(text)) {
    return preset("coordinate-axes", coordinateAxesTikz, "Đã nhận diện hệ trục tọa độ với điểm được đánh dấu.");
  }
  if (detectQuadrilateral(text)) {
    return preset("quadrilateral", quadrilateralTikz, "Đã nhận diện tứ giác ABCD.");
  }
  if (detectSimpleTriangleDiagram(text)) {
    return preset("simple-triangle", simpleTriangleTikz, "Đã nhận diện tam giác ABC đơn giản.");
  }
  return null;
}

export function validateGenericGeometryTikz(tikzCode: string): GeometryTikzValidation {
  const reasons: string[] = [];
  const code = tikzCode.trim();
  if (!code.includes("\\begin{tikzpicture}")) reasons.push("missing_begin_tikzpicture");
  if (!code.includes("\\end{tikzpicture}")) reasons.push("missing_end_tikzpicture");
  if (/"type"\s*:|"tikzCode"\s*:|"standaloneLatex"\s*:/.test(code)) reasons.push("raw_json_visible");
  if (/```/.test(code)) reasons.push("markdown_fence_visible");
  if (!/\\(draw|coordinate|node|fill|path)\b/.test(code)) reasons.push("missing_tikz_commands");
  if (code.endsWith("\\") || code.endsWith("{") || code.endsWith("[") || code.split("\\begin{tikzpicture}").length !== code.split("\\end{tikzpicture}").length) {
    reasons.push("possibly_truncated");
  }
  return { ok: reasons.length === 0, reasons };
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
    if (!new RegExp(`\\$${label}\\$|\\{${label}\\}|\\(${label}\\)`).test(code)) reasons.push(`missing_label_${label}`);
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
  if (!/M\)\s*at\s*\([^,]+,\s*0\)|\(M\)\s*at\s*\([^,]+,\s*0\.0+\)/i.test(code) && text.includes("\\coordinate (m)")) reasons.push("M_not_on_baseline");
  return { ok: reasons.length === 0, reasons };
}
