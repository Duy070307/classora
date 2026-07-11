import { canonicalizeSubject, canonicalizeTopic } from "@/lib/generation/request-context";

export type TopicNode = {
  subject: string;
  grade: string;
  topic: string;
  aliases?: string[];
  subtopics?: string[];
  relatedTopics?: string[];
  allowedTerms: string[];
  relatedTerms?: string[];
  forbiddenTerms: string[];
};

const crossSubject = ["xác suất", "phương trình bậc hai", "phản ứng hóa học"];

export const topicTaxonomy: TopicNode[] = [
  ...["10", "11", "12"].map((grade) => ({
    subject: "Vật lí", grade, topic: "Nhiệt học",
    aliases: ["nhiệt", "vật lí nhiệt", "nhiệt lượng", "nhiệt độ", "nội năng", "truyền nhiệt", "cân bằng nhiệt", "khí lí tưởng", "phương trình trạng thái khí lí tưởng", "định luật Boyle", "định luật Charles", "định luật Gay-Lussac", "nguyên lí I nhiệt động lực học", "nhiệt dung riêng", "sự nở vì nhiệt", "biến đổi trạng thái", "đẳng nhiệt", "đẳng áp", "đẳng tích"],
    allowedTerms: ["nhiệt độ", "nhiệt lượng", "nội năng", "truyền nhiệt", "cân bằng nhiệt", "khối lượng", "nhiệt dung riêng", "Q = mcΔt", "khí lí tưởng", "áp suất", "thể tích", "nhiệt độ tuyệt đối", "pV = nRT", "đẳng nhiệt", "đẳng áp", "đẳng tích", "nguyên lí I nhiệt động lực học"],
    forbiddenTerms: ["định luật newton", "từ trường", "cảm ứng điện từ", "dao động điều hòa", "sóng cơ", "giao thoa ánh sáng", "hạt nhân nguyên tử", "xác suất", "đạo hàm", "ester", "pH"],
  })),
  { subject: "Toán", grade: "12", topic: "Hàm số", aliases: ["khảo sát hàm số", "tính đơn điệu", "cực trị", "giá trị lớn nhất nhỏ nhất", "tiệm cận", "đồ thị hàm số", "đạo hàm và hàm số", "hàm số bậc nhất", "hàm số bậc hai", "hàm số mũ", "hàm số logarit"], allowedTerms: ["hàm số", "tập xác định", "đạo hàm", "đồng biến", "nghịch biến", "cực trị", "bảng biến thiên", "tiệm cận", "đồ thị", "tương giao", "giá trị lớn nhất", "giá trị nhỏ nhất", "GTLN", "GTNN"], forbiddenTerms: ["xác suất", "hình học không gian", "số phức", "ester", "pH", "định luật newton", "định luật ohm"] },
  { subject: "Vật lí", grade: "10", topic: "Chuyển động thẳng", allowedTerms: ["quãng đường", "vận tốc", "tốc độ", "chuyển động thẳng"], forbiddenTerms: ["điện trường", "phản ứng hóa học", "xác suất"] },
  { subject: "Vật lí", grade: "10", topic: "Gia tốc", allowedTerms: ["gia tốc", "vận tốc", "chuyển động biến đổi"], forbiddenTerms: ["điện trường", "quang học", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "10", topic: "Ba định luật Newton", aliases: ["định luật Newton", "dinh luat newton"], subtopics: ["Định luật I Newton", "Định luật II Newton", "Định luật III Newton"], allowedTerms: ["quán tính", "hợp lực", "gia tốc", "khối lượng", "lực và phản lực", "F = ma", "newton"], relatedTerms: ["lực", "ma sát"], forbiddenTerms: ["công và năng lượng", "điện trường", "dòng điện", "quang học", "phản ứng hóa học", "xác suất"] },
  { subject: "Vật lí", grade: "10", topic: "Lực và chuyển động", subtopics: ["Ba định luật Newton"], allowedTerms: ["lực", "hợp lực", "ma sát", "gia tốc", "newton"], forbiddenTerms: ["điện trường", "phản ứng hóa học", "xác suất"] },
  { subject: "Vật lí", grade: "10", topic: "Công và năng lượng", allowedTerms: ["công", "công suất", "động năng", "thế năng", "cơ năng"], forbiddenTerms: ["điện trường", "phản ứng hóa học", "xác suất"] },
  { subject: "Vật lí", grade: "10", topic: "Động lượng", allowedTerms: ["động lượng", "xung lượng", "va chạm", "bảo toàn động lượng"], forbiddenTerms: ["điện trường", "phản ứng hóa học", "xác suất"] },
  { subject: "Vật lí", grade: "10", topic: "Chuyển động tròn", allowedTerms: ["chuyển động tròn", "tốc độ góc", "gia tốc hướng tâm", "lực hướng tâm"], forbiddenTerms: ["điện trường", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "10", topic: "Biến dạng vật rắn", allowedTerms: ["biến dạng", "đàn hồi", "định luật hooke", "lò xo"], forbiddenTerms: ["dòng điện", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "11", topic: "Điện trường", subtopics: ["Cường độ điện trường", "Điện thế"], allowedTerms: ["điện trường", "điện tích", "lực điện", "cường độ điện trường", "điện thế"], forbiddenTerms: ["dao động điều hòa", "sóng cơ", "hạt nhân", "xác suất"] },
  { subject: "Vật lí", grade: "11", topic: "Cường độ điện trường", allowedTerms: ["cường độ điện trường", "điện tích thử", "lực điện", "E = F/q"], forbiddenTerms: ["từ trường", "cảm ứng điện từ", "dao động điều hòa", "xác suất"] },
  { subject: "Vật lí", grade: "11", topic: "Điện thế", allowedTerms: ["điện thế", "hiệu điện thế", "thế năng điện", "công của lực điện"], forbiddenTerms: ["từ trường", "dao động điều hòa", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "11", topic: "Dòng điện không đổi", subtopics: ["Định luật Ohm", "Điện năng và công suất điện"], allowedTerms: ["dòng điện không đổi", "cường độ dòng điện", "nguồn điện", "điện trở", "định luật ohm", "điện năng", "công suất điện"], forbiddenTerms: ["từ trường", "cảm ứng điện từ", "dao động điều hòa", "hạt nhân", "xác suất"] },
  { subject: "Vật lí", grade: "11", topic: "Định luật Ohm", aliases: ["định luật Ôm", "dinh luat om", "Ohm"], allowedTerms: ["cường độ dòng điện", "hiệu điện thế", "điện trở", "I = U/R", "định luật ohm", "đoạn mạch", "dây dẫn", "vôn-ampe"], relatedTerms: ["dòng điện không đổi"], forbiddenTerms: ["từ trường", "cảm ứng điện từ", "dao động điều hòa", "sóng cơ", "hạt nhân", ...crossSubject] },
  { subject: "Vật lí", grade: "11", topic: "Điện năng và công suất điện", allowedTerms: ["điện năng", "công suất điện", "công của dòng điện", "P = UI", "jun-lenxơ"], forbiddenTerms: ["từ trường", "dao động điều hòa", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "11", topic: "Từ trường", allowedTerms: ["từ trường", "cảm ứng từ", "lực từ", "đường sức từ"], forbiddenTerms: ["định luật ohm", "dao động điều hòa", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "11", topic: "Cảm ứng điện từ", allowedTerms: ["cảm ứng điện từ", "từ thông", "suất điện động cảm ứng", "lenz", "faraday"], forbiddenTerms: ["dao động điều hòa", "hạt nhân", "phản ứng hóa học"] },
  { subject: "Vật lí", grade: "11", topic: "Khúc xạ ánh sáng", allowedTerms: ["khúc xạ", "chiết suất", "tia tới", "tia khúc xạ", "snell"], forbiddenTerms: ["dòng điện", "dao động điều hòa", "phản ứng hóa học"] },
  ...["Dao động điều hòa", "Sóng cơ", "Sóng điện từ", "Dòng điện xoay chiều", "Giao thoa ánh sáng", "Lượng tử ánh sáng", "Hạt nhân nguyên tử"].map((topic) => ({ subject: "Vật lí", grade: "12", topic, allowedTerms: [topic], forbiddenTerms: ["phản ứng hóa học", "xác suất", "polymer"] })),
  { subject: "Hóa học", grade: "10", topic: "Cấu tạo nguyên tử", allowedTerms: ["proton", "neutron", "electron", "số hiệu nguyên tử", "đồng vị", "hạt nhân", "lớp electron"], forbiddenTerms: ["cân bằng hóa học", "ester", "polymer", "dòng điện", "định luật ohm"] },
  ...["Bảng tuần hoàn", "Liên kết hóa học", "Phản ứng oxi hóa - khử", "Tốc độ phản ứng", "Năng lượng hóa học", "Halogen"].map((topic) => ({ subject: "Hóa học", grade: "10", topic, allowedTerms: [topic], forbiddenTerms: ["dòng điện", "xác suất", "dao động điều hòa"] })),
  { subject: "Hóa học", grade: "11", topic: "pH", aliases: ["độ pH"], allowedTerms: ["pH", "acid", "base", "H+", "OH-", "nồng độ ion"], forbiddenTerms: ["hydrocarbon", "polymer", "cấu tạo nguyên tử", "dòng điện"] },
  ...["Cân bằng hóa học", "Acid - base", "Nitrogen và hợp chất", "Sulfur và hợp chất", "Đại cương hóa học hữu cơ", "Hydrocarbon"].map((topic) => ({ subject: "Hóa học", grade: "11", topic, allowedTerms: [topic], forbiddenTerms: ["dòng điện", "xác suất", "dao động điều hòa"] })),
  { subject: "Hóa học", grade: "12", topic: "Ester - lipid", aliases: ["Este - lipid"], allowedTerms: ["ester", "este", "lipid", "chất béo", "thủy phân", "xà phòng hóa"], forbiddenTerms: ["cấu tạo nguyên tử", "dòng điện", "định luật ohm", "xác suất"] },
  ...["Carbohydrate", "Amine", "Amino acid", "Protein", "Polymer", "Đại cương kim loại", "Pin điện hóa", "Ăn mòn kim loại", "Sắt và hợp chất"].map((topic) => ({ subject: "Hóa học", grade: "12", topic, allowedTerms: [topic], forbiddenTerms: ["xác suất", "dao động điều hòa"] })),
];

export function findTopicNode(subject: string, grade: string, topic: string) {
  const canonicalSubject = canonicalizeSubject(subject);
  const canonicalTopic = canonicalizeTopic(topic);
  return topicTaxonomy.find((node) => node.subject === canonicalSubject && node.grade === grade && [node.topic, ...(node.aliases || [])].some((value) => canonicalizeTopic(value) === canonicalTopic));
}

export function isTopicAllowed(requestedTopic: string, itemTopic: string, node: TopicNode | undefined, allowRelated = false) {
  const requested = canonicalizeTopic(requestedTopic);
  const item = canonicalizeTopic(itemTopic);
  if (requested === item || requested.includes(item) || item.includes(requested)) return true;
  if (!allowRelated || !node) return false;
  return [...(node.subtopics || []), ...(node.relatedTopics || [])].some((topic) => {
    const related = canonicalizeTopic(topic);
    return related === item || related.includes(item) || item.includes(related);
  });
}
