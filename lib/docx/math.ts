import {
  Math as WordMath,
  MathAngledBrackets,
  MathCurlyBrackets,
  MathFraction,
  MathIntegral,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSubSuperScript,
  MathSum,
  MathSuperScript,
  TextRun,
  type MathComponent,
  type ParagraphChild,
} from "docx";

export type WordMathWarning = "math_parse_fallback" | "unsupported_math_command";

export type WordTextOptions = {
  font: string;
  size: number;
  bold?: boolean;
  italics?: boolean;
  mathHint?: boolean;
  warnings?: WordMathWarning[];
};

type Segment = { type: "text" | "math"; value: string };

const greek: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", theta: "θ", lambda: "λ", mu: "μ", pi: "π", rho: "ρ", sigma: "σ", phi: "φ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Omega: "Ω",
};

const symbols: Record<string, string> = {
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥", neq: "≠", approx: "≈", infty: "∞",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", cup: "∪", cap: "∩", to: "→", rightarrow: "→", leftarrow: "←", Leftrightarrow: "⇔",
  sin: "sin", cos: "cos", tan: "tan", cot: "cot", log: "log", ln: "ln", max: "max", min: "min", lim: "lim",
};

function balanced(value: string) {
  const stack: string[] = [];
  const pairs: Record<string, string> = { "}": "{", "]": "[", ")": "(" };
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "\\") { index += 1; continue; }
    if ("{[(".includes(character)) stack.push(character);
    if ("}])".includes(character) && stack.pop() !== pairs[character]) return false;
  }
  return stack.length === 0;
}

class LatexMathParser {
  private index = 0;

  constructor(private readonly value: string, private readonly warnings: WordMathWarning[]) {}

  parse(stop?: string): MathComponent[] {
    const components: MathComponent[] = [];
    while (this.index < this.value.length && this.value[this.index] !== stop) {
      const atom = this.atom();
      if (!atom.length) continue;
      let subScript: MathComponent[] | undefined;
      let superScript: MathComponent[] | undefined;
      while (this.value[this.index] === "_" || this.value[this.index] === "^") {
        const marker = this.value[this.index++];
        const script = this.argument();
        if (marker === "_") subScript = script;
        else superScript = script;
      }
      if (subScript && superScript) components.push(new MathSubSuperScript({ children: atom, subScript, superScript }));
      else if (subScript) components.push(new MathSubScript({ children: atom, subScript }));
      else if (superScript) components.push(new MathSuperScript({ children: atom, superScript }));
      else components.push(...atom);
    }
    if (stop && this.value[this.index] === stop) this.index += 1;
    return components;
  }

  private atom(): MathComponent[] {
    const character = this.value[this.index];
    if (!character) return [];
    if (character === "{") { this.index += 1; return this.parse("}"); }
    if (character === "(") { this.index += 1; return [new MathRoundBrackets({ children: this.parse(")") })]; }
    if (character === "[") { this.index += 1; return [new MathSquareBrackets({ children: this.parse("]") })]; }
    if (character === "\\") return this.command();
    const start = this.index;
    let end = this.index + 1;
    while (end < this.value.length && !"\\{}_^()[]".includes(this.value[end])) end += 1;
    this.index = end;
    return [new MathRun(this.value.slice(start, end))];
  }

