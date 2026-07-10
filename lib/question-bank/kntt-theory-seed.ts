import type { QuestionDifficulty, QuestionItem } from "@/lib/types";

type SeedTopic = {
  subject: "Vật lí" | "Hóa học";
  grade: string;
  topics: string[];
};

const groups: SeedTopic[] = [
  {
    subject: "Vật lí",
    grade: "10",
    topics: [
      "Chuyển động thẳng",
      "Gia tốc",
      "Lực và chuyển động",
      "Ba định luật Newton",
      "Công và năng lượng",
      "Động lượng",
      "Chuyển động tròn",
      "Biến dạng của vật rắn",
    ],
  },
  {
    subject: "Vật lí",
    grade: "11",
    topics: [
      "Điện trường",
      "Cường độ điện trường",
      "Điện thế",
      "Dòng điện không đổi",
      "Định luật Ohm",
      "Điện năng và công suất điện",
      "Từ trường",
      "Cảm ứng điện từ",
    ],
  },
  {
    subject: "Vật lí",
    grade: "12",
    topics: [
      "Dao động điều hòa",
      "Sóng cơ",
      "Sóng điện từ",
      "Dòng điện xoay chiều",
      "Giao thoa ánh sáng",
      "Lượng tử ánh sáng",
      "Hạt nhân nguyên tử",
      "Ứng dụng vật lí hiện đại",
    ],
  },
  {
    subject: "Hóa học",
    grade: "10",
    topics: [
      "Cấu tạo nguyên tử",
      "Bảng tuần hoàn",
      "Liên kết hóa học",
      "Phản ứng oxi hóa - khử",
      "Tốc độ phản ứng",
      "Năng lượng phản ứng",
      "Halogen",
      "Xu hướng biến đổi tính chất",
    ],
  },
  {
    subject: "Hóa học",
    grade: "11",
    topics: [
      "Cân bằng hóa học",
      "Acid - base",
      "pH",
      "Nitrogen và hợp chất",
      "Sulfur và hợp chất",
      "Đại cương hóa học hữu cơ",
      "Hydrocarbon",
      "Dẫn xuất hydrocarbon",
    ],
  },
  {
    subject: "Hóa học",
    grade: "12",
    topics: [
      "Ester - lipid",
      "Carbohydrate",
      "Amine - amino acid - protein",
      "Polymer",
      "Đại cương kim loại",
      "Pin điện hóa",
      "Ăn mòn kim loại",
      "Sắt và hợp chất",
    ],
  },
];

const difficulties: QuestionDifficulty[] = ["Nhận biết", "Thông hiểu", "Vận dụng"];

