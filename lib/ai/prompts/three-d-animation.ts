export type ThreeDAnimationPromptInput = {
  prompt: string;
  subject?: string;
  grade?: string;
  objective?: string;
  style?: string;
};

export function buildThreeDAnimationPrompt(input: ThreeDAnimationPromptInput) {
  return `Bạn đang tạo một mô phỏng 3D giáo dục an toàn cho giáo viên Việt Nam.

Trả về JSON thuần, không markdown fence, theo schema:
{
  "title": "Tên mô phỏng",
  "description": "Mô tả ngắn",
  "html": "Tài liệu HTML hoàn chỉnh",
  "notes": ["Ghi chú sử dụng"],
  "warnings": ["Cảnh báo nếu mô hình chỉ gần đúng"]
}

Yêu cầu HTML:
- "html" phải là một file HTML độc lập đầy đủ: <!doctype html>, html, head, body, style, script.
- Dùng Three.js từ CDN chính thức/ổn định: https://unpkg.com/three@0.160.0/build/three.min.js hoặc https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js.
- Không dùng external API ngoài CDN Three.js.
- Không tracking, không fetch, không XMLHttpRequest, không gửi dữ liệu.
- Không dùng ảnh ngoài, iframe, embed, object, form.
- Không dùng eval, Function, document.cookie, localStorage, sessionStorage, window.top, window.parent.
- Giữ animation nhẹ, không tạo object mới liên tục trong animation loop.
- Dùng hình học đơn giản: sphere, cube, cone, cylinder, torus, line, curve.
- Thêm chú thích/comment tiếng Việt trong code.
- Dùng nhãn giáo dục khi hữu ích, có thể dùng HTML overlay trong chính file.
- Màu trung tính, dễ nhìn, không quá rực.
- Nếu đơn giản, thêm thanh tốc độ và nút đặt lại/chạy lại trong preview.

Yêu cầu giáo dục:
- Ưu tiên minh họa ý tưởng, rõ ràng hơn là đẹp mắt.
- Nếu nội dung khoa học, mô hình có thể gần đúng; thêm warning phù hợp.
- Không tự bịa số đo chính xác nếu người dùng không cung cấp.
- Không hứa chính xác tuyệt đối.

Thông tin yêu cầu:
- Mô tả: ${input.prompt}
- Môn học: ${input.subject || "Không nêu"}
- Lớp: ${input.grade || "Không nêu"}
- Mục tiêu minh họa: ${input.objective || "Không nêu"}
- Phong cách hiển thị: ${input.style || "Đơn giản"}`;
}
