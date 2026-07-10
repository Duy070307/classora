export type PublicBetaPreset = {
  title: string;
  description: string;
  href: string;
  tool: "exam" | "lesson-plan";
  values: Record<string, string | number | boolean>;
};

function withQuery(href: string, values: Record<string, string | number | boolean>) {
  const params = new URLSearchParams();
  params.set("preset", "public-beta");
  Object.entries(values).forEach(([key, value]) => params.set(key, String(value)));
  return `${href}?${params.toString()}`;
}

export const publicBetaPresets: PublicBetaPreset[] = [
  {
    title: "Toán 12 - Xác suất",
    description: "Tạo bản nháp đề trắc nghiệm theo nguồn câu hỏi Soạn Lab và ngân hàng cá nhân.",
    tool: "exam",
    href: withQuery("/tools/exam-generator", {
      subject: "Toán",
      grade: "12",
      topic: "Xác suất",
      bookSeries: "Kết nối tri thức",
      examType: "Trắc nghiệm",
      bankSource: "both",
      useBank: true,
      multipleChoiceCount: 12,
      trueFalseCount: 0,
      shortAnswerCount: 0,
    }),
    values: {},
  },
  {
    title: "Vật lí 11 - Định luật Ohm",
    description: "Thử tạo đề kiểm tra nhanh từ Ngân hàng Soạn Lab.",
    tool: "exam",
    href: withQuery("/tools/exam-generator", {
      subject: "Vật lí",
      grade: "11",
      topic: "Định luật Ohm",
      bookSeries: "Kết nối tri thức",
      bankSource: "system",
      bankCount: 10,
      useBank: true,
      multipleChoiceCount: 10,
      trueFalseCount: 0,
      shortAnswerCount: 0,
    }),
    values: {},
  },
  {
    title: "Hóa học 10 - Cấu tạo nguyên tử",
    description: "Tạo đề nháp theo chủ đề Hóa học phổ biến cho giáo viên rà soát.",
    tool: "exam",
    href: withQuery("/tools/exam-generator", {
      subject: "Hóa học",
      grade: "10",
      topic: "Cấu tạo nguyên tử",
      bookSeries: "Kết nối tri thức",
      bankSource: "system",
      bankCount: 10,
      useBank: true,
      multipleChoiceCount: 10,
      trueFalseCount: 0,
      shortAnswerCount: 0,
    }),
    values: {},
  },
  {
    title: "Vật lí 10 - Khúc xạ ánh sáng",
    description: "Điền nhanh giáo án có định hướng mục tiêu theo Bloom.",
    tool: "lesson-plan",
    href: withQuery("/tools/lesson-plan-generator", {
      subject: "Vật lí",
      grade: "10",
      bookSeries: "Kết nối tri thức",
      lessonName: "Khúc xạ ánh sáng",
      duration: "45 phút",
      bloomLevel: "Đầy đủ theo Bloom",
      curriculumRequirement: "Học sinh mô tả được hiện tượng khúc xạ ánh sáng và vận dụng để giải thích một số hiện tượng thực tế.",
      objectives: "Học sinh nhận biết, giải thích và vận dụng hiện tượng khúc xạ ánh sáng trong tình huống học tập.",
      methods: "Gợi mở, thảo luận nhóm, quan sát thí nghiệm, luyện tập cá nhân",
      materials: "Sách giáo khoa, mô phỏng tia sáng, phiếu học tập, dụng cụ thí nghiệm đơn giản",
    }),
    values: {},
  },
];

export function getQueryPrefill(search: string) {
  const params = new URLSearchParams(search);
  if (params.get("preset") !== "public-beta") return null;
  const values: Record<string, string | number | boolean> = {};
  params.forEach((value, key) => {
    if (key === "preset") return;
    if (value === "true") values[key] = true;
    else if (value === "false") values[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) values[key] = Number(value);
    else values[key] = value;
  });
  return values;
}
