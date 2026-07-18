"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Download,
  FileCheck2,
  Presentation,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { OutputPreview } from "@/components/OutputPreview";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import {
  AssessmentDisclosure,
  useUnsavedAssessmentWarning,
} from "@/components/assessment/AssessmentWorkspace";
import { AssessmentSourcePicker } from "@/components/assessment/AssessmentSourcePicker";
import {
  buildDeterministicSolutionSet,
  solutionSummary,
} from "@/lib/answer-solutions/verify";
import { solutionSetToDocument } from "@/lib/answer-solutions/document";
import { exportSolutionZip } from "@/lib/answer-solutions/export";
import { ANSWER_SOLUTIONS_SESSION_KEY } from "@/lib/answer-solutions/session";
import { applySolutionAnswerToDocument } from "@/lib/answer-solutions/update";
import type {
  ExamSolutionSet,
  QuestionSolution,
  SemanticSolutionPatch,
  SolutionDetailLevel,
} from "@/lib/answer-solutions/types";
import {
  getCloudDocument,
  listCloudDocuments,
} from "@/lib/data/documents-store";
import { parseExamText } from "@/lib/exam-audit/normalize";
import type { StructuredExam } from "@/lib/exam-types";
import { createDocument, getHistory, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { openLessonSlides } from "@/lib/lesson-slides/source";
import { openGradingAssistant } from "@/lib/grading/session";
import { openAnswerSheet } from "@/lib/answer-sheet/session";
import { openWorksheetGenerator } from "@/lib/worksheet/session";

type Mode = "quick" | "detailed" | "verify";
type SolutionView = "overview" | "student" | "quick" | "detailed" | "scoring";
type Filter = "all" | "verified" | "mismatch" | "uncertain" | "missing";

function parseSession() {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(ANSWER_SOLUTIONS_SESSION_KEY) || "null",
    ) as GeneratedDocument | null;
    return value?.structuredExam ? value : null;
  } catch {
    return null;
  }
}

function statusLabel(solution: QuestionSolution) {
  if (solution.answerStatus === "matches") return "Đã xác nhận";
  if (solution.answerStatus === "mismatch") return "Có cảnh báo";
  if (solution.answerStatus === "uncertain") return "Cần giáo viên xác nhận";
  return "Chưa kiểm tra";
}

function statusTone(solution: QuestionSolution) {
  if (solution.answerStatus === "matches")
    return "bg-emerald-100 text-emerald-800";
  if (solution.answerStatus === "mismatch") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-900";
}

