"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  RotateCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  AssessmentStageNavigation,
  AssessmentStatus,
} from "@/components/assessment/AssessmentWorkspace";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { getCloudDocument } from "@/lib/data/documents-store";
import { printGeneratedDocument } from "@/lib/print-document";
import { saveDocument, getHistory, deleteDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import {
  classSummary,
  createGradingJob,
  overrideQuestionScore,
  regradeJob,
  sourceFromPastedAnswerKey,
  validateGradingSource,
} from "@/lib/grading/engine";
import {
  gradingFileError,
  expandSubmissionFiles,
  prepareSubmissionFile,
  type PreparedSubmission,
} from "@/lib/grading/files";
import { gradingJobToDocument } from "@/lib/grading/history";
import {
  mergeRecognizedAnswers,
  recognizeAnswersFromText,
} from "@/lib/grading/recognition";
import {
  exportGradingCsv,
  exportGradingDocx,
  exportGradingXlsx,
  exportStudentZip,
  gradingReportDocument,
  studentResultDocument,
} from "@/lib/grading/export";
import { readGradingSourceSession } from "@/lib/grading/session";
import { openAnswerSheet } from "@/lib/answer-sheet/session";
import { detectPageSet } from "@/lib/answer-sheet/recognition";
import type {
  GradingJob,
  GradingSubmission,
  RecognizedAnswer,
} from "@/lib/grading/types";
import {
  createRubricAssessment,
  updateCriterionAssessment,
} from "@/lib/rubric/grading";
import { openReviewPack } from "@/lib/review-pack/session";
import type {
  Rubric,
  RubricAssessment,
  RubricCriterionAssessment,
} from "@/lib/rubric/types";

const steps = [
  "Chọn đề và đáp án",
  "Tải bài làm",
  "Nhận dạng câu trả lời",
  "Kiểm tra nhận dạng",
  "Chấm điểm",
  "Giáo viên rà soát",
  "Xác nhận và xuất",
];
type PreparedPage = PreparedSubmission["recognitionPages"][number];

function answerText(value: RecognizedAnswer["normalizedValue"]) {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === "boolean" ? (item ? "Đ" : "S") : item))
        .join("; ")
    : String(value ?? "");
}
function labelFor(submission: GradingSubmission, index: number) {
  return (
    submission.student.displayName ||
    submission.teacherLabel ||
    `Bài làm ${String(index + 1).padStart(2, "0")}`
  );
}
function tone(confidence: string) {
  return confidence === "high"
    ? "bg-emerald-50 text-emerald-700"
    : confidence === "medium"
      ? "bg-amber-50 text-amber-800"
      : "bg-rose-50 text-rose-700";
}