  private command(): MathComponent[] {
    this.index += 1;
    const escaped = this.value[this.index];
    if (escaped && "{}[]()_|%$#&".includes(escaped)) { this.index += 1; return [new MathRun(escaped)]; }
    const match = this.value.slice(this.index).match(/^[A-Za-z]+/);
    const name = match?.[0] || "";
    this.index += name.length;
    if (!name) return [new MathRun("\\")];
    if (name === "left" || name === "right" || name === "displaystyle") return [];
    if (name === "frac" || name === "dfrac" || name === "tfrac") return [new MathFraction({ numerator: this.argument(), denominator: this.argument() })];
    if (name === "sqrt") {
      this.skipSpaces();
      const degree = this.value[this.index] === "[" ? (this.index += 1, this.parse("]")) : undefined;
      return [new MathRadical({ children: this.argument(), degree })];
    }
    if (name === "sum") return [new MathSum({ children: [new MathRun("")] })];
    if (name === "int") return [new MathIntegral({ children: [new MathRun("")] })];
    if (name === "prod") return [new MathRun("∏")];
    if (name === "vec" || name === "overrightarrow") return [...this.argument(), new MathRun("⃗")];
    if (name === "overline") return [...this.argument(), new MathRun("¯")];
    if (name === "lvert" || name === "rvert" || name === "vert") return [new MathRun("|")];
    if (name === "langle") return [new MathRun("⟨")];
    if (name === "rangle") return [new MathRun("⟩")];
    if (name === "text" || name === "mathrm" || name === "mathbf" || name === "operatorname") return this.argument();
    if (name === "begin") return this.environment();
    if (greek[name]) return [new MathRun(greek[name])];
    if (symbols[name]) return [new MathRun(symbols[name])];
    this.warnings.push("unsupported_math_command");
    return [new MathRun(`\\${name}`)];
  }

  private environment(): MathComponent[] {
    const environment = this.rawGroup();
    const endMarker = `\\end{${environment}}`;
    const end = this.value.indexOf(endMarker, this.index);
    if (end < 0) { this.warnings.push("math_parse_fallback"); return [new MathRun(`\\begin{${environment}}`)]; }
    const body = this.value.slice(this.index, end).replace(/\\\\/g, "; ").replace(/&/g, "  ");
    this.index = end + endMarker.length;
    const children = new LatexMathParser(body, this.warnings).parse();
    if (/matrix|pmatrix|bmatrix/.test(environment)) return [new MathSquareBrackets({ children })];
    if (/cases/.test(environment)) return [new MathCurlyBrackets({ children })];
    return [new MathAngledBrackets({ children })];
  }

  private rawGroup() {
    this.skipSpaces();
    if (this.value[this.index] !== "{") return "";
    const start = ++this.index;
    const end = this.value.indexOf("}", start);
    if (end < 0) { this.index = this.value.length; return this.value.slice(start); }
    this.index = end + 1;
    return this.value.slice(start, end);
  }

  private argument(): MathComponent[] {
    this.skipSpaces();
    if (this.value[this.index] === "{") { this.index += 1; return this.parse("}"); }
    return this.atom();
  }

  private skipSpaces() { while (/\s/.test(this.value[this.index] || "")) this.index += 1; }
}

function stripDelimiters(value: string) {
  let clean = value.trim();
  if (clean.startsWith("$$") && clean.endsWith("$$") && clean.length >= 4) {
    clean = clean.slice(2, -2);
  } else if (clean.startsWith("$") && clean.endsWith("$") && clean.length >= 2) {
    clean = clean.slice(1, -1);
  } else if (
    ((clean.startsWith("\\(") && clean.endsWith("\\)"))
      || (clean.startsWith("\\[") && clean.endsWith("\\]")))
    && clean.length >= 4
  ) {
    clean = clean.slice(2, -2);
  }
  return clean.trim();
}

function likelyStandaloneMath(value: string) {
  const clean = stripDelimiters(value);
  if (!/[=+*/^_<>≤≥√]|\\(?:frac|sqrt|sum|prod|int|begin)/.test(clean)) return false;
  const withoutCommands = clean.replace(/\\[A-Za-z]+/g, "");
  const words = withoutCommands.match(/[A-Za-z]{2,}/g) || [];
  return !words.some((word) => !/^[A-Z]{1,3}$/.test(word) && !/^(sin|cos|tan|cot|log|ln|max|min|lim)$/i.test(word));
}

