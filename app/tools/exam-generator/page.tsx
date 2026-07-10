"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { OutputPreview } from "@/components/OutputPreview";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { AppShell } from "@/components/AppShell";
import { TemplateSelect } from "@/components/TemplateSelect";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { PresetSelect } from "@/components/tools/PresetSelect";
import { ToolOutputPanel } from "@/components/tools/ToolOutputPanel";
import { ToolWorkspaceLayout } from "@/components/tools/ToolWorkspaceLayout";
import { useFormDraft } from "@/hooks/useFormDraft";
import { examPresets } from "@/lib/presets";
import { createDocument, saveDocument } from "@/lib/history";
import { generateToolContent } from "@/lib/ai/client";
import { getDocumentSettings } from "@/lib/document-settings";
import { getQuestions } from "@/lib/question-bank";
import { applyTemplate, resolveTemplate } from "@/lib/templates";
import type { ExamInput, GeneratedDocument, QuestionItem } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";
import { sampleExamInput } from "@/lib/sample-data";
import { createStructuredExam, structuredExamToText } from "@/lib/mock-exam-generator";
import { formatQuestionOptions, isValidMultipleChoice } from "@/lib/question-bank";
import { bankQuestionScope, canonicalSubject, filterStrictBankQuestions, normalizeBankText } from "@/lib/exam/question-bank-filter";
import type { ExamQuestion, StructuredExam } from "@/lib/exam-types";
import { getCurrentSampleId, getExamSamplePrefill, mergeDefined } from "@/lib/sample-prefill";
import { BOOK_SERIES_HELPER_TEXT, BOOK_SERIES_OPTIONS, DEFAULT_BOOK_SERIES, withSourceAlignmentNote } from "@/lib/curriculum";
import { getQueryPrefill } from "@/lib/public-beta-presets";

type BankSource = "system" | "user" | "both" | "ai";
type DifficultyMode = "auto" | "suggested";

const systemBankSubjects = ["Vật lí", "Hóa học"];
const systemBankSubjectNote = "Ngân hàng Soạn Lab hiện có câu hỏi mẫu cho Vật lí và Hóa học. Với môn này, thầy cô có thể chọn ‘Tự tạo bằng AI’ hoặc dùng ‘Ngân hàng của tôi’.";
const systemBankTypeNote = "Ngân hàng Soạn Lab hiện ưu tiên câu hỏi trắc nghiệm. Các dạng khác sẽ được bổ sung sau.";

function questionScope(item: QuestionItem): "system" | "user" {
  return bankQuestionScope(item);
}

function normalizeText(value: string) {
  return normalizeBankText(value);
}

function renderBankQuestion(item: QuestionItem, index: number) {
  const options = item.type === "Trắc nghiệm" ? formatQuestionOptions(item.options) : "";
  return `Câu NH${index + 1}. [${questionScope(item) === "system" ? "Soạn Lab" : "Của tôi"}] ${item.question}${options ? `\n${options}` : ""}\nĐáp án: ${item.answer || "Giáo viên bổ sung"}${item.explanation ? `\nLời giải: ${item.explanation}` : ""}`;
}

function sourceLabel(source: BankSource) {
  if (source === "system") return "Ngân hàng Soạn Lab";
  if (source === "user") return "Ngân hàng của tôi";
  if (source === "both") return "Cả hai";
  return "Tự tạo bằng AI";
}

function isValidBankMcq(item: QuestionItem) {
  return item.type === "Trắc nghiệm" && Boolean(item.question.trim()) && isValidMultipleChoice(item);
}

