export type GeometryShapeIntent =
  | "cube"
  | "rectangular_prism"
  | "pyramid"
  | "truncated_pyramid"
  | "cone"
  | "truncated_cone"
  | "cylinder"
  | "sphere"
  | "prism"
  | "frustum_general";

export type DetectedShapeIntent = {
  intent: GeometryShapeIntent;
  keyword: string;
};

function normalizeVietnamese(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const intentPatterns: Array<{ intent: GeometryShapeIntent; keywords: string[] }> = [
  {
    intent: "truncated_pyramid",
    keywords: ["chop cut", "hinh chop cut", "khoi chop cut", "chop tu giac cut", "chop tam giac cut"],
  },
  {
    intent: "truncated_cone",
    keywords: ["non cut", "hinh non cut", "khoi non cut"],
  },
  {
    intent: "rectangular_prism",
    keywords: ["hinh hop chu nhat", "khoi hop chu nhat", "hop chu nhat"],
  },
  {
    intent: "cube",
    keywords: ["lap phuong", "hinh lap phuong", "khoi lap phuong"],
  },
  {
    intent: "pyramid",
    keywords: ["hinh chop", "khoi chop", "chop tam giac", "chop tu giac", "chop deu"],
  },
  {
    intent: "cone",
    keywords: ["hinh non", "khoi non", " non "],
  },
  {
    intent: "cylinder",
    keywords: ["hinh tru", "khoi tru", " tru "],
  },
  {
    intent: "sphere",
    keywords: ["hinh cau", "khoi cau", " cau "],
  },
  {
    intent: "prism",
    keywords: ["lang tru", "hinh lang tru", "lang tru tam giac", "lang tru tu giac"],
  },
  {
    intent: "frustum_general",
    keywords: ["hinh cut", "khoi cut", "mat cat song song day"],
  },
];

export function detectGeometryShapeIntent(text: string): DetectedShapeIntent | null {
  const normalized = ` ${normalizeVietnamese(text)} `;
  for (const pattern of intentPatterns) {
    const keyword = pattern.keywords.find((item) => normalized.includes(` ${item.trim()} `));
    if (keyword) return { intent: pattern.intent, keyword };
  }
  return null;
}

export function isGeometryMode(value: string) {
  return normalizeVietnamese(value).includes("hinh hoc");
}
