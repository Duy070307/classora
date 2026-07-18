"use client";
/* eslint-disable @next/next/no-img-element -- Ảnh là object URL/data URL cục bộ cần giữ đúng tỉ lệ và hộp nhận dạng. */

import Link from "next/link";
import katex from "katex";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileScan,
  FileText,
  ImageIcon,
  LoaderCircle,
  Merge,
  Plus,
  Presentation,
  RotateCcw,
  RotateCw,
  Save,
  Scissors,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { AuthoringWorkspace } from "@/components/authoring/AuthoringWorkspace";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { OutputPreview } from "@/components/OutputPreview";
import { openAnswerSolutions } from "@/lib/answer-solutions/session";
import { getCloudDocument } from "@/lib/data/documents-store";
import {
  cropRecognitionBlock,
  prepareRecognitionFile,
  readPageCache,
  type PreparedRecognitionPage,
  writePageCache,
} from "@/lib/document-recognition/client";
import {
  examQuestionsToBankItems,
  filterDuplicateBankItems,
  mergeRecognitionBlocks,
  recognitionSummaryMetadata,
  recognitionText,
  splitRecognitionBlock,
  validateRecognitionForFinalization,
} from "@/lib/document-recognition/normalize";
import type {
  RecognitionBlock,
  RecognitionBlockType,
  RecognitionDocument,
  RecognitionPage,
} from "@/lib/document-recognition/types";
import {
  recognitionErrorMessage,
  recognitionSummary,
  stripLargeRecognitionAssets,
} from "@/lib/document-recognition/validation";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import {
  auditConfigFromDocument,
  EXAM_AUDIT_SESSION_INPUT,
  withAuditResult,
} from "@/lib/exam-audit/document";
import { documentWithExam } from "@/lib/exam-audit/normalize";
import { openExamMixer } from "@/lib/exam-mixer/session";
import { openLessonSlides } from "@/lib/lesson-slides/source";
import { openWorksheetGenerator } from "@/lib/worksheet/session";
import { openLessonPlanGenerator } from "@/lib/lesson-plan/session";
import { openReviewPack } from "@/lib/review-pack/session";
import { createDocument, getHistory, saveDocument } from "@/lib/history";
import {
  addQuestions,
  createQuestion,
  getQuestions,
} from "@/lib/question-bank";
import type { GeneratedDocument } from "@/lib/types";

const blockLabels: Record<RecognitionBlockType, string> = {
  document_header: "Đầu tài liệu",
  school_header: "Tên trường",
  exam_title: "Tên đề",
  metadata: "Thông tin đề",
  instruction: "Hướng dẫn",
  section_heading: "Tên phần",
  question: "Câu hỏi",
  option: "Phương án",
  true_false_statement: "Mệnh đề Đúng/Sai",
  short_answer_area: "Vùng trả lời ngắn",
  essay_question: "Câu tự luận",
  answer_key: "Đáp án",
  paragraph: "Đoạn chữ",
  formula: "Công thức",
  table: "Bảng",
  image: "Ảnh",
  graph: "Đồ thị",
  geometric_figure: "Hình học",
  page_number: "Số trang",
  footer: "Chân trang",
  watermark: "Dấu nền",
  unknown: "Chưa phân loại",
};

const confidenceLabels = {
  high: "Tin cậy cao",
  medium: "Cần xem lại",
  low: "Tin cậy thấp",
} as const;
const pageTypeLabels = {
  text_layer: "Có lớp chữ",
  scanned_image: "Trang quét",
  mixed: "Chữ + ảnh",
  empty: "Trang trống",
  unreadable: "Khó đọc",
} as const;
type BlockFilter =
  | "all"
  | "review"
  | "formula"
  | "table"
  | "visual"
  | "question"
  | "answer";

function now() {
  return new Date().toISOString();
}
function identifier() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asDocument(
  file: File,
  prepared: Awaited<ReturnType<typeof prepareRecognitionFile>>,
): RecognitionDocument {
  return {
    id: identifier(),
    sourceType: prepared.sourceType,
    sourceFileName: file.name,
    pageCount: prepared.pages.length,
    pages: prepared.pages,
    reviewStatus: "draft",
    documentHash: prepared.documentHash,
    createdAt: now(),
    updatedAt: now(),
  };
}

function draftHistory(document: RecognitionDocument): GeneratedDocument {
  const summary = recognitionSummaryMetadata(document);
  return {
    id: document.id,
    title: `Bản nhận dạng · ${document.sourceFileName}`,
    type: "document-recognition",
    content:
      recognitionText(document) ||
      "Bản nháp nhận dạng đang chờ giáo viên rà soát.",
    createdAt: document.createdAt,
    folder: "Đề kiểm tra",
    recognitionDraft: stripLargeRecognitionAssets(document),
    generationMeta: {
      mode: "document-recognition",
      sourceFileName: document.sourceFileName,
      source: "teacher_document",
      recognitionSourceType: summary.sourceType,
      recognitionPageCount: summary.pageCount,
      recognizedPageCount: summary.recognizedPageCount,
      recognitionReviewStatus: summary.reviewStatus,
      lowConfidenceBlockCount: summary.lowConfidenceBlockCount,
      recognizedQuestionCount: summary.recognizedQuestionCount,
      recognitionDocumentHash: summary.documentHash,
      generatedAt: summary.updatedAt,
    },
  };
}

