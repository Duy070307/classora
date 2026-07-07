import { normalizeMathSymbols } from "@/lib/content/math-symbol-normalize";

export function stripMarkdownSyntax(value: string) {
  return value
    .replace(/```(?:\w+)?\s*([\s\S]*?)```/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/^\s*[•]\s+/gm, "- ")
    .replace(/\r\n/g, "\n");
}

export function normalizeEducationalContent(value: string) {
  return stripMarkdownSyntax(normalizeMathSymbols(value))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function normalizeGeneratedDocument<T extends { content: string; title?: string }>(document: T): T {
  return {
    ...document,
    title: document.title ? normalizeMathSymbols(document.title) : document.title,
    content: normalizeEducationalContent(document.content),
  };
}