export function GradingAssistantWorkspace() {
  const [step, setStep] = useState(1);
  const [job, setJob] = useState<GradingJob | null>(null);
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [pasteKey, setPasteKey] = useState("");
  const [pasteSubmission, setPasteSubmission] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [answerFilter, setAnswerFilter] = useState("all");
  const [reviewQueueFilter, setReviewQueueFilter] = useState<
    "needs_review" | "all"
  >("needs_review");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [submissionFormat, setSubmissionFormat] = useState<
    "general" | "soanlab_answer_sheet"
  >("general");
  const [answerSheetTemplateId, setAnswerSheetTemplateId] = useState("");
  const [semantic, setSemantic] = useState<
    Array<{
      questionId: string;
      suggestedScore: number;
      maximumScore: number;
      evidence: string;
      reason: string;
      feedback: string;
      confidence: string;
    }>
  >([]);
  const pendingPages = useRef(new Map<string, PreparedPage[]>());
  const autosaveReady = useRef(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const local = getHistory();
      setHistory(local);
      const id = new URLSearchParams(window.location.search).get("history");
      const existing = id
        ? (await getCloudDocument(id)) || local.find((item) => item.id === id)
        : null;
      if (existing?.gradingJob) {
        setJob(existing.gradingJob);
        setSelectedId(existing.gradingJob.submissions[0]?.id || "");
        setStep(
          existing.gradingJob.status === "confirmed" ||
            existing.gradingJob.status === "exported"
            ? 7
            : existing.gradingJob.submissions.length
              ? 4
              : 2,
        );
        autosaveReady.current = true;
        return;
      }
      const session = readGradingSourceSession();
      if (session) loadSource(session);
    });
  }, []);

  useEffect(() => {
    if (!job || !autosaveReady.current) return;
    const timer = setTimeout(
      () => saveDocument(gradingJobToDocument(job)),
      900,
    );
    return () => clearTimeout(timer);
  }, [job]);

  function loadSource(document: GeneratedDocument) {
    if (document.gradingJob) {
      setJob(document.gradingJob);
      setStep(4);
      setSelectedId(document.gradingJob.submissions[0]?.id || "");
      autosaveReady.current = true;
      return;
    }
    const source = validateGradingSource(document);
    const next = createGradingJob(source);
    setJob(next);
    setMessage(
      source.blockingErrors[0] || source.warnings[0] || "Đã nạp đề và đáp án.",
    );
    autosaveReady.current = true;
  }

  function usePastedKey() {
    const source = sourceFromPastedAnswerKey("Đáp án nhập thủ công", pasteKey);
    setJob(createGradingJob(source));
    setMessage(source.blockingErrors[0] || source.warnings[0]);
    autosaveReady.current = true;
  }

  async function addFiles(files: File[]) {
    if (!job || !files.length) return;
    setBusy(true);
    setMessage("");
    try {
      const expanded = await expandSubmissionFiles(files);
      const current = [...job.submissions];
      for (const [index, file] of expanded.entries()) {
        setProgress(`Đang chuẩn bị bài ${index + 1}/${expanded.length}`);
        try {
          const prepared = await prepareSubmissionFile(file, current.length);
          current.push(prepared.submission);
          pendingPages.current.set(
            prepared.submission.id,
            prepared.recognitionPages,
          );
        } catch (error) {
          current.push({
            id: crypto.randomUUID(),
            teacherLabel: `Bài làm ${String(current.length + 1).padStart(2, "0")}`,
            student: {},
            examCodeConfirmed: false,
            recognizedAnswers: [],
            reviewStatus: "needs_review",
            warnings: [gradingFileError(error)],
            sourceFiles: [
              {
                id: crypto.randomUUID(),
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                pageCount: 0,
                status: "failed",
                error: gradingFileError(error),
              },
            ],
          });
        }
      }
      setJob({
        ...job,
        submissions: current,
        status: "draft",
        metadata: { ...job.metadata, updatedAt: new Date().toISOString() },
      });
      setSelectedId(current[0]?.id || "");
      setMessage(
        `Đã thêm ${expanded.length} bài làm. Bài lỗi (nếu có) được giữ riêng để thử lại.`,
      );
    } catch (error) {
      setMessage(gradingFileError(error));
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function addPastedSubmission() {
    if (!job || !pasteSubmission.trim()) return;
    const recognized = recognizeAnswersFromText(pasteSubmission);
    const index = job.submissions.length;
    const submission: GradingSubmission = {
      id: crypto.randomUUID(),
      teacherLabel: `Bài làm ${String(index + 1).padStart(2, "0")}`,
      student: recognized.student,
      examCode: recognized.examCode,
      examCodeConfidence: recognized.examCodeConfidence,
      examCodeConfirmed: recognized.examCodeConfidence === "high",
      sourceFiles: [
        {
          id: crypto.randomUUID(),
          fileName: `bai-lam-${index + 1}.txt`,
          mimeType: "text/plain",
          size: new Blob([pasteSubmission]).size,
          pageCount: 1,
          status: "recognized",
        },
      ],
      recognizedAnswers: recognized.answers,
      reviewStatus: recognized.answers.some(
        (answer) => answer.confidence === "low",
      )
        ? "needs_review"
        : "reviewed",
    };
    setJob({ ...job, submissions: [...job.submissions, submission] });
    setSelectedId(submission.id);
    setPasteSubmission("");
    setMessage(
      "Đã nhận dạng câu trả lời từ văn bản. Vui lòng rà soát trước khi chấm.",
    );
  }

  async function recognizeAll() {
    if (!job) return;
    setBusy(true);
    let current: GradingJob = {
      ...job,
      submissions: job.submissions.map((item) => ({ ...item })),
      status: "recognizing",
    };
    const expected = (
      job.source.exam?.parts
        .flatMap((part) => part.questions)
        .map((question) => `${question.number}:${question.id}`) || []
    ).join(",");
    for (const [submissionIndex, submission] of current.submissions.entries()) {
      const pages = pendingPages.current.get(submission.id) || [];
      if (!pages.length) continue;
      const recognizedPageNumbers: number[] = [];
      let expectedSheetPages = 0;
      for (const [index, page] of pages.entries()) {
        setProgress(
          `Đang đọc bài ${submissionIndex + 1}/${current.submissions.length} · trang ${index + 1}/${pages.length}`,
        );
        try {
          const form = new FormData();
          form.set(
            "image",
            new File([page.blob], `trang-${page.pageNumber}.jpg`, {
              type: page.blob.type || "image/jpeg",
            }),
          );
          form.set("pageNumber", String(page.pageNumber));
          form.set("expectedQuestions", expected);
          if (answerSheetTemplateId)
            form.set("templateId", answerSheetTemplateId);
          const response = await fetch(
            submissionFormat === "soanlab_answer_sheet"
              ? "/api/answer-sheet/recognize"
              : "/api/grading/recognize",
            { method: "POST", body: form },
          );
          const data = (await response.json()) as {
            ok?: boolean;
            maintenance?: boolean;
            error?: string;
            answers?: RecognizedAnswer[];
            student?: GradingSubmission["student"];
            examCode?: string;
            examCodeConfidence?: GradingSubmission["examCodeConfidence"];
            warnings?: string[];
            pageNumber?: number;
            expectedPageCount?: number;
          };
          if (data.maintenance) {
            window.location.assign("/maintenance");
            return;
          }
          if (!response.ok || !data.ok)
            throw new Error(data.error || "recognition_failed");
          if (submissionFormat === "soanlab_answer_sheet" && data.pageNumber) {
            recognizedPageNumbers.push(data.pageNumber);
            expectedSheetPages = Math.max(
              expectedSheetPages,
              data.expectedPageCount || 0,
            );
          }
          const target = current.submissions[submissionIndex];
          current.submissions[submissionIndex] = {
            ...target,
            student: {
              ...target.student,
              ...Object.fromEntries(
                Object.entries(data.student || {}).filter(([, value]) => value),
              ),
            },
            examCode: target.examCode || data.examCode,
            examCodeConfidence:
              target.examCodeConfidence || data.examCodeConfidence,
            examCodeConfirmed:
              target.examCodeConfirmed || data.examCodeConfidence === "high",
            recognizedAnswers: mergeRecognizedAnswers(
              target.recognizedAnswers,
              data.answers || [],
            ),
            warnings: [
              ...new Set([
                ...(target.warnings || []),
                ...(data.warnings || []),
              ]),
            ],
          };
        } catch (error) {
          const target = current.submissions[submissionIndex];
          current.submissions[submissionIndex] = {
            ...target,
            reviewStatus: "needs_review",
            warnings: [
              ...(target.warnings || []),
              error instanceof Error && error.message !== "recognition_failed"
                ? error.message
                : "Bài làm này chưa được xử lý thành công. Thầy cô có thể thử lại riêng bài này.",
            ],
          };
        }
      }
      if (submissionFormat === "soanlab_answer_sheet" && expectedSheetPages) {
        const pageSet = detectPageSet(
          Array.from({ length: expectedSheetPages }, (_, index) => index + 1),
          recognizedPageNumbers,
        );
        const target = current.submissions[submissionIndex];
        current.submissions[submissionIndex] = {
          ...target,
          warnings: [
            ...new Set([
              ...(target.warnings || []),
              ...pageSet.missingPages.map(
                (page) => `Bài làm đang thiếu trang ${page}.`,
              ),
              ...pageSet.duplicatePages.map(
                (page) => `Phát hiện hai bản của trang ${page}.`,
              ),
              ...pageSet.unexpectedPages.map(
                (page) => `Trang ${page} không thuộc phiếu trả lời đã chọn.`,
              ),
            ]),
          ],
        };
      }
      current.submissions[submissionIndex] = {
        ...current.submissions[submissionIndex],
        sourceFiles: current.submissions[submissionIndex].sourceFiles.map(
          (file) => ({ ...file, status: "recognized" }),
        ),
        reviewStatus:
          current.submissions[submissionIndex].recognizedAnswers.some(
            (answer) => answer.confidence === "low",
          ) ||
          current.submissions[submissionIndex].warnings?.some((warning) =>
            /thiếu trang|hai bản|không thuộc/.test(warning),
          )
            ? "needs_review"
            : "reviewed",
      };
      setJob({ ...current });
    }
    current = {
      ...current,
      status: current.submissions.some(
        (item) => item.reviewStatus === "needs_review",
      )
        ? "needs_review"
        : "draft",
      metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
    };
    setJob(current);
    setBusy(false);
    setProgress("");
    setStep(4);
    setSelectedId(current.submissions[0]?.id || "");
    setMessage(
      "Đã nhận dạng xong. Giáo viên cần kiểm tra các câu chưa chắc chắn trước khi chấm.",
    );
  }

  function updateSubmission(
    id: string,
    update: (submission: GradingSubmission) => GradingSubmission,
  ) {
    if (job)
      setJob({
        ...job,
        submissions: job.submissions.map((submission) =>
          submission.id === id ? update(submission) : submission,
        ),
        status: "needs_review",
        metadata: { ...job.metadata, updatedAt: new Date().toISOString() },
      });
  }
  function updateAnswer(
    submissionId: string,
    questionNumber: number,
    patch: Partial<RecognizedAnswer>,
    questionId?: string,
  ) {
    const targetQuestionId = questionId || patch.questionId;
    updateSubmission(submissionId, (submission) => ({
      ...submission,
      recognizedAnswers: submission.recognizedAnswers.map((answer) =>
        targetQuestionId
          ? answer.questionId === targetQuestionId
            ? { ...answer, ...patch }
            : answer
          : answer.questionNumber === questionNumber
            ? { ...answer, ...patch }
            : answer,
      ),
      reviewStatus: "needs_review",
      gradingResult: undefined,
    }));
  }
  function confirmClearAnswers(submissionId: string) {
    updateSubmission(submissionId, (submission) => ({
      ...submission,
      recognizedAnswers: submission.recognizedAnswers.map((answer) =>
        answer.confidence !== "low"
          ? { ...answer, teacherConfirmed: true }
          : answer,
      ),
      reviewStatus: submission.recognizedAnswers.some(
        (answer) => answer.confidence === "low" && !answer.teacherConfirmed,
      )
        ? "needs_review"
        : "reviewed",
    }));
  }

  function gradeAll() {
    if (!job) return;
    if (job.source.blockingErrors.length) {
      setMessage(job.source.blockingErrors[0]);
      return;
    }
    const missingCode =
      job.source.variantSet &&
      job.submissions.some(
        (submission) =>
          !submission.examCodeConfirmed ||
          !job.source.variantSet?.variants.some(
            (variant) => variant.code === submission.examCode,
          ),
      );
    if (missingCode) {
      setMessage(
        "Chưa xác định chắc chắn mã đề. Giáo viên phải chọn mã đề trước khi chấm.",
      );
      setStep(4);
      return;
    }
    const next = regradeJob({ ...job, status: "grading" });
    setJob(next);
    setStep(6);
    setMessage(
      "Đã chấm phần có thể đối chiếu xác định. Câu trả lời mở và nhận dạng thiếu chắc chắn vẫn chờ giáo viên rà soát.",
    );
  }

  async function suggestOpenScores() {
    if (!job) return;
    const responses = job.submissions.flatMap(
      (submission) =>
        submission.gradingResult?.questionResults
          .filter((result) => result.status === "needs_teacher_review")
          .map((result) => {
            const exam =
              job.source.variantSet?.variants.find(
                (variant) => variant.code === submission.examCode,
              )?.exam || job.source.exam;
            const question = exam?.parts
              .flatMap((part) => part.questions)
              .find((item) => item.id === result.questionId);
            return {
              questionId: `${submission.id}:${result.questionId}`,
              question: question?.stem || "",
              expected: question?.answer || "",
              studentAnswer: String(result.studentAnswer || ""),
              maximumScore: result.maximumScore,
            };
          }) || [],
    );
    if (!responses.length) {
      setMessage("Không có câu trả lời mở cần hỗ trợ chấm.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/grading/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rubric: job.source.rubricText || "",
          responses,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        maintenance?: boolean;
        error?: string;
        suggestions?: typeof semantic;
      };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.ok) throw new Error(data.error || "failed");
      setSemantic(data.suggestions || []);
      setMessage(
        "Đã tạo gợi ý. Điểm chưa được áp dụng cho đến khi giáo viên bấm duyệt từng câu.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Chưa thể tạo gợi ý chấm.",
      );
    } finally {
      setBusy(false);
    }
  }

  function applySuggestion(item: (typeof semantic)[number]) {
    const [submissionId, questionId] = item.questionId.split(":");
    if (!job) return;
    setJob(
      overrideQuestionScore(
        job,
        submissionId,
        questionId,
        item.suggestedScore,
        `Giáo viên duyệt gợi ý: ${item.reason}`,
      ),
    );
    setSemantic((current) =>
      current.filter((suggestion) => suggestion !== item),
    );
  }
  function excludeQuestion(questionId: string) {
    if (
      !job ||
      !window.confirm("Câu này sẽ không được tính điểm cho tất cả bài làm.")
    )
      return;
    const settings = {
      ...job.settings,
      excludedQuestionIds: [
        ...new Set([...job.settings.excludedQuestionIds, questionId]),
      ],
    };
    setJob(
      regradeJob({
        ...job,
        settings,
        submissions: job.submissions.map((submission) => ({
          ...submission,
          gradingResult: undefined,
        })),
      }),
    );
    setMessage(
      `Đã loại câu khỏi bài chấm và tính lại ${job.submissions.length} bài. Điểm đã xác nhận trước đó được chuyển về chờ rà soát.`,
    );
  }
  function updateRubricScore(
    submissionId: string,
    criterionId: string,
    patch: Partial<RubricCriterionAssessment>,
  ) {
    if (!job?.source.rubric) return;
    const current =
      job.rubricAssessments?.[submissionId] ||
      createRubricAssessment(job.source.rubric, submissionId);
    const assessment = updateCriterionAssessment(
      job.source.rubric,
      current,
      criterionId,
      patch,
    );
    setJob({
      ...job,
      rubricAssessments: {
        ...(job.rubricAssessments || {}),
        [submissionId]: assessment,
      },
      submissions: job.submissions.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              reviewStatus: assessment.teacherConfirmed
                ? "reviewed"
                : "needs_review",
              gradingResult: submission.gradingResult
                ? {
                    ...submission.gradingResult,
                    totalScore: assessment.totalScore,
                    maximumScore: assessment.maximumScore,
                    percentage: assessment.maximumScore
                      ? Math.round(
                          (assessment.totalScore / assessment.maximumScore) *
                            10000,
                        ) / 100
                      : 0,
                    assistedScore: assessment.totalScore,
                    sectionScores: {
                      ...submission.gradingResult.sectionScores,
                      rubric: assessment.totalScore,
                    },
                    overallFeedback: assessment.feedback,
                    confirmedByTeacher: false,
                  }
                : submission.gradingResult,
            }
          : submission,
      ),
      metadata: { ...job.metadata, updatedAt: new Date().toISOString() },
    });
  }
  function confirmSubmission(id: string) {
    if (job?.source.rubric && !job.rubricAssessments?.[id]?.teacherConfirmed) {
      setMessage(
        "Giáo viên cần xác nhận điểm của từng tiêu chí rubric trước khi xác nhận bài.",
      );
      return;
    }
    updateSubmission(id, (submission) => ({
      ...submission,
      reviewStatus: "confirmed",
      gradingResult: submission.gradingResult
        ? {
            ...submission.gradingResult,
            confirmedByTeacher: true,
            overallFeedback:
              submission.gradingResult.overallFeedback ||
              feedbackFor(submission),
          }
        : undefined,
    }));
  }
  function feedbackFor(submission: GradingSubmission) {
    const result = submission.gradingResult;
    if (!result || job?.settings.feedbackMode === "none")
      return result?.overallFeedback;
    return `Em đã làm đúng ${result.correctCount} câu. Cần xem lại ${result.incorrectCount + result.unresolvedCount} câu và kiểm tra cách trình bày trước khi hoàn thiện.`;
  }
  function confirmJob() {
    if (!job) return;
    const unresolved = job.submissions.filter(
      (item) => !item.gradingResult?.confirmedByTeacher,
    );
    if (unresolved.length) {
      setMessage(`Còn ${unresolved.length} bài chưa được giáo viên xác nhận.`);
      return;
    }
    setJob({
      ...job,
      status: "confirmed",
      metadata: { ...job.metadata, updatedAt: new Date().toISOString() },
    });
    setStep(7);
    saveDocument(gradingJobToDocument({ ...job, status: "confirmed" }));
  }
  function removeSubmission(id: string) {
    if (!job) return;
    pendingPages.current.delete(id);
    const submissions = job.submissions.filter((item) => item.id !== id);
    setJob({ ...job, submissions });
    setSelectedId(submissions[0]?.id || "");
  }

  const selected =
    job?.submissions.find((item) => item.id === selectedId) ||
    job?.submissions[0];
  const shownAnswers =
    selected?.recognizedAnswers.filter(
      (answer) =>
        answerFilter === "all" ||
        (answerFilter === "unconfirmed" && !answer.teacherConfirmed) ||
        (answerFilter === "low" && answer.confidence === "low") ||
        (answerFilter === "multiple" &&
          Array.isArray(answer.normalizedValue)) ||
        (answerFilter === "blank" && !answerText(answer.normalizedValue)),
    ) || [];
  const previewUrls =
    selected?.sourceFiles.flatMap((file) => file.previewUrls || []) || [];
  const canOpenStage = (stage: number) => {
    if (stage === 1) return true;
    if (!job) return false;
    if (stage === 2) return true;
    if (!job.submissions.length) return false;
    if (stage <= 4) return true;
    if (!job.submissions.some((item) => item.recognizedAnswers.length))
      return false;
    if (stage === 5) return true;
    if (!job.submissions.some((item) => item.gradingResult)) return false;
    return true;
  };

  const stageDisabledReason = (stage: number) => {
    if (!job) return "Cần chọn đề và đáp án trước.";
    if (!job.submissions.length) return "Cần tải ít nhất một bài làm trước.";
    if (!job.submissions.some((item) => item.recognizedAnswers.length))
      return "Cần nhận dạng câu trả lời trước.";
    return "Cần chấm điểm trước khi mở bước này.";
  };
  const activeAnswer = selected?.recognizedAnswers.find(
    (answer) => answer.questionNumber === selectedAnswer,
  );
  const summary = job ? classSummary(job) : null;

  return (
    <AppShell title="Chấm bài" contentClassName="w-full p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1700px]">
        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-sm font-bold text-blue-700"
          >
            <ArrowLeft size={16} />
            Trung tâm công cụ
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="soft-badge">Đánh giá &amp; kiểm tra</span>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Chấm bài
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Nhận dạng bài làm, chấm phần khách quan theo đáp án và để giáo
                viên quyết định mọi kết quả chưa chắc chắn.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">
                <ShieldCheck className="mr-2 inline" size={18} />
                Điểm chỉ là bản nháp đến khi giáo viên xác nhận.
              </div>
              {job?.source.exam || job?.source.variantSet ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    openAnswerSheet({
                      id: job.source.documentId || crypto.randomUUID(),
                      title: job.source.title,
                      type: job.source.variantSet ? "exam-shuffler" : "exam",
                      content: "Nguồn chấm bài",
                      createdAt: new Date().toISOString(),
                      structuredExam: job.source.exam,
                      examVariantSet: job.source.variantSet,
                    })
                  }
                >
                  Tạo phiếu trả lời chuẩn
                </button>
              ) : (
                <Link href="/tools/answer-sheet" className="btn-secondary">
                  Tạo phiếu trả lời chuẩn
                </Link>
              )}
            </div>
          </div>
          <div className="mt-5">
            <AssessmentStageNavigation
              activeId={String(step)}
              onChange={(next) => {
                const nextStep = Number(next);
                if (canOpenStage(nextStep)) setStep(nextStep);
              }}
              stages={steps.map((label, index) => ({
                id: String(index + 1),
                label,
                shortLabel: [
                  "Nguồn chấm",
                  "Tải bài",
                  "Nhận dạng",
                  "Kiểm tra",
                  "Chấm điểm",
                  "Rà soát",
                  "Xác nhận",
                ][index],
                disabled: !canOpenStage(index + 1),
                disabledReason: !canOpenStage(index + 1)
                  ? stageDisabledReason(index + 1)
                  : undefined,
              }))}
            />
          </div>
        </header>
        {message ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-950">
            {message}
          </div>
        ) : null}
        {progress ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold">
            <Loader2 className="animate-spin text-blue-600" size={18} />
            {progress}
          </div>
        ) : null}
        {step === 2 && job ? (
          <section className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Loại bài làm</span>
                <select
                  className="form-field mt-2"
                  value={submissionFormat}
                  onChange={(event) =>
                    setSubmissionFormat(
                      event.target.value as typeof submissionFormat,
                    )
                  }
                >
                  <option value="general">Bài làm thông thường</option>
                  <option value="soanlab_answer_sheet">
                    Phiếu trả lời SOẠN LAB
                  </option>
                </select>
              </label>
              {submissionFormat === "soanlab_answer_sheet" ? (
                <label>
                  <span className="label">
                    Mẫu phiếu dự phòng khi QR khó đọc
                  </span>
                  <select
                    className="form-field mt-2"
                    value={answerSheetTemplateId}
                    onChange={(event) =>
                      setAnswerSheetTemplateId(event.target.value)
                    }
                  >
                    <option value="">Tự đọc từ QR</option>
                    {history
                      .filter((item) => item.answerSheetTemplate)
                      .map((item) => (
                        <option
                          key={item.id}
                          value={
                            item.answerSheetTemplate!.recognition.templateId
                          }
                        >
                          {item.title}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
            </div>
            {submissionFormat === "soanlab_answer_sheet" ? (
              <p className="mt-3 text-sm leading-6 text-emerald-950">
                SOẠN LAB căn theo QR và bốn ô định vị, sau đó đọc bubble bằng xử
                lý ảnh xác định. Ô tô mờ, tô nhiều hoặc gạch sửa luôn được
                chuyển sang giáo viên rà soát.
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 1 ? (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">1. Chọn đề và đáp án</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ưu tiên đề có cấu trúc và đáp án đã được kiểm tra.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label>
                <span className="label">
                  Đề, bộ mã đề hoặc rubric trong lịch sử
                </span>
                <select
                  className="form-field mt-2"
                  value=""
                  onChange={(event) => {
                    const document = history.find(
                      (item) => item.id === event.target.value,
                    );
                    if (document) loadSource(document);
                  }}
                >
                  <option value="">Chọn nguồn…</option>
                  {history
                    .filter(
                      (item) =>
                        item.structuredExam ||
                        item.examVariantSet ||
                        item.type === "rubric" ||
                        item.gradingJob,
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                        {item.examVariantSet
                          ? " · Bộ mã đề"
                          : item.type === "rubric"
                            ? " · Rubric"
                            : ""}
                      </option>
                    ))}
                </select>
              </label>
              <div>
                <span className="label">Hoặc dán đáp án</span>
                <textarea
                  className="form-field mt-2 min-h-28"
                  value={pasteKey}
                  onChange={(event) => setPasteKey(event.target.value)}
                  placeholder={"1: A\n2: C\n3: D"}
                />
                <button
                  type="button"
                  className="btn-secondary mt-2"
                  onClick={usePastedKey}
                >
                  Dùng đáp án đã dán
                </button>
              </div>
            </div>
            {job ? <SourceCard job={job} /> : null}
            <div className="mt-5 flex justify-end">
              <button
                className="btn-primary"
                disabled={!job || Boolean(job.source.blockingErrors.length)}
                onClick={() => setStep(2)}
              >
                Tiếp tục tải bài
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 && job ? (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">2. Tải bài làm</h2>
            <p className="mt-1 text-sm text-slate-600">
              PNG, JPG/JPEG, WEBP, PDF tối đa 30 trang, DOCX, TXT hoặc ZIP an
              toàn. Tối đa 100 bài và 200MB mỗi bộ.
            </p>
            <label className="mt-5 grid min-h-48 cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
              <span>
                <Upload className="mx-auto text-blue-600" size={30} />
                <strong className="mt-3 block">
                  Chọn hoặc kéo bài làm vào đây
                </strong>
                <span className="mt-1 block text-sm text-slate-600">
                  Mỗi file được tạo thành một bài; file lỗi không làm mất các
                  bài còn lại.
                </span>
              </span>
              <input
                className="hidden"
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt,.zip"
                disabled={busy}
                onChange={(event) =>
                  void addFiles(Array.from(event.target.files || []))
                }
              />
            </label>
            <details className="mt-4 rounded-2xl border border-slate-200 p-4">
              <summary className="cursor-pointer font-black">
                Hoặc dán bài làm dạng văn bản
              </summary>
              <textarea
                className="form-field mt-3 min-h-36"
                value={pasteSubmission}
                onChange={(event) => setPasteSubmission(event.target.value)}
                placeholder={"Họ và tên: Nguyễn Văn A\nMã đề: 101\n1: A\n2: C"}
              />
              <button
                className="btn-secondary mt-2"
                onClick={addPastedSubmission}
              >
                Thêm bài đã dán
              </button>
            </details>
            <SubmissionList
              job={job}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeSubmission}
            />
            <div className="mt-5 flex justify-between">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ChevronLeft size={16} />
                Quay lại
              </button>
              <button
                className="btn-primary"
                disabled={!job.submissions.length}
                onClick={() => setStep(3)}
              >
                Tiếp tục nhận dạng
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 && job ? (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">3. Nhận dạng câu trả lời</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              SOẠN LAB chỉ đọc nội dung nhìn thấy. Bài viết tay, tẩy xóa, khoanh
              nhiều đáp án hoặc ảnh mờ sẽ được đánh dấu để giáo viên kiểm tra.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info label="Số bài" value={job.submissions.length} />
              <Info
                label="Đã có câu trả lời"
                value={
                  job.submissions.filter(
                    (item) => item.recognizedAnswers.length,
                  ).length
                }
              />
              <Info
                label="File lỗi"
                value={
                  job.submissions.filter((item) =>
                    item.sourceFiles.some((file) => file.status === "failed"),
                  ).length
                }
              />
            </div>
            <button
              className="btn-primary mt-5"
              disabled={busy}
              onClick={() => void recognizeAll()}
            >
              <Eye size={17} />
              {busy ? "Đang nhận dạng…" : "Bắt đầu nhận dạng"}
            </button>
            <button
              className="btn-secondary mt-5 ml-2"
              onClick={() => setStep(4)}
            >
              Bỏ qua và tự nhập
            </button>
          </section>
        ) : null}

        {step === 4 && job && selected ? (
          <section className="mt-5 grid min-h-[720px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_390px]">
            <aside className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="px-2 py-2 font-black">4. Kiểm tra nhận dạng</h2>
              <SubmissionList
                job={job}
                selectedId={selected.id}
                onSelect={(id) => {
                  setSelectedId(id);
                  setSelectedAnswer(null);
                  setPageIndex(0);
                }}
                onRemove={removeSubmission}
                compact
              />
            </aside>
            <div className="min-w-0 rounded-[24px] border border-slate-200 bg-slate-950 p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 p-2 text-white">
                <div className="flex items-center gap-1">
                  <button
                    className="rounded-lg p-2 hover:bg-white/10"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                    aria-label="Thu nhỏ"
                  >
                    <ZoomOut size={17} />
                  </button>
                  <span className="text-xs font-bold">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    className="rounded-lg p-2 hover:bg-white/10"
                    onClick={() => setZoom(Math.min(2.5, zoom + 0.2))}
                    aria-label="Phóng to"
                  >
                    <ZoomIn size={17} />
                  </button>
                  <button
                    className="rounded-lg p-2 hover:bg-white/10"
                    onClick={() => setRotation((rotation + 90) % 360)}
                    aria-label="Xoay"
                  >
                    <RotateCw size={17} />
                  </button>
                </div>
                {previewUrls.length ? (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    Trang {pageIndex + 1}/{previewUrls.length}
                    <button
                      disabled={pageIndex === previewUrls.length - 1}
                      onClick={() =>
                        setPageIndex(
                          Math.min(previewUrls.length - 1, pageIndex + 1),
                        )
                      }
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="relative mt-3 flex min-h-[610px] items-start justify-center overflow-auto rounded-xl bg-slate-800 p-4">
                {previewUrls[pageIndex] ? (
                  <div
                    className="relative origin-top"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: "top center",
                    }}
                  >
                    <img
                      src={previewUrls[pageIndex]}
                      alt={`Bài làm trang ${pageIndex + 1}`}
                      className="max-w-full bg-white shadow-2xl"
                    />
                    {activeAnswer?.sourceRegion &&
                    activeAnswer.sourcePage === pageIndex + 1 ? (
                      <span
                        className="pointer-events-none absolute border-2 border-rose-500 bg-rose-400/15"
                        style={{
                          left: `${activeAnswer.sourceRegion.x * 100}%`,
                          top: `${activeAnswer.sourceRegion.y * 100}%`,
                          width: `${activeAnswer.sourceRegion.width * 100}%`,
                          height: `${activeAnswer.sourceRegion.height * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="m-auto text-center text-sm text-slate-300">
                    <FileText className="mx-auto mb-3" />
                    <p>File văn bản không có ảnh xem trước.</p>
                    <p>Kiểm tra câu trả lời ở bảng bên phải.</p>
                  </div>
                )}
              </div>
            </div>
            <aside className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <IdentityEditor
                job={job}
                submission={selected}
                updateSubmission={updateSubmission}
              />
              <div className="mt-4 max-w-full overflow-x-auto">
                <div className="flex min-w-max gap-1">
                  {[
                    ["all", "Tất cả"],
                    ["unconfirmed", "Chưa xác nhận"],
                    ["low", "Tin cậy thấp"],
                    ["multiple", "Nhiều lựa chọn"],
                    ["blank", "Bỏ trống"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${answerFilter === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      onClick={() => setAnswerFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto">
                {shownAnswers.map((answer) => (
                  <AnswerEditor
                    key={`${answer.questionNumber}-${answer.sourcePage}`}
                    answer={answer}
                    active={selectedAnswer === answer.questionNumber}
                    onFocus={() => {
                      setSelectedAnswer(answer.questionNumber);
                      if (answer.sourcePage)
                        setPageIndex(answer.sourcePage - 1);
                    }}
                    onUpdate={(patch) =>
                      updateAnswer(selected.id, answer.questionNumber, patch)
                    }
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => confirmClearAnswers(selected.id)}
                >
                  <Check size={16} />
                  Xác nhận câu rõ ràng
                </button>
                <button className="btn-primary" onClick={() => setStep(5)}>
                  Thiết lập chấm điểm
                  <ArrowRight size={16} />
                </button>
              </div>
            </aside>
          </section>
        ) : null}

        {step === 5 && job ? (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">5. Chấm điểm</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Setting label="Trắc nghiệm">
                <select
                  className="form-field mt-2"
                  value={job.settings.multipleChoice}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        multipleChoice: event.target
                          .value as typeof job.settings.multipleChoice,
                      },
                    })
                  }
                >
                  <option value="fixed">Điểm cố định mỗi câu</option>
                  <option value="all_or_nothing">Đúng mới có điểm</option>
                </select>
              </Setting>
              <Setting label="Đúng/Sai">
                <select
                  className="form-field mt-2"
                  value={job.settings.trueFalse}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        trueFalse: event.target
                          .value as typeof job.settings.trueFalse,
                      },
                    })
                  }
                >
                  <option value="per_statement">Điểm theo từng mệnh đề</option>
                  <option value="all_or_nothing">Đúng toàn bộ câu</option>
                  <option value="custom">Quy tắc tùy chỉnh</option>
                </select>
              </Setting>
              <Setting label="Dung sai trả lời số">
                <select
                  className="form-field mt-2"
                  value={job.settings.numericTolerance}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        numericTolerance: event.target
                          .value as typeof job.settings.numericTolerance,
                      },
                    })
                  }
                >
                  <option value="exact">Chính xác</option>
                  <option value="absolute">Dung sai tuyệt đối</option>
                  <option value="percentage">Dung sai phần trăm</option>
                </select>
                {job.settings.numericTolerance !== "exact" ? (
                  <input
                    className="form-field mt-2"
                    type="number"
                    min="0"
                    value={job.settings.toleranceValue}
                    onChange={(event) =>
                      setJob({
                        ...job,
                        settings: {
                          ...job.settings,
                          toleranceValue: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                ) : null}
              </Setting>
              <Setting label="Làm tròn">
                <select
                  className="form-field mt-2"
                  value={job.settings.rounding}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        rounding: event.target
                          .value as typeof job.settings.rounding,
                      },
                    })
                  }
                >
                  <option value="none">Không làm tròn</option>
                  <option value="one_decimal">Một chữ số</option>
                  <option value="two_decimals">Hai chữ số</option>
                  <option value="quarter">0,25 điểm</option>
                  <option value="half">0,5 điểm</option>
                </select>
              </Setting>
              <Setting label="Điểm tối đa">
                <input
                  className="form-field mt-2"
                  type="number"
                  min="0"
                  step="0.25"
                  value={job.settings.maximumScore}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        maximumScore: Number(event.target.value) || 0,
                      },
                    })
                  }
                />
              </Setting>
              <Setting label="Trả lời ngắn">
                <select
                  className="form-field mt-2"
                  value={job.settings.shortAnswerMode}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        shortAnswerMode: event.target
                          .value as typeof job.settings.shortAnswerMode,
                      },
                    })
                  }
                >
                  <option value="final_only">Chỉ chấm đáp án cuối</option>
                  <option value="process">Chấm cả quá trình</option>
                  <option value="rubric">Dùng rubric</option>
                </select>
              </Setting>
              <Setting label="Nhận xét">
                <select
                  className="form-field mt-2"
                  value={job.settings.feedbackMode}
                  onChange={(event) =>
                    setJob({
                      ...job,
                      settings: {
                        ...job.settings,
                        feedbackMode: event.target
                          .value as typeof job.settings.feedbackMode,
                      },
                    })
                  }
                >
                  <option value="none">Không tạo nhận xét</option>
                  <option value="short">Nhận xét ngắn</option>
                  <option value="mistakes">Theo lỗi sai</option>
                  <option value="detailed">Chi tiết</option>
                </select>
              </Setting>
              <Setting label="Đơn vị">
                <label className="mt-3 flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={job.settings.requireUnit}
                    onChange={(event) =>
                      setJob({
                        ...job,
                        settings: {
                          ...job.settings,
                          requireUnit: event.target.checked,
                        },
                      })
                    }
                  />
                  Yêu cầu đúng đơn vị
                </label>
              </Setting>
            </div>
            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
              Xem trước: tổng điểm tối đa {job.settings.maximumScore}. Bỏ trống
              và chọn nhiều phương án mặc định nhận 0 điểm. Không có quy tắc
              quốc gia thay đổi theo thời điểm nào được áp dụng ngầm.
            </div>
            <button className="btn-primary mt-5" onClick={gradeAll}>
              <ClipboardCheck size={17} />
              Chấm {job.submissions.length} bài
            </button>
          </section>
        ) : null}

        {step === 6 && job && summary ? (
          <section className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <Info label="Tổng số bài" value={summary.total} />
              <Info label="Đã chấm" value={summary.graded} />
              <Info label="Cần rà soát" value={summary.needsReview} />
              <Info label="Điểm trung bình" value={summary.average} />
              <Info label="Cao nhất" value={summary.highest} />
              <Info label="Thấp nhất" value={summary.lowest} />
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">6. Giáo viên rà soát</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Mọi câu mở, điểm gợi ý và thay đổi đều cần giáo viên duyệt.
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void suggestOpenScores()}
                >
                  Gợi ý chấm câu mở
                </button>
              </div>
              {semantic.length ? (
                <div className="mt-4 space-y-2">
                  {semantic.map((item) => (
                    <div
                      key={item.questionId}
                      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"
                    >
                      <strong>
                        Gợi ý {item.suggestedScore}/{item.maximumScore} · Tin
                        cậy {item.confidence}
                      </strong>
                      <p className="mt-1">Bằng chứng: {item.evidence}</p>
                      <p className="mt-1">{item.reason}</p>
                      <button
                        className="btn-secondary mt-2"
                        onClick={() => applySuggestion(item)}
                      >
                        Giáo viên duyệt điểm này
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black">Hàng đợi rà soát</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Ưu tiên bài còn câu chưa chắc chắn hoặc chưa được giáo viên
                    xác nhận.
                  </p>
                </div>
                <div
                  className="ui-segmented-control grid grid-cols-2"
                  role="tablist"
                  aria-label="Lọc hàng đợi rà soát"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={reviewQueueFilter === "needs_review"}
                    className={
                      reviewQueueFilter === "needs_review"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600"
                    }
                    onClick={() => setReviewQueueFilter("needs_review")}
                  >
                    Cần rà soát
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={reviewQueueFilter === "all"}
                    className={
                      reviewQueueFilter === "all"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600"
                    }
                    onClick={() => setReviewQueueFilter("all")}
                  >
                    Tất cả
                  </button>
                </div>
              </div>
              <div className="ui-table-wrap mt-4">
                <table className="ui-table min-w-[760px]">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="p-3">Học sinh</th>
                      <th className="p-3">Mã đề</th>
                      <th className="p-3">Điểm</th>
                      <th className="p-3">Câu đúng</th>
                      <th className="p-3">Cần rà soát</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.submissions
                      .filter((submission) =>
                        reviewQueueFilter === "all"
                          ? true
                          : !submission.gradingResult?.confirmedByTeacher ||
                            Boolean(submission.gradingResult?.unresolvedCount),
                      )
                      .map((submission, index) => (
                        <tr
                          key={submission.id}
                          className="border-b border-slate-100"
                        >
                          <td className="p-3 font-bold">
                            {labelFor(submission, index)}
                          </td>
                          <td className="p-3">{submission.examCode || "—"}</td>
                          <td className="p-3 font-black">
                            {submission.gradingResult?.totalScore ?? "—"}
                          </td>
                          <td className="p-3">
                            {submission.gradingResult?.correctCount ?? 0}
                          </td>
                          <td className="p-3">
                            {submission.gradingResult?.unresolvedCount ?? "—"}
                          </td>
                          <td className="p-3">
                            {submission.gradingResult?.confirmedByTeacher
                              ? "Đã xác nhận"
                              : submission.gradingResult
                                ? "Cần kiểm tra"
                                : "Chưa chấm"}
                          </td>
                          <td className="p-3">
                            <button
                              className="text-sm font-black text-blue-700"
                              onClick={() => setSelectedId(submission.id)}
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selected && job.source.rubric ? (
              <RubricAssessmentPanel
                rubric={job.source.rubric}
                assessment={
                  job.rubricAssessments?.[selected.id] ||
                  createRubricAssessment(job.source.rubric, selected.id)
                }
                onUpdate={(criterionId, patch) =>
                  updateRubricScore(selected.id, criterionId, patch)
                }
              />
            ) : null}
            {selected?.gradingResult ? (
              <ResultReview
                job={job}
                submission={selected}
                onOverride={(questionId, score) =>
                  setJob(
                    overrideQuestionScore(
                      job,
                      selected.id,
                      questionId,
                      score,
                      "Giáo viên chỉnh thủ công",
                    ),
                  )
                }
                onExclude={excludeQuestion}
                onConfirm={() => confirmSubmission(selected.id)}
              />
            ) : null}
            <div className="flex justify-end">
              <button className="btn-primary" onClick={confirmJob}>
                Xác nhận toàn bộ và xuất
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        ) : null}

        {step === 7 && job && summary ? (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600" size={28} />
              <div>
                <h2 className="text-xl font-black">
                  7. Xác nhận và xuất kết quả
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Đã xác nhận{" "}
                  {
                    job.submissions.filter(
                      (item) => item.gradingResult?.confirmedByTeacher,
                    ).length
                  }
                  /{job.submissions.length} bài. Phiếu học sinh mặc định không
                  lộ đáp án đầy đủ.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionMenu
                label="Xuất kết quả"
                className="btn-primary"
                items={[
                  {
                    label: "Bảng điểm Excel",
                    onSelect: () => exportGradingXlsx(job),
                  },
                  {
                    label: "Bảng điểm CSV",
                    onSelect: () => exportGradingCsv(job),
                  },
                  {
                    label: "Báo cáo DOCX",
                    onSelect: () => exportGradingDocx(job),
                  },
                  {
                    label: "In hoặc lưu PDF báo cáo",
                    onSelect: () =>
                      printGeneratedDocument(gradingReportDocument(job)),
                  },
                  {
                    label: "ZIP phiếu học sinh",
                    onSelect: () => exportStudentZip(job),
                  },
                ]}
              />
              {job.submissions
                .filter((item) => item.gradingResult?.confirmedByTeacher)
                .slice(0, 3)
                .map((submission, index) => (
                  <button
                    key={submission.id}
                    className="btn-secondary justify-start"
                    onClick={() =>
                      printGeneratedDocument(
                        studentResultDocument(job, submission),
                      )
                    }
                  >
                    <Printer size={18} />
                    Phiếu {labelFor(submission, index)}
                  </button>
                ))}
            </div>
            <div className="mt-4 max-w-sm">
              <AssessmentStatus
                tone={job.status === "confirmed" ? "ready" : "review"}
                label={
                  job.status === "confirmed"
                    ? "Đã xác nhận"
                    : "Cần giáo viên xác nhận"
                }
                detail="Chỉ xuất kết quả chính thức sau khi giáo viên rà soát."
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  saveDocument(gradingJobToDocument(job));
                  setMessage("Đã lưu bộ bài đã chấm vào lịch sử.");
                }}
              >
                <Save size={17} />
                Lưu lịch sử
              </button>
              <button
                className="btn-secondary text-rose-700"
                onClick={() => {
                  if (window.confirm("Xóa toàn bộ bài làm và kết quả?")) {
                    deleteDocument(job.id);
                    setJob(null);
                    setStep(1);
                    pendingPages.current.clear();
                  }
                }}
              >
                <Trash2 size={17} />
                Xóa toàn bộ bài làm và kết quả
              </button>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <h3 className="font-black">Lỗi sai phổ biến</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {summary.questions.slice(0, 5).map((item) => (
                  <li key={item.questionId}>
                    Câu {item.number}: {item.correctPercentage}% trả lời đúng.
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        {step === 7 && job ? (
          <button
            className="btn-secondary mt-4"
            onClick={() => openReviewPack(gradingJobToDocument(job))}
          >
            <FileText size={16} />
            Tạo gói củng cố từ kết quả đã xác nhận
          </button>
        ) : null}
      </div>
    </AppShell>
  );
}

function SourceCard({ job }: { job: GradingJob }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <strong>{job.source.title}</strong>
      <p className="mt-1 text-sm text-slate-600">
        {job.source.variantSet
          ? `${job.source.variantSet.variantCount} mã đề`
          : job.source.exam
            ? `${job.source.exam.parts.flatMap((part) => part.questions).length} câu hỏi`
            : "Chấm bằng rubric"}
      </p>
      {job.source.warnings.map((warning) => (
        <p key={warning} className="mt-2 text-sm font-semibold text-amber-800">
          <AlertTriangle className="mr-1 inline" size={15} />
          {warning}
        </p>
      ))}
      {job.source.blockingErrors.map((error) => (
        <p key={error} className="mt-2 text-sm font-semibold text-rose-700">
          <XCircle className="mr-1 inline" size={15} />
          {error}
        </p>
      ))}
      {!job.source.verified && job.source.exam ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/tools/answer-solutions">
            Mở Lời giải &amp; đáp án
          </Link>
          <span className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">
            Tiếp tục đồng nghĩa giáo viên tự chịu trách nhiệm kiểm tra đáp án.
          </span>
        </div>
      ) : null}
    </div>
  );
}
function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
function Setting({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="rounded-2xl border border-slate-200 p-4">
      <span className="font-black">{label}</span>
      {children}
    </label>
  );
}

function RubricAssessmentPanel({
  rubric,
  assessment,
  onUpdate,
}: {
  rubric: Rubric;
  assessment: RubricAssessment;
  onUpdate: (
    criterionId: string,
    patch: Partial<RubricCriterionAssessment>,
  ) => void;
}) {
  return (
    <section className="rounded-[28px] border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Chấm theo từng tiêu chí rubric</h2>
          <p className="mt-1 text-sm text-slate-600">
            Điểm gợi ý không được tính cho đến khi giáo viên xác nhận từng tiêu
            chí.
          </p>
        </div>
        <strong className="rounded-xl bg-blue-50 px-4 py-2 text-blue-800">
          {assessment.totalScore}/{assessment.maximumScore}
        </strong>
      </div>
      <div className="mt-4 space-y-3">
        {rubric.criteria.map((criterion) => {
          const item = assessment.criteria.find(
            (entry) => entry.criterionId === criterion.id,
          );
          return (
            <article
              key={criterion.id}
              className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[minmax(180px,1fr)_140px_1fr_1fr_auto]"
            >
              <div>
                <strong>{criterion.title}</strong>
                <p className="mt-1 text-xs text-slate-500">
                  {criterion.weight}% · tối đa {criterion.maxScore}
                </p>
              </div>
              <label>
                <span className="text-xs font-bold text-slate-500">
                  Điểm giáo viên
                </span>
                <input
                  className="form-field mt-1"
                  type="number"
                  min="0"
                  max={criterion.maxScore}
                  step="0.25"
                  value={item?.confirmedScore ?? ""}
                  onChange={(event) =>
                    onUpdate(criterion.id, {
                      confirmedScore:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                      teacherConfirmed: false,
                    })
                  }
                />
              </label>
              <label>
                <span className="text-xs font-bold text-slate-500">
                  Minh chứng
                </span>
                <input
                  className="form-field mt-1"
                  value={item?.evidence || ""}
                  onChange={(event) =>
                    onUpdate(criterion.id, {
                      evidence: event.target.value,
                      teacherConfirmed: false,
                    })
                  }
                />
              </label>
              <label>
                <span className="text-xs font-bold text-slate-500">
                  Phản hồi
                </span>
                <input
                  className="form-field mt-1"
                  value={item?.feedback || ""}
                  onChange={(event) =>
                    onUpdate(criterion.id, {
                      feedback: event.target.value,
                      teacherConfirmed: false,
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-black">
                <input
                  type="checkbox"
                  checked={Boolean(item?.teacherConfirmed)}
                  disabled={item?.confirmedScore === undefined}
                  onChange={(event) =>
                    onUpdate(criterion.id, {
                      teacherConfirmed: event.target.checked,
                    })
                  }
                />
                Xác nhận
              </label>
            </article>
          );
        })}
      </div>
      {assessment.feedback ? (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
          <strong>Phản hồi từ điểm đã xác nhận</strong>
          <p className="mt-2">{assessment.feedback}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-amber-800">
          Phản hồi tổng hợp chỉ xuất hiện sau khi giáo viên xác nhận đủ các tiêu
          chí.
        </p>
      )}
    </section>
  );
}

function SubmissionList({
  job,
  selectedId,
  onSelect,
  onRemove,
  compact = false,
}: {
  job: GradingJob;
  selectedId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <>
      {compact ? (
        <div className="mt-2 md:hidden">
          <label className="label" htmlFor="grading-submission-select">
            Bài làm đang kiểm tra
          </label>
          <div className="flex gap-2">
            <select
              id="grading-submission-select"
              className="form-field min-w-0 flex-1"
              value={selectedId}
              onChange={(event) => onSelect(event.target.value)}
            >
              {job.submissions.map((submission, index) => (
                <option key={submission.id} value={submission.id}>
                  {labelFor(submission, index)} ·{" "}
                  {submission.recognizedAnswers.length} câu
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ui-icon-button border border-slate-200"
              aria-label="Xóa bài làm đang chọn"
              onClick={() => onRemove(selectedId)}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
      <div
        className={`${compact ? "mt-2 hidden max-h-[620px] overflow-y-auto md:block" : "mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3"}`}
      >
        {job.submissions.map((submission, index) => (
          <button
            key={submission.id}
            type="button"
            onClick={() => onSelect(submission.id)}
            className={`mb-2 w-full rounded-2xl border p-3 text-left ${selectedId === submission.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <strong className="block truncate">
                  {labelFor(submission, index)}
                </strong>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {submission.sourceFiles
                    .map((file) => file.fileName)
                    .join(", ") || "Văn bản đã dán"}
                </span>
              </span>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(submission.id);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={15} />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-black ${submission.reviewStatus === "confirmed" ? "bg-emerald-50 text-emerald-700" : submission.reviewStatus === "needs_review" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}
              >
                {submission.reviewStatus === "confirmed"
                  ? "Đã xác nhận"
                  : submission.reviewStatus === "needs_review"
                    ? "Cần rà soát"
                    : "Chưa rà soát"}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black">
                {submission.recognizedAnswers.length} câu
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function IdentityEditor({
  job,
  submission,
  updateSubmission,
}: {
  job: GradingJob;
  submission: GradingSubmission;
  updateSubmission: (
    id: string,
    fn: (submission: GradingSubmission) => GradingSubmission,
  ) => void;
}) {
  const update = (patch: Partial<GradingSubmission>) =>
    updateSubmission(submission.id, (current) => ({ ...current, ...patch }));
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <label>
          <span className="text-xs font-bold text-slate-500">
            Họ và tên / nhãn
          </span>
          <input
            className="form-field mt-1"
            value={submission.student.displayName || ""}
            onChange={(event) =>
              update({
                student: {
                  ...submission.student,
                  displayName: event.target.value,
                },
              })
            }
          />
        </label>
        <label>
          <span className="text-xs font-bold text-slate-500">Lớp</span>
          <input
            className="form-field mt-1"
            value={submission.student.className || ""}
            onChange={(event) =>
              update({
                student: {
                  ...submission.student,
                  className: event.target.value,
                },
              })
            }
          />
        </label>
        {job.source.variantSet ? (
          <label>
            <span className="text-xs font-bold text-slate-500">Mã đề</span>
            <select
              className="form-field mt-1"
              value={submission.examCode || ""}
              onChange={(event) =>
                update({
                  examCode: event.target.value,
                  examCodeConfidence: "high",
                  examCodeConfirmed: true,
                  gradingResult: undefined,
                })
              }
            >
              <option value="">Chọn mã đề…</option>
              {job.source.variantSet.variants.map((variant) => (
                <option key={variant.code} value={variant.code}>
                  {variant.code}
                </option>
              ))}
            </select>
            {!submission.examCodeConfirmed ? (
              <span className="mt-1 block text-xs font-bold text-amber-700">
                Chưa xác định chắc chắn mã đề.
              </span>
            ) : null}
          </label>
        ) : null}
      </div>
    </div>
  );
}

function AnswerEditor({
  answer,
  active,
  onFocus,
  onUpdate,
}: {
  answer: RecognizedAnswer;
  active: boolean;
  onFocus: () => void;
  onUpdate: (patch: Partial<RecognizedAnswer>) => void;
}) {
  const updateCurrentAnswer = (patch: Partial<RecognizedAnswer>) =>
    onUpdate({ ...patch, questionId: answer.questionId });
  const confidenceLabel =
    answer.confidence === "high"
      ? "✓ Tin cậy cao"
      : answer.confidence === "medium"
        ? "! Cần kiểm tra"
        : "× Chưa chắc chắn";
  return (
    <article
      onClick={onFocus}
      className={`rounded-2xl border p-3 ${active ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <strong>Câu {answer.questionNumber}</strong>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-black ${tone(answer.confidence)}`}
        >
          {confidenceLabel}
        </span>
      </div>
      {answer.sourceCrop ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
          <img
            src={answer.sourceCrop}
            alt={`Vùng trả lời câu ${answer.questionNumber}`}
            className="max-h-28 w-full object-contain"
          />
        </div>
      ) : null}
      <label className="mt-2 block">
        <span className="text-xs font-bold text-slate-500">
          Câu trả lời nhận dạng
        </span>
        <input
          className="form-field mt-1"
          value={answerText(answer.normalizedValue)}
          onChange={(event) =>
            updateCurrentAnswer({
              rawValue: event.target.value,
              normalizedValue: event.target.value,
              teacherConfirmed: false,
            })
          }
        />
      </label>
      {answer.warnings?.map((warning) => (
        <p key={warning} className="mt-2 text-xs font-semibold text-amber-800">
          {warning}
        </p>
      ))}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
          onClick={(event) => {
            event.stopPropagation();
            updateCurrentAnswer({
              rawValue: "",
              normalizedValue: "",
              teacherConfirmed: false,
            });
          }}
        >
          Đánh dấu bỏ trống
        </button>
        <label className="flex items-center gap-2 text-xs font-black">
          <input
            type="checkbox"
            checked={Boolean(answer.teacherConfirmed)}
            onChange={(event) =>
              updateCurrentAnswer({
                teacherConfirmed: event.target.checked,
                confidence: event.target.checked ? "high" : answer.confidence,
              })
            }
          />
          Giáo viên xác nhận
        </label>
      </div>
    </article>
  );
}

function ResultReview({
  job,
  submission,
  onOverride,
  onExclude,
  onConfirm,
}: {
  job: GradingJob;
  submission: GradingSubmission;
  onOverride: (questionId: string, score: number) => void;
  onExclude: (questionId: string) => void;
  onConfirm: () => void;
}) {
  const result = submission.gradingResult!;
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">
            {submission.student.displayName || submission.teacherLabel}
          </h2>
          <p className="mt-1 text-sm">
            Điểm:{" "}
            <strong>
              {result.totalScore}/{result.maximumScore}
            </strong>{" "}
            · {result.percentage}%
          </p>
        </div>
        <button className="btn-primary" onClick={onConfirm}>
          <CheckCircle2 size={17} />
          {result.confirmedByTeacher ? "Đã xác nhận" : "Xác nhận bài này"}
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {result.questionResults.map((item) => (
          <div
            key={item.questionId}
            className="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[90px_1fr_120px_auto] sm:items-center"
          >
            <strong>Câu {item.questionNumber}</strong>
            <div className="text-sm">
              <span className="font-bold">
                {item.status === "correct"
                  ? "Đúng"
                  : item.status === "incorrect"
                    ? "Sai"
                    : item.status === "partial"
                      ? "Một phần"
                      : item.status === "blank"
                        ? "Bỏ trống"
                        : "Cần kiểm tra"}
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Bài làm: {String(item.studentAnswer ?? "—")} · Đáp án:{" "}
                {String(item.expectedAnswer ?? "—")}
              </p>
              {item.teacherOverride ? (
                <p className="mt-1 text-xs font-bold text-blue-700">
                  Đã chỉnh từ {item.teacherOverride.previousScore} thành{" "}
                  {item.teacherOverride.newScore}
                </p>
              ) : null}
            </div>
            <label>
              <span className="text-xs font-bold text-slate-500">Điểm</span>
              <input
                className="form-field mt-1"
                type="number"
                min="0"
                max={item.maximumScore}
                step="0.05"
                value={item.awardedScore}
                onChange={(event) =>
                  onOverride(item.questionId, Number(event.target.value) || 0)
                }
              />
            </label>
            <button
              className="text-xs font-black text-rose-700"
              onClick={() => onExclude(item.questionId)}
            >
              Loại câu
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
