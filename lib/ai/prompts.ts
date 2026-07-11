import type { AIRefinementAction } from "@/lib/ai/types";
import { buildCurriculumPromptRules } from "@/lib/curriculum";
import { createGenerationRequestContext } from "@/lib/generation/request-context";
import { findTopicNode } from "@/lib/generation/topic-taxonomy";

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
  const record = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const context = createGenerationRequestContext(record, task);
  const topicNode = context.topic ? findTopicNode(context.subject, context.grade, context.topic) : undefined;
  const fidelityRules = context.topic ? `
RÀNG BUỘC BÁM SÁT CHỦ ĐỀ:
- Môn học: ${context.subject}
- Lớp: ${context.grade}
- Chủ đề bắt buộc: ${context.topic}
- Bộ sách/định hướng: ${context.bookSeries || "Theo dữ liệu giáo viên cung cấp"}
- Loại nội dung: ${context.questionType || task}
- Chỉ tạo nội dung thuộc đúng chủ đề “${context.topic}” của môn ${context.subject}, lớp ${context.grade}. Không đưa kiến thức từ chương, chủ đề hoặc môn học khác.
- Không dùng ví dụ ngoài phạm vi nếu ví dụ đó đòi hỏi kiến thức chưa thuộc chủ đề.
- ${context.allowRelatedTopics ? "Chỉ được mở rộng sang các chủ đề con/liên quan đã xác định và phải ghi rõ." : "Không mở rộng sang chủ đề liên quan."}
${topicNode?.allowedTerms.length ? `- Khái niệm trọng tâm: ${topicNode.allowedTerms.join(", ")}.` : ""}
${topicNode?.forbiddenTerms.length ? `- Không sử dụng các khái niệm ngoài phạm vi: ${topicNode.forbiddenTerms.join(", ")}.` : ""}
- Nếu không đủ thông tin để tạo nội dung đúng chủ đề, trả về trạng thái không đủ dữ liệu thay vì tạo nội dung không liên quan.
- Trước khi trả kết quả, tự kiểm tra từng mục: đúng môn, đúng lớp, đúng chủ đề, không chứa khái niệm ngoài phạm vi và đúng loại nội dung.
- Không tạo câu hỏi chung chung kiểu “Phát biểu nào đúng về nội dung bài học?”; mỗi mục phải kiểm tra một khái niệm cụ thể.
- Với câu hỏi, đáp án và lời giải phải cùng bám sát chủ đề. Với giáo án/phiếu học tập, mục tiêu, hoạt động, đánh giá và bài tập đều phải cùng bám sát chủ đề.
` : "";
  return `Bạn là trợ lý soạn tài liệu cho giáo viên Việt Nam.
Nhiệm vụ: ${task}

Dữ liệu đầu vào:
${formatInput(input)}

Định hướng nội dung:
${buildCurriculumPromptRules(input)}

${fidelityRules}

Cấu trúc mong muốn:
${structure}

${baseRules}`;
}

