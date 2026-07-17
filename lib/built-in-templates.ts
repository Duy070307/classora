import type { TemplateItem } from "@/lib/templates";

export type BuiltInTemplate = TemplateItem & {
  builtIn: true;
  tools: string[];
};

const now = "built-in";

export const builtInTemplates: BuiltInTemplate[] = [
  {
    id: "builtin-exam-basic",
    builtIn: true,
    name: "Mẫu đề kiểm tra cơ bản",
    type: "Đề kiểm tra",
    tools: ["exam", "exam-shuffler"],
    notes: "Mẫu đề kiểm tra có header, dòng thông tin học sinh, hướng dẫn và phần giáo viên.",
    updatedAt: now,
    content: `{{ten_truong}}
Tổ/Bộ môn: {{to_bo_mon}}
Giáo viên: {{ten_giao_vien}}
Năm học: {{nam_hoc}}

ĐỀ KIỂM TRA
Môn: {{mon_hoc}} - Lớp: {{lop}}
Thời gian làm bài: {{thoi_gian}}
Chủ đề: {{chu_de}}

Họ và tên học sinh: ........................................................
Lớp: .........................................................................

HƯỚNG DẪN LÀM BÀI
- Đọc kỹ đề trước khi làm bài.
- Trình bày rõ ràng, sạch đẹp; phần tự luận cần nêu đủ bước.
- Không sử dụng tài liệu nếu giáo viên không cho phép.

BẢN DÀNH CHO HỌC SINH
{{noi_dung}}

PHẦN DÀNH CHO GIÁO VIÊN
Đáp án:
{{dap_an}}

Thang điểm:
{{thang_diem}}

Ma trận:
{{ma_tran}}

Ghi chú:
{{ghi_chu}}

--- HẾT ---`
  },
  {
    id: "builtin-answer-key",
    builtIn: true,
    name: "Mẫu đáp án và thang điểm",
    type: "Đáp án và thang điểm",
    tools: ["answer-key", "exam"],
    notes: "Mẫu dành cho đáp án, lời giải và hướng dẫn chấm.",
    updatedAt: now,
    content: `{{ten_truong}}
Giáo viên: {{ten_giao_vien}} - Năm học: {{nam_hoc}}

ĐÁP ÁN VÀ THANG ĐIỂM
Môn: {{mon_hoc}} - Lớp: {{lop}}
Chủ đề: {{chu_de}}

I. BẢNG ĐÁP ÁN
{{dap_an}}

II. LỜI GIẢI / HƯỚNG DẪN CHẤM CHI TIẾT
{{noi_dung}}

III. THANG ĐIỂM
{{thang_diem}}

IV. LƯU Ý KHI CHẤM
{{ghi_chu}}`
  },
  {
    id: "builtin-matrix",
    builtIn: true,
    name: "Mẫu ma trận đề",
    type: "Ma trận đề",
    tools: ["matrix", "exam"],
    notes: "Mẫu trình bày ma trận theo chủ đề, mức độ, số câu, điểm và tỉ lệ.",
    updatedAt: now,
    content: `{{ten_truong}}
Tổ/Bộ môn: {{to_bo_mon}}

MA TRẬN ĐỀ
Môn: {{mon_hoc}} - Lớp: {{lop}}
Chủ đề: {{chu_de}}
Thời gian: {{thoi_gian}}

| Nội dung/chủ đề | Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao | Tổng số câu | Tổng điểm | Tỉ lệ |
|---|---:|---:|---:|---:|---:|---:|---:|
{{ma_tran}}

Ghi chú:
{{ghi_chu}}

{{noi_dung}}`
  },
  {
    id: "builtin-lesson-plan",
    builtIn: true,
    name: "Mẫu giáo án cơ bản",
    type: "Giáo án",
    tools: ["lesson-plan"],
    notes: "Mẫu giáo án theo tiến trình dạy học phổ biến.",
    updatedAt: now,
    content: `{{ten_truong}}
Giáo viên: {{ten_giao_vien}} - Tổ/Bộ môn: {{to_bo_mon}}
Năm học: {{nam_hoc}}

GIÁO ÁN
Tên bài học / chủ đề: {{chu_de}}
Môn: {{mon_hoc}} - Lớp: {{lop}} - Thời lượng: {{thoi_gian}}

I. MỤC TIÊU
{{noi_dung}}

II. CHUẨN BỊ
- Giáo viên: tài liệu, học liệu, phương tiện dạy học phù hợp.
- Học sinh: sách vở, đồ dùng học tập và nhiệm vụ chuẩn bị trước.

III. PHƯƠNG PHÁP
- Gợi mở, thảo luận, luyện tập cá nhân/nhóm, phản hồi nhanh.

IV. TIẾN TRÌNH DẠY HỌC
Hoạt động 1: Mở đầu
Hoạt động 2: Hình thành kiến thức
Hoạt động 3: Luyện tập
Hoạt động 4: Vận dụng

V. ĐÁNH GIÁ
{{ghi_chu}}`
  },
  {
    id: "builtin-worksheet",
    builtIn: true,
    name: "Mẫu phiếu học tập",
    type: "Phiếu học tập",
    tools: ["worksheet"],
    notes: "Mẫu phiếu có dòng tên/lớp, mục tiêu, bài tập và đáp án giáo viên.",
    updatedAt: now,
    content: `{{ten_truong}}

PHIẾU HỌC TẬP
Môn: {{mon_hoc}} - Lớp: {{lop}}
Chủ đề: {{chu_de}}

Họ và tên: ....................................  Lớp: ......................

MỤC TIÊU HỌC TẬP
{{ghi_chu}}

NỘI DUNG PHIẾU
{{noi_dung}}

KHU VỰC HỌC SINH TRẢ LỜI
................................................................................
................................................................................
................................................................................

ĐÁP ÁN DÀNH CHO GIÁO VIÊN
{{dap_an}}`
  }
];

export function getBuiltInTemplatesForType(type: string) {
  return builtInTemplates.filter((template) => template.type === type);
}

export function getBuiltInTemplatesForTool(tool: string) {
  return builtInTemplates.filter((template) => template.tools.includes(tool));
}

export function getBuiltInTemplate(id: string) {
  return builtInTemplates.find((template) => template.id === id);
}
