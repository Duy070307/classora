type Token = { type: "number" | "operator" | "left" | "right"; value: string };

function tokenize(raw: string): Token[] | null {
  const input = raw.replace(/,/g, ".").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  if (!input || input.length > 120 || /[^0-9.+\-*/()]/.test(input)) return null;
  const tokens: Token[] = [];
  for (let index = 0; index < input.length;) {
    const char = input[index];
    if (/\d|\./.test(char)) {
      const match = input.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/)?.[0];
      if (!match) return null;
      tokens.push({ type: "number", value: match }); index += match.length; continue;
    }
    if ("+-*/".includes(char)) tokens.push({ type: "operator", value: char });
    else tokens.push({ type: char === "(" ? "left" : "right", value: char });
    index += 1;
  }
  return tokens;
}

export function safeCalculate(raw: string): number | null {
  const tokens = tokenize(raw); if (!tokens) return null;
  let index = 0;
  const primary = (): number | null => {
    const token = tokens[index]; if (!token) return null;
    if (token.type === "operator" && (token.value === "+" || token.value === "-")) { index += 1; const value = primary(); return value === null ? null : token.value === "-" ? -value : value; }
    if (token.type === "number") { index += 1; return Number(token.value); }
    if (token.type === "left") { index += 1; const value = expression(); if (tokens[index]?.type !== "right") return null; index += 1; return value; }
    return null;
  };
  const term = (): number | null => {
    let value = primary(); if (value === null) return null;
    while (tokens[index]?.type === "operator" && "*/".includes(tokens[index].value)) { const op = tokens[index++].value; const right = primary(); if (right === null || (op === "/" && right === 0)) return null; value = op === "*" ? value * right : value / right; }
    return value;
  };
  const expression = (): number | null => {
    let value = term(); if (value === null) return null;
    while (tokens[index]?.type === "operator" && "+-".includes(tokens[index].value)) { const op = tokens[index++].value; const right = term(); if (right === null) return null; value = op === "+" ? value + right : value - right; }
    return value;
  };
  const result = expression();
  return result !== null && index === tokens.length && Number.isFinite(result) ? result : null;
}

export function numericValue(value: string): number | null {
  const raw = value.trim().replace(/^\$|\$$/g, "").replace(/^(?:x|y|i|u|v|s|t)\s*=\s*/i, "");
  if (/^-?\d+(?:[.,]\d+)?\s*%$/.test(raw)) return Number(raw.replace(",", ".").replace("%", "")) / 100;
  const cleaned = raw.replace(/\s*(?:cm|mm|m|km|kg|g|s|phút|giờ|v|a|ω|mol)(?:\^\d+)?\s*$/i, "").trim();
  return safeCalculate(cleaned);
}

export function numericEquivalent(left: string, right: string, tolerance = 1e-6) {
  const a = numericValue(left); const b = numericValue(right);
  return a !== null && b !== null && Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}

export function extractCalculableExpression(stem: string) {
  const normalized = stem.replace(/\$[^$]*\$/g, (value) => value.slice(1, -1));
  const candidates = [...normalized.matchAll(/(?:tính|giá trị(?: của)?|bằng)\s*[:=]?\s*(-?[\d.,()\s+*/×÷·-]{3,})/giu)].map((match) => match[1].trim().replace(/[?.;,]+$/, ""));
  return candidates.find((value) => safeCalculate(value) !== null) || null;
}

export function extractDeterministicCalculation(stem: string): { expression: string; result: number } | null {
  const percentage = stem.match(/(-?\d+(?:[.,]\d+)?)\s*%\s*(?:của|x|×|\*)\s*(-?\d+(?:[.,]\d+)?)/iu);
  if (percentage) {
    const rate = Number(percentage[1].replace(",", "."));
    const base = Number(percentage[2].replace(",", "."));
    const result = rate / 100 * base;
    if (Number.isFinite(result)) return { expression: `${rate}% × ${base}`, result };
  }

  const arithmetic = extractCalculableExpression(stem);
  const arithmeticResult = arithmetic ? safeCalculate(arithmetic) : null;
  if (arithmetic && arithmeticResult !== null) return { expression: arithmetic, result: arithmeticResult };

  const linear = stem.replace(/,/g, ".").match(/(?:giải\s+phương\s+trình|nghiệm\s+của)[^\n]*?([+-]?(?:\d+(?:\.\d+)?)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*([+-]?\d+(?:\.\d+)?)/iu);
  if (linear) {
    const coefficient = linear[1] === "" || linear[1] === "+" ? 1 : linear[1] === "-" ? -1 : Number(linear[1]);
    const constant = Number((linear[2] || "0").replace(/\s+/g, ""));
    const right = Number(linear[3]);
    if (coefficient !== 0 && [coefficient, constant, right].every(Number.isFinite)) return { expression: `${coefficient}x ${constant >= 0 ? "+" : "-"} ${Math.abs(constant)} = ${right}`, result: (right - constant) / coefficient };
  }

  const functionMatch = stem.replace(/,/g, ".").match(/f\s*\(\s*x\s*\)\s*=\s*([\dx+*/().\s-]{1,80})[^\n]*?f\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/iu);
  if (functionMatch) {
    const input = Number(functionMatch[2]);
    const substituted = functionMatch[1].trim().replace(/x/giu, `(${input})`);
    const result = safeCalculate(substituted);
    if (result !== null) return { expression: substituted, result };
  }
  return null;
}
