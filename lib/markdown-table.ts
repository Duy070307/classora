export type ParsedMarkdownTable = {
  headers: string[];
  rows: string[][];
};

export type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "table"; table: ParsedMarkdownTable };

function cells(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function isSeparator(line: string) {
  const values = cells(line);
  return values.length > 0 && values.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseSimpleMarkdownTable(lines: string[]): ParsedMarkdownTable | null {
  if (lines.length < 2 || !lines[0].trim().startsWith("|") || !isSeparator(lines[1])) return null;
  const headers = cells(lines[0]);
  const rows = lines.slice(2).filter((line) => line.trim().startsWith("|")).map(cells);
  if (!headers.length || rows.some((row) => row.length !== headers.length)) return null;
  return { headers, rows };
}

export function splitMarkdownTables(text: string): MarkdownBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  const flushParagraph = () => {
    const value = paragraphLines.join("\n").trim();
    if (value) blocks.push({ type: "paragraph", text: value });
    paragraphLines = [];
  };
  for (let index = 0; index < lines.length;) {
    if (lines[index].trim().startsWith("|") && index + 1 < lines.length && isSeparator(lines[index + 1])) {
      const tableLines: string[] = [];
      let cursor = index;
      while (cursor < lines.length && lines[cursor].trim().startsWith("|")) tableLines.push(lines[cursor++]);
      const table = parseSimpleMarkdownTable(tableLines);
      if (table) {
        flushParagraph();
        blocks.push({ type: "table", table });
        index = cursor;
        continue;
      }
    }
    paragraphLines.push(lines[index]);
    index += 1;
  }
  flushParagraph();
  return blocks;
}
