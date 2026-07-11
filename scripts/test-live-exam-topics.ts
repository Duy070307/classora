import { existsSync, readFileSync } from "node:fs";
import { buildExamPrompt } from "../lib/ai/prompts";
import { openAIProvider } from "../lib/ai/providers/openai-provider";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const base = { schoolName: "", teacherName: "", bookSeries: "Kết nối tri thức", duration: "45 phút", examType: "Trắc nghiệm", examStyle: "Kiểm tra thường", trueFalseCount: 0, shortAnswerCount: 0, essayCount: 0, examCode: "101", multipleChoiceCount: 10, totalScore: 10, level: "Trung bình", recognitionRate: 30, understandingRate: 40, applicationRate: 20, advancedRate: 10, includeAnswers: true, includeRubric: true, includeMatrix: true, includeSpecification: true, extraRequirements: "" };

async function runCase(subject: string, grade: string, topic: string) {
  const input = { ...base, subject, grade, topic };
  const result = await openAIProvider.generate({ tool: "exam", input, prompt: buildExamPrompt(input) });
  const count = result.structuredExam?.parts.reduce((sum, part) => sum + part.questions.length, 0) ?? 0;
  if (count < 8) throw new Error(`${subject} ${topic}: insufficient_count_${count}`);
  console.log(`${subject} ${grade} ${topic}: ${count}/10 câu có cấu trúc.`);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) return console.log("SKIP: chưa cấu hình khóa máy chủ.");
  await runCase("Toán", "12", "hàm số");
  await runCase("Vật lí", "10", "nhiệt học");
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : "live_exam_test_failed"); process.exitCode = 1; });