export function buildExamPrompt(input: unknown) {
  const examInput = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const requestedCount = Number(examInput.multipleChoiceCount ?? 0) + Number(examInput.trueFalseCount ?? 0) + Number(examInput.shortAnswerCount ?? 0) + Number(examInput.essayCount ?? 0);
  const rates = [Number(examInput.recognitionRate ?? 30), Number(examInput.understandingRate ?? 40), Number(examInput.applicationRate ?? 20), Number(examInput.advancedRate ?? 10)];
  const rateTotal = rates.reduce((sum, value) => sum + Math.max(0, value), 0) || 100;
  const rawTargets = rates.map((value) => requestedCount * Math.max(0, value) / rateTotal);
  const targets = rawTargets.map(Math.floor);
  for (let remainder = requestedCount - targets.reduce((sum, value) => sum + value, 0); remainder > 0; remainder -= 1) {
    const index = rawTargets.map((value, itemIndex) => ({ itemIndex, fraction: value - targets[itemIndex] })).sort((a, b) => b.fraction - a.fraction)[0].itemIndex;
    targets[index] += 1;
    rawTargets[index] = targets[index];
  }
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
- Bạn phải tạo đủ chính xác ${requestedCount} câu hỏi theo số lượng từng phần trong dữ liệu đầu vào. Không được tự rút gọn còn 1–2 câu.
- PHẦN I phải có đúng ${Number(examInput.multipleChoiceCount ?? 0)} câu trắc nghiệm A/B/C/D; PHẦN II đúng ${Number(examInput.trueFalseCount ?? 0)} câu, mỗi câu có bốn ý a/b/c/d kèm đúng-sai; PHẦN III đúng ${Number(examInput.shortAnswerCount ?? 0)} câu trả lời ngắn có đáp án và giải thích. Không được bỏ PHẦN III.
- Phân bố mức độ sau khi chuẩn hóa và làm tròn phải có tổng đúng ${requestedCount}: Nhận biết ${targets[0]}, Thông hiểu ${targets[1]}, Vận dụng ${targets[2]}, Vận dụng cao ${targets[3]}.
- Không lặp cùng stem hoặc cùng biểu thức/hàm số quá một lần. Với Toán 12 chủ đề hàm số, phân tán câu hỏi qua tập xác định, đạo hàm, đơn điệu, cực trị, GTLN/GTNN, tiệm cận, bảng biến thiên, đồ thị, tương giao và hàm mũ/logarit khi phù hợp.
- Mỗi câu phải đúng môn ${String(examInput.subject || "")}, lớp ${String(examInput.grade || "")}, chủ đề “${String(examInput.topic || "")}”. Nếu chủ đề chưa có trong danh mục, bám sát nguyên văn chủ đề giáo viên nhập và không tự đổi sang chương khác.
- Không tạo câu hỏi meta/chung chung kiểu “kiến thức nào thuộc chủ đề”; phải dùng dữ kiện hoặc khái niệm cụ thể.
- Mỗi câu hỏi phải tự khai báo thêm các trường kiểm tra: "subject", "grade", "topic", "relevanceReason", "confidence" (high/medium/low) và "conceptsUsed" (mảng khái niệm). Các trường này phục vụ kiểm tra nội bộ; nội dung thực tế của câu hỏi vẫn nằm trong stem/options/answer/explanation.
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
    "Soạn kế hoạch bài dạy dạng bản nháp tham khảo",
    input,
    `KẾ HOẠCH BÀI DẠY - BẢN NHÁP THAM KHẢO

Yêu cầu bắt buộc:
- Đặt giáo án là tài liệu tham khảo/bản nháp, không viết như tài liệu chính thức đã được chứng nhận.
- Dùng bối cảnh giáo dục Việt Nam, phù hợp môn học, lớp, chủ đề và thời lượng.
- Nếu người dùng cung cấp "Yêu cầu cần đạt / chuẩn chương trình", ưu tiên nội dung đó.
- Nếu chưa có yêu cầu cần đạt, viết "Gợi ý yêu cầu cần đạt tham khảo" và nhắc giáo viên kiểm tra theo chương trình chính thức.
- Không bịa mã chương trình/chứng nhận chính thức nếu người dùng không cung cấp.
- Mục tiêu phải đo được, tránh động từ mơ hồ như "hiểu", "nắm được", "biết được"; hãy chuyển thành động từ đo được.

Cấu trúc đầu ra:
I. THÔNG TIN BÀI HỌC
- Môn học
- Lớp
- Chủ đề/Bài học
- Thời lượng
- Định hướng sử dụng: bản nháp tham khảo, giáo viên cần điều chỉnh theo lớp học và chương trình.

II. MỤC TIÊU BÀI HỌC
- Yêu cầu cần đạt tham khảo
- Năng lực đặc thù
- Năng lực chung
- Phẩm chất
- Mục tiêu cụ thể theo thang Bloom

Với mục tiêu Bloom, tạo 3-6 mục tiêu cụ thể, đo được. Chọn động từ phù hợp:
- Nhớ: nêu được, kể tên được, nhận biết được, liệt kê được, xác định được.
- Hiểu: trình bày được, mô tả được, giải thích được, phân biệt được, tóm tắt được.
- Vận dụng: vận dụng được, thực hiện được, giải quyết được, tính được, sử dụng được.
- Phân tích: phân tích được, so sánh được, chỉ ra được, phân loại được, nhận xét được.
- Đánh giá: đánh giá được, lựa chọn được, bảo vệ được ý kiến, nhận định được, phản biện được.
- Sáng tạo: thiết kế được, xây dựng được, đề xuất được, tạo ra được, lập kế hoạch được.

III. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU

IV. TIẾN TRÌNH DẠY HỌC
1. Khởi động
2. Hình thành kiến thức
3. Luyện tập
4. Vận dụng
5. Củng cố/Dặn dò

Với mỗi hoạt động ghi rõ:
- Mục tiêu hoạt động
- Thời lượng
- Hoạt động của giáo viên
- Hoạt động của học sinh
- Sản phẩm dự kiến
- Cách đánh giá

V. LƯU Ý CHUYÊN MÔN
- Các điểm dễ nhầm
- Gợi ý điều chỉnh theo lớp học
- Lưu ý an toàn nếu có thí nghiệm

VI. GHI CHÚ RÀ SOÁT
- Giáo viên cần kiểm tra lại tính chính xác, đáp án, số liệu, thí nghiệm và yêu cầu chương trình trước khi sử dụng.

Nếu là Vật lí/Khoa học với chủ đề điện, quang học, sóng, cơ học:
- Có giải thích khái niệm cốt lõi.
- Có lỗi hiểu nhầm thường gặp.
- Có gợi ý minh họa/thí nghiệm đơn giản nếu phù hợp.
- Có lưu ý an toàn khi dùng thiết bị, điện, nhiệt, ánh sáng mạnh hoặc hóa chất.`
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