export function AnswerSolutionsWorkspace() {
  const searchParams = useSearchParams();
  const [source, setSource] = useState<GeneratedDocument | null>(null);
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [solutionSet, setSolutionSet] = useState<ExamSolutionSet | null>(null);
  const [mode, setMode] = useState<Mode>("quick");
  const [view, setView] = useState<SolutionView>("overview");
  const [detailLevel, setDetailLevel] =
    useState<SolutionDetailLevel>("standard");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewId, setReviewId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSource, setPendingSource] =
    useState<GeneratedDocument | null>(null);
  const [pendingNote, setPendingNote] = useState("");
  const [selectedSourceMethod, setSelectedSourceMethod] = useState("");

  useUnsavedAssessmentWarning(hasUnsavedChanges);

  useEffect(() => {
    queueMicrotask(async () => {
      const docs = (await listCloudDocuments()) ?? getHistory();
      const exams = docs.filter((item) => item.structuredExam);
      setHistory(exams);
      const historyId = searchParams.get("history");
      const saved = historyId
        ? ((await getCloudDocument(historyId)) ??
          exams.find((item) => item.id === historyId))
        : null;
      const initial = saved?.structuredExam ? saved : parseSession();
      if (initial)
        stageSource(
          initial,
          "Đề đã sẵn sàng. Bấm tiếp tục để kiểm tra đáp án.",
          saved?.structuredExam ? "history" : "current",
        );
    });
    // Chỉ nạp nguồn ban đầu một lần.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stageSource(
    document: GeneratedDocument,
    note: string,
    method: "current" | "upload" | "history" | "paste",
  ) {
    if (!document.structuredExam) {
      setMessage("Tài liệu chưa có cấu trúc đề hợp lệ.");
      return;
    }
    setPendingSource(document);
    setPendingNote(note);
    setSelectedSourceMethod(method);
    setMessage(note);
  }

  function confirmPendingSource() {
    if (!pendingSource) return;
    loadSource(
      pendingSource,
      pendingNote || "Đã nạp đề để tạo lời giải và kiểm tra đáp án.",
    );
    setPendingSource(null);
  }

  function loadSource(document: GeneratedDocument, note = "Đã nạp đề.") {
    if (!document.structuredExam)
      return setMessage("Tài liệu chưa có cấu trúc đề hợp lệ.");
    const originalExam =
      document.examVariantSet?.sourceExamSnapshot ?? document.structuredExam;
    const normalized = { ...document, structuredExam: originalExam };
    const next = buildDeterministicSolutionSet(originalExam, {
      examId: document.id,
      detailLevel,
      previous: document.examSolutionSet,
    });
    setSource(normalized);
    setSolutionSet(next);
    setHasUnsavedChanges(false);
    setSelected(
      next.questions
        .filter((item) => item.answerStatus !== "matches")
        .map((item) => item.questionId),
    );
    setMessage(note);
  }

  function regenerateDeterministic(level = detailLevel) {
    if (!source?.structuredExam)
      return setMessage("Vui lòng chọn một đề trước.");
    const next = buildDeterministicSolutionSet(source.structuredExam, {
      examId: source.id,
      detailLevel: level,
      previous: solutionSet || source.examSolutionSet,
    });
    setSolutionSet(next);
    setHasUnsavedChanges(true);
    setDetailLevel(level);
    setMessage(
      `Đã kiểm tra xác định ${next.summary.deterministicVerifiedCount}/${next.summary.totalQuestions} câu. Các câu còn lại cần giáo viên xác nhận hoặc tạo lời giải bổ sung.`,
    );
  }

  function usePaste() {
    if (pasteText.trim().length < 20)
      return setMessage("Vui lòng dán nội dung đề đầy đủ hơn.");
    const parsed = parseExamText(pasteText);
    const document = createDocument(
      parsed.exam.metadata.title || "Đề đã dán",
      "exam",
      pasteText,
    );
    document.structuredExam = parsed.exam;
    stageSource(
      document,
      parsed.warnings[0] || "Đã nhận diện đề từ văn bản đã dán.",
      "paste",
    );
  }

  async function upload(file?: File) {
    if (!file) return;
    setLoading(true);
    setMessage("Đang đọc file…");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/exam-audit/import", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        exam?: StructuredExam;
        error?: string;
        maintenance?: boolean;
      };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.exam)
        throw new Error(data.error || "Chưa thể đọc file đề.");
      const document = createDocument(
        data.exam.metadata.title || file.name,
        "exam",
        "Đề được nhập từ file để tạo lời giải.",
      );
      document.structuredExam = data.exam;
      stageSource(
        document,
        "Đã đọc file. Vui lòng kiểm tra lại cấu trúc trước khi dùng lời giải.",
        "upload",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Chưa thể đọc file đề.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateSemantic(onlyQuestionIds?: string[]) {
    if (!source?.structuredExam || !solutionSet) return;
    const questionIds = onlyQuestionIds?.length
      ? onlyQuestionIds
      : selected.length
        ? selected
        : solutionSet.questions
            .filter((item) => item.answerStatus !== "matches")
            .map((item) => item.questionId);
    if (!questionIds.length)
      return setMessage(
        "Các câu đã được xác minh xác định; không cần tạo lại.",
      );
    setLoading(true);
    setMessage(
      `Đang kiểm tra ${Math.min(questionIds.length, 15)} câu đã chọn…`,
    );
    try {
      const response = await fetch("/api/answer-solutions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: source.structuredExam,
          questionIds: questionIds.slice(0, 15),
          detailLevel,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        questions?: SemanticSolutionPatch[];
        error?: string;
        maintenance?: boolean;
      };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.ok)
        throw new Error(data.error || "Một số câu chưa tạo được lời giải.");
      const patches = new Map(
        (data.questions || []).map((item) => [item.questionId, item]),
      );
      const questions = solutionSet.questions.map((item) =>
        patches.has(item.questionId)
          ? {
              ...item,
              ...patches.get(item.questionId),
              contentHash: item.contentHash,
            }
          : item,
      );
      setSolutionSet({
        ...solutionSet,
        questions,
        generatedAt: new Date().toISOString(),
        summary: solutionSummary(questions, solutionSet.summary.cacheHitCount),
      });
      setHasUnsavedChanges(true);
      setMessage(
        `Đã bổ sung lời giải cho ${patches.size} câu. Thầy cô cần rà soát trước khi áp dụng đáp án đề xuất.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Một số câu chưa tạo được lời giải. Thầy cô có thể thử lại riêng các câu này.",
      );
    } finally {
      setLoading(false);
    }
  }

  function saveCurrent() {
    if (!source || !solutionSet) return;
    const next = { ...source, examSolutionSet: solutionSet };
    saveDocument(next);
    setSource(next);
    setHasUnsavedChanges(false);
    setMessage(
      "Đã lưu lời giải vào đúng bản ghi đề trong lịch sử, không tạo bản sao đề mới.",
    );
  }

  function applyAnswer(solution: QuestionSolution) {
    if (!source || !solutionSet) return;
    try {
      const changed = applySolutionAnswerToDocument(source, solution);
      const nextSet = buildDeterministicSolutionSet(changed.structuredExam!, {
        examId: changed.id,
        detailLevel,
        previous: solutionSet,
      });
      const next = { ...changed, examSolutionSet: nextSet };
      setSource(next);
      setSolutionSet(nextSet);
      setReviewId("");
      saveDocument(next);
      setHasUnsavedChanges(false);
      setMessage(
        "Đã áp dụng đáp án có độ tin cậy cao, làm mới kiểm tra liên quan và tái tạo ánh xạ mã đề.",
      );
    } catch {
      setMessage(
        "Chỉ có thể áp dụng tự động khi đáp án không khớp và độ tin cậy cao.",
      );
    }
  }

  function updateSolution(id: string, detailedSolution: string) {
    if (!solutionSet) return;
    const questions = solutionSet.questions.map((item) =>
      item.questionId === id
        ? { ...item, detailedSolution, teacherConfirmed: true }
        : item,
    );
    setSolutionSet({
      ...solutionSet,
      questions,
      summary: solutionSummary(questions, solutionSet.summary.cacheHitCount),
    });
    setHasUnsavedChanges(true);
  }

  const examQuestions = useMemo(
    () =>
      new Map(
        source?.structuredExam?.parts.flatMap((part) =>
          part.questions.map((question) => [question.id, question] as const),
        ) || [],
      ),
    [source],
  );
  const shown =
    solutionSet?.questions.filter(
      (item) =>
        filter === "all" ||
        (filter === "verified" && item.answerStatus === "matches") ||
        (filter === "mismatch" && item.answerStatus === "mismatch") ||
        (filter === "uncertain" &&
          ["uncertain", "not_verified"].includes(item.answerStatus)) ||
        (filter === "missing" && !item.detailedSolution),
    ) || [];
  const review = solutionSet?.questions.find(
    (item) => item.questionId === reviewId,
  );
  const quickDocument =
    source && solutionSet
      ? solutionSetToDocument(source, solutionSet, "quick")
      : null;
  const detailedDocument =
    source && solutionSet
      ? solutionSetToDocument(source, solutionSet, "detailed")
      : null;
  const scoringDocument =
    source && solutionSet
      ? solutionSetToDocument(source, solutionSet, "scoring")
      : null;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      {detailedDocument ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openLessonSlides(detailedDocument, "solution")}
          >
            <Presentation size={16} />
            Tạo slide chữa đề
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openWorksheetGenerator(detailedDocument, "solution")}
          >
            <FileCheck2 size={16} />
            Tạo phiếu chữa bài
          </button>
        </div>
      ) : null}
      <section className="rounded-[30px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              <FileCheck2 size={14} />
              Dành riêng cho giáo viên
            </span>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Lời giải &amp; đáp án
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Tạo đáp án nhanh, lời giải chi tiết và kiểm tra độc lập đáp án
              trên cùng cấu trúc đề đã có.
            </p>
          </div>
          <Link href="/tools/exam-audit" className="btn-secondary">
            <ClipboardCheck size={16} />
            Mở công cụ Kiểm tra đề
          </Link>
        </div>
        <AssessmentSourcePicker
          selectedId={selectedSourceMethod}
          continueLabel={
            pendingSource ? "Tiếp tục kiểm tra đáp án" : undefined
          }
          continueHint="SOẠN LAB chỉ tạo bộ lời giải sau khi thầy cô xác nhận nguồn đề."
          onContinue={pendingSource ? confirmPendingSource : undefined}
          options={[
            {
              id: "current",
              title: "Đề hiện tại",
              description:
                "Nhận đề từ công cụ tạo đề, kiểm tra đề hoặc trộn mã.",
              icon: ClipboardCheck,
              action: (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const current = parseSession();
                    if (current)
                      stageSource(
                        current,
                        "Đã chọn đề hiện tại.",
                        "current",
                      );
                    else setMessage("Chưa có đề hiện tại trong phiên này.");
                  }}
                >
                  Nạp đề hiện tại
                </button>
              ),
            },
            {
              id: "upload",
              title: "Tải DOCX, PDF hoặc TXT",
              description: "Dùng bộ nhận diện đề hiện có.",
              icon: Upload,
              action: (
                <label className="btn-secondary inline-flex cursor-pointer">
                  <Upload size={16} />
                  {loading ? "Đang xử lý…" : "Chọn file"}
                  <input
                    className="hidden"
                    type="file"
                    accept=".docx,.pdf,.txt"
                    disabled={loading}
                    onChange={(event) => void upload(event.target.files?.[0])}
                  />
                </label>
              ),
            },
            {
              id: "history",
              title: "Lịch sử của thầy/cô",
              description: "Chọn đề đã lưu để kiểm tra lại đáp án.",
              icon: FileCheck2,
              action: (
                <select
                  aria-label="Chọn đề đã lưu"
                  className="form-field"
                  value={
                    selectedSourceMethod === "history"
                      ? pendingSource?.id || source?.id || ""
                      : ""
                  }
                  onChange={(event) => {
                    const item = history.find(
                      (document) => document.id === event.target.value,
                    );
                    if (item)
                      stageSource(item, "Đã chọn đề từ lịch sử.", "history");
                  }}
                >
                  <option value="">Chọn đề đã lưu…</option>
                  {history.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
          secondary={
            <AssessmentDisclosure
              title="Dán nội dung đề"
              description="Dùng khi thầy cô chưa có file hoặc đề trong lịch sử."
            >
              <textarea
                className="form-field min-h-36"
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder="Dán đầy đủ nội dung đề và đáp án…"
              />
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={usePaste}
              >
                Nhận diện đề đã dán
              </button>
            </AssessmentDisclosure>
          }
        />
        {message ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            {message}
          </p>
        ) : null}
      </section>

      {source?.structuredExam && solutionSet ? (
        <>
          <section className="flex flex-wrap gap-2 rounded-[28px] border border-blue-100 bg-blue-50 p-5">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                openGradingAssistant({
                  ...source,
                  examSolutionSet: solutionSet,
                })
              }
            >
              <ClipboardCheck size={16} />
              Dùng đáp án này để chấm bài
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                openAnswerSheet({ ...source, examSolutionSet: solutionSet })
              }
            >
              <ClipboardCheck size={16} />
              Tạo phiếu trả lời
            </button>
          </section>
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                  Đề đang xử lý
                </p>
                <h2 className="mt-1 text-xl font-black">{source.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {source.structuredExam.metadata.subject} · Lớp{" "}
                  {source.structuredExam.metadata.grade} ·{" "}
                  {solutionSet.summary.totalQuestions} câu
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={saveCurrent}
              >
                <Save size={16} />
                Lưu cùng đề
              </button>
            </div>
            <div
              className="mt-5 flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
              role="tablist"
              aria-label="Chế độ xem đề và lời giải"
            >
              {(
                [
                  ["overview", "Tổng quan"],
                  ["student", "Đề học sinh"],
                  ["quick", "Đáp án nhanh"],
                  ["detailed", "Lời giải chi tiết"],
                  ["scoring", "Hướng dẫn chấm"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => {
                    setView(key);
                    if (key === "quick") setMode("quick");
                    if (key === "detailed" || key === "scoring")
                      setMode("detailed");
                  }}
                  className={`min-h-11 shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${view === key ? "bg-emerald-700 text-white" : "bg-transparent text-slate-700 hover:bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label>
                <span className="label">Mức chi tiết</span>
                <select
                  className="form-field mt-1"
                  value={detailLevel}
                  onChange={(event) =>
                    regenerateDeterministic(
                      event.target.value as SolutionDetailLevel,
                    )
                  }
                >
                  <option value="short">Ngắn gọn</option>
                  <option value="standard">Tiêu chuẩn</option>
                  <option value="detailed">Chi tiết</option>
                </select>
              </label>
              <button
                type="button"
                className="btn-primary"
                disabled={loading}
                onClick={() =>
                  mode === "quick"
                    ? regenerateDeterministic()
                    : void generateSemantic()
                }
              >
                <Sparkles size={16} />
                {loading
                  ? "Đang xử lý…"
                  : mode === "quick"
                    ? "Tạo đáp án nhanh"
                    : "Tạo lời giải đã chọn"}
              </button>
            </div>
          </section>

          {view === "student" ? <OutputPreview document={source} /> : null}
          {view === "quick" && quickDocument ? (
            <OutputPreview document={quickDocument} />
          ) : null}
          {view === "detailed" && detailedDocument ? (
            <OutputPreview document={detailedDocument} />
          ) : null}
          {view === "scoring" && scoringDocument ? (
            <OutputPreview document={scoringDocument} />
          ) : null}

          {view === "overview" ? (
            <section className="ui-panel grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Tổng số câu", solutionSet.summary.totalQuestions],
                ["Đã xác minh", solutionSet.summary.verifiedCount],
                ["Đáp án không khớp", solutionSet.summary.mismatchCount],
                ["Cần xác nhận", solutionSet.summary.uncertainCount],
                ["Chưa có lời giải", solutionSet.summary.missingSolutionCount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

          {view === "overview" ? (
            <section className="ui-panel min-w-0 p-4 sm:p-5">
              <div className="max-w-full overflow-x-auto">
                <div className="flex min-w-max gap-2">
                  {(
                    [
                      ["all", "Tất cả"],
                      ["verified", "Đã xác minh"],
                      ["mismatch", "Không khớp"],
                      ["uncertain", "Cần xác nhận"],
                      ["missing", "Chưa có lời giải"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${filter === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-4 block sm:max-w-xs">
                <span className="label">Đi đến câu hỏi</span>
                <select
                  className="form-field"
                  defaultValue=""
                  onChange={(event) => {
                    document
                      .getElementById(`solution-${event.target.value}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <option value="" disabled>
                    Chọn câu…
                  </option>
                  {shown.map((item) => (
                    <option key={item.questionId} value={item.questionId}>
                      {item.sectionId} · Câu {item.questionNumber}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-5 space-y-4">
                {shown.map((solution) => {
                  const question = examQuestions.get(solution.questionId);
                  const checked = selected.includes(solution.questionId);
                  return (
                    <article
                      key={solution.questionId}
                      id={`solution-${solution.questionId}`}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <label className="flex min-w-0 items-start gap-3">
                          <input
                            className="mt-1"
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setSelected((current) =>
                                event.target.checked
                                  ? [
                                      ...new Set([
                                        ...current,
                                        solution.questionId,
                                      ]),
                                    ]
                                  : current.filter(
                                      (id) => id !== solution.questionId,
                                    ),
                              )
                            }
                          />
                          <span>
                            <strong>
                              {solution.sectionId} · Câu{" "}
                              {solution.questionNumber}
                            </strong>
                            <span className="mt-1 block text-sm leading-6 text-slate-700">
                              {question?.stem}
                            </span>
                          </span>
                        </label>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(solution)}`}
                        >
                          {statusLabel(solution)} ·{" "}
                          {solution.confidence === "high"
                            ? "Tin cậy cao"
                            : solution.confidence === "medium"
                              ? "Tin cậy vừa"
                              : "Tin cậy thấp"}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          <span className="font-bold text-slate-500">
                            Đáp án hiện tại
                          </span>
                          <p className="mt-1 font-black">
                            {String(solution.currentAnswer)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-sm">
                          <span className="font-bold text-blue-700">
                            Đáp án kiểm tra
                          </span>
                          <p className="mt-1 font-black">
                            {solution.verifiedAnswer === undefined
                              ? "Cần giáo viên xác nhận"
                              : String(solution.verifiedAnswer)}
                          </p>
                        </div>
                      </div>
                      {solution.statementExplanations?.map((item) => (
                        <p
                          key={item.statementId}
                          className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"
                        >
                          <strong>
                            {String.fromCharCode(97 + item.statementIndex)}){" "}
                            {item.value ? "Đúng" : "Sai"}.
                          </strong>{" "}
                          {item.explanation}
                        </p>
                      ))}
                      <p className="mt-3 text-sm">
                        <strong>Lời giải ngắn:</strong> {solution.conciseAnswer}
                      </p>
                      {editingId === solution.questionId ? (
                        <textarea
                          className="form-field mt-3 min-h-32"
                          value={solution.detailedSolution || ""}
                          onChange={(event) =>
                            updateSolution(
                              solution.questionId,
                              event.target.value,
                            )
                          }
                        />
                      ) : solution.detailedSolution ? (
                        <div className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 p-3 text-sm leading-6">
                          {solution.detailedSolution}
                        </div>
                      ) : null}
                      {solution.warnings?.length ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                          <AlertTriangle className="mr-1 inline" size={15} />
                          {solution.warnings.join(" ")}
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() =>
                            void generateSemantic([solution.questionId])
                          }
                        >
                          <Sparkles size={15} />
                          {solution.detailedSolution
                            ? "Tạo lại lời giải"
                            : "Tạo lời giải"}
                        </button>
                        <ActionMenu
                          label="Chỉnh lời giải"
                          items={[
                            {
                              label:
                                editingId === solution.questionId
                                  ? "Đóng trình chỉnh sửa"
                                  : "Chỉnh sửa nội dung",
                              onSelect: () =>
                                setEditingId(
                                  editingId === solution.questionId
                                    ? ""
                                    : solution.questionId,
                                ),
                            },
                            {
                              label: "Xem thay đổi đáp án",
                              disabled: solution.answerStatus !== "mismatch",
                              onSelect: () => setReviewId(solution.questionId),
                            },
                            {
                              label: "Đánh dấu đã xác nhận",
                              onSelect: () =>
                                updateSolution(
                                  solution.questionId,
                                  solution.detailedSolution ||
                                    solution.conciseAnswer,
                                ),
                            },
                          ]}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Xuất file dành cho giáo viên</h2>
            <p className="mt-1 text-sm text-slate-600">
              Đáp án, lời giải và hướng dẫn chấm luôn nằm trong file riêng; đề
              học sinh không bị thay đổi.
            </p>
            <div className="mt-4 space-y-4">
              {quickDocument ? (
                <div>
                  <p className="mb-2 font-bold">Đáp án nhanh DOCX/PDF</p>
                  <DocumentExportMenu document={quickDocument} compact />
                </div>
              ) : null}
              {detailedDocument ? (
                <div>
                  <p className="mb-2 font-bold">Lời giải chi tiết DOCX/PDF</p>
                  <DocumentExportMenu document={detailedDocument} compact />
                </div>
              ) : null}
              {scoringDocument ? (
                <div>
                  <p className="mb-2 font-bold">Hướng dẫn chấm DOCX/PDF</p>
                  <DocumentExportMenu document={scoringDocument} compact />
                </div>
              ) : null}
              <button
                type="button"
                className="btn-primary"
                onClick={() => void exportSolutionZip(source, solutionSet)}
              >
                <Download size={16} />
                Tải gói ZIP file giáo viên
              </button>
            </div>
          </section>
        </>
      ) : null}

      {review && source ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xem thay đổi đáp án"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-black">Xem thay đổi đáp án</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-bold text-slate-500">
                  Đáp án hiện tại
                </span>
                <p className="font-black">{String(review.currentAnswer)}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <span className="text-xs font-bold text-blue-700">
                  Đáp án đề xuất
                </span>
                <p className="font-black">{String(review.verifiedAnswer)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              <strong>Lý do:</strong>{" "}
              {review.detailedSolution || review.conciseAnswer}
            </p>
            <p className="mt-2 text-sm">
              <strong>Độ tin cậy:</strong>{" "}
              {review.confidence === "high" ? "Cao" : "Cần giáo viên xác nhận"}
            </p>
            {source.examVariantSet ? (
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                Thay đổi sẽ tái tạo ánh xạ đáp án của{" "}
                {source.examVariantSet.variantCount} mã đề và yêu cầu kiểm tra
                lại.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={review.confidence !== "high"}
                onClick={() => applyAnswer(review)}
              >
                Áp dụng
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReviewId("")}
              >
                Giữ nguyên
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  updateSolution(
                    review.questionId,
                    review.detailedSolution || review.conciseAnswer,
                  );
                  setReviewId("");
                }}
              >
                Cần xem lại
              </button>
            </div>
            {review.confidence !== "high" ? (
              <p className="mt-3 text-xs font-bold text-amber-700">
                Cần giáo viên xác nhận; không thể tự động thay đáp án.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
