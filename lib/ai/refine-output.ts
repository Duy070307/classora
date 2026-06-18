import type { AIRefinementAction } from "@/lib/ai/types";

function shorten(content: string) {
  const lines = content.split("\n");
  const kept = lines.filter((line, index) => {
    const trimmed = line.trim();
    return !trimmed || index < 3 || /^(#|[IVX]+\.|PHẦN|ĐÁP ÁN|THANG ĐIỂM|MỤC TIÊU)/i.test(trimmed) || index % 2 === 0;
  });
  return `${kept.join("\n").trim()}\n\n[Ghi chú mô phỏng: nội dung đã được rút gọn.]`;
}

export function refineOutput(content: string, action: AIRefinementAction): string {
  if (action === "shorter") return shorten(content);

  const notes: Record<Exclude<AIRefinementAction, "shorter">, string> = {
    regenerate: "Đây là phiên bản mô phỏng được tạo lại; giáo viên có thể tiếp tục chỉnh sửa.",
    "more-detailed": "Đã bổ sung định hướng giải thích, ví dụ minh họa và tiêu chí kiểm tra chi tiết hơn.",
    simpler: "Đã điều chỉnh cách diễn đạt theo hướng câu ngắn, rõ ý và dễ hiểu hơn.",
    "more-formal": "Đã điều chỉnh văn phong theo hướng trang trọng, chuẩn mực và nhất quán.",
    easier: "Đã giảm mức độ yêu cầu, ưu tiên nhiệm vụ cơ bản và có gợi ý hỗ trợ.",
    harder: "Đã tăng yêu cầu vận dụng, lập luận và mức độ thử thách."
  };

  const marker = action === "regenerate" ? "PHIÊN BẢN TẠO LẠI" : "TINH CHỈNH NỘI DUNG";
  return `${marker}\n\n${content.trim()}\n\nLƯU Ý TINH CHỈNH\n${notes[action]}`;
}
