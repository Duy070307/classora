export const BOOK_SERIES_OPTIONS = [
  "Kết nối tri thức",
  "Chân trời sáng tạo",
  "Cánh diều",
  "Không chọn",
] as const;

export const DEFAULT_BOOK_SERIES = "Kết nối tri thức";

export const BOOK_SERIES_HELPER_TEXT =
  "Soạn Lab sẽ ưu tiên cấu trúc kiến thức và cách diễn đạt phù hợp với bộ sách đã chọn. Nội dung vẫn là bản nháp tham khảo và cần giáo viên rà soát.";

export const KNTT_SOURCE_NOTE =
  "Nội dung được tạo theo định hướng bộ sách Kết nối tri thức và chỉ là bản nháp tham khảo. Thầy cô cần đối chiếu lại với SGK, chương trình chính thức và yêu cầu của nhà trường trước khi sử dụng.";

export function getBookSeries(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || DEFAULT_BOOK_SERIES;
}

export function isKntt(value: unknown) {
  return getBookSeries(value) === "Kết nối tri thức";
}

export function buildSourceAlignmentNote(input: Record<string, unknown>) {
  return isKntt(input.bookSeries) ? KNTT_SOURCE_NOTE : "";
}

export function withSourceAlignmentNote(content: string, input: Record<string, unknown>) {
  const note = buildSourceAlignmentNote(input);
  if (!note || content.includes(note)) return content;
  return `${content.trim()}\n\nGHI CHÚ ĐỊNH HƯỚNG NỘI DUNG\n${note}`;
}

export function buildCurriculumPromptRules(input: unknown) {
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const bookSeries = getBookSeries(data.bookSeries);
  if (bookSeries !== "Kết nối tri thức") {
    return `Định hướng bộ sách: ${bookSeries}. Nếu thiếu dữ liệu chính xác, chỉ tạo nội dung tham khảo theo môn, lớp và chủ đề; không khẳng định là nội dung chính thức.`;
  }

  return `Định hướng bộ sách: Kết nối tri thức với cuộc sống.
- Ưu tiên bám theo mạch kiến thức, thuật ngữ và mức độ phù hợp với bộ sách Kết nối tri thức với cuộc sống.
- Không chép nguyên văn nội dung SGK.
- Không bịa số trang, tên bài, mã bài nếu không có dữ liệu đầu vào.
- Nếu thiếu thông tin chính xác, tạo nội dung tham khảo theo chủ đề, lớp, môn và ghi rõ cần giáo viên kiểm tra.
- Ưu tiên câu hỏi lý thuyết ngắn gọn, đúng trọng tâm, phù hợp kiểm tra kiến thức nền.
- Với Vật lí/Hóa học, ưu tiên khái niệm, định luật, hiện tượng, bản chất, nhận biết, giải thích hiện tượng thực tế, an toàn thí nghiệm nếu có và lỗi sai thường gặp.`;
}