const physicsFocus: Record<string, [string, string, string]> = {
  "Chuyển động thẳng": ["độ dời, quãng đường và vận tốc", "đồ thị tọa độ - thời gian", "điều kiện chuyển động thẳng đều"],
  "Gia tốc": ["sự biến thiên vận tốc theo thời gian", "dấu của gia tốc trong chuyển động chậm dần", "đơn vị m/s²"],
  "Lực và chuyển động": ["lực là nguyên nhân làm thay đổi vận tốc", "hợp lực và trạng thái chuyển động", "quán tính của vật"],
  "Ba định luật Newton": ["mối liên hệ giữa lực, khối lượng và gia tốc", "cặp lực tương tác", "quán tính khi hợp lực bằng không"],
  "Công và năng lượng": ["công của lực khi có độ dịch chuyển", "định luật bảo toàn cơ năng trong điều kiện phù hợp", "mối liên hệ giữa công và độ biến thiên động năng"],
  "Động lượng": ["động lượng phụ thuộc khối lượng và vận tốc", "bảo toàn động lượng trong hệ kín", "xung lượng của lực"],
  "Chuyển động tròn": ["hướng của gia tốc hướng tâm", "chu kì và tần số", "tốc độ góc trong chuyển động tròn đều"],
  "Biến dạng của vật rắn": ["biến dạng đàn hồi", "giới hạn đàn hồi", "lực đàn hồi phụ thuộc độ biến dạng trong miền đàn hồi"],
  "Điện trường": ["môi trường truyền tương tác điện", "đường sức điện", "tác dụng lực điện lên điện tích thử"],
  "Cường độ điện trường": ["đại lượng đặc trưng cho độ mạnh yếu của điện trường", "hướng của vectơ cường độ điện trường", "đơn vị N/C hoặc V/m"],
  "Điện thế": ["khả năng sinh công của điện trường", "hiệu điện thế giữa hai điểm", "mốc điện thế được chọn tùy bài toán"],
  "Dòng điện không đổi": ["dòng chuyển dời có hướng của điện tích", "cường độ dòng điện không đổi theo thời gian", "điều kiện duy trì dòng điện"],
  "Định luật Ohm": ["mối liên hệ giữa U, I và R", "điện trở không đổi trong điều kiện xác định", "đồ thị I theo U của vật dẫn ohmic"],
  "Điện năng và công suất điện": ["công suất P = UI", "điện năng tiêu thụ trong một khoảng thời gian", "ý nghĩa số ghi trên thiết bị điện"],
  "Từ trường": ["tác dụng lực từ lên nam châm hoặc dòng điện", "đường sức từ", "chiều của từ trường quanh dây dẫn thẳng"],
  "Cảm ứng điện từ": ["sự xuất hiện suất điện động cảm ứng", "sự biến thiên từ thông", "chiều dòng điện cảm ứng chống lại nguyên nhân sinh ra nó"],
  "Dao động điều hòa": ["li độ biến thiên theo hàm sin hoặc cos", "vận tốc cực đại ở vị trí cân bằng", "gia tốc hướng về vị trí cân bằng"],
  "Sóng cơ": ["sự lan truyền dao động trong môi trường", "bước sóng và chu kì", "sóng cơ không truyền được trong chân không"],
  "Sóng điện từ": ["điện trường và từ trường biến thiên lan truyền", "truyền được trong chân không", "mang năng lượng"],
  "Dòng điện xoay chiều": ["cường độ và điện áp biến thiên điều hòa", "giá trị hiệu dụng", "tần số của dòng điện"],
  "Giao thoa ánh sáng": ["sự chồng chập hai chùm sáng kết hợp", "vân sáng và vân tối", "khoảng vân phụ thuộc bước sóng"],
  "Lượng tử ánh sáng": ["photon mang năng lượng", "năng lượng photon tỉ lệ với tần số", "hiện tượng quang điện"],
  "Hạt nhân nguyên tử": ["cấu tạo từ proton và neutron", "độ hụt khối và năng lượng liên kết", "phóng xạ là quá trình tự phát"],
  "Ứng dụng vật lí hiện đại": ["laser, bán dẫn hoặc y học hạt nhân", "nguyên lí vật lí đứng sau thiết bị", "giới hạn an toàn khi sử dụng công nghệ"],
};