function shuffleQuestions(items: QuestionItem[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function distributeQuestions(items: QuestionItem[], count: number, mode: DifficultyMode) {
  const unique = new Map<string, QuestionItem>();
  items.forEach((item) => unique.set(item.id || item.question, item));
  const pool = [...unique.values()];
  if (mode === "auto") return shuffleQuestions(pool).slice(0, count);

  const targets: Record<string, number> = {
    "Nhận biết": Math.round(count * 0.4),
    "Thông hiểu": Math.round(count * 0.4),
    "Vận dụng": Math.floor(count * 0.2),
    "Vận dụng cao": 0,
  };
  targets["Nhận biết"] += count - Object.values(targets).reduce((sum, value) => sum + value, 0);
  const selected: QuestionItem[] = [];
  const used = new Set<string>();
  Object.entries(targets).forEach(([difficulty, target]) => {
    shuffleQuestions(pool.filter((item) => item.difficulty === difficulty && !used.has(item.id))).slice(0, target).forEach((item) => {
      selected.push(item);
      used.add(item.id);
    });
  });
  shuffleQuestions(pool.filter((item) => !used.has(item.id))).slice(0, count - selected.length).forEach((item) => selected.push(item));
  return shuffleQuestions(selected).slice(0, count);
}

const initialInput: ExamInput = {
  schoolName: "",
  teacherName: "",
  subject: "Toán",
  grade: "7",
  bookSeries: DEFAULT_BOOK_SERIES,
  topic: "Tỉ lệ thức và dãy tỉ số bằng nhau",
  duration: "45 phút",
  examType: "Kết hợp",
  examStyle: "Kiểm tra thường",
  multipleChoiceCount: 8,
  essayCount: 3,
  trueFalseCount: 2,
  shortAnswerCount: 3,
  examCode: "0101",
  totalScore: 10,
  level: "Trung bình",
  recognitionRate: 30,
  understandingRate: 40,
  applicationRate: 20,
  advancedRate: 10,
  includeAnswers: true,
  includeRubric: true,
  includeMatrix: true,
  includeSpecification: true,
  extraRequirements: ""
};

const quickExamPresets: Array<{ label: string; values: Partial<ExamInput>; bank?: Partial<{ useBank: boolean; bankSource: BankSource; bankCount: number }> }> = [
  { label: "Toán 12 THPTQG", values: { subject: "Toán", grade: "12", topic: "Hàm số, mũ - logarit, tích phân, xác suất", duration: "90 phút", examStyle: "THPTQG / tốt nghiệp", multipleChoiceCount: 12, trueFalseCount: 4, shortAnswerCount: 6 } },
  { label: "Xác suất", values: { subject: "Toán", grade: "12", topic: "Xác suất, biến cố, quy tắc cộng và quy tắc nhân", examStyle: "THPTQG / tốt nghiệp" } },
  { label: "Vật lí 11 · Định luật Ohm", values: { subject: "Vật lí", grade: "11", topic: "Định luật Ohm", bookSeries: DEFAULT_BOOK_SERIES, examType: "Trắc nghiệm", multipleChoiceCount: 10, trueFalseCount: 0, shortAnswerCount: 0 }, bank: { useBank: true, bankSource: "system", bankCount: 10 } },
  { label: "Hóa 10 · Cấu tạo nguyên tử", values: { subject: "Hóa học", grade: "10", topic: "Cấu tạo nguyên tử", bookSeries: DEFAULT_BOOK_SERIES, examType: "Trắc nghiệm", multipleChoiceCount: 10, trueFalseCount: 0, shortAnswerCount: 0 }, bank: { useBank: true, bankSource: "system", bankCount: 10 } },
  { label: "Lịch sử 12", values: { subject: "Lịch sử", grade: "12", topic: "Việt Nam giai đoạn 1919-1975", duration: "50 phút" } },
  { label: "Tiếng Anh 9", values: { subject: "Tiếng Anh", grade: "9", topic: "Vocabulary, grammar and reading comprehension", duration: "45 phút" } },
  { label: "Toán 8", values: { subject: "Toán", grade: "8", topic: "Phương trình bậc nhất một ẩn", duration: "45 phút" } },
];

export default function ExamGeneratorPage() {
  const [input, setInput] = useState(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [useBank, setUseBank] = useState(false);
  const [bankSource, setBankSource] = useState<BankSource>("system");
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([]);
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [bankCount, setBankCount] = useState(10);
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>("suggested");
  const [allowAiSupplement, setAllowAiSupplement] = useState(false);
  const normalizeExamDraft = useCallback((saved: ExamInput) => ({ ...initialInput, ...saved }), []);
  const draft = useFormDraft("/tools/exam-generator", input, setInput, normalizeExamDraft);

  const bankPreview = useMemo(() => {
    if (bankSource === "ai") return { valid: [] as QuestionItem[], invalidSkipped: 0 };
    let invalidSkipped = 0;
    const strictMatches = filterStrictBankQuestions(bankQuestions, {
      subject: input.subject,
      grade: input.grade,
      topic: input.topic,
      source: bankSource,
      difficulty: bankDifficulty,
    });
    const candidates = strictMatches.filter((item) => {
      const scope = questionScope(item);
      if (scope === "system" && !systemBankSubjects.some((subject) => canonicalSubject(subject) === canonicalSubject(item.subject))) return false;
      if (!isValidBankMcq(item)) {
        invalidSkipped += 1;
        return false;
      }
      return true;
    });
    const requestedCount = Math.min(Math.max(bankCount || 1, 1), 50);
    return {
      valid: distributeQuestions(candidates, requestedCount, difficultyMode),
      invalidSkipped,
    };
  }, [bankCount, bankDifficulty, bankQuestions, bankSource, difficultyMode, input.grade, input.subject, input.topic]);

  useEffect(() => {
    queueMicrotask(() => {
      const settings = getDocumentSettings();
      setInput((current) => ({
        ...current,
        schoolName: current.schoolName || settings.schoolName,
        teacherName: current.teacherName || settings.teacherName
      }));
      const localQuestions = getQuestions();
      setBankQuestions(localQuestions);
      import("@/lib/data/question-bank-store")
        .then(({ listCloudQuestions }) => listCloudQuestions())
        .then((cloud) => {
          if (!cloud?.length) return;
          const merged = new Map<string, QuestionItem>();
          [...cloud, ...localQuestions].forEach((item) => merged.set(item.id, item));
          setBankQuestions([...merged.values()]);
        })
        .catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => setDocument(null));
  }, [input.subject, input.grade, input.topic, input.examType, useBank, bankSource, bankCount, bankDifficulty, allowAiSupplement]);

  useEffect(() => {
    const sampleId = getCurrentSampleId();
    const sample = getExamSamplePrefill(sampleId);
    const queryPreset = typeof window !== "undefined" ? getQueryPrefill(window.location.search) : null;
    if (!sample && !queryPreset) return;
    queueMicrotask(() => {
      const presetInput = { ...(sample || {}), ...(queryPreset || {}) } as Partial<ExamInput> & { bankSource?: BankSource; useBank?: boolean; bankCount?: number };
      setInput((current) => mergeDefined({ ...initialInput, ...current }, presetInput));
      if (typeof presetInput.useBank === "boolean") setUseBank(presetInput.useBank);
      if (presetInput.bankSource) setBankSource(presetInput.bankSource);
      if (presetInput.bankCount) setBankCount(Math.min(50, Math.max(1, Number(presetInput.bankCount))));
      setMessage("Đã điền mẫu nhanh. Thầy/cô có thể chỉnh sửa trước khi tạo bản nháp.");
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate();
  }

  async function generate() {
    if (!input.subject.trim()) return setMessage("Vui lòng nhập môn học.");
    if (!input.grade.trim()) return setMessage("Vui lòng nhập lớp.");
    if (useBank && bankSource !== "ai" && !input.topic.trim()) return setMessage("Vui lòng nhập chủ đề trước khi lấy câu hỏi từ ngân hàng.");
    if (input.multipleChoiceCount + input.trueFalseCount + input.shortAnswerCount <= 0) return setMessage("Tổng số câu phải lớn hơn 0.");
    if ([input.recognitionRate, input.understandingRate, input.applicationRate, input.advancedRate].reduce((a, b) => a + b, 0) !== 100) return setMessage("Tổng tỉ lệ mức độ nên bằng 100%.");
    setLoading(true);
    setMessage("");
    try {
    if (useBank && bankSource !== "ai") {
      const requestedCount = Math.min(Math.max(bankCount || 1, 1), 50);
      const selected = bankPreview.valid.slice(0, requestedCount);
      if (!selected.length) {
        const emptyMessage = bankSource === "system"
          ? "Ngân hàng Soạn Lab hiện chưa có câu hỏi phù hợp với môn, lớp hoặc chủ đề này. Thầy cô có thể chọn ‘Tự tạo bằng AI’ hoặc dùng ‘Ngân hàng của tôi’."
          : bankSource === "user"
            ? "Ngân hàng của tôi chưa có câu hỏi phù hợp. Thầy cô có thể thêm câu hỏi, nhập từ Excel hoặc chọn Ngân hàng Soạn Lab."
            : "Chưa có đủ câu hỏi phù hợp trong các nguồn đã chọn. Thầy cô có thể giảm số câu hoặc để Soạn Lab tạo bổ sung bằng AI.";
        setDocument(null);
        setMessage(allowAiSupplement ? `${emptyMessage} Soạn Lab sẽ thử tạo đủ ${requestedCount} câu bằng AI.` : emptyMessage);
        if (!allowAiSupplement) {
          setLoading(false);
          return;
        }
      }
      if (selected.length < requestedCount && !allowAiSupplement) {
        setDocument(null);
        setMessage(`Hiện có ${selected.length} câu phù hợp trong nguồn đã chọn, nhưng thầy cô yêu cầu ${requestedCount} câu. Vui lòng giảm số câu, chọn chủ đề/nguồn khác hoặc bật “Cho phép AI tạo bổ sung”.`);
        setLoading(false);
        return;
      }
      const missingCount = requestedCount - selected.length;
      let aiQuestions: ExamQuestion[] = [];
      if (missingCount > 0 && allowAiSupplement) {
        const supplementInput: ExamInput & { questionType: string; questionCount: number; source: string; allowAiSupplement: boolean } = {
          ...input,
          examType: "Trắc nghiệm",
          multipleChoiceCount: missingCount,
          trueFalseCount: 0,
          shortAnswerCount: 0,
          essayCount: 0,
          questionType: "Trắc nghiệm",
          questionCount: missingCount,
          source: bankSource,
          allowAiSupplement: true,
          extraRequirements: `${input.extraRequirements}\nChỉ tạo ${missingCount} câu trắc nghiệm mới đúng môn ${input.subject}, lớp ${input.grade}, chủ đề ${input.topic}. Không dùng câu mẫu khác môn hoặc khác chủ đề.`.trim(),
        };
        const aiSupplement = await generateToolContent({ tool: "exam", input: supplementInput as unknown as Record<string, unknown> });
        aiQuestions = (aiSupplement.structuredExam?.parts.find((part) => part.type === "multiple_choice")?.questions || [])
          .filter((question) => question.options && ["A", "B", "C", "D"].every((key) => question.options?.[key as keyof typeof question.options]?.trim()) && ["A", "B", "C", "D"].includes(question.answer.trim().toUpperCase()))
          .slice(0, missingCount)
          .map((question, index) => ({ ...question, id: `ai-supplement-${index + 1}-${Date.now()}`, number: selected.length + index + 1, topic: input.topic }));
        if (aiQuestions.length < missingCount) {
          setDocument(null);
          setMessage(`Ngân hàng có ${selected.length} câu phù hợp nhưng chỉ tạo bổ sung được ${aiQuestions.length}/${missingCount} câu. Chưa tạo đề để tránh dùng câu không đúng bộ lọc.`);
          setLoading(false);
          return;
        }
      }
      const notes: string[] = [];
      if (aiQuestions.length) notes.push(`${aiQuestions.length} câu do AI tạo bổ sung là bản nháp; giáo viên cần rà soát trước khi sử dụng.`);
      if (bankPreview.invalidSkipped) notes.push("Một số câu trong ngân hàng chưa đủ phương án nên đã được bỏ qua.");
      if (difficultyMode === "suggested") notes.push("Một số mức độ có thể được điều chỉnh do số câu phù hợp trong ngân hàng chưa đủ.");

      const bankStructuredQuestions: ExamQuestion[] = selected.map((item, index) => ({
        id: item.id, part: "multiple_choice", number: index + 1, stem: item.question,
        options: { A: item.options?.A || "", B: item.options?.B || "", C: item.options?.C || "", D: item.options?.D || "" },
        answer: item.answer.trim().toUpperCase(), explanation: item.explanation || "",
        score: Number((input.totalScore / requestedCount).toFixed(2)), difficulty: item.difficulty, topic: item.topic,
      }));
      const allStructuredQuestions = [...bankStructuredQuestions, ...aiQuestions];
      const structuredExam: StructuredExam = {
        metadata: { title: `Đề kiểm tra ${input.subject} lớp ${input.grade}`, examStyle: input.examStyle, subject: input.subject, grade: input.grade, duration: input.duration, examCode: input.examCode.padStart(4, "0"), schoolName: input.schoolName },
        parts: [{ type: "multiple_choice", title: "PHẦN I. TRẮC NGHIỆM", instruction: "Chọn phương án đúng nhất trong mỗi câu.", questions: allStructuredQuestions }],
        teacherOnly: {
          scoringGuide: allStructuredQuestions.map((item, index) => `Câu ${index + 1}: ${item.answer} - ${item.explanation || "Rà soát lời giải."}`).join("\n"),
          matrix: `Nguồn: ${sourceLabel(bankSource)}\nSố câu ngân hàng: ${selected.length}\nSố câu AI bổ sung: ${aiQuestions.length}\nChủ đề: ${input.topic}`,
          specification: "Đề trắc nghiệm được tạo theo bộ lọc môn, lớp, chủ đề và nguồn đã chọn. Giáo viên cần rà soát trước khi sử dụng.",
          notes: notes.join("\n"),
        },
      };
      const sourceSummary = `Nguồn câu hỏi: ${sourceLabel(bankSource)}\n${selected.length} câu từ ngân hàng${aiQuestions.length ? `\n${aiQuestions.length} câu AI bổ sung` : ""}`;
      const rawContent = `${sourceSummary}\n\n${structuredExamToText(structuredExam, input)}`;
      const content = applyTemplate(resolveTemplate(templateId), rawContent, {
        subject: input.subject,
        grade: input.grade,
        topic: input.topic,
        bookSeries: input.bookSeries,
        duration: input.duration,
        extraRequirements: input.extraRequirements
      });
      const next = createDocument(`Đề kiểm tra ${input.subject} lớp ${input.grade}`, "exam", content);
      next.structuredExam = structuredExam;
      next.examMeta = {
        schoolName: input.schoolName,
        teacherName: input.teacherName,
        subject: input.subject,
        grade: input.grade,
        duration: input.duration,
        topic: input.topic,
        examCode: input.examCode.padStart(4, "0"),
        examStyle: input.examStyle
      };
      next.generationMeta = {
        source: "question-bank",
        bankSource: sourceLabel(bankSource),
        subject: input.subject,
        grade: input.grade,
        topic: input.topic,
        questionCount: allStructuredQuestions.length,
        bankQuestionCount: selected.length,
        aiQuestionCount: aiQuestions.length,
        allowAiSupplement,
        questionType: "Trắc nghiệm",
        warnings: notes,
      };
      setDocument(next);
      incrementUsage();
      setMessage(`Đã tạo đề với ${selected.length} câu từ ngân hàng${aiQuestions.length ? ` và ${aiQuestions.length} câu AI bổ sung` : ""}.`);
      setLoading(false);
      return;
    }
    const aiResult = await generateToolContent({ tool: "exam", input: input as unknown as Record<string, unknown> });
    const generatedRaw = aiResult.content;
    const generated = withSourceAlignmentNote(generatedRaw
      .replace(/\nI\.\s+/i, "\nBẢN DÀNH CHO HỌC SINH\n\nI. ")
      .replace(/\nIII\.\s+/i, "\nPHẦN DÀNH CHO GIÁO VIÊN\n\nIII. "), input as unknown as Record<string, unknown>);
    const wantsSystemBank = bankSource === "system" || bankSource === "both";
    const systemSubjectSupported = systemBankSubjects.some((subject) => normalizeText(subject) === normalizeText(input.subject));
    const hasNonMultipleChoiceParts = input.trueFalseCount > 0 || input.shortAnswerCount > 0 || input.essayCount > 0;
    const matching = bankSource === "ai" ? [] : bankQuestions.filter((item) => {
      const scope = questionScope(item);
      return item.subject.toLowerCase() === input.subject.toLowerCase()
        && item.grade.toLowerCase() === input.grade.toLowerCase()
        && (bankSource === "both" || scope === bankSource)
        && (scope !== "system" || (systemBankSubjects.some((subject) => normalizeText(subject) === normalizeText(item.subject)) && item.type === "Trắc nghiệm"))
        && (!input.topic || item.topic.toLowerCase().includes(input.topic.toLowerCase()) || input.topic.toLowerCase().includes(item.topic.toLowerCase()))
        && (!bankDifficulty || item.difficulty === bankDifficulty);
    }).sort((a, b) => {
      const aMatch = a.metadata?.bookSeries === input.bookSeries ? 1 : 0;
      const bMatch = b.metadata?.bookSeries === input.bookSeries ? 1 : 0;
      return bMatch - aMatch;
    }).slice(0, bankCount);
    const bankContent = useBank && matching.length
      ? `\n\nCÂU HỎI TỪ NGÂN HÀNG\n${matching.map(renderBankQuestion).join("\n\n")}`
      : "";
    const bankWarning = useBank && bankSource !== "ai" && !matching.length
      ? wantsSystemBank && !systemSubjectSupported
        ? systemBankSubjectNote
        : wantsSystemBank && hasNonMultipleChoiceParts
          ? systemBankTypeNote
          : "Chưa có câu hỏi trong nguồn đã chọn. Soạn Lab đã tạo bản nháp tham khảo để thầy cô rà soát."
      : "";
    const bankNote = bankWarning
      ? `\n\nLƯU Ý NGUỒN CÂU HỎI\n${bankWarning}`
      : "";
    const content = applyTemplate(resolveTemplate(templateId), generated + bankContent + bankNote, {
      subject: input.subject,
      grade: input.grade,
      topic: input.topic,
      bookSeries: input.bookSeries,
      duration: input.duration,
      extraRequirements: input.extraRequirements
    });
    const next = createDocument(`Đề kiểm tra ${input.subject} lớp ${input.grade}`, "exam", content);
    next.structuredExam = aiResult.structuredExam || createStructuredExam(input);
    next.examMeta = {
      schoolName: input.schoolName,
      teacherName: input.teacherName,
      subject: input.subject,
      grade: input.grade,
      duration: input.duration,
      topic: input.topic,
      examCode: input.examCode.padStart(4, "0"),
      examStyle: input.examStyle
    };
    setDocument(next);
    incrementUsage();
    setMessage(bankWarning || "Đã tạo đề kiểm tra thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo đề kiểm tra lúc này.");
    }
    setLoading(false);
  }

  function handleSave() {
    if (!document) return;
    saveDocument(document);
    setMessage("Đã lưu vào lịch sử.");
  }

  function handleRefined(content: string) {
    if (!document) return;
    setDocument({ ...document, content });
    setMessage("Đã tinh chỉnh nội dung.");
  }

  function useSampleData() {
    const settings = getDocumentSettings();
    setInput({ ...sampleExamInput, schoolName: settings.schoolName || sampleExamInput.schoolName, teacherName: settings.teacherName || sampleExamInput.teacherName });
    setMessage("Đã điền dữ liệu mẫu.");
  }

  function applyQuickPreset(values: Partial<ExamInput>, bank?: Partial<{ useBank: boolean; bankSource: BankSource; bankCount: number }>) {
    setInput((current) => ({ ...current, ...values }));
    if (typeof bank?.useBank === "boolean") setUseBank(bank.useBank);
    if (bank?.bankSource) setBankSource(bank.bankSource);
    if (bank?.bankCount) setBankCount(bank.bankCount);
    setMessage("Đã điền mẫu nhanh. Có thể chỉnh sửa nội dung sau khi tạo trước khi xuất file.");
  }

  return (
    <AppShell title="Tạo đề kiểm tra">
        <PageHeader title="Tạo đề kiểm tra" description="Tạo bản nháp đề kiểm tra, đáp án, thang điểm và ma trận trong vài phút." />
        <ToolWorkspaceLayout
          form={
          <form onSubmit={handleSubmit} className="tool-form-card">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <p className="text-sm font-black text-slate-900">Mẫu nhanh</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Chọn một gợi ý để điền nhanh các trường chính, rồi chỉnh lại theo lớp của thầy/cô.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickExamPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyQuickPreset(preset.values, preset.bank)}
                    className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={useSampleData} className="btn-secondary w-full">Điền thử mẫu nhanh</button>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <div><p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">Mẫu nhanh theo môn</p><PresetSelect presets={examPresets} onApply={(values) => setInput((current) => ({ ...current, ...values }))} /></div>
            <TemplateSelect type="Đề kiểm tra" value={templateId} onChange={setTemplateId} />
            <div className="form-section">
              <p className="form-section-title">Thông tin đề</p>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Tên trường/trung tâm</label><input className="form-field mt-1" value={input.schoolName} onChange={(e) => setInput({ ...input, schoolName: e.target.value })} /></div>
                  <div><label className="label">Tên giáo viên</label><input className="form-field mt-1" value={input.teacherName} onChange={(e) => setInput({ ...input, teacherName: e.target.value })} /></div>
                </div>
                <div><label className="label">Môn học</label><input className="form-field mt-1" value={input.subject} onChange={(e) => setInput({ ...input, subject: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Lớp</label><input className="form-field mt-1" value={input.grade} onChange={(e) => setInput({ ...input, grade: e.target.value })} /></div>
                  <div><label className="label">Thời gian làm bài</label><input className="form-field mt-1" value={input.duration ?? ""} onChange={(e) => setInput({ ...input, duration: e.target.value })} /></div>
                </div>
                <div>
                  <label className="label">Bộ sách / định hướng nội dung</label>
                  <select className="form-field mt-1" value={input.bookSeries} onChange={(e) => setInput({ ...input, bookSeries: e.target.value })}>{BOOK_SERIES_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select>
                  <p className="mt-1 text-xs leading-5 text-muted">{BOOK_SERIES_HELPER_TEXT}</p>
                </div>
                <div><label className="label">Chủ đề/chương</label><input className="form-field mt-1" value={input.topic} onChange={(e) => setInput({ ...input, topic: e.target.value })} /></div>
              </div>
            </div>
            <div className="form-section">
              <p className="form-section-title">Cấu trúc câu hỏi</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">Kiểu đề</label><select className="form-field mt-1" value={input.examStyle} onChange={(e) => setInput({ ...input, examStyle: e.target.value as ExamInput["examStyle"] })}><option>Kiểm tra thường</option><option>THPTQG / tốt nghiệp</option><option>Giữa kỳ</option><option>Cuối kỳ</option></select></div>
                <div><label className="label">Mức độ chung</label><select className="form-field mt-1" value={input.level} onChange={(e) => setInput({ ...input, level: e.target.value as ExamInput["level"] })}><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><label className="label">Số câu PHẦN I</label><input type="number" min="0" className="form-field mt-1" value={input.multipleChoiceCount ?? 0} onChange={(e) => setInput({ ...input, multipleChoiceCount: Number(e.target.value) })} /></div>
                <div><label className="label">Số câu PHẦN II</label><input type="number" min="0" className="form-field mt-1" value={input.trueFalseCount ?? 0} onChange={(e) => setInput({ ...input, trueFalseCount: Number(e.target.value) })} /></div>
                <div><label className="label">Số câu PHẦN III</label><input type="number" min="0" className="form-field mt-1" value={input.shortAnswerCount ?? 0} onChange={(e) => setInput({ ...input, shortAnswerCount: Number(e.target.value) })} /></div>
                <div><label className="label">Tổng điểm</label><input type="number" className="form-field mt-1" value={input.totalScore ?? 0} onChange={(e) => setInput({ ...input, totalScore: Number(e.target.value) })} /></div>
              </div>
              <div className="mt-3"><label className="label">Mã đề</label><input className="form-field mt-1 max-w-48" value={input.examCode ?? ""} onChange={(e) => setInput({ ...input, examCode: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></div>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-blue-700">Chủ đề & mức độ</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><label className="label">Tỉ lệ nhận biết</label><input type="number" className="form-field mt-1" value={input.recognitionRate ?? 0} onChange={(e) => setInput({ ...input, recognitionRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ thông hiểu</label><input type="number" className="form-field mt-1" value={input.understandingRate ?? 0} onChange={(e) => setInput({ ...input, understandingRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ vận dụng</label><input type="number" className="form-field mt-1" value={input.applicationRate ?? 0} onChange={(e) => setInput({ ...input, applicationRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ vận dụng cao</label><input type="number" className="form-field mt-1" value={input.advancedRate ?? 0} onChange={(e) => setInput({ ...input, advancedRate: Number(e.target.value) })} /></div>
              </div>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Xuất file</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeAnswers} onChange={(e) => setInput({ ...input, includeAnswers: e.target.checked })} /> Có tạo đáp án không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeRubric} onChange={(e) => setInput({ ...input, includeRubric: e.target.checked })} /> Có tạo thang điểm không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeMatrix} onChange={(e) => setInput({ ...input, includeMatrix: e.target.checked })} /> Có tạo ma trận đề không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeSpecification} onChange={(e) => setInput({ ...input, includeSpecification: e.target.checked })} /> Có bản đặc tả đề không</label>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Mẫu tài liệu / ngân hàng câu hỏi</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={useBank} onChange={(e) => setUseBank(e.target.checked)} /> Lấy câu hỏi từ ngân hàng câu hỏi</label>
              {useBank ? <>
                <div>
                  <label className="label">Nguồn câu hỏi</label>
                  <select className="form-field mt-1" value={bankSource} onChange={(e) => setBankSource(e.target.value as BankSource)}>
                    <option value="system">Ngân hàng Soạn Lab</option>
                    <option value="user">Ngân hàng của tôi</option>
                    <option value="both">Cả hai</option>
                    <option value="ai">Tự tạo bằng AI</option>
                  </select>
                  <div className="mt-2 space-y-1 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                    <p><strong>Ngân hàng Soạn Lab:</strong> Câu hỏi trắc nghiệm tham khảo theo định hướng Kết nối tri thức cho Vật lí và Hóa học.</p>
                    <p><strong>Ngân hàng của tôi:</strong> Câu hỏi do thầy cô tự thêm hoặc upload, chỉ tài khoản của thầy cô nhìn thấy.</p>
                    <p><strong>Cả hai:</strong> Kết hợp câu hỏi mẫu và câu hỏi riêng.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Mức độ</label><select className="form-field mt-1" value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value)}><option value="">Mọi mức độ</option>{["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((value) => <option key={value}>{value}</option>)}</select></div>
                  <div>
                    <label className="label">Số câu hỏi</label>
                    <input type="number" min="1" max="50" className="form-field mt-1" value={bankCount} onChange={(e) => setBankCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20].map((count) => <button key={count} type="button" className={`rounded-full px-2.5 py-1 text-[11px] font-black ${bankCount === count ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`} onClick={() => setBankCount(count)}>{count}</button>)}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">Phân bố mức độ</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="radio" checked={difficultyMode === "auto"} onChange={() => setDifficultyMode("auto")} />Tự động</label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="radio" checked={difficultyMode === "suggested"} onChange={() => setDifficultyMode("suggested")} />Theo tỉ lệ gợi ý 40% - 40% - 20%</label>
                  </div>
                </div>
                {bankSource !== "ai" ? (
                  <label className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
                    <input className="mt-1" type="checkbox" checked={allowAiSupplement} onChange={(event) => setAllowAiSupplement(event.target.checked)} />
                    <span><strong>Cho phép AI tạo bổ sung khi ngân hàng chưa đủ câu</strong><span className="mt-1 block text-xs leading-5 text-blue-800">Nếu ngân hàng chưa đủ câu, SOẠN LAB có thể tạo thêm câu hỏi bằng AI để thầy cô rà soát.</span></span>
                  </label>
                ) : null}
                {bankSource === "system" || bankSource === "both" ? (
                  <p className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                    Ngân hàng Soạn Lab hiện ưu tiên câu hỏi trắc nghiệm tham khảo cho Vật lí và Hóa học. Nếu thầy cô cần môn hoặc dạng câu hỏi khác, có thể chọn “Tự tạo bằng AI” hoặc “Ngân hàng của tôi”.
                  </p>
                ) : null}
                {bankSource === "ai" ? <p className="text-sm text-muted">Soạn Lab sẽ tự tạo bản nháp bằng AI, không lấy câu hỏi từ ngân hàng.</p> : bankPreview.valid.length ? (
                  <div className="max-h-40 space-y-2 overflow-auto rounded-md border border-line bg-white p-3 text-sm">
                    <p className="font-bold text-slate-900">Tìm thấy {bankPreview.valid.length} câu phù hợp để đưa vào đề.</p>
                    {bankPreview.valid.slice(0, Math.min(bankCount, 5)).map((item, index) => <div key={item.id} className="border-b border-line pb-2 last:border-0"><p><span className="font-bold text-blue-700">Câu {index + 1} · {questionScope(item) === "system" ? "Soạn Lab" : "Của tôi"}:</span> {item.question}</p><pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{formatQuestionOptions(item.options)}</pre></div>)}
                  </div>
                ) : <p className="text-sm text-muted">{(bankSource === "system" || bankSource === "both") && !systemBankSubjects.some((subject) => normalizeText(subject) === normalizeText(input.subject)) ? systemBankSubjectNote : (bankSource === "system" || bankSource === "both") && (input.trueFalseCount > 0 || input.shortAnswerCount > 0 || input.essayCount > 0) ? systemBankTypeNote : "Chưa có câu hỏi trong nguồn đã chọn. Thầy cô có thể chọn nguồn khác hoặc để Soạn Lab tạo bản nháp bằng AI."}</p>}
              </> : null}
            </div>
            <div><label className="label">Yêu cầu thêm</label><textarea className="form-field mt-1 min-h-24" value={input.extraRequirements} onChange={(e) => setInput({ ...input, extraRequirements: e.target.value })} /></div>
            <div className="tool-tip-card"><p className="font-bold text-blue-800">Mẹo trước khi tạo</p><p className="mt-1">Kiểm tra tổng tỉ lệ nhận thức bằng 100% và chọn đúng phần cần xuất để file Word gọn hơn.</p></div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo đề kiểm tra"}</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          }
          output={
            <ToolOutputPanel loading={loading} loadingTitle="Đang tạo đề kiểm tra..." loadingDescription="Soạn Lab đang soạn bản nháp có đáp án, thang điểm và ma trận." hasOutput={Boolean(document)} showWarning={false}>
              {document ? (
              <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool="exam" input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
              ) : null}
            </ToolOutputPanel>
          }
        />
    </AppShell>
  );
}
