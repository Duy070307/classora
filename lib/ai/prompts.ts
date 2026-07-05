import type { AIRefinementAction } from "@/lib/ai/types";

const reviewNote =
  "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.";

const baseRules = `Yêu cầu chung:
- Trả lời bằng tiếng Việt.
- Viết theo giọng chuyên nghiệp, thân thiện với giáo viên Việt Nam.
- Tạo nội dung có cấu trúc rõ ràng, dễ copy sang Word.
- Không yêu cầu nhập dữ liệu cá nhân nhạy cảm của học sinh.
- Không tạo đoạn văn bản có bản quyền quá dài.
- Không cam kết độ chính xác tuyệt đối.
- Cuối nội dung chỉ nhắc ngắn gọn: "${reviewNote}"`;

function formatInput(input: unknown) {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}


function examTopicRules(input: unknown) {
  const raw = formatInput(input).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/toan/.test(raw) && /(grade|lop|l?p)[^\n]{0,20}12/.test(raw) && /(xac suat|to hop|probability|thong ke)/.test(raw)) {
    return `
Quy t?c b?t bu?c cho To?n 12 - X?c su?t:
- Ch? t?o c?u h?i x?c su?t/t? h?p/th?ng k?: bi?n c?, kh?ng gian m?u, quy t?c c?ng, quy t?c nh?n, ho?n v?, ch?nh h?p, t? h?p, x?c su?t c? ?i?u ki?n, bi?n c? ??c l?p, r?t th?m, gieo x?c x?c, tung ??ng xu, ch?n h?c sinh, ch?n s?n ph?m, ch?n s?, ch?n th?, h?p bi.
- Kh?ng t?o c?u h?i v? ??o h?m, t?ch ph?n, nguy?n h?m, kh?o s?t h?m s?, ??ng bi?n/ngh?ch bi?n, c?c tr?, ti?m c?n, s? ph?c, vector, m?t ph?ng, h?nh h?c kh?ng gian ho?c l??ng gi?c.
- PH?N I ??ng s? c?u input y?u c?u, m?c ??nh 12 c?u A/B/C/D.
- PH?N II ??ng s? nh?m input y?u c?u, m?c ??nh 4 nh?m, m?i nh?m c? a,b,c,d.
- PH?N III ??ng s? c?u input y?u c?u, m?c ??nh 6 c?u tr? l?i ng?n.
- ??p ?n ph?i kh?p c?u h?i v? kh?ng d?ng placeholder l?p l?i.`;
  }
  return "";
}

function prompt(task: string, input: unknown, structure: string) {
  return `Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam.
Nhiệm vụ: ${task}

Dữ liệu đầu vào:
${formatInput(input)}

Cấu trúc mong muốn:
${structure}

${baseRules}`;
}

export function buildExamPrompt(input: unknown) {
  return prompt(
    "So?n ?? ki?m tra theo ??c tr?ng m?n h?c",
    input,
    `Ch? tr? v? M?T JSON object h?p l?. Kh?ng b?c trong markdown fence. Kh?ng gi?i th?ch ngo?i JSON. Kh?ng nh?t to?n b? ?? v?o m?t chu?i content duy nh?t.

Schema b?t bu?c:
{
  "title": "?? ki?m tra ...",
  "structuredExam": {
    "metadata": {
      "title": "...",
      "examStyle": "...",
      "subject": "...",
      "grade": "...",
      "duration": "...",
      "examCode": "0101",
      "schoolName": "..."
    },
    "parts": [
      {
        "type": "multiple_choice",
        "title": "PH?N I",
        "instruction": "...",
        "questions": [
          {
            "id": "mc-1",
            "part": "multiple_choice",
            "number": 1,
            "stem": "C?u h?i th?c t?, kh?ng ch?a ??p ?n.",
            "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
            "answer": "A",
            "explanation": "Gi?i th?ch ng?n g?n v?i c?u h?i.",
            "score": 0.25,
            "difficulty": "Nh?n bi?t",
            "topic": "..."
          }
        ]
      },
      {
        "type": "true_false",
        "title": "PH?N II",
        "instruction": "...",
        "questions": [
          {
            "id": "tf-1",
            "part": "true_false",
            "number": 1,
            "stem": "Ng? c?nh c?u h?i.",
            "trueFalseItems": [
              { "label": "a", "text": "...", "answer": true },
              { "label": "b", "text": "...", "answer": false },
              { "label": "c", "text": "...", "answer": true },
              { "label": "d", "text": "...", "answer": false }
            ],
            "answer": "a ??ng; b Sai; c ??ng; d Sai",
            "explanation": "Gi?i th?ch ng?n.",
            "score": 1,
            "difficulty": "Th?ng hi?u",
            "topic": "..."
          }
        ]
      },
      {
        "type": "short_answer",
        "title": "PH?N III",
        "instruction": "...",
        "questions": [
          {
            "id": "sa-1",
            "part": "short_answer",
            "number": 1,
            "stem": "C?u tr? l?i ng?n.",
            "answer": "??p ?n c? th?",
            "explanation": "G?i ? ch?m g?n v?i c?u h?i.",
            "score": 0.5,
            "difficulty": "V?n d?ng",
            "topic": "..."
          }
        ]
      }
    ],
    "teacherOnly": {
      "scoringGuide": "...",
      "matrix": "...",
      "specification": "...",
      "notes": "N?i dung l? b?n nh?p h? tr? gi?o vi?n. Gi?o vi?n c?n ki?m tra, ch?nh s?a tr??c khi s? d?ng ch?nh th?c."
    }
  }
}

Y?u c?u ri?ng:
- T?ch tuy?t ??i ?? h?c sinh v? ??p ?n gi?o vi?n: kh?ng ??a ??p ?n/thang ?i?m v?o stem/options.
- N?u l? To?n 12 THPTQG: PH?N I c? 12 c?u A/B/C/D, PH?N II c? 4 nh?m ??ng/sai v?i a,b,c,d, PH?N III c? 6 c?u tr? l?i ng?n, tr? khi input y?u c?u s? kh?c.
- C?u h?i v? ??p ?n ph?i g?n v?i nhau; kh?ng d?ng ??p ?n placeholder l?p l?i.
- Kh?ng d?ng markdown table separator trong tr??ng c?u h?i.
${examTopicRules(input)}`
  );
}