function confidenceClass(confidence: RecognitionBlock["confidence"]) {
  return confidence === "high"
    ? "bg-emerald-50 text-emerald-700"
    : confidence === "medium"
      ? "bg-amber-50 text-amber-800"
      : "bg-red-50 text-red-700";
}

export function DocumentRecognitionWorkspace() {
  const search = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<RecognitionDocument | null>(null);
  const [pageBlobs, setPageBlobs] = useState<Record<number, Blob>>({});
  const [activePage, setActivePage] = useState(1);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [finalDocument, setFinalDocument] = useState<GeneratedDocument | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [blockFilter, setBlockFilter] = useState<BlockFilter>("all");
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    const historyId = search.get("history");
    if (!historyId) return;
    void (async () => {
      const item =
        (await getCloudDocument(historyId)) ??
        getHistory().find((candidate) => candidate.id === historyId);
      if (item?.recognitionDraft) {
        setDocument(item.recognitionDraft);
        setActivePage(item.recognitionDraft.pages[0]?.pageNumber || 1);
        setMessage(
          "Đã mở lại bản nháp nhận dạng. Ảnh gốc dung lượng lớn không được lưu; nội dung đã nhận dạng vẫn có thể chỉnh sửa.",
        );
      }
    })();
  }, [search]);

  const page =
    document?.pages.find((item) => item.pageNumber === activePage) ?? null;
  const summary = useMemo(
    () => (document ? recognitionSummary(document) : null),
    [document],
  );
  const reviewQueue = useMemo(
    () =>
      document?.pages.flatMap((item) =>
        item.blocks
          .filter(
            (block) =>
              !block.excluded &&
              (!block.reviewed || block.confidence !== "high"),
          )
          .map((block) => ({ pageNumber: item.pageNumber, block })),
      ) || [],
    [document],
  );
  const visibleBlocks = useMemo(() => {
    const blocks = page
      ? [...page.blocks].sort((a, b) => a.readingOrder - b.readingOrder)
      : [];
    return blocks.filter(
      (block) =>
        blockFilter === "all" ||
        (blockFilter === "review" &&
          (!block.reviewed || block.confidence !== "high")) ||
        (blockFilter === "formula" && block.type === "formula") ||
        (blockFilter === "table" && block.type === "table") ||
        (blockFilter === "visual" &&
          ["image", "graph", "geometric_figure"].includes(block.type)) ||
        (blockFilter === "question" &&
          [
            "question",
            "essay_question",
            "option",
            "true_false_statement",
            "short_answer_area",
          ].includes(block.type)) ||
        (blockFilter === "answer" && block.type === "answer_key"),
    );
  }, [blockFilter, page]);

  function renderFormula(latex: string) {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        strict: "ignore",
        trust: false,
        displayMode: true,
      });
    } catch {
      return "";
    }
  }

  function updateDocument(
    mapper: (current: RecognitionDocument) => RecognitionDocument,
  ) {
    setDocument((current) =>
      current
        ? { ...mapper(current), updatedAt: now(), reviewStatus: "draft" }
        : current,
    );
    setFinalDocument(null);
  }

  function openNextReviewBlock() {
    const next =
      reviewQueue.find((item) => item.pageNumber >= activePage) ||
      reviewQueue[0];
    if (!next) {
      setMessage("Không còn khối nào cần kiểm tra.");
      return;
    }
    setActivePage(next.pageNumber);
    setBlockFilter("review");
    setSelectedBlocks([next.block.id]);
    setMessage(`Đã mở khối cần kiểm tra tiếp theo ở trang ${next.pageNumber}.`);
  }

  function updatePage(
    pageNumber: number,
    mapper: (current: RecognitionPage) => RecognitionPage,
  ) {
    updateDocument((current) => ({
      ...current,
      pages: current.pages.map((item) =>
        item.pageNumber === pageNumber ? mapper(item) : item,
      ),
    }));
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setProgress("Đang phân tích file và phân loại từng trang…");
    setFinalDocument(null);
    try {
      const prepared = await prepareRecognitionFile(file);
      setDocument(asDocument(file, prepared));
      setPageBlobs(
        Object.fromEntries(
          prepared.pages.flatMap((item: PreparedRecognitionPage) =>
            item.imageBlob ? [[item.pageNumber, item.imageBlob]] : [],
          ),
        ),
      );
      setActivePage(1);
      setSelectedBlocks([]);
      const visualPages = prepared.pages.filter(
        (item) => item.recognitionRequired,
      ).length;
      setMessage(
        visualPages
          ? `Đã phân loại ${prepared.pages.length} trang. ${visualPages} trang cần đọc hình ảnh.`
          : `Đã đọc ${prepared.pages.length} trang bằng lớp chữ, không cần gửi hình ảnh để nhận dạng.`,
      );
    } catch (error) {
      setMessage(recognitionErrorMessage(error));
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function recognizePage(pageNumber: number, force = false) {
    if (!document) return false;
    const current = document.pages.find(
      (item) => item.pageNumber === pageNumber,
    );
    if (!current || (!current.recognitionRequired && !force)) return true;
    if (!force) {
      const cached = readPageCache(current.cacheKey);
      if (cached) {
        updatePage(pageNumber, (item) => ({
          ...item,
          ...cached,
          status: cached.blocks.some((block) => block.confidence === "low")
            ? "needs_review"
            : "recognized",
        }));
        return true;
      }
    }
    const blob = pageBlobs[pageNumber];
    if (!blob) {
      updatePage(pageNumber, (item) => ({
        ...item,
        status: "failed",
        warnings: [
          ...item.warnings,
          "Không còn ảnh trang để nhận dạng lại. Vui lòng thay ảnh trang này.",
        ],
      }));
      return false;
    }
    updatePage(pageNumber, (item) => ({ ...item, status: "processing" }));
    try {
      const form = new FormData();
      form.append(
        "image",
        new File([blob], `trang-${pageNumber}.jpg`, {
          type: blob.type || "image/jpeg",
        }),
      );
      form.append("pageNumber", String(pageNumber));
      if (current.extractedText)
        form.append("extractedText", current.extractedText);
      const response = await fetch("/api/document-recognition/page", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        blocks?: RecognitionBlock[];
        warnings?: string[];
        error?: string;
      };
      if (!response.ok || !result.ok || !result.blocks)
        throw new Error(result.error || "recognition_failed");
      const cropTypes = new Set([
        "formula",
        "table",
        "image",
        "graph",
        "geometric_figure",
      ]);
      const blocks = await Promise.all(
        result.blocks.map(async (block) =>
          cropTypes.has(block.type)
            ? {
                ...block,
                sourceCrop: await cropRecognitionBlock(blob, block.boundingBox),
              }
            : block,
        ),
      );
      const status = blocks.some((block) => block.confidence === "low")
        ? "needs_review"
        : "recognized";
      updatePage(pageNumber, (item) => ({
        ...item,
        blocks,
        warnings: [...new Set([...item.warnings, ...(result.warnings || [])])],
        status,
      }));
      writePageCache(current.cacheKey, {
        blocks,
        warnings: result.warnings || [],
      });
      return true;
    } catch (error) {
      const safeMessage =
        error instanceof Error &&
        /^(?:SOẠN LAB|Vui lòng|Trang này)/u.test(error.message)
          ? error.message
          : "Trang này chưa được đọc thành công. Thầy cô có thể thử lại hoặc bỏ qua trang.";
      updatePage(pageNumber, (item) => ({
        ...item,
        status: "failed",
        warnings: [...new Set([...item.warnings, safeMessage])],
      }));
      return false;
    }
  }

  async function recognizeAll() {
    if (!document) return;
    setBusy(true);
    let failed = 0;
    const targets = document.pages.filter(
      (item) => item.recognitionRequired && item.status !== "recognized",
    );
    for (let index = 0; index < targets.length; index += 1) {
      setProgress(
        `Đang đọc trang ${targets[index].pageNumber}/${document.pageCount} · ${index + 1}/${targets.length} trang cần xử lý`,
      );
      if (!(await recognizePage(targets[index].pageNumber))) failed += 1;
    }
    setBusy(false);
    setProgress("");
    setMessage(
      failed
        ? `Đã giữ kết quả các trang đọc được; ${failed} trang cần thử lại hoặc thay ảnh.`
        : "Đã nhận dạng xong. Thầy cô vui lòng rà soát các khối được đánh dấu.",
    );
  }

  function updateBlock(id: string, values: Partial<RecognitionBlock>) {
    if (!page) return;
    updatePage(page.pageNumber, (current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, ...values } : block,
      ),
      status: "needs_review",
    }));
  }

  async function recognizeFormulaCrop(block: RecognitionBlock) {
    if (!block.sourceCrop)
      return setMessage("Khối này chưa có ảnh công thức để nhận dạng lại.");
    setBusy(true);
    setMessage("Đang nhận dạng riêng vùng công thức…");
    try {
      const blob = await (await fetch(block.sourceCrop)).blob();
      const form = new FormData();
      form.append(
        "image",
        new File([blob], `cong-thuc-trang-${block.pageNumber}.jpg`, {
          type: blob.type || "image/jpeg",
        }),
      );
      form.append("mode", "formula");
      const response = await fetch("/api/ai/image-to-latex", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        latex?: string;
        confidence?: RecognitionBlock["confidence"];
        warnings?: string[];
        error?: string;
      };
      if (!response.ok || !result.ok || !result.latex)
        throw new Error(result.error || "formula_failed");
      updateBlock(block.id, {
        latex: result.latex,
        confidence: result.confidence || "medium",
        warnings: result.warnings || [],
        reviewed: false,
      });
      setMessage(
        "Đã cập nhật LaTeX từ riêng vùng công thức. Vui lòng kiểm tra bản xem trước.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error &&
          /^(?:SOẠN LAB|Vui lòng|Tính năng)/u.test(error.message)
          ? error.message
          : "Chưa thể nhận dạng lại công thức. Nội dung hiện tại vẫn được giữ nguyên.",
      );
    } finally {
      setBusy(false);
    }
  }

  function moveBlock(id: string, direction: -1 | 1) {
    if (!page) return;
    const ordered = [...page.blocks].sort(
      (a, b) => a.readingOrder - b.readingOrder,
    );
    const index = ordered.findIndex((block) => block.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const oldOrder = ordered[index].readingOrder;
    ordered[index] = {
      ...ordered[index],
      readingOrder: ordered[target].readingOrder,
    };
    ordered[target] = { ...ordered[target], readingOrder: oldOrder };
    updatePage(page.pageNumber, (current) => ({ ...current, blocks: ordered }));
  }

  function mergeSelected() {
    if (!page || selectedBlocks.length < 2) return;
    updatePage(page.pageNumber, (current) => ({
      ...current,
      blocks: mergeRecognitionBlocks(current.blocks, selectedBlocks),
      status: "needs_review",
    }));
    setSelectedBlocks([]);
  }

  function splitSelected() {
    if (!page || selectedBlocks.length !== 1) return;
    updatePage(page.pageNumber, (current) => ({
      ...current,
      blocks: current.blocks.flatMap((block) =>
        block.id === selectedBlocks[0] ? splitRecognitionBlock(block) : [block],
      ),
      status: "needs_review",
    }));
    setSelectedBlocks([]);
  }

  function addQuestion() {
    if (!page) return;
    const block: RecognitionBlock = {
      id: `p${page.pageNumber}-manual-${identifier()}`,
      pageNumber: page.pageNumber,
      type: "question",
      text: "Câu mới. ",
      boundingBox: { x: 0.05, y: 0.9, width: 0.9, height: 0.05 },
      confidence: "medium",
      readingOrder:
        Math.max(0, ...page.blocks.map((item) => item.readingOrder)) + 1,
      warnings: ["Khối do giáo viên bổ sung."],
      reviewed: false,
      excluded: false,
    };
    updatePage(page.pageNumber, (current) => ({
      ...current,
      blocks: [...current.blocks, block],
      status: "needs_review",
    }));
  }

  async function replacePage(file?: File) {
    if (!file || !page) return;
    try {
      const prepared = await prepareRecognitionFile(file);
      if (prepared.pages.length !== 1) throw new Error("unsupported_file");
      const replacement = prepared.pages[0] as PreparedRecognitionPage;
      setPageBlobs((current) => ({
        ...current,
        [page.pageNumber]: replacement.imageBlob as Blob,
      }));
      updatePage(page.pageNumber, (current) => ({
        ...replacement,
        pageNumber: current.pageNumber,
        cacheKey: `${document?.documentHash}:${current.pageNumber}:${Date.now()}`,
        blocks: [],
        status: "pending",
      }));
      setMessage("Đã thay ảnh trang. Chọn “Đọc lại trang” để nhận dạng.");
    } catch (error) {
      setMessage(recognitionErrorMessage(error));
    }
  }

  async function rotatePage(delta: 90 | -90) {
    if (!page || !pageBlobs[page.pageNumber]) return;
    const { normalizeImageBlob } = await import(
      "@/lib/document-recognition/client"
    );
    const rotation = ((page.rotation + delta + 360) % 360) as
      | 0
      | 90
      | 180
      | 270;
    const adjusted = await normalizeImageBlob(
      pageBlobs[page.pageNumber],
      delta === 90 ? 90 : 270,
    );
    setPageBlobs((current) => ({
      ...current,
      [page.pageNumber]: adjusted.blob,
    }));
    updatePage(page.pageNumber, (current) => ({
      ...current,
      rotation,
      adjustedDataUrl: adjusted.dataUrl,
      blocks: [],
      status: "pending",
      cacheKey: `${current.cacheKey}:r${rotation}`,
    }));
  }

  function saveDraft() {
    if (!document) return;
    saveDocument(draftHistory(document));
    setMessage(
      "Đã lưu bản nháp vào Lịch sử. Ảnh dung lượng lớn không được lưu.",
    );
  }

  function finalize() {
    if (!document) return;
    const checked = validateRecognitionForFinalization(document);
    if (!checked.valid) {
      setMessage(`Chưa thể xác nhận: ${checked.issues.join(" ")}`);
      return;
    }
    const confirmed = {
      ...document,
      reviewStatus: "confirmed" as const,
      structuredExamDraft: checked.exam,
      updatedAt: now(),
    };
    const base = createDocument(
      checked.exam.metadata.title || "Đề kiểm tra nhận dạng",
      "exam",
      checked.sourceText,
    );
    const recognized = documentWithExam(
      {
        ...base,
        examMeta: {
          subject: checked.exam.metadata.subject,
          grade: checked.exam.metadata.grade,
          duration: checked.exam.metadata.duration,
          examCode: checked.exam.metadata.examCode,
        },
        generationMeta: {
          mode: "document-recognition",
          source: "teacher_document",
          sourceFileName: document.sourceFileName,
        },
      },
      checked.exam,
    );
    const audited = withAuditResult(
      recognized,
      auditStructuredExam(checked.exam, auditConfigFromDocument(recognized)),
    );
    saveDocument(draftHistory(confirmed));
    saveDocument(audited);
    setDocument(confirmed);
    setFinalDocument(audited);
    setSelectedQuestions(
      checked.exam.parts.flatMap((part) =>
        part.questions.map((question) => question.id),
      ),
    );
    setMessage(
      "Đã xác nhận cấu trúc và tạo đề có thể tiếp tục kiểm tra, xuất file hoặc lưu vào ngân hàng câu hỏi.",
    );
  }

  function addToBank() {
    if (!finalDocument?.structuredExam || !selectedQuestions.length) return;
    const existing = getQuestions();
    const candidates = filterDuplicateBankItems(
      examQuestionsToBankItems(finalDocument.structuredExam, selectedQuestions),
      existing,
    ).accepted;
    addQuestions(candidates.map(createQuestion));
    setMessage(
      candidates.length
        ? `Đã thêm ${candidates.length} câu vào ngân hàng cá nhân ở trạng thái cần rà soát.`
        : "Không thêm câu trùng với ngân hàng hiện có.",
    );
  }

  function openAudit() {
    if (!finalDocument) return;
    sessionStorage.setItem(
      EXAM_AUDIT_SESSION_INPUT,
      JSON.stringify(finalDocument),
    );
    window.location.assign("/tools/exam-audit");
  }

  if (!document)
    return (
      <div className="space-y-5">
        <section className="rounded-[30px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              <FileScan size={15} /> Nhận dạng tài liệu
            </span>
            <h1 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">
              Đọc đề từ ảnh/PDF
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              Tải đề đã quét hoặc PDF có cả chữ và ảnh, sau đó rà soát từng khối
              trước khi tạo đề có cấu trúc.
            </p>
          </div>
        </section>
        <section className="rounded-[28px] border-2 border-dashed border-blue-200 bg-white p-8 text-center shadow-sm">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
            onChange={(event) => void chooseFile(event.target.files?.[0])}
          />
          <Upload className="mx-auto text-blue-600" size={36} />
          <h2 className="mt-4 text-lg font-black text-slate-900">
            Chọn ảnh hoặc PDF đề kiểm tra
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            PNG, JPG/JPEG, WEBP tối đa 10 MB; PDF tối đa 40 MB và 30 trang. PDF
            có lớp chữ được đọc trực tiếp trước, chỉ trang quét mới dùng nhận
            dạng hình ảnh.
          </p>
          <button
            type="button"
            className="btn-primary mt-5"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Upload size={17} />
            )}{" "}
            Chọn file
          </button>
          <p className="mt-4 text-xs font-semibold text-amber-700">
            HEIC chưa được hỗ trợ. Vui lòng chuyển sang JPG hoặc PNG. Không tải
            file có mật khẩu.
          </p>
        </section>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Bắt buộc rà soát:</strong> Kết quả nhận dạng là bản nháp. Giáo
          viên cần kiểm tra câu hỏi, đáp án, công thức, bảng và hình trước khi
          xác nhận hoặc xuất file.
        </div>
        {progress || message ? (
          <p className="rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">
            {progress || message}
          </p>
        ) : null}
      </div>
    );

  return (
    <div className="space-y-5">
      {finalDocument ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openLessonSlides(finalDocument)}
          >
            <Presentation size={16} /> Tạo slide từ tài liệu đã nhận dạng
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openWorksheetGenerator(finalDocument, "practice")}
          >
            <FileText size={16} />
            Tạo phiếu từ tài liệu này
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openLessonPlanGenerator(finalDocument, "new_lesson")}
          >
            <FileText size={16} />
            Tạo giáo án từ tài liệu
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openReviewPack(finalDocument)}
          >
            <FileText size={16} />
            Tạo đề cương ôn tập
          </button>
        </div>
      ) : null}
      <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Đọc đề từ ảnh/PDF
            </p>
            <h1 className="mt-1 text-xl font-black text-slate-950">
              Kiểm tra nội dung đã nhận dạng
            </h1>
            <p className="mt-1 break-words text-sm font-bold text-slate-700">
              {document.sourceFileName}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {document.pageCount} trang ·{" "}
              {pageTypeLabels[document.pages[0]?.type || "unreadable"]} · trạng
              thái{" "}
              {document.reviewStatus === "confirmed"
                ? "đã xác nhận"
                : "bản nháp"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void recognizeAll()}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <FileScan size={16} />
              )}{" "}
              Đọc các trang cần xử lý
            </button>
            <button type="button" className="btn-secondary" onClick={saveDraft}>
              <Save size={16} /> Lưu bản nháp
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setDocument(null);
                setFinalDocument(null);
                setPageBlobs({});
              }}
            >
              <Trash2 size={16} /> Hủy
            </button>
          </div>
        </div>
        {progress || message ? (
          <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">
            {progress || message}
          </p>
        ) : null}
      </section>

      {summary ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ["Trang", `${summary.recognizedPages}/${summary.totalPages}`],
            ["Cần rà soát", summary.reviewPages],
            ["Câu hỏi", summary.questionCount],
            ["Công thức", summary.formulaReviewCount],
            ["Bảng/hình", summary.visualCount],
            ["Tin cậy thấp", summary.lowConfidenceBlockCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-3"
            >
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <AuthoringWorkspace
        navigatorLabel="Danh sách trang"
        canvasLabel="Ảnh tài liệu"
        inspectorLabel="Kiểm tra nội dung"
        selectionLabel={`Trang ${activePage} · ${reviewQueue.length} khối cần kiểm tra`}
        navigator={
          <aside className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-2 pb-2 text-sm font-black text-slate-900">
              Danh sách trang
            </p>
            <div className="max-h-[70vh] space-y-2 overflow-auto">
              {document.pages.map((item) => (
                <button
                  type="button"
                  key={item.pageNumber}
                  onClick={() => {
                    setActivePage(item.pageNumber);
                    setSelectedBlocks([]);
                  }}
                  className={`min-h-11 w-full rounded-2xl border p-3 text-left ${activePage === item.pageNumber ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}
                >
                  {item.adjustedDataUrl || item.sourceDataUrl ? (
                    <img
                      src={item.adjustedDataUrl || item.sourceDataUrl}
                      alt=""
                      className="mb-2 h-24 w-full rounded-xl bg-slate-100 object-contain"
                    />
                  ) : null}
                  <div className="flex items-center justify-between">
                    <strong>Trang {item.pageNumber}</strong>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.status === "recognized" ? "bg-emerald-500" : item.status === "failed" ? "bg-red-500" : item.status === "processing" ? "bg-blue-500" : "bg-amber-500"}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {pageTypeLabels[item.type]} · {item.blocks.length} khối
                  </p>
                  {item.warnings.length ? (
                    <p className="mt-1 line-clamp-2 text-xs text-amber-700">
                      {item.warnings[0]}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </aside>
        }
        canvas={
          <div className="min-w-0 rounded-[24px] border border-slate-200 bg-slate-100 p-3 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black text-slate-900">
                  {showOriginal ? "Ảnh gốc" : "Ảnh đã căn chỉnh"} · trang{" "}
                  {page?.pageNumber}
                </p>
                <p className="text-xs text-slate-500">
                  {page ? pageTypeLabels[page.type] : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary px-3"
                  type="button"
                  onClick={() => setShowOriginal((value) => !value)}
                >
                  {showOriginal ? "Xem ảnh đã căn chỉnh" : "Dùng ảnh gốc"}
                </button>
                <button
                  className="btn-secondary px-3"
                  type="button"
                  disabled={!pageBlobs[activePage]}
                  onClick={() => void rotatePage(-90)}
                  aria-label="Xoay trái"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="btn-secondary px-3"
                  type="button"
                  disabled={!pageBlobs[activePage]}
                  onClick={() => void rotatePage(90)}
                  aria-label="Xoay phải"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  className="btn-secondary px-3"
                  type="button"
                  onClick={() => replaceRef.current?.click()}
                >
                  Cắt/thay ảnh
                </button>
                <input
                  ref={replaceRef}
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    void replacePage(event.target.files?.[0])
                  }
                />
              </div>
            </div>
            <div className="flex min-h-[360px] items-center justify-center overflow-auto rounded-2xl border border-slate-200 bg-white">
              {page?.adjustedDataUrl || page?.sourceDataUrl ? (
                <div className="relative inline-block max-w-full">
                  <img
                    src={
                      showOriginal
                        ? page.sourceDataUrl || page.adjustedDataUrl
                        : page.adjustedDataUrl || page.sourceDataUrl
                    }
                    alt={`Trang ${page.pageNumber}`}
                    className="block max-h-[68vh] max-w-full object-contain"
                  />
                  {!showOriginal
                    ? page.blocks
                        .filter((item) => !item.excluded)
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={`Chọn ${blockLabels[item.type]}`}
                            title={blockLabels[item.type]}
                            onClick={() => {
                              setSelectedBlocks([item.id]);
                              setBlockFilter("all");
                            }}
                            className={`absolute border-2 ${selectedBlocks.includes(item.id) ? "border-blue-600 bg-blue-300/25" : item.confidence === "low" ? "border-red-500 bg-red-200/15" : "border-cyan-500 bg-cyan-200/10"}`}
                            style={{
                              left: `${item.boundingBox.x * 100}%`,
                              top: `${item.boundingBox.y * 100}%`,
                              width: `${item.boundingBox.width * 100}%`,
                              height: `${item.boundingBox.height * 100}%`,
                            }}
                          />
                        ))
                    : null}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <ImageIcon className="mx-auto" />
                  <p className="mt-2 text-sm">
                    Ảnh gốc không được lưu cùng bản nháp để bảo vệ dung lượng.
                    Có thể thay ảnh nếu cần đọc lại.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={busy || !pageBlobs[activePage]}
                onClick={() => void recognizePage(activePage, true)}
              >
                <FileScan size={16} /> Nhận dạng lại
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() =>
                  page &&
                  updatePage(page.pageNumber, (current) => ({
                    ...current,
                    status:
                      current.status === "excluded"
                        ? "needs_review"
                        : "excluded",
                  }))
                }
              >
                {page?.status === "excluded"
                  ? "Khôi phục trang"
                  : "Bỏ qua trang"}
              </button>
            </div>
          </div>
        }
        inspector={
          <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
              <div>
                <p className="font-black text-slate-900">
                  Khối nội dung đã nhận dạng
                </p>
                <p className="text-xs text-slate-500">
                  Chọn khối để gộp/tách, sửa chữ và xác nhận.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!reviewQueue.length}
                  onClick={openNextReviewBlock}
                >
                  <ClipboardCheck size={15} />
                  Kiểm tra tiếp ({reviewQueue.length})
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={addQuestion}
                >
                  <Plus size={15} /> Thêm câu thiếu
                </button>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(
                [
                  ["all", "Tất cả"],
                  ["review", "Cần kiểm tra"],
                  ["formula", "Công thức"],
                  ["table", "Bảng"],
                  ["visual", "Hình"],
                  ["question", "Câu hỏi"],
                  ["answer", "Đáp án"],
                ] as [BlockFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={blockFilter === value}
                  className={`min-h-11 rounded-full px-3 py-2 text-xs font-black ${blockFilter === value ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-50"}`}
                  onClick={() => setBlockFilter(value)}
                >
                  {label}
                  {value === "review" ? ` (${reviewQueue.length})` : ""}
                </button>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary px-3"
                disabled={selectedBlocks.length < 2}
                onClick={mergeSelected}
              >
                <Merge size={15} /> Gộp khối
              </button>
              <button
                type="button"
                className="btn-secondary px-3"
                disabled={selectedBlocks.length !== 1}
                onClick={splitSelected}
              >
                <Scissors size={15} /> Tách khối
              </button>
              <span className="self-center text-xs font-bold text-slate-500">
                Đã chọn {selectedBlocks.length}
              </span>
            </div>
            <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
              {visibleBlocks.length ? (
                visibleBlocks.map((block) => (
                  <article
                    key={block.id}
                    className={`rounded-2xl border p-3 ${selectedBlocks.includes(block.id) ? "ring-2 ring-emerald-300" : ""} ${block.excluded ? "border-slate-200 bg-slate-50 opacity-60" : block.confidence === "low" ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBlocks.includes(block.id)}
                        onChange={(event) =>
                          setSelectedBlocks(
                            event.target.checked
                              ? [...selectedBlocks, block.id]
                              : selectedBlocks.filter((id) => id !== block.id),
                          )
                        }
                        aria-label="Chọn khối"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold"
                            value={block.type}
                            onChange={(event) =>
                              updateBlock(block.id, {
                                type: event.target
                                  .value as RecognitionBlockType,
                                reviewed: false,
                              })
                            }
                          >
                            {Object.entries(blockLabels).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-black ${confidenceClass(block.confidence)}`}
                          >
                            {confidenceLabels[block.confidence]}
                          </span>
                          {block.reviewed ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-700">
                              Đã xác nhận
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ui-icon-button"
                        onClick={() => moveBlock(block.id, -1)}
                        aria-label="Đưa lên"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="ui-icon-button"
                        onClick={() => moveBlock(block.id, 1)}
                        aria-label="Đưa xuống"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <textarea
                      className="form-field mt-2 min-h-24 text-sm"
                      value={block.text}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: event.target.value,
                          reviewed: false,
                        })
                      }
                    />
                    {block.type === "formula" ? (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {block.sourceCrop ? (
                          <div>
                            <img
                              src={block.sourceCrop}
                              alt="Ảnh công thức"
                              className="max-h-28 rounded-xl border border-slate-200 object-contain"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              className="btn-secondary mt-2 px-2 text-xs"
                              onClick={() => void recognizeFormulaCrop(block)}
                            >
                              Nhận dạng lại công thức
                            </button>
                          </div>
                        ) : null}
                        <label className="block text-xs font-bold text-slate-600">
                          LaTeX
                          <input
                            className="form-field mt-1 font-mono text-xs"
                            value={block.latex || ""}
                            onChange={(event) =>
                              updateBlock(block.id, {
                                latex: event.target.value,
                                reviewed: false,
                              })
                            }
                          />
                        </label>
                        {block.latex ? (
                          <div
                            className="overflow-auto rounded-xl border border-slate-200 bg-white p-2 text-center"
                            dangerouslySetInnerHTML={{
                              __html: renderFormula(block.latex),
                            }}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    {block.type === "table" && block.table ? (
                      <label className="mt-2 block text-xs font-bold text-slate-600">
                        Bảng có thể chỉnh sửa
                        <textarea
                          className="form-field mt-1 min-h-24 font-mono text-xs"
                          value={block.table.rows
                            .map((row) => row.join("\t"))
                            .join("\n")}
                          onChange={(event) =>
                            updateBlock(block.id, {
                              table: {
                                ...block.table,
                                rows: event.target.value
                                  .split("\n")
                                  .map((row) => row.split("\t")),
                              },
                              reviewed: false,
                            })
                          }
                        />
                      </label>
                    ) : null}
                    {[
                      "option",
                      "true_false_statement",
                      "short_answer_area",
                      "formula",
                      "table",
                      "image",
                      "graph",
                      "geometric_figure",
                    ].includes(block.type) ? (
                      <label className="mt-2 block text-xs font-bold text-slate-600">
                        Gắn với câu hỏi
                        <select
                          className="form-field mt-1"
                          value={block.questionId || ""}
                          onChange={(event) =>
                            updateBlock(block.id, {
                              questionId: event.target.value || undefined,
                              parentBlockId: event.target.value || undefined,
                              reviewed: false,
                            })
                          }
                        >
                          <option value="">Chưa gắn</option>
                          {page?.blocks
                            .filter((item) =>
                              ["question", "essay_question"].includes(
                                item.type,
                              ),
                            )
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.text.slice(0, 80)}
                              </option>
                            ))}
                        </select>
                      </label>
                    ) : null}
                    {["image", "graph", "geometric_figure"].includes(
                      block.type,
                    ) ? (
                      <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <strong>Mặc định giữ ảnh gốc.</strong> Không tự thay
                        bằng hình vẽ lại.{" "}
                        {block.type === "geometric_figure" ? (
                          <Link
                            href="/tools/image-to-latex"
                            className="ml-1 font-black text-blue-700 underline"
                          >
                            Thử chuyển thành TikZ
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                    {block.warnings.length ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        <span className="font-black">Cần lưu ý:</span>{" "}
                        {block.warnings.slice(0, 2).join(" ")}
                        {block.warnings.length > 2
                          ? ` (+${block.warnings.length - 2} cảnh báo)`
                          : ""}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary px-2 text-xs"
                        onClick={() =>
                          updateBlock(block.id, {
                            reviewed: true,
                            confidence:
                              block.confidence === "low"
                                ? "medium"
                                : block.confidence,
                            warnings: [],
                          })
                        }
                      >
                        <Check size={14} /> Xác nhận
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-2 text-xs"
                        onClick={() =>
                          updateBlock(block.id, { excluded: !block.excluded })
                        }
                      >
                        {block.excluded ? "Khôi phục" : "Loại khỏi đề"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Trang chưa có khối nội dung. Hãy đọc trang hoặc thêm câu còn
                  thiếu.
                </div>
              )}
            </div>
          </div>
        }
      />

      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-black text-amber-950">Xác nhận cấu trúc đề</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-900">
              Chỉ xác nhận khi đã kiểm tra các khối tin cậy thấp, phương án,
              mệnh đề Đúng/Sai, công thức, bảng và hình. Sau bước này đề vẫn
              được đưa qua công cụ Kiểm tra đề trước khi sử dụng.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary shrink-0"
            onClick={finalize}
          >
            <ShieldCheck size={17} /> Xác nhận và tạo đề
          </button>
        </div>
      </section>

      {finalDocument ? (
        <section className="space-y-4">
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-emerald-950">
                  Đề đã được tạo từ bản nhận dạng
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Chọn câu để thêm vào ngân hàng cá nhân hoặc tiếp tục kiểm tra,
                  tạo lời giải, trộn mã và xuất file.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={openAudit}
                >
                  <ClipboardCheck size={16} /> Kiểm tra đề
                </button>
                <ActionMenu
                  label="Dùng đề này"
                  items={[
                    {
                      label: "Tạo lời giải & đáp án",
                      onSelect: () => openAnswerSolutions(finalDocument),
                    },
                    {
                      label: "Trộn mã đề",
                      onSelect: () => openExamMixer(finalDocument),
                    },
                  ]}
                />
                <DocumentExportMenu document={finalDocument} />
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm">
                  Thêm câu vào ngân hàng cá nhân
                </strong>
                <button
                  type="button"
                  className="btn-secondary px-3"
                  disabled={!selectedQuestions.length}
                  onClick={addToBank}
                >
                  Thêm {selectedQuestions.length} câu đã chọn
                </button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {finalDocument.structuredExam?.parts
                  .flatMap((part) => part.questions)
                  .map((question) => (
                    <label
                      key={question.id}
                      className="flex gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={(event) =>
                          setSelectedQuestions(
                            event.target.checked
                              ? [...selectedQuestions, question.id]
                              : selectedQuestions.filter(
                                  (id) => id !== question.id,
                                ),
                          )
                        }
                      />
                      <span>
                        <strong>Câu {question.number}.</strong> {question.stem}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <OutputPreview document={finalDocument} />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/exam-generator?mode=file"
          className="font-bold text-blue-700 hover:underline"
        >
          Mở Soạn đề kiểm tra
        </Link>
        <Link
          href="/question-bank"
          className="font-bold text-blue-700 hover:underline"
        >
          Mở Ngân hàng câu hỏi
        </Link>
        <Link
          href="/history"
          className="font-bold text-blue-700 hover:underline"
        >
          Mở Lịch sử
        </Link>
      </div>
    </div>
  );
}