const chemistryFocus: Record<string, [string, string, string]> = {
  "Cấu tạo nguyên tử": ["số proton quyết định nguyên tố", "electron phân bố theo lớp và phân lớp", "số khối liên hệ với proton và neutron"],
  "Bảng tuần hoàn": ["chu kì và nhóm", "xu hướng bán kính nguyên tử", "xu hướng tính kim loại và phi kim"],
  "Liên kết hóa học": ["liên kết ion hình thành do lực hút tĩnh điện", "liên kết cộng hóa trị dùng chung electron", "độ âm điện giúp dự đoán phân cực liên kết"],
  "Phản ứng oxi hóa - khử": ["sự thay đổi số oxi hóa", "chất oxi hóa nhận electron", "chất khử nhường electron"],
  "Tốc độ phản ứng": ["ảnh hưởng của nồng độ và nhiệt độ", "vai trò của chất xúc tác", "diện tích tiếp xúc trong phản ứng dị thể"],
  "Năng lượng phản ứng": ["phản ứng tỏa nhiệt và thu nhiệt", "biến thiên enthalpy", "liên hệ giữa phá vỡ và hình thành liên kết"],
  "Halogen": ["tính oxi hóa của halogen", "xu hướng biến đổi trong nhóm VIIA", "muối halide và phản ứng nhận biết phù hợp"],
  "Xu hướng biến đổi tính chất": ["sự biến đổi tuần hoàn", "mối liên hệ cấu hình electron và tính chất", "so sánh tính kim loại trong cùng chu kì"],
  "Cân bằng hóa học": ["trạng thái tốc độ thuận bằng tốc độ nghịch", "hằng số cân bằng", "nguyên lí chuyển dịch cân bằng"],
  "Acid - base": ["acid cho proton theo Brønsted", "base nhận proton theo Brønsted", "phản ứng trung hòa"],
  "pH": ["môi trường acid có pH nhỏ hơn 7", "pH liên hệ với nồng độ ion H+", "dung dịch đệm hạn chế biến đổi pH"],
  "Nitrogen và hợp chất": ["nitrogen có phân tử bền", "ammonia có tính base yếu", "nitrate có thể thể hiện tính oxi hóa"],
  "Sulfur và hợp chất": ["sulfur có nhiều số oxi hóa", "SO2 vừa có tính khử vừa có tính oxi hóa", "sulfuric acid đặc có tính oxi hóa mạnh"],
  "Đại cương hóa học hữu cơ": ["đặc điểm hợp chất carbon", "công thức cấu tạo và đồng phân", "nhóm chức quyết định nhiều tính chất"],
  "Hydrocarbon": ["alkane chủ yếu phản ứng thế", "alkene có liên kết đôi và phản ứng cộng", "arene có tính thơm"],
  "Dẫn xuất hydrocarbon": ["nguyên tử hoặc nhóm nguyên tử thay thế H trong hydrocarbon", "nhóm chức làm thay đổi tính chất", "phân loại theo nhóm chức"],
  "Ester - lipid": ["ester có nhóm chức -COO-", "phản ứng thủy phân ester", "lipid gồm chất béo và một số hợp chất liên quan"],
  "Carbohydrate": ["glucose là monosaccharide", "saccharose là disaccharide", "tinh bột và cellulose là polysaccharide"],
  "Amine - amino acid - protein": ["amine có tính base", "amino acid có tính lưỡng tính", "protein tạo bởi các đơn vị amino acid"],
  "Polymer": ["đại phân tử gồm nhiều mắt xích", "phản ứng trùng hợp hoặc trùng ngưng", "tính chất phụ thuộc cấu trúc mạch"],
  "Đại cương kim loại": ["tính khử của kim loại", "liên kết kim loại", "dãy điện hóa giúp so sánh mức độ hoạt động"],
  "Pin điện hóa": ["chuyển hóa năng lượng hóa học thành điện năng", "electron đi qua mạch ngoài", "cực âm là nơi xảy ra oxi hóa trong pin Galvani"],
  "Ăn mòn kim loại": ["sự oxi hóa kim loại bởi môi trường", "ăn mòn điện hóa cần các điện cực khác nhau và chất điện li", "bảo vệ kim loại bằng sơn phủ hoặc hi sinh"],
  "Sắt và hợp chất": ["sắt có số oxi hóa phổ biến +2 và +3", "Fe2+ dễ bị oxi hóa thành Fe3+", "một số hợp chất sắt có màu đặc trưng"],
};

function hexHash(text: string) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function seedId(subject: string, grade: string, topic: string, index: number) {
  const a = hexHash(`${subject}-${grade}`);
  const b = hexHash(topic);
  const c = hexHash(`${topic}-${index}-mcq`);
  return `${a.slice(0, 8)}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${c.slice(0, 3)}-${c}${a.slice(0, 4)}`;
}

function focusFor(subject: string, topic: string, index: number) {
  const bank = subject === "Vật lí" ? physicsFocus : chemistryFocus;
  const focus = bank[topic] || ["khái niệm cốt lõi", "điều kiện áp dụng", "ý nghĩa thực tiễn"];
  return focus[index % focus.length];
}

