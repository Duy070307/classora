import type { QuestionBankItem } from "@/lib/question-bank-core/types";

export function questionCollectionText(items: QuestionBankItem[], audience: "student" | "teacher") {
  return items.map((item, index) => {
    const choices = item.options.map((option) => `${option.label}. ${option.text}`).join("\n");
    const statements = item.trueFalseStatements.map((statement) => `${statement.label}) ${statement.text}`).join("\n");
    const answer = item.type === "multiple_choice" ? item.correctOptionIds.join(", ") : item.type === "true_false" ? item.trueFalseStatements.map((statement) => `${statement.label}:${statement.answer ? "Đúng" : "Sai"}`).join("; ") : item.answer || item.acceptedAnswers.join("; ");
    return `Câu ${index + 1}. ${item.prompt}${choices ? `\n${choices}` : ""}${statements ? `\n${statements}` : ""}${audience === "teacher" ? `\nĐáp án: ${answer}${item.explanation ? `\nLời giải: ${item.explanation}` : ""}` : ""}`;
  }).join("\n\n");
}