function mathIntervals(value: string) {
  const intervals: Array<{ start: number; end: number }> = [];
  const equationPattern = /(?:[A-Za-z]\s*=\s*)?(?:\([^()\n]{1,36}\)|[A-Za-z0-9]+)(?:\s*\^\s*\{?-?\d+\}?)?(?:\s*[+\-*/]\s*(?:\([^()\n]{1,36}\)|[A-Za-z0-9]+)(?:\s*\^\s*\{?-?\d+\}?)?)*\s*=\s*-?\d+(?:[.,]\d+)?/g;
  for (const match of value.matchAll(equationPattern)) intervals.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  const allowed = /[A-Za-z0-9\\{}()[\]+\-*/^_=<>≤≥±×÷√∞π∑∏∫.,;:'"|\s]/;
  const triggers = /[=+*/^_<>≤≥√]|\\(?:frac|sqrt|sum|prod|int)/g;
  for (const match of value.matchAll(triggers)) {
    const at = match.index ?? 0;
    let start = at; let end = at + match[0].length;
    while (start > 0 && allowed.test(value[start - 1])) start -= 1;
    while (end < value.length && allowed.test(value[end])) end += 1;
    let candidate = value.slice(start, end);
    const brokenWord = candidate.match(/^\s*[a-z]{2,}\s+/i);
    if (brokenWord && !/^(?:\s*)(?:sin|cos|tan|cot|log|ln|lim)\s+/i.test(candidate)) { start += brokenWord[0].length; candidate = value.slice(start, end); }
    const leftTrim = candidate.length - candidate.trimStart().length;
    const rightTrim = candidate.length - candidate.trimEnd().length;
    start += leftTrim; end -= rightTrim;
    while (/[.,;:]$/.test(value.slice(start, end))) end -= 1;
    if (end > start && likelyStandaloneMath(value.slice(start, end))) intervals.push({ start, end });
  }
  for (const match of value.matchAll(/\b[A-Z][A-Za-z]?\s*\(\s*-?\d+(?:[.,]\d+)?(?:\s*[;,]\s*-?\d+(?:[.,]\d+)?){1,2}\s*\)/g)) {
    intervals.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  return intervals.sort((a, b) => a.start - b.start).reduce<Array<{ start: number; end: number }>>((all, item) => {
    const previous = all.at(-1);
    if (previous && item.start <= previous.end) previous.end = Math.max(previous.end, item.end);
    else all.push({ ...item });
    return all;
  }, []);
}

function splitUnmarked(value: string, mathHint = false): Segment[] {
  if (!value) return [];
  if (mathHint || likelyStandaloneMath(value)) return [{ type: "math", value: stripDelimiters(value) }];
  const intervals = mathIntervals(value);
  if (!intervals.length) return [{ type: "text", value }];
  const segments: Segment[] = []; let cursor = 0;
  for (const interval of intervals) {
    if (interval.start > cursor) segments.push({ type: "text", value: value.slice(cursor, interval.start) });
    segments.push({ type: "math", value: value.slice(interval.start, interval.end) }); cursor = interval.end;
  }
  if (cursor < value.length) segments.push({ type: "text", value: value.slice(cursor) });
  return segments;
}

export function splitWordMathSegments(value: string, mathHint = false): Segment[] {
  const segments: Segment[] = [];
  const delimiter = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
  let cursor = 0;
  for (const match of value.matchAll(delimiter)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push(...splitUnmarked(value.slice(cursor, start), false));
    segments.push({ type: "math", value: String(match[1] ?? match[2] ?? match[3] ?? match[4] ?? "").trim() });
    cursor = start + match[0].length;
  }
  if (cursor < value.length) segments.push(...splitUnmarked(value.slice(cursor), mathHint && cursor === 0));
  return segments.filter((segment) => segment.value.length > 0);
}

export function wordTextChildren(value: string, options: WordTextOptions): ParagraphChild[] {
  const warnings = options.warnings ?? [];
  return splitWordMathSegments(value, options.mathHint).map((segment) => {
    if (segment.type === "text") return new TextRun({ text: segment.value, font: options.font, size: options.size, bold: options.bold, italics: options.italics });
    const formula = stripDelimiters(segment.value);
    if (!formula || !balanced(formula)) {
      warnings.push("math_parse_fallback");
      return new TextRun({ text: formula || segment.value, font: "Cambria Math", size: options.size, bold: options.bold, italics: options.italics });
    }
    try {
      const components = new LatexMathParser(formula, warnings).parse();
      if (!components.length) throw new Error("empty_math");
      return new WordMath({ children: components });
    } catch {
      warnings.push("math_parse_fallback");
      return new TextRun({ text: formula, font: "Cambria Math", size: options.size, bold: options.bold, italics: options.italics });
    }
  });
}