function distractorSet(subject: string) {
  if (subject === "Vật lí") {
    return [
      "Chỉ cần nhớ kết quả cuối cùng, không cần xét hiện tượng.",
      "Bỏ qua đơn vị và điều kiện áp dụng của đại lượng.",
      "Luôn suy luận theo cảm tính thay vì dựa vào khái niệm vật lí.",
    ];
  }
  return [
    "Chỉ học thuộc tên chất mà không xét cấu tạo hoặc bản chất phản ứng.",
    "Bỏ qua điều kiện phản ứng và vai trò của môi trường.",
    "Dựa hoàn toàn vào màu sắc quan sát được mà không xét bản chất hóa học.",
  ];
}

function multipleChoice(group: SeedTopic, topic: string, index: number) {
  const focus = focusFor(group.subject, topic, index);
  const [wrong1, wrong2, wrong3] = distractorSet(group.subject);
  const questionStarters = group.subject === "Vật lí"
    ? [
        `Khi ôn tập chủ đề ${topic}, nhận định nào đúng nhất về ${focus}?`,
        `Trong chủ đề ${topic}, ý nào giúp học sinh hiểu đúng ${focus}?`,
        `Để kiểm tra kiến thức nền về ${topic}, phương án nào phù hợp nhất với ${focus}?`,
      ]
    : [
        `Khi học chủ đề ${topic}, phát biểu nào phù hợp nhất về ${focus}?`,
        `Trong chủ đề ${topic}, ý nào thể hiện đúng bản chất của ${focus}?`,
        `Để kiểm tra kiến thức nền về ${topic}, phương án nào đúng nhất liên quan đến ${focus}?`,
      ];

  const correct = group.subject === "Vật lí"
    ? `Cần gắn ${focus} với khái niệm, đại lượng và điều kiện áp dụng trong tình huống cụ thể.`
    : `Cần gắn ${focus} với cấu tạo, tính chất, quy luật hoặc bản chất biến đổi chất.`;

  return {
    question: questionStarters[index % questionStarters.length],
    options: {
      A: correct,
      B: wrong1,
      C: wrong2,
      D: wrong3,
    },
    answer: "A",
    explanation: group.subject === "Vật lí"
      ? `Phương án A phù hợp vì câu hỏi Vật lí cần kiểm tra bản chất hiện tượng, đại lượng và điều kiện áp dụng của ${focus}.`
      : `Phương án A phù hợp vì câu hỏi Hóa học cần kiểm tra bản chất cấu tạo, tính chất hoặc quy luật liên quan đến ${focus}.`,
  };
}

function buildQuestion(group: SeedTopic, topic: string, index: number): QuestionItem {
  const difficulty = difficulties[index % difficulties.length];
  const base = multipleChoice(group, topic, index);

  return {
    id: seedId(group.subject, group.grade, topic, index),
    subject: group.subject,
    grade: group.grade,
    topic,
    question: base.question,
    type: "Trắc nghiệm",
    difficulty,
    options: base.options,
    answer: base.answer,
    explanation: base.explanation,
    bankScope: "system",
    userId: null,
    createdAt: new Date("2026-07-10T00:00:00.000Z").toISOString(),
    metadata: {
      bookSeries: "Kết nối tri thức",
      sourceType: "Soạn Lab seed",
      contentType: "Lý thuyết",
      generatedBy: "Soạn Lab seed",
      needsReview: true,
      seedKey: `${group.subject}-${group.grade}-${topic}-Trắc nghiệm-${index}`,
      note: "Câu hỏi tham khảo theo định hướng Kết nối tri thức, không phải câu hỏi chính thức từ sách giáo khoa.",
    },
  };
}

export function getKnttTheorySeedQuestions(): QuestionItem[] {
  return groups.flatMap((group) => {
    const repeated = Array.from({ length: 24 }, (_, index) => group.topics[index % group.topics.length]);
    return repeated.map((topic, index) => buildQuestion(group, topic, index));
  });
}
