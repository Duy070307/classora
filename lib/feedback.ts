export const FEEDBACK_CATEGORIES = [
  "Lỗi khi sử dụng",
  "Nội dung chưa chính xác",
  "Giao diện khó dùng",
  "Xuất Word/PDF bị lỗi",
  "Công cụ cần cải thiện",
  "Đề xuất tính năng",
  "Khác",
] as const;

export const FEEDBACK_RATING_LABELS = [
  "Rất khó dùng",
  "Chưa ổn",
  "Tạm được",
  "Khá tốt",
  "Rất hữu ích",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type FeedbackPayload = {
  category: string;
  tool: string;
  rating?: number | null;
  message: string;
  contact?: string;
  path?: string;
  pageTitle?: string;
  userAgent?: string;
};

export function detectToolFromPath(pathname: string) {
  if (pathname.startsWith("/tools/exam-generator")) return "Soạn đề kiểm tra";
  if (pathname.startsWith("/tools/worksheet-generator")) return "Phiếu học tập";
  if (pathname.startsWith("/tools/lesson-plan-generator")) return "Giáo án";
  if (pathname.startsWith("/tools/student-comments")) return "Nhận xét học sinh";
  if (pathname.startsWith("/tools/bulk-student-comments")) return "Nhận xét học sinh hàng loạt";
  if (pathname.startsWith("/tools/parent-message-generator")) return "Tin nhắn phụ huynh";
  if (pathname.startsWith("/tools/rubric-generator")) return "Rubric";
  if (pathname.startsWith("/tools/import-questions")) return "Nhập câu hỏi";
  if (pathname.startsWith("/tools/image-to-latex")) return "Ảnh công thức / hình học → LaTeX/TikZ";
  if (pathname.startsWith("/tools/3d-animation")) return "Tạo mô phỏng 3D";
  if (pathname.startsWith("/question-bank")) return "Ngân hàng câu hỏi";
  if (pathname.startsWith("/history")) return "Lịch sử";
  if (pathname.startsWith("/templates")) return "Mẫu cá nhân";
  if (pathname.startsWith("/data")) return "Dữ liệu";
  if (pathname.startsWith("/settings")) return "Cài đặt";
  if (pathname.startsWith("/admin")) return "Quản trị";
  if (pathname.startsWith("/create")) return "Tạo mới";
  if (pathname.startsWith("/tools")) return "Công cụ";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "Khác";
}

export function validateFeedbackPayload(input: unknown): { ok: true; data: FeedbackPayload } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Dữ liệu góp ý chưa hợp lệ." };
  const body = input as Record<string, unknown>;
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const tool = typeof body.tool === "string" ? body.tool.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const path = typeof body.path === "string" ? body.path.trim() : "";
  const pageTitle = typeof body.pageTitle === "string" ? body.pageTitle.trim() : "";
  const userAgent = typeof body.userAgent === "string" ? body.userAgent.trim() : "";
  const rating = typeof body.rating === "number" && Number.isFinite(body.rating) ? body.rating : null;

  if (!category) return { ok: false, error: "Vui lòng chọn loại góp ý." };
  if (!message) return { ok: false, error: "Vui lòng nhập nội dung góp ý." };
  if (message.length > 3000) return { ok: false, error: "Nội dung góp ý quá dài. Vui lòng rút ngắn lại." };
  if (contact.length > 300) return { ok: false, error: "Thông tin liên hệ quá dài. Vui lòng rút ngắn lại." };
  if (tool.length > 200) return { ok: false, error: "Tên công cụ quá dài." };
  if (path.length > 500) return { ok: false, error: "Đường dẫn trang quá dài." };
  if (rating !== null && (rating < 1 || rating > 5)) return { ok: false, error: "Mức độ hài lòng chưa hợp lệ." };

  return {
    ok: true,
    data: {
      category,
      tool: tool || "Khác",
      rating,
      message,
      contact,
      path,
      pageTitle: pageTitle.slice(0, 200),
      userAgent: userAgent.slice(0, 500),
    },
  };
}
