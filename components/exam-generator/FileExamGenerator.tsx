"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Plus, Trash2, Upload } from "lucide-react";
import { OutputPreview } from "@/components/OutputPreview";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { ToolOutputPanel } from "@/components/tools/ToolOutputPanel";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import { auditConfigFromDocument, EXAM_AUDIT_SESSION_INPUT, withAuditResult } from "@/lib/exam-audit/document";
import { applySafeFixes } from "@/lib/exam-audit/fixes";
import { generateToolContent } from "@/lib/ai/client";
import { createSavedExamBlueprint, EXAM_BLUEPRINT_SESSION_KEY, getExamBlueprints, saveExamBlueprint, type SavedExamBlueprint } from "@/lib/exam-blueprints";
import { blueprintToExamInput, validateExamBlueprint } from "@/lib/exam-source/blueprint";
import { filterPreviousExamDuplicates } from "@/lib/exam-source/similarity";
import type { BlueprintBankMode, BlueprintQuestionType, ExamBlueprint, ExamSourceType, ParsedExamSource, PreviousExamMode } from "@/lib/exam-source/types";
import { sanitizeExamStructure } from "@/lib/exam/exam-structure";
import { getQuestions } from "@/lib/question-bank";
import { createDocument, saveDocument } from "@/lib/history";
import { structuredExamToText } from "@/lib/mock-exam-generator";
import type { ExamPartType, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import type { ExamInput, GeneratedDocument, QuestionItem } from "@/lib/types";

type ParseResponse = { ok: true; source: ParsedExamSource; blueprint: ExamBlueprint } | { ok: false; error: string; maintenance?: boolean; message?: string };

const sourceLabels: Record<ExamSourceType, string> = {
  matrix: "Ma trận đề", specification: "Bảng đặc tả", previous_exam: "Đề kiểm tra cũ", lesson_material: "Tài liệu bài học", unknown: "Không chắc, để SOẠN LAB nhận diện",
};

const typeLabels: Record<BlueprintQuestionType, string> = {
  multiple_choice: "Trắc nghiệm A/B/C/D", true_false: "Đúng/Sai", short_answer: "Trả lời ngắn", essay: "Tự luận", mixed: "Kết hợp",
};

const sourceHistoryLabels: Record<Exclude<ExamSourceType, "unknown">, string> = {
  matrix: "Tạo từ ma trận", specification: "Tạo từ bảng đặc tả", previous_exam: "Tạo từ đề cũ", lesson_material: "Tạo từ tài liệu",
};

function confidenceLabel(value: number) {
  if (value >= 0.75) return "Cao";
  if (value >= 0.5) return "Trung bình";
  return "Thấp";
}

function inputClass(confidence = 1) {
  return `form-field mt-1 ${confidence < 0.5 ? "border-amber-300 bg-amber-50" : ""}`;
}

function questionTypeOf(item: QuestionItem): ExamPartType | null {
  if (item.type === "Trắc nghiệm") return "multiple_choice";
  if (item.type === "Đúng/Sai") return "true_false";
  if (item.type === "Trả lời ngắn" || item.type === "Tự luận") return "short_answer";
  return null;
}

function bankQuestionToExam(item: QuestionItem, type: ExamPartType, index: number, score: number): ExamQuestion | null {
  if (type === "multiple_choice" && (!item.options || !(["A", "B", "C", "D"] as const).every((key) => item.options?.[key]?.trim()))) return null;
  if (type === "true_false") return null;
  return {
    id: item.id, part: type, number: index + 1, stem: item.question, options: type === "multiple_choice" ? item.options as ExamQuestion["options"] : undefined,
    answer: item.answer, explanation: item.explanation || "Giáo viên rà soát lời giải.", score, difficulty: item.difficulty, topic: item.topic,
    sourceMetadata: { bankScope: item.bankScope === "system" ? "system" : "user" },
  };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().trim();
}

function selectBankQuestions(blueprint: ExamBlueprint, input: ExamInput, mode: BlueprintBankMode) {
  if (mode === "ai_new") return [] as ExamQuestion[];
  const topics = blueprint.topicDistribution.map((topic) => normalize(topic.topic));
  const perQuestionScore = input.totalScore / Math.max(1, input.multipleChoiceCount + input.trueFalseCount + input.shortAnswerCount);
  const requested: Record<ExamPartType, number> = { multiple_choice: input.multipleChoiceCount, true_false: input.trueFalseCount, short_answer: input.shortAnswerCount };
  const used = new Set<string>();
  return getQuestions().flatMap((item) => {
    const type = questionTypeOf(item);
    if (!type || requested[type] <= 0 || used.has(item.id)) return [];
    if (normalize(item.subject) !== normalize(input.subject) || normalize(item.grade) !== normalize(input.grade)) return [];
    const itemTopic = normalize(item.topic);
    if (topics.length && !topics.some((topic) => itemTopic.includes(topic) || topic.includes(itemTopic))) return [];
    const converted = bankQuestionToExam(item, type, used.size, Number(perQuestionScore.toFixed(2)));
    if (!converted) return [];
    used.add(item.id);
    requested[type] -= 1;
    return [converted];
  });
}

function mergeExamQuestions(base: StructuredExam, additions: ExamQuestion[], prepend = true) {
  const next = JSON.parse(JSON.stringify(base)) as StructuredExam;
  for (const type of ["multiple_choice", "true_false", "short_answer"] as ExamPartType[]) {
    const items = additions.filter((item) => item.part === type);
    if (!items.length) continue;
    const part = next.parts.find((candidate) => candidate.type === type);
    if (part) part.questions = prepend ? [...items, ...part.questions] : [...part.questions, ...items];
    else next.parts.push({ type, title: type === "multiple_choice" ? "PHẦN I" : type === "true_false" ? "PHẦN II" : "PHẦN III", instruction: "", questions: items });
  }
  return next;
}

function sourceStems(source: ParsedExamSource | null) {
  return source?.previousExam?.parts.flatMap((part) => part.questions.map((question) => question.stem).filter(Boolean)) || [];
}

function filterOldExam(exam: StructuredExam, stems: string[]) {
  if (!stems.length) return { exam, rejected: 0 };
  let rejected = 0;
  const parts = exam.parts.map((part) => {
    const result = filterPreviousExamDuplicates(part.questions, stems, (question) => question.stem);
    rejected += result.rejected.length;
    return { ...part, questions: result.accepted };
  });
  return { exam: { ...exam, parts }, rejected };
}

function requestedCounts(input: ExamInput) {
  return { partI: input.multipleChoiceCount, partII: input.trueFalseCount, partIII: input.shortAnswerCount };
}

function allocateTopics(blueprint: ExamBlueprint, input: ExamInput) {
  const capacities = [input.multipleChoiceCount, input.trueFalseCount, input.shortAnswerCount];
  const topics = blueprint.topicDistribution.filter((topic) => (topic.totalQuestions || 0) > 0);
  if (!topics.length || topics.reduce((sum, topic) => sum + Number(topic.totalQuestions || 0), 0) !== capacities.reduce((sum, value) => sum + value, 0)) return [];
  let remaining = [...capacities];
  let remainingTotal = remaining.reduce((sum, value) => sum + value, 0);
  return topics.map((topic, topicIndex) => {
    const target = Number(topic.totalQuestions || 0);
    let allocation: number[];
    if (topicIndex === topics.length - 1) allocation = [...remaining];
    else {
      const raw = remaining.map((capacity) => remainingTotal ? target * capacity / remainingTotal : 0);
      allocation = raw.map((value, index) => Math.min(remaining[index], Math.floor(value)));
      let missing = target - allocation.reduce((sum, value) => sum + value, 0);
      raw.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((left, right) => right.fraction - left.fraction).forEach(({ index }) => {
        if (missing > 0 && allocation[index] < remaining[index]) { allocation[index] += 1; missing -= 1; }
      });
    }
    remaining = remaining.map((capacity, index) => capacity - allocation[index]);
    remainingTotal -= target;
    return { topic, counts: { multipleChoiceCount: allocation[0], trueFalseCount: allocation[1], shortAnswerCount: allocation[2] } };
  });
}

function auditAndSafelyFix(exam: StructuredExam, input: ExamInput) {
  const config = { expectedSectionCounts: requestedCounts(input), totalScore: input.totalScore, numericShortAnswers: /THPTQG|tốt nghiệp/iu.test(input.examStyle), requireFourOptions: true, requestedCognitiveRates: { recognition: input.recognitionRate, understanding: input.understandingRate, application: input.applicationRate, advanced: input.advancedRate } };
  const first = auditStructuredExam(exam, config);
  const safeIds = first.issues.filter((issue) => issue.canAutoFix && issue.fixKind !== "correct_answer").map((issue) => issue.id);
  const fixed = safeIds.length ? applySafeFixes(exam, first.issues, safeIds, config) : exam;
  return auditStructuredExam(fixed, config);
}

export function FileExamGenerator() {
  const [sourceType, setSourceType] = useState<ExamSourceType>("unknown");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [source, setSource] = useState<ParsedExamSource | null>(null);
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previousMode, setPreviousMode] = useState<PreviousExamMode>("same_structure_new_questions");
  const [bankMode, setBankMode] = useState<BlueprintBankMode>("ai_new");
  const [onlyDocumentKnowledge, setOnlyDocumentKnowledge] = useState(true);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedExamBlueprint[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setSavedBlueprints(getExamBlueprints());
      const restored = sessionStorage.getItem(EXAM_BLUEPRINT_SESSION_KEY);
      if (!restored) return;
      try { setBlueprint(JSON.parse(restored) as ExamBlueprint); setMessage("Đã khôi phục cấu trúc. Thầy cô vui lòng kiểm tra trước khi tạo đề."); } catch { /* Bỏ qua bản cũ không hợp lệ. */ }
      sessionStorage.removeItem(EXAM_BLUEPRINT_SESSION_KEY);
    });
  }, []);

  const validation = useMemo(() => blueprint ? validateExamBlueprint(blueprint) : null, [blueprint]);

  async function parseSource(forcedType: ExamSourceType = sourceType) {
    if (!file && !pastedText.trim()) return setMessage("Vui lòng chọn file hoặc dán nội dung cần đọc.");
    setLoading(true); setMessage(""); setDocument(null);
    try {
      let response: Response;
      if (file) {
        const form = new FormData(); form.set("file", file); form.set("sourceType", forcedType);
        response = await fetch("/api/exam-source/parse", { method: "POST", body: form });
      } else response = await fetch("/api/exam-source/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: pastedText, sourceType: forcedType }) });
      const result = await response.json() as ParseResponse;
      if (!result.ok) {
        if (result.maintenance) window.location.assign("/maintenance");
        throw new Error(result.error || result.message || "Chưa thể đọc cấu trúc.");
      }
      setSource(result.source); setBlueprint(result.blueprint);
      setSourceType(result.blueprint.sourceType);
      setMessage(result.blueprint.confidence.overall >= 0.75 ? "Đã đọc được cấu trúc chính của file." : result.blueprint.confidence.overall >= 0.5 ? "SOẠN LAB đã đọc được phần lớn cấu trúc. Thầy cô vui lòng kiểm tra các mục được đánh dấu." : "SOẠN LAB chưa xác định chắc chắn cấu trúc của file. Vui lòng chỉnh lại trước khi tạo đề.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể đọc cấu trúc."); }
    setLoading(false);
  }

  function updateBlueprint(patch: Partial<ExamBlueprint>) {
    setBlueprint((current) => current ? { ...current, ...patch } : current);
    setDocument(null);
  }

  async function selectDetectedType(type: ExamSourceType) {
    setSourceType(type);
    if ((file || pastedText.trim()) && blueprint?.sourceType !== type) {
      await parseSource(type);
      return;
    }
    if (blueprint) updateBlueprint({ sourceType: type, warnings: blueprint.warnings.filter((warning) => !["source_type_unknown", "source_type_required"].includes(warning.code)) });
  }

  function saveBlueprintTemplate() {
    if (!blueprint) return;
    const name = window.prompt("Tên mẫu cấu trúc", `${sourceLabels[blueprint.sourceType]} ${blueprint.subject || ""} ${blueprint.grade || ""}`.trim());
    if (!name?.trim()) return;
    const saved = createSavedExamBlueprint(name.trim(), blueprint);
    saveExamBlueprint(saved); setSavedBlueprints(getExamBlueprints()); setMessage("Đã lưu cấu trúc làm mẫu cá nhân.");
  }

  async function generateFromBlueprint() {
    if (!blueprint || !validation?.valid) return setMessage("Tổng số câu hoặc tổng điểm chưa khớp. Vui lòng sửa các lỗi cấu trúc trước khi tạo đề.");
    setLoading(true); setMessage("Đang tạo từng phần và kiểm tra cấu trúc..."); setDocument(null);
    try {
      const input = blueprintToExamInput(blueprint, {
        extraRequirements: `${blueprintToExamInput(blueprint).extraRequirements}\n${blueprint.sourceType === "previous_exam" ? `Chế độ đề cũ: ${previousMode}. Không sao chép nguyên câu, không chỉ thay số liệu nhỏ. Các câu nguồn cần tránh:\n${sourceStems(source).slice(0, 40).join("\n")}` : ""}\n${blueprint.sourceType === "lesson_material" && onlyDocumentKnowledge ? `Chỉ sử dụng kiến thức trong tài liệu nguồn sau, không thêm chủ đề ngoài tài liệu:\n${source?.text.slice(0, 24000) || blueprint.topicDistribution.map((topic) => topic.topic).join("; ")}` : ""}`.trim(),
      });
      const bankQuestions = selectBankQuestions(blueprint, input, bankMode);
      const bankCount: Record<ExamPartType, number> = { multiple_choice: 0, true_false: 0, short_answer: 0 };
      bankQuestions.forEach((question) => { bankCount[question.part] += 1; });
      if (bankMode === "bank_only" && (bankCount.multiple_choice < input.multipleChoiceCount || bankCount.true_false < input.trueFalseCount || bankCount.short_answer < input.shortAnswerCount)) throw new Error(`Ngân hàng chỉ có ${bankQuestions.length} câu phù hợp, chưa đủ cấu trúc đã chọn. Hãy đổi sang chế độ kết hợp hoặc tự tạo mới.`);
      const aiInput = { ...input, multipleChoiceCount: Math.max(0, input.multipleChoiceCount - bankCount.multiple_choice), trueFalseCount: Math.max(0, input.trueFalseCount - bankCount.true_false), shortAnswerCount: Math.max(0, input.shortAnswerCount - bankCount.short_answer) };
      let exam: StructuredExam;
      if (aiInput.multipleChoiceCount + aiInput.trueFalseCount + aiInput.shortAnswerCount > 0) {
        const topicAllocations = bankQuestions.length ? [] : allocateTopics(blueprint, aiInput);
        if (topicAllocations.length > 1) {
          exam = { metadata: { title: `Đề kiểm tra ${input.subject} lớp ${input.grade}`, examStyle: input.examStyle, subject: input.subject, grade: input.grade, duration: input.duration, examCode: input.examCode, totalScore: input.totalScore }, parts: [], teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: "" } };
          for (const allocation of topicAllocations) {
            const topicInput = { ...aiInput, ...allocation.counts, topic: allocation.topic.topic, extraRequirements: `${aiInput.extraRequirements}\nChỉ tạo câu thuộc chủ đề “${allocation.topic.topic}”. Yêu cầu cần đạt: ${allocation.topic.learningOutcomes?.join("; ") || "Theo ma trận đã xác nhận"}. Phân bố nhận thức của chủ đề: nhận biết ${allocation.topic.counts.recognition || 0}, thông hiểu ${allocation.topic.counts.comprehension || 0}, vận dụng ${allocation.topic.counts.application || 0}, vận dụng cao ${allocation.topic.counts.advancedApplication || 0}.` };
            const generated = await generateToolContent({ tool: "exam", input: topicInput as unknown as Record<string, unknown> });
            if (!generated.structuredExam) throw new Error(`SOẠN LAB chưa tạo được phần chủ đề “${allocation.topic.topic}”. Vui lòng thử lại.`);
            exam = mergeExamQuestions(exam, generated.structuredExam.parts.flatMap((part) => part.questions), false);
          }
        } else {
          const generated = await generateToolContent({ tool: "exam", input: aiInput as unknown as Record<string, unknown> });
          if (!generated.structuredExam) throw new Error("SOẠN LAB chưa tạo được nội dung phù hợp. Vui lòng thử lại.");
          exam = generated.structuredExam;
        }
        exam = mergeExamQuestions(exam, bankQuestions);
      } else {
        exam = { metadata: { title: `Đề kiểm tra ${input.subject} lớp ${input.grade}`, examStyle: input.examStyle, subject: input.subject, grade: input.grade, duration: input.duration, examCode: input.examCode, totalScore: input.totalScore }, parts: [], teacherOnly: { scoringGuide: "", matrix: "", specification: "", notes: "" } };
        exam = mergeExamQuestions(exam, bankQuestions);
      }
      let antiCopy = filterOldExam(exam, blueprint.sourceType === "previous_exam" ? sourceStems(source) : []);
      let structure = sanitizeExamStructure(antiCopy.exam, input as unknown as ExamInput & Record<string, unknown>);
      if (!structure.complete) {
        const retryInput = { ...input, multipleChoiceCount: structure.missing.partI, trueFalseCount: structure.missing.partII, shortAnswerCount: structure.missing.partIII, extraRequirements: `${input.extraRequirements}\nChỉ tạo phần còn thiếu. Tuyệt đối không lặp các câu đã có hoặc các câu trong đề cũ.` };
        const retry = await generateToolContent({ tool: "exam", input: retryInput as unknown as Record<string, unknown> });
        if (retry.structuredExam) {
          const supplements = retry.structuredExam.parts.flatMap((part) => part.questions);
          antiCopy = filterOldExam(mergeExamQuestions(structure.exam, supplements, false), blueprint.sourceType === "previous_exam" ? sourceStems(source) : []);
          structure = sanitizeExamStructure(antiCopy.exam, input as unknown as ExamInput & Record<string, unknown>);
        }
      }
      const audited = auditAndSafelyFix(structure.exam, input);
      const content = structuredExamToText(audited.exam, input);
      let next = createDocument(`Đề kiểm tra ${input.subject} lớp ${input.grade}`, "exam", content);
      next.structuredExam = audited.exam;
      next.examMeta = { subject: input.subject, grade: input.grade, duration: input.duration, topic: input.topic, examCode: input.examCode, examStyle: input.examStyle };
      next.generationMeta = {
        source: blueprint.sourceType, creationMode: blueprint.sourceType === "unknown" ? "manual" : blueprint.sourceType, sourceFileName: blueprint.sourceName, sourceType: blueprint.sourceType,
        normalizedBlueprint: blueprint, sourceContentHash: blueprint.sourceContentHash, generatedAt: new Date().toISOString(), auditStatus: audited.summary.readiness,
        subject: input.subject, grade: input.grade, topic: input.topic, questionCount: audited.summary.totalQuestions, requestedCount: validation.totals.sectionQuestions,
        finalCount: audited.summary.totalQuestions, isPartial: audited.summary.totalQuestions !== validation.totals.sectionQuestions,
        requestedSectionCounts: requestedCounts(input), generatedSectionCounts: { partI: audited.exam.parts.find((part) => part.type === "multiple_choice")?.questions.length || 0, partII: audited.exam.parts.find((part) => part.type === "true_false")?.questions.length || 0, partIII: audited.exam.parts.find((part) => part.type === "short_answer")?.questions.length || 0 },
        bankSource: bankMode, bankQuestionCount: bankQuestions.length, aiQuestionCount: Math.max(0, audited.summary.totalQuestions - bankQuestions.length), duplicateRemovedCount: structure.duplicateRemovedCount + antiCopy.rejected,
        requestedTotalScore: input.totalScore, requestedCognitiveRates: { recognition: input.recognitionRate, understanding: input.understandingRate, application: input.applicationRate, advanced: input.advancedRate },
        warnings: [...blueprint.warnings.map((warning) => warning.message), ...(antiCopy.rejected ? [`Đã loại ${antiCopy.rejected} câu trùng hoặc gần trùng đề cũ.`] : [])],
      };
      next = withAuditResult(next, audited);
      setDocument(next);
      setMessage(audited.summary.errorCount ? "Đề đã tạo nhưng vẫn còn lỗi cần rà soát." : `Đã tạo ${audited.summary.totalQuestions}/${validation.totals.sectionQuestions} câu và đưa qua công cụ kiểm tra đề.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể tạo đề lúc này."); }
    setLoading(false);
  }

  function openAudit() {
    if (!document) return;
    sessionStorage.setItem(EXAM_AUDIT_SESSION_INPUT, JSON.stringify({ document, config: auditConfigFromDocument(document), source: "generator" }));
    window.location.assign("/tools/exam-audit");
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="tool-form-card min-w-0">
        {!blueprint ? <>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex gap-3"><FileSpreadsheet className="mt-0.5 text-blue-700" /><div><h2 className="font-black text-slate-950">Tạo đề từ cấu trúc có sẵn</h2><p className="mt-1 text-sm leading-6 text-slate-700">Đọc ma trận, bảng đặc tả, đề cũ hoặc tài liệu bài học. SOẠN LAB chỉ tạo đề sau khi thầy cô xác nhận cấu trúc.</p></div></div></div>
          <div className="form-section"><label className="label">Loại nguồn</label><select className="form-field mt-1" value={sourceType} onChange={(event) => setSourceType(event.target.value as ExamSourceType)}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-white p-5 text-center hover:bg-blue-50"><Upload className="text-blue-700" /><span className="mt-2 font-bold text-slate-900">{file?.name || "Chọn file Excel, CSV, Word, PDF hoặc TXT"}</span><span className="mt-1 text-xs text-slate-500">Tối đa 8MB · PDF cần có lớp văn bản</span><input className="hidden" type="file" accept=".xlsx,.csv,.docx,.pdf,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
          <div><label className="label">Hoặc dán văn bản có cấu trúc</label><textarea className="form-field mt-1 min-h-36" value={pastedText} onChange={(event) => setPastedText(event.target.value)} placeholder="Dán ma trận, bảng đặc tả, đề cũ hoặc nội dung bài học..." /></div>
          <button type="button" className="btn-primary w-full" disabled={loading} onClick={() => void parseSource()}>{loading ? "Đang đọc cấu trúc..." : "Đọc và kiểm tra cấu trúc"}</button>
          {savedBlueprints.length ? <div><label className="label">Mẫu cấu trúc đã lưu</label><select className="form-field mt-1" defaultValue="" onChange={(event) => { const item = savedBlueprints.find((candidate) => candidate.id === event.target.value); if (item) { setBlueprint(item.blueprint); setSourceType(item.sourceType); setMessage("Đã mở mẫu cấu trúc. Thầy cô vui lòng kiểm tra trước khi tạo đề."); } }}><option value="">Chọn mẫu...</option>{savedBlueprints.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
        </> : <>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-blue-700">Kiểm tra cấu trúc đã đọc</p><h2 className="mt-1 text-xl font-black text-slate-950">{blueprint.sourceName || "Cấu trúc đề"}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${blueprint.confidence.overall >= 0.75 ? "bg-emerald-100 text-emerald-700" : blueprint.confidence.overall >= 0.5 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>Độ tin cậy: {confidenceLabel(blueprint.confidence.overall)}</span></div>
          <div className="grid gap-2 sm:grid-cols-2"><div><label className="label">Loại nguồn</label><select className={inputClass(blueprint.confidence.fields.sourceType)} value={blueprint.sourceType} onChange={(event) => void selectDetectedType(event.target.value as ExamSourceType)}>{Object.entries(sourceLabels).filter(([value]) => value !== "unknown").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="label">Tổng điểm</label><input type="number" min="0" step="0.25" className={inputClass()} value={blueprint.totalScore ?? 0} onChange={(event) => updateBlueprint({ totalScore: Number(event.target.value) })} /></div><div><label className="label">Môn học</label><input className={inputClass(blueprint.confidence.fields.subject)} value={blueprint.subject ?? ""} onChange={(event) => updateBlueprint({ subject: event.target.value })} /></div><div><label className="label">Khối lớp</label><input className={inputClass(blueprint.confidence.fields.grade)} value={blueprint.grade ?? ""} onChange={(event) => updateBlueprint({ grade: event.target.value })} /></div><div><label className="label">Loại kỳ kiểm tra</label><input className={inputClass()} value={blueprint.examType ?? ""} onChange={(event) => updateBlueprint({ examType: event.target.value })} /></div><div><label className="label">Thời gian (phút)</label><input type="number" min="1" className={inputClass()} value={blueprint.durationMinutes ?? 45} onChange={(event) => updateBlueprint({ durationMinutes: Number(event.target.value) })} /></div></div>
          <div><div className="flex items-center justify-between"><p className="form-section-title">Cấu trúc đề</p><button type="button" className="btn-secondary" onClick={() => updateBlueprint({ sections: [...blueprint.sections, { id: crypto.randomUUID(), title: `Phần ${blueprint.sections.length + 1}`, questionType: "multiple_choice", questionCount: 1, score: 0 }] })}><Plus size={15} /> Thêm phần</button></div><div className="mt-2 overflow-x-auto"><table className="min-w-[680px] text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500"><th className="p-2">Tên phần</th><th className="p-2">Dạng câu</th><th className="p-2">Số câu</th><th className="p-2">Điểm</th><th /></tr></thead><tbody>{blueprint.sections.map((section, index) => <tr key={section.id} className="border-t border-slate-100"><td className="p-1"><input className="form-field" value={section.title} onChange={(event) => updateBlueprint({ sections: blueprint.sections.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} /></td><td className="p-1"><select className="form-field" value={section.questionType} onChange={(event) => updateBlueprint({ sections: blueprint.sections.map((item, itemIndex) => itemIndex === index ? { ...item, questionType: event.target.value as BlueprintQuestionType, statementsPerQuestion: event.target.value === "true_false" ? 4 : undefined } : item) })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="p-1"><input type="number" min="0" className="form-field w-24" value={section.questionCount} onChange={(event) => updateBlueprint({ sections: blueprint.sections.map((item, itemIndex) => itemIndex === index ? { ...item, questionCount: Number(event.target.value) } : item) })} /></td><td className="p-1"><input type="number" min="0" step="0.25" className="form-field w-24" value={section.score} onChange={(event) => updateBlueprint({ sections: blueprint.sections.map((item, itemIndex) => itemIndex === index ? { ...item, score: Number(event.target.value) } : item) })} /></td><td className="p-1"><button type="button" aria-label="Xóa phần" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => updateBlueprint({ sections: blueprint.sections.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>
          <div><div className="flex items-center justify-between"><p className="form-section-title">Phân bố nội dung</p><button type="button" className="btn-secondary" onClick={() => updateBlueprint({ topicDistribution: [...blueprint.topicDistribution, { topic: "Chủ đề mới", counts: {}, totalQuestions: 1, totalScore: 0 }] })}><Plus size={15} /> Thêm chủ đề</button></div><div className="mt-2 overflow-x-auto"><table className="min-w-[920px] text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500"><th className="p-2">Chủ đề</th><th>Nhận biết</th><th>Thông hiểu</th><th>Vận dụng</th><th>Vận dụng cao</th><th>Số câu</th><th>Điểm</th><th /></tr></thead><tbody>{blueprint.topicDistribution.map((topic, index) => <tr key={`${topic.topic}-${index}`} className="border-t border-slate-100"><td className="p-1"><input className="form-field min-w-48" value={topic.topic} onChange={(event) => updateBlueprint({ topicDistribution: blueprint.topicDistribution.map((item, itemIndex) => itemIndex === index ? { ...item, topic: event.target.value } : item) })} /></td>{(["recognition", "comprehension", "application", "advancedApplication"] as const).map((key) => <td className="p-1" key={key}><input type="number" min="0" className="form-field w-20" value={topic.counts[key] ?? 0} onChange={(event) => updateBlueprint({ topicDistribution: blueprint.topicDistribution.map((item, itemIndex) => itemIndex === index ? { ...item, counts: { ...item.counts, [key]: Number(event.target.value) } } : item) })} /></td>)}<td className="p-1"><input type="number" min="0" className="form-field w-20" value={topic.totalQuestions ?? 0} onChange={(event) => updateBlueprint({ topicDistribution: blueprint.topicDistribution.map((item, itemIndex) => itemIndex === index ? { ...item, totalQuestions: Number(event.target.value) } : item) })} /></td><td className="p-1"><input type="number" min="0" step="0.25" className="form-field w-20" value={topic.totalScore ?? 0} onChange={(event) => updateBlueprint({ topicDistribution: blueprint.topicDistribution.map((item, itemIndex) => itemIndex === index ? { ...item, totalScore: Number(event.target.value) } : item) })} /></td><td><button type="button" aria-label="Xóa chủ đề" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => updateBlueprint({ topicDistribution: blueprint.topicDistribution.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>
          {blueprint.sourceType === "previous_exam" ? <div><label className="label">Cách dùng đề cũ</label><select className="form-field mt-1" value={previousMode} onChange={(event) => setPreviousMode(event.target.value as PreviousExamMode)}><option value="same_structure_new_questions">Giữ nguyên cấu trúc, tạo câu hỏi mới</option><option value="equivalent_difficulty">Giữ cấu trúc và mức độ tương đương</option><option value="topics_and_types">Chỉ lấy chủ đề và dạng câu hỏi</option><option value="reference_only">Dùng đề cũ làm tài liệu tham khảo</option></select><p className="mt-2 text-xs leading-5 text-blue-800">Đề mới được tạo theo cấu trúc của đề cũ, không sao chép nguyên câu hỏi.</p></div> : null}
          {blueprint.sourceType === "lesson_material" ? <label className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm"><input className="mt-1" type="checkbox" checked={onlyDocumentKnowledge} onChange={(event) => setOnlyDocumentKnowledge(event.target.checked)} /><span><strong>Chỉ sử dụng kiến thức trong tài liệu</strong><span className="mt-1 block text-xs text-blue-800">Đang bật mặc định để tránh tạo câu ngoài tài liệu đã tải lên.</span></span></label> : null}
          <div><label className="label">Nguồn câu hỏi</label><select className="form-field mt-1" value={bankMode} onChange={(event) => setBankMode(event.target.value as BlueprintBankMode)}><option value="ai_new">Chỉ tạo câu hỏi mới</option><option value="prefer_bank">Ưu tiên ngân hàng câu hỏi</option><option value="combine">Kết hợp ngân hàng câu hỏi và tạo mới</option><option value="bank_only">Chỉ dùng ngân hàng câu hỏi</option></select><p className="mt-1 text-xs text-slate-500">Ngân hàng chỉ lấy câu phù hợp môn, lớp, chủ đề và phạm vi tài khoản hiện tại.</p></div>
          {validation ? <div className={`rounded-2xl border p-4 ${validation.errors.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}><div className="flex gap-2">{validation.errors.length ? <AlertTriangle className="shrink-0 text-red-600" /> : <CheckCircle2 className="shrink-0 text-emerald-600" />}<div><p className="font-black text-slate-950">{validation.errors.length ? "Cần sửa trước khi tạo đề" : "Cấu trúc đã sẵn sàng để xác nhận"}</p><p className="mt-1 text-sm">{validation.totals.sectionQuestions} câu · {blueprint.totalScore || 0} điểm · {blueprint.topicDistribution.length} chủ đề</p>{[...validation.errors, ...validation.warnings].map((issue) => <p key={issue.code} className="mt-1 text-xs leading-5">• {issue.message}</p>)}</div></div></div> : null}
          <div className="flex flex-wrap gap-2"><button type="button" className="btn-primary flex-1" disabled={loading || !validation?.valid} onClick={generateFromBlueprint}>{loading ? "Đang tạo và rà soát..." : "Xác nhận cấu trúc và tạo đề"}</button><button type="button" className="btn-secondary" onClick={saveBlueprintTemplate}>Lưu làm mẫu</button><button type="button" className="btn-secondary" onClick={() => { setBlueprint(null); setSource(null); setDocument(null); setFile(null); setMessage(""); }}>Chọn file khác</button></div>
        </>}
        {message ? <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">{message}</p> : null}
      </section>
      <ToolOutputPanel loading={loading && Boolean(blueprint)} loadingTitle="Đang tạo đề theo cấu trúc..." loadingDescription="SOẠN LAB đang tạo từng phần, bổ sung phần thiếu và rà soát chất lượng." hasOutput={Boolean(document)} showWarning={false}>
        {document ? <><div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black uppercase text-blue-700">{blueprint && blueprint.sourceType !== "unknown" ? sourceHistoryLabels[blueprint.sourceType] : "Tạo từ file"}</p><p className="mt-1 text-sm font-bold text-slate-950">Rà soát chất lượng: {document.auditMeta?.errorCount ? `${document.auditMeta.errorCount} lỗi cần kiểm tra` : "Đã hoàn tất kiểm tra cấu trúc"}</p></div><button type="button" className="btn-primary" onClick={openAudit}>Mở công cụ Kiểm tra đề</button></div></div><ToolOutputActions document={document} onSave={() => { saveDocument(document); setMessage("Đã lưu đề và cấu trúc nguồn vào lịch sử."); }} onGenerateAgain={generateFromBlueprint} /><OutputPreview document={document} /></> : null}
      </ToolOutputPanel>
    </div>
  );
}
