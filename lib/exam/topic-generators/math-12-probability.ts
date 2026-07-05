import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { ExamInput, QuestionDifficulty } from "@/lib/types";

const difficulties: QuestionDifficulty[] = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"];
const answers = ["A", "B", "C", "D"] as const;

export function isMath12Probability(input: Partial<ExamInput>) {
  const value = `${input.subject ?? ""} ${input.grade ?? ""} ${input.topic ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return /toan/.test(value) && /\b12\b/.test(value) && /(xac suat|probability|to hop|thong ke)/.test(value);
}

const mcTemplates = [
  ["Gieo một con xúc xắc cân đối một lần. Xác suất để xuất hiện số chấm chẵn là", ["1/2", "1/3", "2/3", "1/6"], "A", "Các kết quả chẵn là 2, 4, 6 nên có 3/6 = 1/2."],
  ["Từ một hộp có 5 bi đỏ và 3 bi xanh, rút ngẫu nhiên 1 viên. Xác suất rút được bi xanh là", ["3/8", "5/8", "1/3", "3/5"], "A", "Có 3 bi xanh trong tổng 8 viên."],
  ["Một lớp có 20 học sinh, trong đó 12 nữ. Chọn ngẫu nhiên 1 học sinh. Xác suất chọn được học sinh nam là", ["2/5", "3/5", "1/2", "1/5"], "A", "Số nam là 8 nên xác suất bằng 8/20 = 2/5."],
  ["Tung hai đồng xu cân đối. Xác suất xuất hiện đúng một mặt sấp là", ["1/2", "1/4", "3/4", "1/3"], "A", "Không gian mẫu có 4 kết quả, thuận lợi có 2 kết quả."],
  ["Từ các chữ số 1,2,3,4 lập số tự nhiên có 2 chữ số khác nhau. Số phần tử của không gian mẫu là", ["12", "8", "16", "6"], "A", "Có 4 cách chọn hàng chục và 3 cách chọn hàng đơn vị."],
  ["Chọn ngẫu nhiên 2 học sinh từ nhóm 6 học sinh. Số cách chọn là", ["15", "12", "30", "36"], "A", "Số cách chọn là C(6,2)=15."],
  ["Gieo hai xúc xắc cân đối. Xác suất để tổng số chấm bằng 7 là", ["1/6", "1/12", "1/9", "1/18"], "A", "Có 6 kết quả thuận lợi trong 36 kết quả đồng khả năng."],
  ["Một hộp có 4 thẻ số chẵn và 6 thẻ số lẻ. Rút 1 thẻ. Xác suất rút được thẻ số chẵn là", ["2/5", "3/5", "1/2", "1/4"], "A", "Có 4 thẻ chẵn trên tổng 10 thẻ."],
  ["Có 7 quyển sách khác nhau xếp lên một kệ. Số cách xếp là", ["7!", "7", "2^7", "C(7,2)"], "A", "Xếp 7 đối tượng khác nhau có 7! hoán vị."],
  ["Chọn 3 sản phẩm từ 10 sản phẩm để kiểm tra. Số cách chọn là", ["120", "720", "30", "1000"], "A", "Số cách chọn là C(10,3)=120."],
  ["Hai biến cố A, B độc lập với P(A)=0,4 và P(B)=0,5. P(A∩B) bằng", ["0,2", "0,9", "0,1", "0,45"], "A", "Vì độc lập nên P(A∩B)=P(A)P(B)=0,2."],
  ["Nếu P(A)=0,7 thì xác suất của biến cố đối Ā là", ["0,3", "0,7", "1,7", "0"], "A", "P(Ā)=1-P(A)=0,3."],
] as const;

const tfTemplates = [
  ["Một hộp có 3 bi đỏ, 2 bi xanh và 1 bi vàng. Rút ngẫu nhiên 1 viên bi.", ["Không gian mẫu có 6 kết quả nếu phân biệt từng viên bi.", "Xác suất rút được bi đỏ là 1/2.", "Xác suất rút được bi vàng là 1/6.", "Biến cố rút được bi đỏ và bi xanh cùng lúc là chắc chắn."], [true, true, true, false]],
  ["Gieo một con xúc xắc cân đối hai lần.", ["Không gian mẫu có 36 kết quả đồng khả năng.", "Xác suất để cả hai lần đều ra số 6 là 1/36.", "Xác suất để tổng số chấm bằng 2 là 1/6.", "Biến cố tổng số chấm bằng 7 có 6 kết quả thuận lợi."], [true, true, false, true]],
  ["Chọn ngẫu nhiên 2 học sinh từ nhóm gồm 5 nam và 4 nữ.", ["Số cách chọn 2 học sinh là C(9,2).", "Số cách chọn 2 học sinh nữ là C(4,2).", "Xác suất chọn được 2 học sinh nữ là 1/6.", "Số cách chọn 1 nam và 1 nữ là 20."], [true, true, true, true]],
  ["Hai biến cố A và B độc lập, P(A)=0,3 và P(B)=0,6.", ["P(A∩B)=0,18.", "P(A∪B)=0,72.", "A và B độc lập thì P(A∩B)=P(A)+P(B).", "P(Ā)=0,7."], [true, true, false, true]],
] as const;

const shortTemplates = [
  ["Một hộp có 6 bi đỏ và 4 bi xanh. Rút ngẫu nhiên 2 viên không hoàn lại. Tính xác suất để cả hai viên đều đỏ.", "1/3", "Số cách chọn 2 bi từ 10 là C(10,2)=45; chọn 2 bi đỏ là C(6,2)=15; xác suất 15/45=1/3."],
  ["Gieo hai xúc xắc cân đối. Tính xác suất để tổng số chấm bằng 8.", "5/36", "Các cặp thuận lợi: (2,6),(3,5),(4,4),(5,3),(6,2), có 5 trên 36 kết quả."],
  ["Từ 8 học sinh gồm 5 nữ và 3 nam, chọn ngẫu nhiên 3 học sinh. Tính xác suất chọn được đúng 2 nữ.", "15/28", "Số thuận lợi C(5,2)C(3,1)=30; số cách chọn C(8,3)=56; xác suất 30/56=15/28."],
  ["Tung 3 đồng xu cân đối. Tính xác suất xuất hiện ít nhất 2 mặt ngửa.", "1/2", "Có C(3,2)+C(3,3)=4 kết quả thuận lợi trên 8 kết quả."],
  ["Một mã gồm 3 chữ số khác nhau được lập từ các chữ số 1,2,3,4,5. Có bao nhiêu mã như vậy?", "60", "Số mã là A(5,3)=5·4·3=60."],
  ["Hai biến cố độc lập A, B có P(A)=0,25 và P(B)=0,4. Tính P(A∪B).", "0,55", "P(A∪B)=P(A)+P(B)-P(A)P(B)=0,25+0,4-0,1=0,55."],
] as const;

function rotateOptions(options: readonly string[], answer: string, index: number) {
  const answerIndex = answers.indexOf(answer as typeof answers[number]);
  const target = index % 4;
  const offset = (target - answerIndex + 4) % 4;
  const rotated = offset ? [...options.slice(-offset), ...options.slice(0, -offset)] : [...options];

  return {
    options: Object.fromEntries(answers.map((key, optionIndex) => [key, rotated[optionIndex]])) as Record<typeof answers[number], string>,
    answer: answers[target],
  };
}

function difficulty(index: number) {
  return difficulties[Math.min(difficulties.length - 1, Math.floor(index / 4))];
}

export function createMath12ProbabilityExam(input: ExamInput): StructuredExam {
  const mcCount = Math.max(0, input.multipleChoiceCount || 12);
  const tfCount = Math.max(0, input.trueFalseCount || 4);
  const shortCount = Math.max(0, input.shortAnswerCount || 6);

  const mc: ExamQuestion[] = Array.from({ length: mcCount }, (_, index) => {
    const template = mcTemplates[index % mcTemplates.length];
    const rotated = rotateOptions(template[1], template[2], index);
    return {
      id: `prob-mc-${index + 1}`,
      part: "multiple_choice",
      number: index + 1,
      stem: template[0],
      options: rotated.options,
      answer: rotated.answer,
      explanation: template[3],
      score: 0.25,
      difficulty: difficulty(index),
      topic: "Xác suất"
    };
  });

  const tf: ExamQuestion[] = Array.from({ length: tfCount }, (_, index) => {
    const template = tfTemplates[index % tfTemplates.length];
    const labels = ["a", "b", "c", "d"] as const;
    const items = labels.map((label, itemIndex) => ({ label, text: template[1][itemIndex], answer: template[2][itemIndex] }));
    return {
      id: `prob-tf-${index + 1}`,
      part: "true_false",
      number: index + 1,
      stem: template[0],
      trueFalseItems: items,
      answer: items.map((item) => `${item.label} ${item.answer ? "Đúng" : "Sai"}`).join("; "),
      explanation: "Đối chiếu định nghĩa xác suất cổ điển, quy tắc đếm và công thức xác suất.",
      score: 1,
      difficulty: difficulty(index),
      topic: "Xác suất"
    };
  });

  const short: ExamQuestion[] = Array.from({ length: shortCount }, (_, index) => {
    const template = shortTemplates[index % shortTemplates.length];
    return {
      id: `prob-sa-${index + 1}`,
      part: "short_answer",
      number: index + 1,
      stem: template[0],
      answer: template[1],
      explanation: template[2],
      score: Number((Math.max(0, input.totalScore - mc.length * 0.25 - tf.length) / Math.max(shortCount, 1)).toFixed(2)),
      difficulty: difficulty(index),
      topic: "Xác suất"
    };
  });

  const parts: StructuredExam["parts"] = [
    { type: "multiple_choice" as const, title: "PH?N I", instruction: `Th? sinh tr? l?i t? c?u 1 ??n c?u ${mc.length}. M?i c?u h?i th? sinh ch? ch?n m?t ph??ng ?n.`, questions: mc },
    { type: "true_false" as const, title: "PH?N II", instruction: `Th? sinh tr? l?i t? c?u 1 ??n c?u ${tf.length}. Trong m?i ? a), b), c), d), th? sinh ch?n ??ng ho?c sai.`, questions: tf },
    { type: "short_answer" as const, title: "PH?N III", instruction: `Th? sinh tr? l?i t? c?u 1 ??n c?u ${short.length}.`, questions: short },
  ].filter((part) => part.questions.length);

  return {
    metadata: {
      title: `Đề kiểm tra ${input.subject} lớp ${input.grade} - Xác suất`,
      examStyle: input.examStyle,
      subject: input.subject,
      grade: input.grade,
      duration: input.duration,
      examCode: input.examCode.padStart(4, "0"),
      schoolName: input.schoolName,
    },
    parts,
    teacherOnly: {
      scoringGuide: `Tổng điểm: ${input.totalScore} điểm. PHẦN I mỗi câu 0,25 điểm; PHẦN II chấm theo từng ý đúng/sai; PHẦN III chấm theo đáp án và lập luận xác suất.`,
      matrix: `| Chủ đề | Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao | Số câu |\n|---|---:|---:|---:|---:|---:|\n| Xác suất - tổ hợp | 4 | 6 | 8 | 4 | ${mc.length + tf.length + short.length} |`,
      specification: `| Phần | Nội dung | Yêu cầu |\n|---|---|---|\n| I | Xác suất cổ điển, tổ hợp | Chọn đáp án đúng |\n| II | Không gian mẫu, biến cố, độc lập | Xác định đúng/sai |\n| III | Bài toán tính xác suất | Trình bày kết quả ngắn |`,
      notes: "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.",
    }
  };
}
