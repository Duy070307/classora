export type DocumentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "table"; rows: string[][] };

const headingPattern = /^(#{1,3}\s+|PHIẾU HỌC TẬP|KẾ HOẠCH BÀI DẠY|NHẬN XÉT|RUBRIC ĐÁNH GIÁ|TIN NHẮN GỬI PHỤ HUYNH|HOẠT ĐỘNG LỚP HỌC|BÀI TẬP PHÂN HÓA|TÓM TẮT BÀI HỌC|SƠ ĐỒ TƯ DUY|I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|HOẠT ĐỘNG \d+|ĐIỂM MẠNH|ĐIỂM CẦN CẢI THIỆN|GỢI Ý HỖ TRỢ|NHẬN XÉT HOÀN CHỈNH|PHẦN DÀNH CHO GIÁO VIÊN)/i;

function isDivider(row: string[]) {
  return row.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTableLine(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

export function parseDocumentContent(content: string): DocumentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: DocumentBlock[] = [];
  for (let index = 0; index < lines.length;) {
    const trimmed = lines[index].trim();
    if (!trimmed) {
      index += 1;
      continue;
    }
    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const row = parseTableLine(lines[index]);
        if (!isDivider(row)) rows.push(row);
        index += 1;
      }
      if (rows.length) blocks.push({ type: "table", rows });
      continue;
    }
    const text = trimmed.replace(/^#{1,3}\s+/, "");
    if (headingPattern.test(trimmed)) blocks.push({ type: "heading", text });
    else if (/^[-*•]\s+/.test(trimmed)) blocks.push({ type: "bullet", text: trimmed.replace(/^[-*•]\s+/, "") });
    else blocks.push({ type: "paragraph", text });
    index += 1;
  }
  return blocks;
}