export function buildWorksheetPrompt(input: unknown) {
  return prompt(
    "Soạn phiếu học tập",
    input,
    `PHIẾU HỌC TẬP
- Thông tin bài học.
- Mục tiêu.
- Kiến thức cần nhớ.
- Bài tập cơ bản.
- Bài tập vận dụng.
- Hướng dẫn/đáp án dành cho giáo viên.`
  );
}

export function buildLessonPlanPrompt(input: unknown) {
  return prompt(
    "Soạn kế hoạch bài dạy",
    input,
    `KẾ HOẠCH BÀI DẠY
- Thông tin bài học.
- Mục tiêu.
- Học liệu.
- Tiến trình hoạt động: mở đầu, hình thành kiến thức, luyện tập, vận dụng.
- Đánh giá.
- Điều chỉnh sau bài dạy.`
  );
}

export function buildStudentCommentsPrompt(input: unknown) {
  return prompt(
    "Viết nhận xét học sinh",
    input,
    `- Điểm mạnh.
- Điểm cần cải thiện.
- Hành động tiếp theo.
- Nhận xét hoàn chỉnh.
- Có thể thêm phiên bản ngắn, trang trọng và thân thiện gửi phụ huynh.`
  );
}

export function buildBulkStudentCommentsPrompt(input: unknown) {
  return prompt(
    "Viết nhận xét học sinh hàng loạt",
    input,
    `- Mỗi học sinh có nhận xét riêng.
- Ngôn ngữ tự nhiên, tích cực, không phán xét.
- Có điểm mạnh, điểm cần cải thiện và gợi ý hành động tiếp theo.`
  );
}

export function buildParentMessagePrompt(input: unknown) {
  return prompt(
    "Soạn tin nhắn gửi phụ huynh",
    input,
    `- Phiên bản ngắn.
- Phiên bản đầy đủ.
- Giọng văn lịch sự, rõ ràng, tôn trọng.
- Tránh quy kết hoặc gây áp lực không cần thiết.`
  );
}

export function buildRubricPrompt(input: unknown) {
  return prompt(
    "Tạo rubric đánh giá",
    input,
    `- Thông tin nhiệm vụ.
- Bảng tiêu chí, mức đánh giá và điểm.
- Hướng dẫn chấm.
- Gợi ý nhận xét.
Hãy dùng bảng Markdown sạch để hệ thống chuyển thành bảng Word/PDF.`
  );
}

export function buildGenericPrompt(tool: string, input: unknown) {
  return prompt(tool, input, "Các phần có tiêu đề rõ ràng, nội dung ngắn gọn, dễ kiểm tra và dễ xuất Word/PDF.");
}

const refinementInstructions: Record<AIRefinementAction, string> = {
  regenerate: "Tạo lại một phiên bản khác nhưng giữ mục tiêu và dữ liệu đầu vào.",
  shorter: "Rút gọn nội dung, giữ ý chính.",
  "more-detailed": "Bổ sung chi tiết, ví dụ và hướng dẫn hữu ích.",
  simpler: "Diễn đạt dễ hiểu hơn, dùng câu ngắn và từ ngữ phổ thông.",
  "more-formal": "Điều chỉnh sang văn phong trang trọng, chuẩn mực.",
  easier: "Giảm độ khó, phù hợp học sinh cần hỗ trợ.",
  harder: "Tăng độ khó và mức vận dụng nhưng vẫn bám sát dữ liệu đầu vào.",
};

export function buildPrompt(tool: string, input: unknown, action?: AIRefinementAction, currentContent?: string) {
  const builders: Record<string, (value: unknown) => string> = {
    exam: buildExamPrompt,
    "exam-generator": buildExamPrompt,
    worksheet: buildWorksheetPrompt,
    "worksheet-generator": buildWorksheetPrompt,
    "lesson-plan": buildLessonPlanPrompt,
    "lesson-plan-generator": buildLessonPlanPrompt,
    "student-comments": buildStudentCommentsPrompt,
    "bulk-student-comments": buildBulkStudentCommentsPrompt,
    rubric: buildRubricPrompt,
    "rubric-generator": buildRubricPrompt,
    "parent-message": buildParentMessagePrompt,
    "parent-message-generator": buildParentMessagePrompt,
  };
  const base = (builders[tool] ?? ((value) => buildGenericPrompt(tool, value)))(input);
  if (!action) return base;
  return `${base}

Yêu cầu tinh chỉnh: ${refinementInstructions[action]}
Nội dung hiện tại:
${currentContent || "(chưa có; hãy tạo mới từ dữ liệu đầu vào)"}`;
}
