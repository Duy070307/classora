"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Copy,
  FileUp,
  FolderPlus,
  ListFilter,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BugReportLink } from "@/components/BugReportLink";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { createDocument } from "@/lib/history";
import { exportDocx } from "@/lib/export-docx";
import { downloadMarkdown, downloadTxt } from "@/lib/export-text";
import { printGeneratedDocument } from "@/lib/print-document";
import { getQuestions, saveQuestions } from "@/lib/question-bank";
import { listCloudQuestions } from "@/lib/data/question-bank-store";
import { listCloudDocuments } from "@/lib/data/documents-store";
import {
  auditAndUpdate,
  clusterDuplicateMatches,
  detectDuplicates,
  duplicateDecisionKey,
  filterIgnoredDuplicateMatches,
} from "@/lib/question-bank-core/audit";
import {
  createQuestionCollection,
  localQuestionCollections,
  saveQuestionCollection,
} from "@/lib/question-bank-core/collections";
import {
  importRowsFromText,
  type ImportReviewItem,
} from "@/lib/question-bank-core/import";
import {
  cloneQuestion,
  createCanonicalQuestion,
  normalizeQuestionItems,
  toLegacyQuestion,
} from "@/lib/question-bank-core/normalize";
import { buildSmartSet, filterQuestions } from "@/lib/question-bank-core/query";
import {
  activeQuestionFilters,
  clearQuestionFilter,
} from "@/lib/question-bank-core/ui-state";
import {
  openLessonPlanFromQuestions,
  openWorksheetFromQuestions,
  saveExamFromQuestions,
} from "@/lib/question-bank-core/integration";
import { openAnswerSolutions } from "@/lib/answer-solutions/session";
import { openGradingAssistant } from "@/lib/grading/session";
import { openExamBlueprint } from "@/lib/exam-blueprint/session";
import { openReviewPack } from "@/lib/review-pack/session";
import type {
  CanonicalQuestionType,
  QuestionBankItem,
  QuestionCollection,
  QuestionFilters,
  QuestionSort,
} from "@/lib/question-bank-core/types";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
} from "@/lib/question-bank-core/types";
import type { QuestionDifficulty } from "@/lib/types";

const difficulties: QuestionDifficulty[] = [
  "Nhận biết",
  "Thông hiểu",
  "Vận dụng",
  "Vận dụng cao",
];
const qualityLabels = {
  valid: "Hợp lệ",
  needs_review: "Cần rà soát",
  invalid: "Không hợp lệ",
} as const;
const qualityClasses = {
  valid: "bg-emerald-50 text-emerald-700",
  needs_review: "bg-amber-50 text-amber-800",
  invalid: "bg-red-50 text-red-700",
} as const;
const DUPLICATE_IGNORE_KEY = "soanlab-question-bank-duplicate-ignores-v1";

function unique(
  items: QuestionBankItem[],
  field: "subject" | "grade" | "topic" | "subtopic" | "bookSeries",
) {
  return [...new Set(items.map((item) => item[field]).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "vi", { numeric: true }),
  );
}

function mergeItems(local: QuestionBankItem[], cloud: QuestionBankItem[]) {
  const map = new Map(local.map((item) => [item.id, item]));
  cloud.forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

function collectionDocument(items: QuestionBankItem[], teacher: boolean) {
  const body = items
    .map((item, index) => {
      const options = item.options
        .map((option) => `${option.label}. ${option.text}`)
        .join("\n");
      const statements = item.trueFalseStatements
        .map((statement) => `${statement.label}) ${statement.text}`)
        .join("\n");
      const answer =
        item.type === "multiple_choice"
          ? item.correctOptionIds.join(", ")
          : item.type === "true_false"
            ? item.trueFalseStatements
                .map(
                  (statement) =>
                    `${statement.label}: ${statement.answer ? "Đúng" : "Sai"}`,
                )
                .join("; ")
            : item.answer || item.acceptedAnswers.join("; ");
      return `Câu ${index + 1}. ${item.prompt}${options ? `\n${options}` : ""}${statements ? `\n${statements}` : ""}${teacher ? `\nĐáp án: ${answer || "Chưa có"}${item.explanation ? `\nLời giải: ${item.explanation}` : ""}` : ""}`;
    })
    .join("\n\n");
  return createDocument(
    teacher ? "Bộ câu hỏi dành cho giáo viên" : "Bộ câu hỏi dành cho học sinh",
    "question-bank",
    body,
  );
}

function downloadBlob(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
function exportCsv(items: QuestionBankItem[]) {
  const headers = [
    "Môn",
    "Lớp",
    "Chủ đề",
    "Dạng câu",
    "Câu hỏi",
    "A",
    "B",
    "C",
    "D",
    "Đáp án",
    "Lời giải",
    "Độ khó",
    "Mức độ nhận thức",
    "Điểm",
    "Tags",
  ];
  const rows = items.map((item) => [
    item.subject,
    item.grade,
    item.topic,
    QUESTION_TYPE_LABELS[item.type],
    item.prompt,
    ...["A", "B", "C", "D"].map(
      (label) =>
        item.options.find((option) => option.label === label)?.text || "",
    ),
    item.type === "multiple_choice"
      ? item.correctOptionIds.join(";")
      : item.answer,
    item.explanation,
    item.difficulty,
    item.cognitiveLevel,
    item.score,
    item.tags.join(";"),
  ]);
  downloadBlob(
    `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`,
    "ngan-hang-cau-hoi.csv",
    "text/csv;charset=utf-8",
  );
}

async function exportXlsx(items: QuestionBankItem[]) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Câu hỏi");
  sheet.columns = [
    "Môn",
    "Lớp",
    "Chủ đề",
    "Dạng câu",
    "Câu hỏi",
    "A",
    "B",
    "C",
    "D",
    "Đáp án",
    "Lời giải",
    "Độ khó",
    "Mức độ nhận thức",
    "Điểm",
    "Tags",
  ].map((header) => ({
    header,
    key: header,
    width: header === "Câu hỏi" || header === "Lời giải" ? 45 : 18,
  }));
  items.forEach((item) =>
    sheet.addRow([
      item.subject,
      item.grade,
      item.topic,
      QUESTION_TYPE_LABELS[item.type],
      item.prompt,
      ...["A", "B", "C", "D"].map(
        (label) =>
          item.options.find((option) => option.label === label)?.text || "",
      ),
      item.type === "multiple_choice"
        ? item.correctOptionIds.join(";")
        : item.answer,
      item.explanation,
      item.difficulty,
      item.cognitiveLevel,
      item.score,
      item.tags.join(";"),
    ]),
  );
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const data = await workbook.xlsx.writeBuffer();
  downloadBlob(
    data,
    "ngan-hang-cau-hoi.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

function TypeFields({
  item,
  update,
}: {
  item: QuestionBankItem;
  update: (patch: Partial<QuestionBankItem>) => void;
}) {
  if (item.type === "multiple_choice")
    return (
      <div>
        <label className="label">Phương án và đáp án đúng</label>
        <div className="mt-2 space-y-2">
          {item.options.map((option, index) => (
            <div key={option.id} className="flex gap-2">
              <input
                type="radio"
                name="correct"
                checked={item.correctOptionIds.includes(option.id)}
                onChange={() => update({ correctOptionIds: [option.id] })}
              />
              <input
                className="form-field"
                value={option.text}
                onChange={(event) =>
                  update({
                    options: item.options.map((current, currentIndex) =>
                      currentIndex === index
                        ? { ...current, text: event.target.value }
                        : current,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label="Xóa phương án"
                className="text-red-600"
                onClick={() =>
                  update({
                    options: item.options.filter(
                      (_, currentIndex) => currentIndex !== index,
                    ),
                    correctOptionIds: item.correctOptionIds.filter(
                      (id) => id !== option.id,
                    ),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm font-bold text-blue-700"
          onClick={() => {
            const label = String.fromCharCode(65 + item.options.length);
            update({
              options: [
                ...item.options,
                { id: crypto.randomUUID(), label, text: "" },
              ],
            });
          }}
        >
          + Thêm phương án
        </button>
      </div>
    );
  if (item.type === "true_false")
    return (
      <div>
        <label className="label">Các mệnh đề</label>
        <div className="mt-2 space-y-2">
          {item.trueFalseStatements.map((statement, index) => (
            <div key={statement.id} className="rounded-xl border p-2">
              <div className="flex gap-2">
                <input
                  className="form-field"
                  value={statement.text}
                  onChange={(event) =>
                    update({
                      trueFalseStatements: item.trueFalseStatements.map(
                        (current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, text: event.target.value }
                            : current,
                      ),
                    })
                  }
                />
                <select
                  className="form-field w-28"
                  value={statement.answer ? "true" : "false"}
                  onChange={(event) =>
                    update({
                      trueFalseStatements: item.trueFalseStatements.map(
                        (current, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...current,
                                answer: event.target.value === "true",
                              }
                            : current,
                      ),
                    })
                  }
                >
                  <option value="true">Đúng</option>
                  <option value="false">Sai</option>
                </select>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() =>
                    update({
                      trueFalseStatements: item.trueFalseStatements.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm font-bold text-blue-700"
          onClick={() => {
            const index = item.trueFalseStatements.length;
            update({
              trueFalseStatements: [
                ...item.trueFalseStatements,
                {
                  id: crypto.randomUUID(),
                  label: String.fromCharCode(97 + index),
                  text: "",
                  answer: true,
                },
              ],
            });
          }}
        >
          + Thêm mệnh đề
        </button>
      </div>
    );
  if (item.type === "matching")
    return (
      <label>
        <span className="label">Các cặp ghép (trái = phải)</span>
        <textarea
          className="form-field mt-1 min-h-28"
          value={item.matchingPairs
            .map((pair) => `${pair.left} = ${pair.right}`)
            .join("\n")}
          onChange={(event) =>
            update({
              matchingPairs: event.target.value
                .split(/\r?\n/)
                .map((line) => line.split("="))
                .filter((pair) => pair[0]?.trim())
                .map((pair, index) => ({
                  id: item.matchingPairs[index]?.id || crypto.randomUUID(),
                  left: pair[0].trim(),
                  right: pair.slice(1).join("=").trim(),
                })),
            })
          }
        />
      </label>
    );
  if (item.type === "ordering")
    return (
      <label>
        <span className="label">Thứ tự đúng (mỗi dòng một mục)</span>
        <textarea
          className="form-field mt-1 min-h-28"
          value={item.orderingItems
            .sort((a, b) => a.order - b.order)
            .map((entry) => entry.text)
            .join("\n")}
          onChange={(event) =>
            update({
              orderingItems: event.target.value
                .split(/\r?\n/)
                .filter(Boolean)
                .map((text, index) => ({
                  id: item.orderingItems[index]?.id || crypto.randomUUID(),
                  text,
                  order: index + 1,
                })),
            })
          }
        />
      </label>
    );
  if (item.type === "table_completion")
    return (
      <label>
        <span className="label">Đáp án ô bảng (hàng,cột=giá trị)</span>
        <textarea
          className="form-field mt-1 min-h-28"
          value={item.tableAnswers
            .map((entry) => `${entry.row},${entry.column}=${entry.value}`)
            .join("\n")}
          onChange={(event) =>
            update({
              tableAnswers: event.target.value
                .split(/\r?\n/)
                .map((line) => line.match(/^(\d+)\s*,\s*(\d+)\s*=\s*(.+)$/))
                .filter((match): match is RegExpMatchArray => Boolean(match))
                .map((match) => ({
                  row: Number(match[1]),
                  column: Number(match[2]),
                  value: match[3],
                })),
            })
          }
        />
      </label>
    );
  return (
    <>
      <label>
        <span className="label">Đáp án</span>
        <textarea
          className="form-field mt-1 min-h-20"
          value={item.answer}
          onChange={(event) => update({ answer: event.target.value })}
        />
      </label>
      <label>
        <span className="label">Phương án chấp nhận (mỗi dòng một đáp án)</span>
        <textarea
          className="form-field mt-1 min-h-20"
          value={item.acceptedAnswers.join("\n")}
          onChange={(event) =>
            update({
              acceptedAnswers: event.target.value
                .split(/\r?\n/)
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      {item.type === "essay" ? (
        <label>
          <span className="label">Rubric (tiêu chí | điểm | hướng dẫn)</span>
          <textarea
            className="form-field mt-1 min-h-24"
            value={item.essayRubric
              .map(
                (entry) =>
                  `${entry.criterion} | ${entry.maxScore} | ${entry.guidance}`,
              )
              .join("\n")}
            onChange={(event) =>
              update({
                essayRubric: event.target.value
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .map((line, index) => {
                    const [criterion, score, ...guidance] = line.split("|");
                    return {
                      id: item.essayRubric[index]?.id || crypto.randomUUID(),
                      criterion: criterion.trim(),
                      maxScore: Math.max(0, Number(score) || 0),
                      guidance: guidance.join("|").trim(),
                    };
                  }),
              })
            }
          />
        </label>
      ) : null}
    </>
  );
}

export function QuestionBankWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"new" | "edit" | "copy">("new");
  const [draftBaseline, setDraftBaseline] = useState("");
  const [draft, setDraft] = useState<QuestionBankItem>(() =>
    createCanonicalQuestion({
      options: ["A", "B", "C", "D"].map((label) => ({
        id: label,
        label,
        text: "",
      })),
    }),
  );
  const [filters, setFilters] = useState<QuestionFilters>({
    scope: "all",
    usage: "all",
  });
  const [queryInput, setQueryInput] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<QuestionSort>("newest");
  const [collections, setCollections] = useState<QuestionCollection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState("");
  const [message, setMessage] = useState("");
  const [importRows, setImportRows] = useState<ImportReviewItem[]>([]);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [smartCount, setSmartCount] = useState(10);
  const [smartSeed, setSmartSeed] = useState("soanlab");
  const [ignoredDuplicateKeys, setIgnoredDuplicateKeys] = useState<Set<string>>(
    () => {
      if (typeof window === "undefined") return new Set();
      try {
        const parsed = JSON.parse(
          localStorage.getItem(DUPLICATE_IGNORE_KEY) || "[]",
        );
        return new Set(
          Array.isArray(parsed)
            ? parsed.filter((value) => typeof value === "string")
            : [],
        );
      } catch {
        return new Set();
      }
    },
  );

  const closeEditor = useCallback(
    (force = false) => {
      if (
        !force &&
        JSON.stringify(draft) !== draftBaseline &&
        !window.confirm(
          "Nội dung chưa lưu sẽ được giữ trong phiên này. Đóng trình chỉnh sửa?",
        )
      )
        return;
      setEditorOpen(false);
    },
    [draft, draftBaseline],
  );

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const local = normalizeQuestionItems(getQuestions());
        setItems(local);
        setCollections(localQuestionCollections());
        const [cloudQuestions, cloudDocuments] = await Promise.all([
          listCloudQuestions(),
          listCloudDocuments(),
        ]);
        if (cloudQuestions)
          setItems((current) =>
            mergeItems(current, normalizeQuestionItems(cloudQuestions)),
          );
        if (cloudDocuments)
          setCollections((current) => {
            const map = new Map(current.map((item) => [item.id, item]));
            cloudDocuments.forEach((document) => {
              if (document.questionCollection)
                map.set(
                  document.questionCollection.id,
                  document.questionCollection,
                );
            });
            return [...map.values()];
          });
      } catch (error) {
        if (process.env.NODE_ENV === "development")
          console.error("Question Bank load failed", error);
        setMessage("Chưa thể tải đầy đủ ngân hàng câu hỏi. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(
      () =>
        setFilters((current) => ({
          ...current,
          query: queryInput || undefined,
        })),
      220,
    );
    return () => window.clearTimeout(timeout);
  }, [queryInput]);

  useEffect(() => {
    if (!editorOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeEditor();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = editorRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    queueMicrotask(() =>
      editorRef.current
        ?.querySelector<HTMLElement>("input, textarea, select")
        ?.focus(),
    );
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeEditor, editorOpen]);

  function persist(next: QuestionBankItem[]) {
    try {
      saveQuestions(
        next.filter((item) => item.scope === "user").map(toLegacyQuestion),
      );
      setItems(next);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Question Bank save failed", error);
      setMessage(
        "Chưa thể lưu thay đổi. Nội dung đang chỉnh sửa vẫn được giữ.",
      );
      return false;
    }
  }
  function openEditor(item: QuestionBankItem) {
    const nextDraft = structuredClone(item);
    setActiveId(item.id);
    setDraft(nextDraft);
    setDraftBaseline(JSON.stringify(nextDraft));
    setEditorMode("edit");
    setEditorOpen(true);
  }
  function startNew() {
    const nextDraft = createCanonicalQuestion({
      subject: filters.subject || "",
      grade: filters.grade || "",
      topic: filters.topic || "",
      options: ["A", "B", "C", "D"].map((label) => ({
        id: label,
        label,
        text: "",
      })),
    });
    setActiveId("");
    setDraft(nextDraft);
    setDraftBaseline(JSON.stringify(nextDraft));
    setEditorMode("new");
    setEditorOpen(true);
  }
  function duplicate(item: QuestionBankItem) {
    const copy = cloneQuestion(item);
    setActiveId("");
    setDraft(copy);
    setDraftBaseline(JSON.stringify(copy));
    setEditorMode("copy");
    setEditorOpen(true);
  }
  function saveDraft(event?: FormEvent) {
    event?.preventDefault();
    if (draft.scope === "system") {
      setMessage(
        "Câu hỏi SOẠN LAB là dữ liệu dùng chung. Hãy nhân bản để chỉnh sửa riêng.",
      );
      return false;
    }
    const checked = auditAndUpdate({
      ...draft,
      updatedAt: new Date().toISOString(),
    });
    const next = activeId
      ? items.map((item) => (item.id === activeId ? checked : item))
      : [checked, ...items];
    if (!persist(next)) return false;
    setActiveId(checked.id);
    setDraft(checked);
    setDraftBaseline(JSON.stringify(checked));
    setEditorMode("edit");
    setMessage(
      checked.quality.status === "invalid"
        ? "Đã lưu bản nháp nhưng câu hỏi còn lỗi cấu trúc."
        : "Đã lưu câu hỏi.",
    );
    return true;
  }
  function remove(ids: string[], confirmed = false) {
    const own = items.filter(
      (item) => ids.includes(item.id) && item.scope === "user",
    );
    if (!own.length)
      return setMessage("Không có câu hỏi thuộc ngân hàng của thầy/cô để xóa.");
    if (
      !confirmed &&
      !window.confirm("Các câu hỏi đã chọn sẽ bị xóa khỏi ngân hàng.")
    )
      return;
    persist(
      items.filter((item) => !own.some((target) => target.id === item.id)),
    );
    setSelected([]);
    if (own.some((item) => item.id === activeId)) closeEditor(true);
  }

  const visible = useMemo(() => {
    const filtered = filterQuestions(items, filters, sort);
    if (!activeCollectionId) return filtered;
    const collection = collections.find(
      (item) => item.id === activeCollectionId,
    );
    return collection
      ? filtered.filter((item) => collection.questionIds.includes(item.id))
      : filtered;
  }, [activeCollectionId, collections, filters, items, sort]);
  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.id)),
    [items, selected],
  );
  const duplicates = useMemo(() => detectDuplicates(items), [items]);
  const reviewableDuplicates = useMemo(
    () =>
      filterIgnoredDuplicateMatches(duplicates, items, ignoredDuplicateKeys),
    [duplicates, ignoredDuplicateKeys, items],
  );
  const duplicateClusters = useMemo(
    () => clusterDuplicateMatches(items, reviewableDuplicates),
    [items, reviewableDuplicates],
  );
  const teacherDocument = useMemo(
    () => collectionDocument(selectedItems, true),
    [selectedItems],
  );
  const studentDocument = useMemo(
    () => collectionDocument(selectedItems, false),
    [selectedItems],
  );
  const activeFilters = useMemo(
    () => activeQuestionFilters(filters),
    [filters],
  );

  function bulkPatch(patch: Partial<QuestionBankItem>) {
    if (!selectedItems.length) return;
    persist(
      items.map((item) =>
        selected.includes(item.id) && item.scope === "user"
          ? auditAndUpdate({
              ...item,
              ...patch,
              updatedAt: new Date().toISOString(),
            })
          : item,
      ),
    );
    setMessage(
      `Đã cập nhật ${selectedItems.filter((item) => item.scope === "user").length} câu hỏi của thầy/cô.`,
    );
  }
  function addTags() {
    const value = window.prompt("Nhập tag, phân cách bằng dấu phẩy:");
    if (!value) return;
    const tags = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    persist(
      items.map((item) =>
        selected.includes(item.id) && item.scope === "user"
          ? {
              ...item,
              tags: [...new Set([...item.tags, ...tags])],
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }
  function addToCollection() {
    if (!selected.length) return setMessage("Vui lòng chọn câu hỏi trước.");
    const title = window.prompt(
      "Tên bộ câu hỏi:",
      collections.find((item) => item.id === activeCollectionId)?.title ||
        "Bộ câu hỏi mới",
    );
    if (!title) return;
    const existing = collections.find((item) => item.title === title);
    const collection = existing
      ? {
          ...existing,
          questionIds: [...new Set([...existing.questionIds, ...selected])],
          updatedAt: new Date().toISOString(),
        }
      : createQuestionCollection(title, selected);
    const saved = saveQuestionCollection(collection);
    setCollections((current) => [
      saved,
      ...current.filter((item) => item.id !== saved.id),
    ]);
    setActiveCollectionId(saved.id);
    setMessage(`Đã thêm ${selected.length} câu vào “${saved.title}”.`);
  }
  function renameCollection(collection: QuestionCollection) {
    const title = window.prompt("Tên mới:", collection.title);
    if (!title) return;
    const saved = saveQuestionCollection({ ...collection, title });
    setCollections((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/question-bank/import", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        rows?: ImportReviewItem[];
        error?: string;
        maintenance?: boolean;
        warnings?: string[];
        requiresRecognition?: boolean;
      };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.ok)
        throw new Error(data.error || "Chưa đọc được file.");
      setImportRows(data.rows || []);
      setMessage(
        data.requiresRecognition
          ? "PDF này là bản quét. Vui lòng dùng Đọc đề từ ảnh/PDF."
          : `Đã đọc ${data.rows?.length || 0} câu. Vui lòng rà soát rồi xác nhận nhập.${data.warnings?.length ? ` ${data.warnings.join(" ")}` : ""}`,
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Question Bank import failed", error);
      setMessage(
        "Không thể đọc một số câu hỏi. Các câu đã đọc thành công vẫn được giữ lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  function parsePaste() {
    const rows = importRowsFromText(paste);
    setImportRows(rows);
    setMessage(`Đã tách ${rows.length} mục. Vui lòng rà soát trước khi nhập.`);
  }
  function confirmImport() {
    const accepted = importRows
      .filter((row) => row.selected && row.status !== "error")
      .map((row) => row.item);
    if (!accepted.length) return setMessage("Chưa có câu hợp lệ được chọn.");
    const duplicateKeys = new Set(
      detectDuplicates([...items, ...accepted])
        .filter(
          (match) =>
            accepted.some(
              (item) => item.id === match.leftId || item.id === match.rightId,
            ) &&
            items.some(
              (item) => item.id === match.leftId || item.id === match.rightId,
            ),
        )
        .flatMap((match) => [match.leftId, match.rightId]),
    );
    const safe = accepted.filter((item) => !duplicateKeys.has(item.id));
    if (!safe.length)
      return setMessage(
        "Các câu đã chọn đều có thể trùng với ngân hàng hiện có. Hãy kiểm tra và quyết định trước khi nhập.",
      );
    persist([...safe, ...items]);
    setImportRows([]);
    setPaste("");
    setMessage(
      `Đã nhập ${safe.length} câu. Bỏ qua ${accepted.length - safe.length} câu có thể trùng.`,
    );
  }
  function toggleImport(id: string) {
    setImportRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              selected: !row.selected,
              status:
                row.status === "excluded"
                  ? row.warnings.length
                    ? "warning"
                    : "valid"
                  : "excluded",
            }
          : row,
      ),
    );
  }
  function updateImport(id: string, patch: Partial<QuestionBankItem>) {
    setImportRows((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        const item = auditAndUpdate({ ...row.item, ...patch });
        const status =
          item.quality.status === "invalid"
            ? "error"
            : item.quality.status === "needs_review"
              ? "warning"
              : "valid";
        return {
          ...row,
          item,
          warnings: item.quality.issues,
          status,
          selected: status !== "error",
        };
      }),
    );
  }
  function bulkImportMetadata() {
    const subject = window.prompt("Môn học (để trống nếu giữ nguyên):") || "";
    const grade = window.prompt("Khối/lớp (để trống nếu giữ nguyên):") || "";
    const topic = window.prompt("Chủ đề (để trống nếu giữ nguyên):") || "";
    setImportRows((rows) =>
      rows.map((row) => {
        if (!row.selected) return row;
        const item = auditAndUpdate({
          ...row.item,
          subject: subject || row.item.subject,
          grade: grade || row.item.grade,
          topic: topic || row.item.topic,
        });
        const status =
          item.quality.status === "invalid"
            ? "error"
            : item.quality.status === "needs_review"
              ? "warning"
              : "valid";
        return {
          ...row,
          item,
          warnings: item.quality.issues,
          status,
          selected: status !== "error",
        };
      }),
    );
  }

  function runSmartSet() {
    const result = buildSmartSet(items, {
      subject: filters.subject,
      grade: filters.grade,
      topics: filters.topic ? [filters.topic] : [],
      types: filters.type ? [filters.type] : [],
      count: smartCount,
      seed: smartSeed,
      excludeRecentlyUsedDays: 14,
    });
    setSelected(result.selected.map((item) => item.id));
    setMessage(
      result.shortages.length
        ? `${result.selected.length}/${result.requested} câu. ${result.shortages.join(" ")}`
        : `Đã chọn đủ ${result.selected.length} câu theo seed “${smartSeed}”.`,
    );
  }
  function handleUseSelection(
    action:
      "exam" | "worksheet" | "lesson" | "solutions" | "grading" | "blueprint",
  ) {
    if (!selectedItems.length)
      return setMessage("Vui lòng chọn ít nhất một câu hỏi.");
    const usedAt = new Date().toISOString();
    persist(
      items.map((item) =>
        selected.includes(item.id)
          ? {
              ...item,
              usage: {
                ...item.usage,
                count: item.usage.count + 1,
                lastUsedAt: usedAt,
              },
            }
          : item,
      ),
    );
    if (action === "blueprint")
      return openExamBlueprint({
        mode: "question_bank",
        selectedQuestionIds: selected,
      });
    if (action === "exam" || action === "grading") {
      const result = saveExamFromQuestions(selectedItems);
      if (action === "grading") return openGradingAssistant(result.document);
      if (!result.conflicts.length)
        return window.location.assign(`/history/${result.document.id}`);
      setMessage(
        `Đã tạo đề trong lịch sử với ${result.compatibleCount} câu tương thích. ${result.conflicts.length} câu cần xử lý thủ công.`,
      );
      return;
    }
    if (action === "worksheet")
      return openWorksheetFromQuestions(selectedItems);
    if (action === "lesson") return openLessonPlanFromQuestions(selectedItems);
    openAnswerSolutions(collectionDocument(selectedItems, true));
  }
  function ignoreDuplicateCluster(clusterId: string) {
    const cluster = duplicateClusters.find((item) => item.id === clusterId);
    if (!cluster) return;
    const byId = new Map(items.map((item) => [item.id, item]));
    const keys = cluster.matches.flatMap((match) => {
      const left = byId.get(match.leftId);
      const right = byId.get(match.rightId);
      return left && right ? [duplicateDecisionKey(left, right)] : [];
    });
    const next = new Set([...ignoredDuplicateKeys, ...keys]);
    setIgnoredDuplicateKeys(next);
    localStorage.setItem(DUPLICATE_IGNORE_KEY, JSON.stringify([...next]));
    setMessage("Đã ghi nhớ quyết định không trùng cho nội dung hiện tại.");
  }

  function mergeDuplicateMetadata(clusterId: string) {
    const cluster = duplicateClusters.find((item) => item.id === clusterId);
    if (!cluster) return;
    const clusterItems = items.filter((item) =>
      cluster.questionIds.includes(item.id),
    );
    const target = clusterItems.find((item) => item.scope === "user");
    if (!target)
      return setMessage(
        "Nhóm này chỉ có câu hỏi dùng chung nên không thể sửa metadata.",
      );
    const mergedTags = [...new Set(clusterItems.flatMap((item) => item.tags))];
    const next = items.map((item) =>
      item.id === target.id
        ? {
            ...item,
            tags: mergedTags,
            topic:
              item.topic ||
              clusterItems.find((entry) => entry.topic)?.topic ||
              "",
            subtopic:
              item.subtopic ||
              clusterItems.find((entry) => entry.subtopic)?.subtopic ||
              "",
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    if (persist(next))
      setMessage(
        "Đã gộp metadata vào một câu hỏi thuộc ngân hàng của thầy/cô.",
      );
  }

  function keepDuplicateQuestion(clusterId: string, keepId: string) {
    const cluster = duplicateClusters.find((item) => item.id === clusterId);
    if (!cluster) return;
    const removableIds = items
      .filter(
        (item) =>
          cluster.questionIds.includes(item.id) &&
          item.id !== keepId &&
          item.scope === "user",
      )
      .map((item) => item.id);
    if (!removableIds.length) {
      setMessage("Không có câu hỏi cá nhân nào khác trong nhóm để xóa.");
      return;
    }
    if (
      !window.confirm(
        `Giữ câu này và xóa ${removableIds.length} câu cá nhân còn lại trong nhóm?`,
      )
    )
      return;
    remove(removableIds, true);
  }

  function suggestMetadata() {
    const text = draft.prompt.toLocaleLowerCase("vi");
    const level: QuestionDifficulty =
      /chứng minh|đánh giá|vận dụng|giải thích/.test(text)
        ? "Vận dụng"
        : /so sánh|phân tích|tại sao/.test(text)
          ? "Thông hiểu"
          : "Nhận biết";
    setMessage(
      `Gợi ý: mức độ “${level}” (độ tin cậy trung bình), vì động từ trong câu hỏi phù hợp nhóm thao tác này. Chỉ áp dụng khi thầy/cô xác nhận.`,
    );
    if (window.confirm(`Áp dụng gợi ý mức độ “${level}”?`))
      setDraft((current) => ({
        ...current,
        difficulty: level,
        cognitiveLevel: level,
      }));
  }

  return (
    <AppShell title="Ngân hàng câu hỏi">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="soft-badge">Kho nội dung cá nhân</span>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Ngân hàng câu hỏi
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Lưu câu hỏi có cấu trúc, rà soát chất lượng, tạo bộ câu hỏi và
                tái sử dụng trong đề, phiếu học tập hoặc giáo án.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-secondary"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                <FileUp size={16} />
                {busy ? "Đang đọc…" : "Nhập file"}
              </button>
              <input
                ref={fileRef}
                className="hidden"
                type="file"
                accept=".xlsx,.csv,.docx,.pdf,.txt"
                onChange={(event) => void handleFile(event)}
              />
              <button
                className="btn-secondary"
                onClick={() => setSmartOpen((value) => !value)}
              >
                <WandSparkles size={16} />
                Tạo bộ thông minh
              </button>
              <button className="btn-primary" onClick={startNew}>
                <Plus size={16} />
                Thêm câu hỏi
              </button>
            </div>
          </div>
          <BugReportLink source="question-bank" className="mt-4" />
        </header>

        {message ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
            {message}
          </div>
        ) : null}
        {smartOpen ? (
          <section className="rounded-[24px] border border-blue-100 bg-white p-5">
            <div className="flex flex-wrap items-end gap-3">
              <label>
                <span className="label">Số câu cần chọn</span>
                <input
                  className="form-field mt-1 w-36"
                  type="number"
                  min="1"
                  max="200"
                  value={smartCount}
                  onChange={(event) =>
                    setSmartCount(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </label>
              <label>
                <span className="label">Seed tái lập</span>
                <input
                  className="form-field mt-1"
                  value={smartSeed}
                  onChange={(event) => setSmartSeed(event.target.value)}
                />
              </label>
              <button className="btn-primary" onClick={runSmartSet}>
                Tạo tập câu
              </button>
              <p className="text-sm text-slate-500">
                Cùng bộ lọc + cùng seed sẽ cho cùng kết quả. Không tự chèn câu
                ngoài chủ đề khi thiếu.
              </p>
            </div>
          </section>
        ) : null}

        {importRows.length || paste ? (
          <section className="rounded-[24px] border border-amber-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">Rà soát trước khi nhập</h2>
                <p className="text-sm text-slate-500">
                  Có thể sửa trực tiếp nội dung, đáp án và chủ đề; chỉ các dòng
                  được chọn và không có lỗi chặn mới được nhập.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {importRows.length ? (
                  <button
                    className="btn-secondary"
                    onClick={bulkImportMetadata}
                  >
                    Gán metadata đã chọn
                  </button>
                ) : null}
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setImportRows([]);
                    setPaste("");
                  }}
                >
                  Hủy
                </button>
                <button className="btn-primary" onClick={confirmImport}>
                  Xác nhận nhập
                </button>
              </div>
            </div>
            {!importRows.length ? (
              <div className="mt-4">
                <textarea
                  className="form-field min-h-40"
                  value={paste}
                  onChange={(event) => setPaste(event.target.value)}
                  placeholder={
                    "Câu 1. Nội dung câu hỏi\nA. ...\nB. ...\nĐáp án: A"
                  }
                />
                <button className="btn-secondary mt-2" onClick={parsePaste}>
                  Tách câu hỏi
                </button>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[1100px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-500">
                      <th className="p-2">Chọn</th>
                      <th>Trạng thái</th>
                      <th>Dạng câu</th>
                      <th>Nội dung</th>
                      <th>Đáp án</th>
                      <th>Chủ đề</th>
                      <th>Cảnh báo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row) => (
                      <tr key={row.id} className="border-t align-top">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleImport(row.id)}
                          />
                        </td>
                        <td className="p-2 font-bold">
                          {
                            {
                              valid: "Hợp lệ",
                              warning: "Cần kiểm tra",
                              error: "Lỗi cấu trúc",
                              excluded: "Bị loại",
                            }[row.status]
                          }
                        </td>
                        <td className="p-2">
                          <select
                            className="form-field w-44"
                            value={row.item.type}
                            onChange={(event) =>
                              updateImport(row.id, {
                                type: event.target
                                  .value as CanonicalQuestionType,
                              })
                            }
                          >
                            {QUESTION_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {QUESTION_TYPE_LABELS[type]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="max-w-md p-2">
                          <textarea
                            className="form-field min-h-20 w-80"
                            value={row.item.prompt}
                            onChange={(event) =>
                              updateImport(row.id, {
                                prompt: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="form-field w-36"
                            value={
                              row.item.type === "multiple_choice"
                                ? row.item.correctOptionIds.join(",")
                                : row.item.answer
                            }
                            onChange={(event) =>
                              updateImport(
                                row.id,
                                row.item.type === "multiple_choice"
                                  ? {
                                      correctOptionIds: event.target.value
                                        .toUpperCase()
                                        .split(/[,;]/)
                                        .map((value) => value.trim())
                                        .filter(Boolean),
                                    }
                                  : { answer: event.target.value },
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="form-field w-40"
                            value={row.item.topic}
                            onChange={(event) =>
                              updateImport(row.id, {
                                topic: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="max-w-xs p-2 text-amber-800">
                          {row.warnings.join(" · ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <details className="rounded-[24px] border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-black">
              Hoặc dán nội dung câu hỏi
            </summary>
            <textarea
              className="form-field mt-3 min-h-32"
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
            />
            <button className="btn-secondary mt-2" onClick={parsePaste}>
              Rà soát nội dung dán
            </button>
          </details>
        )}

        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          {filterOpen ? (
            <button
              type="button"
              aria-label="Đóng bộ lọc"
              className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
              onClick={() => setFilterOpen(false)}
            />
          ) : null}
          <aside
            className={`${filterOpen ? "fixed inset-y-0 left-0 z-50 block w-[min(88vw,320px)] overflow-y-auto bg-slate-50 p-4 shadow-2xl" : "hidden"} space-y-4 lg:static lg:z-auto lg:block lg:w-auto lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none`}
          >
            <section className="rounded-[24px] border bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black">Bộ câu hỏi</h2>
                <button
                  aria-label="Tạo bộ"
                  onClick={() => {
                    const title = window.prompt("Tên bộ câu hỏi:");
                    if (title) {
                      const saved = saveQuestionCollection(
                        createQuestionCollection(title),
                      );
                      setCollections((current) => [saved, ...current]);
                    }
                  }}
                >
                  <FolderPlus size={17} />
                </button>
              </div>
              <button
                className={`mt-3 w-full rounded-xl p-2 text-left text-sm font-bold ${!activeCollectionId ? "bg-blue-50 text-blue-800" : "hover:bg-slate-50"}`}
                onClick={() => setActiveCollectionId("")}
              >
                Tất cả câu hỏi ({items.length})
              </button>
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`mt-1 flex rounded-xl ${activeCollectionId === collection.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <button
                    className="min-w-0 flex-1 p-2 text-left text-sm"
                    onClick={() => setActiveCollectionId(collection.id)}
                  >
                    <strong className="block truncate">
                      {collection.title}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {collection.questionIds.length} câu
                    </span>
                  </button>
                  <button
                    aria-label="Đổi tên"
                    className="px-2"
                    onClick={() => renameCollection(collection)}
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              ))}
            </section>
            <section className="rounded-[24px] border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-black">
                  <ListFilter size={17} />
                  Bộ lọc{" "}
                  {activeFilters.length ? `(${activeFilters.length})` : ""}
                </h2>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 lg:hidden"
                  aria-label="Đóng bộ lọc"
                  onClick={() => setFilterOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <select
                  className="form-field"
                  value={filters.scope || "all"}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      scope: event.target.value as QuestionFilters["scope"],
                    })
                  }
                >
                  <option value="all">Mọi nguồn</option>
                  <option value="system">SOẠN LAB</option>
                  <option value="user">Của tôi</option>
                </select>
                {(
                  [
                    "subject",
                    "grade",
                    "topic",
                    "subtopic",
                    "bookSeries",
                  ] as const
                ).map((field) => (
                  <select
                    key={field}
                    className="form-field"
                    value={filters[field] || ""}
                    onChange={(event) =>
                      setFilters({ ...filters, [field]: event.target.value })
                    }
                  >
                    <option value="">
                      {field === "subject"
                        ? "Mọi môn"
                        : field === "grade"
                          ? "Mọi khối"
                          : field === "topic"
                            ? "Mọi chủ đề"
                            : field === "subtopic"
                              ? "Mọi chủ đề con"
                              : "Mọi bộ sách"}
                    </option>
                    {unique(items, field).map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                ))}
                <select
                  className="form-field"
                  value={filters.type || ""}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      type: event.target.value as CanonicalQuestionType | "",
                    })
                  }
                >
                  <option value="">Mọi dạng câu</option>
                  {QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {QUESTION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <select
                  className="form-field"
                  value={filters.difficulty || ""}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      difficulty: event.target.value as QuestionDifficulty | "",
                    })
                  }
                >
                  <option value="">Mọi độ khó</option>
                  {difficulties.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <select
                  className="form-field"
                  value={filters.quality || ""}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      quality: event.target.value as QuestionFilters["quality"],
                    })
                  }
                >
                  <option value="">Mọi chất lượng</option>
                  <option value="valid">Hợp lệ</option>
                  <option value="needs_review">Cần rà soát</option>
                  <option value="invalid">Không hợp lệ</option>
                </select>
                <select
                  className="form-field"
                  value={filters.usage || "all"}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      usage: event.target.value as QuestionFilters["usage"],
                    })
                  }
                >
                  <option value="all">Đã/chưa sử dụng</option>
                  <option value="used">Đã sử dụng</option>
                  <option value="unused">Chưa sử dụng</option>
                </select>
                {activeFilters.length ? (
                  <button
                    type="button"
                    className="w-full text-sm font-bold text-blue-700"
                    onClick={() => {
                      setFilters({ scope: "all", usage: "all" });
                      setQueryInput("");
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                ) : null}
              </div>
            </section>
          </aside>

          <main className="min-w-0 space-y-3">
            <section className="rounded-[24px] border bg-white p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary lg:hidden"
                  onClick={() => setFilterOpen(true)}
                >
                  <ListFilter size={16} />
                  Bộ lọc{" "}
                  {activeFilters.length ? `(${activeFilters.length})` : ""}
                </button>
                <label className="relative min-w-56 flex-1">
                  <Search
                    className="absolute left-3 top-3 text-slate-400"
                    size={17}
                  />
                  <input
                    className="form-field pl-10"
                    value={queryInput}
                    onChange={(event) => setQueryInput(event.target.value)}
                    placeholder="Tìm nội dung, đáp án, tag…"
                  />
                </label>
                <select
                  className="form-field w-44"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as QuestionSort)
                  }
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="most_used">Dùng nhiều nhất</option>
                  <option value="least_used">Ít dùng nhất</option>
                  <option value="difficulty">Độ khó</option>
                  <option value="topic">Chủ đề</option>
                  <option value="quality">Chất lượng</option>
                </select>
              </div>
              {activeFilters.length ? (
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  aria-label="Bộ lọc đang dùng"
                >
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100"
                      onClick={() => {
                        setFilters((current) =>
                          clearQuestionFilter(current, filter.key),
                        );
                        if (filter.key === "query") setQueryInput("");
                      }}
                      aria-label={`Bỏ bộ lọc ${filter.label}: ${filter.value}`}
                    >
                      {filter.value} ×
                    </button>
                  ))}
                  <button
                    type="button"
                    className="px-2 text-xs font-bold text-slate-600 hover:text-blue-700"
                    onClick={() => {
                      setFilters({ scope: "all", usage: "all" });
                      setQueryInput("");
                    }}
                  >
                    Xóa tất cả
                  </button>
                </div>
              ) : null}
              <div className="mt-3 text-sm text-slate-600">
                <strong className="text-slate-900">
                  {visible.length} câu hỏi
                </strong>
              </div>
            </section>

            {selectedItems.length ? (
              <section className="sticky top-3 z-30 rounded-[22px] border border-blue-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="mr-1 text-sm text-blue-900">
                    Đã chọn {selectedItems.length} câu
                  </strong>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleUseSelection("exam")}
                  >
                    Tạo đề
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={addToCollection}
                  >
                    Thêm vào bộ
                  </button>
                  <ActionMenu
                    label="Dùng trong..."
                    items={[
                      {
                        label: "Tạo phiếu học tập",
                        onSelect: () => handleUseSelection("worksheet"),
                      },
                      {
                        label: "Đưa vào giáo án",
                        onSelect: () => handleUseSelection("lesson"),
                      },
                      {
                        label: "Lấy câu theo ma trận",
                        onSelect: () => handleUseSelection("blueprint"),
                      },
                      {
                        label: "Chuẩn bị chấm bài",
                        onSelect: () => handleUseSelection("grading"),
                      },
                      {
                        label: "Tạo/kiểm tra lời giải",
                        onSelect: () => handleUseSelection("solutions"),
                      },
                      {
                        label: "Tạo đề cương ôn tập",
                        onSelect: () =>
                          openReviewPack(
                            collectionDocument(selectedItems, true),
                          ),
                      },
                    ]}
                  />
                  <ActionMenu
                    label="Xuất"
                    items={[
                      {
                        label: "Word bản học sinh",
                        onSelect: () => exportDocx(studentDocument),
                      },
                      {
                        label: "Word bản giáo viên",
                        onSelect: () => exportDocx(teacherDocument),
                      },
                      {
                        label: "PDF bản học sinh",
                        onSelect: () => printGeneratedDocument(studentDocument),
                      },
                      {
                        label: "PDF bản giáo viên",
                        onSelect: () => printGeneratedDocument(teacherDocument),
                      },
                      {
                        label: "XLSX",
                        onSelect: () => exportXlsx(selectedItems),
                      },
                      {
                        label: "CSV",
                        onSelect: () => exportCsv(selectedItems),
                      },
                      {
                        label: "Markdown",
                        onSelect: () => downloadMarkdown(teacherDocument),
                      },
                      {
                        label: "TXT",
                        onSelect: () => downloadTxt(teacherDocument),
                      },
                    ]}
                  />
                  <ActionMenu
                    label="Thao tác khác"
                    items={[
                      {
                        label: "Sao chép",
                        onSelect: async () => {
                          await navigator.clipboard.writeText(
                            teacherDocument.content,
                          );
                          setMessage("Đã sao chép các câu đã chọn.");
                        },
                      },
                      { label: "Thêm tag", onSelect: addTags },
                      {
                        label: "Đổi mức độ",
                        onSelect: () => {
                          const value = window.prompt(
                            `Nhập mức độ: ${difficulties.join(", ")}`,
                          );
                          if (
                            value &&
                            difficulties.includes(value as QuestionDifficulty)
                          )
                            bulkPatch({
                              difficulty: value as QuestionDifficulty,
                              cognitiveLevel: value as QuestionDifficulty,
                            });
                        },
                      },
                      {
                        label: "Xóa câu đã chọn",
                        onSelect: () => remove(selected),
                        danger: true,
                      },
                    ]}
                  />
                  <button
                    type="button"
                    className="ml-auto text-xs font-bold text-blue-700"
                    onClick={() => setSelected(visible.map((item) => item.id))}
                  >
                    Chọn tất cả kết quả hiện tại
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-slate-600"
                    onClick={() => setSelected([])}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </section>
            ) : null}

            {duplicates.length || ignoredDuplicateKeys.size ? (
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none font-black text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                  <span>{duplicateClusters.length} nhóm câu cần kiểm tra</span>
                  <span className="ml-3 text-xs font-semibold text-slate-500">
                    Trùng chính xác{" "}
                    {
                      duplicateClusters.filter(
                        (cluster) => cluster.kind === "exact",
                      ).length
                    }{" "}
                    · Gần trùng{" "}
                    {
                      duplicateClusters.filter(
                        (cluster) => cluster.kind !== "exact",
                      ).length
                    }{" "}
                    · Đã bỏ qua {ignoredDuplicateKeys.size}
                  </span>
                </summary>
                <div className="mt-4 space-y-3 text-sm">
                  {duplicateClusters.length ? (
                    duplicateClusters.map((cluster) => {
                      const clusterItems = items.filter((item) =>
                        cluster.questionIds.includes(item.id),
                      );
                      return (
                        <article
                          key={cluster.id}
                          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <strong className="text-amber-950">
                                {cluster.kind === "exact"
                                  ? "Trùng chính xác"
                                  : cluster.kind === "reordered_options"
                                    ? "Trùng sau khi đảo phương án"
                                    : "Gần trùng có độ tin cậy cao"}
                              </strong>
                              <p className="mt-1 text-xs text-slate-600">
                                {cluster.questionIds.length} câu · độ tin cậy{" "}
                                {Math.round(cluster.confidence * 100)}%
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn-secondary min-h-9 px-3 py-1.5 text-xs"
                                onClick={() =>
                                  setMessage(
                                    "Đã giữ nguyên tất cả câu trong nhóm; không có dữ liệu nào bị xóa.",
                                  )
                                }
                              >
                                Giữ tất cả
                              </button>
                              <button
                                type="button"
                                className="btn-secondary min-h-9 px-3 py-1.5 text-xs"
                                onClick={() =>
                                  ignoreDuplicateCluster(cluster.id)
                                }
                              >
                                Đánh dấu không trùng
                              </button>
                              <button
                                type="button"
                                className="btn-secondary min-h-9 px-3 py-1.5 text-xs"
                                onClick={() =>
                                  mergeDuplicateMetadata(cluster.id)
                                }
                              >
                                Gộp metadata
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {clusterItems.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-slate-200 bg-white p-3"
                              >
                                <p className="font-semibold leading-6 text-slate-900">
                                  {item.prompt}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {item.source.name ||
                                    (item.scope === "system"
                                      ? "SOẠN LAB"
                                      : "Của tôi")}{" "}
                                  ·{" "}
                                  {new Date(item.createdAt).toLocaleDateString(
                                    "vi-VN",
                                  )}{" "}
                                  · dùng {item.usage.count} lần
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="text-xs font-bold text-blue-700"
                                    onClick={() => openEditor(item)}
                                  >
                                    Xem/chỉnh sửa
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs font-bold text-blue-700"
                                    onClick={() =>
                                      keepDuplicateQuestion(cluster.id, item.id)
                                    }
                                  >
                                    Giữ câu này
                                  </button>
                                  {item.scope === "user" ? (
                                    <button
                                      type="button"
                                      className="text-xs font-bold text-red-700"
                                      onClick={() => remove([item.id])}
                                    >
                                      Xóa câu này
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-3 text-slate-600">
                      Không còn nhóm câu nào cần kiểm tra.
                    </p>
                  )}
                </div>
              </details>
            ) : null}
            <section className="space-y-2">
              {loading ? (
                <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-600">
                  Đang tải ngân hàng câu hỏi...
                </div>
              ) : visible.length ? (
                visible.map((item) => (
                  <article
                    key={item.id}
                    className={`group rounded-2xl border bg-white p-4 transition ${activeId === item.id && editorOpen ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        className="mt-1"
                        type="checkbox"
                        aria-label={`Chọn câu hỏi: ${item.prompt.slice(0, 80)}`}
                        checked={selected.includes(item.id)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id],
                          )
                        }
                      />
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => openEditor(item)}
                      >
                        <div className="flex flex-wrap gap-2">
                          <span className="soft-badge">
                            {QUESTION_TYPE_LABELS[item.type]}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-black ${item.quality.checkedAt ? qualityClasses[item.quality.status] : "bg-slate-100 text-slate-600"}`}
                          >
                            {item.quality.checkedAt
                              ? qualityLabels[item.quality.status]
                              : "Chưa kiểm tra"}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-5 font-bold leading-6 text-slate-900">
                          {item.prompt || "Câu hỏi chưa có nội dung"}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">
                            {item.subject || "Chưa có môn"} · Lớp{" "}
                            {item.grade || "—"} ·{" "}
                            {item.topic || "Chưa có chủ đề"}
                          </p>
                          <p>
                            {item.difficulty} · {item.cognitiveLevel} ·{" "}
                            {item.source.name ||
                              (item.scope === "system"
                                ? "SOẠN LAB"
                                : "Của tôi")}{" "}
                            · dùng {item.usage.count} lần
                          </p>
                        </div>
                      </button>
                      <div className="hidden gap-1 md:group-hover:flex md:group-focus-within:flex">
                        <button
                          aria-label="Chỉnh sửa câu hỏi"
                          className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
                          onClick={() => openEditor(item)}
                        >
                          <Sparkles size={16} />
                        </button>
                        <button
                          aria-label="Nhân bản"
                          className="rounded-lg p-2 hover:bg-slate-100"
                          onClick={() => duplicate(item)}
                        >
                          <Copy size={16} />
                        </button>
                        {item.scope === "user" ? (
                          <button
                            aria-label="Xóa"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            onClick={() => remove([item.id])}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                      <div className="md:hidden">
                        <ActionMenu
                          label="Tác vụ"
                          className="btn-secondary min-h-9 px-3 py-1.5 text-xs"
                          items={[
                            {
                              label: "Chỉnh sửa",
                              onSelect: () => openEditor(item),
                            },
                            {
                              label: "Nhân bản",
                              onSelect: () => duplicate(item),
                            },
                            ...(item.scope === "user"
                              ? [
                                  {
                                    label: "Xóa",
                                    onSelect: () => remove([item.id]),
                                    danger: true,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed bg-white p-10 text-center">
                  <Search className="mx-auto text-slate-400" />
                  <h2 className="mt-3 font-black">
                    {items.length
                      ? "Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại."
                      : "Ngân hàng câu hỏi chưa có nội dung."}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {items.length
                      ? "Xóa một số bộ lọc để xem thêm kết quả."
                      : "Nhập từ file hoặc thêm câu hỏi mới để bắt đầu."}
                  </p>
                </div>
              )}
            </section>
          </main>

          {editorOpen ? (
            <>
              <button
                type="button"
                aria-label="Đóng trình chỉnh sửa"
                className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
                onClick={() => closeEditor()}
              />
              <aside
                ref={editorRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="question-editor-title"
                className="fixed inset-y-0 right-0 z-50 h-dvh w-full overflow-y-auto bg-slate-50 shadow-2xl sm:max-w-xl"
              >
                <form
                  onSubmit={saveDraft}
                  className="min-h-full space-y-3 bg-white p-4 pb-10 sm:p-6"
                >
                  <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
                    <div>
                      <h2 id="question-editor-title" className="font-black">
                        {editorMode === "edit"
                          ? "Chỉnh sửa câu hỏi"
                          : editorMode === "copy"
                            ? "Bản sao câu hỏi"
                            : "Thêm câu hỏi"}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"
                        onClick={suggestMetadata}
                        title="Gợi ý phân loại"
                        aria-label="Gợi ý phân loại"
                      >
                        <Sparkles size={18} />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                        onClick={() => closeEditor()}
                        aria-label="Đóng trình chỉnh sửa"
                      >
                        <X size={19} />
                      </button>
                    </div>
                  </div>
                  <label>
                    <span className="label">Dạng câu</span>
                    <select
                      className="form-field mt-1"
                      value={draft.type}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          type: event.target.value as CanonicalQuestionType,
                        })
                      }
                    >
                      {QUESTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {QUESTION_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="label">Nội dung câu hỏi</span>
                    <textarea
                      className="form-field mt-1 min-h-28"
                      value={draft.prompt}
                      onChange={(event) =>
                        setDraft({ ...draft, prompt: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span className="label">Hướng dẫn</span>
                    <input
                      className="form-field mt-1"
                      value={draft.instructions}
                      onChange={(event) =>
                        setDraft({ ...draft, instructions: event.target.value })
                      }
                    />
                  </label>
                  <TypeFields
                    item={draft}
                    update={(patch) => setDraft({ ...draft, ...patch })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <span className="label">Môn</span>
                      <input
                        className="form-field mt-1"
                        value={draft.subject}
                        onChange={(event) =>
                          setDraft({ ...draft, subject: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="label">Lớp</span>
                      <input
                        className="form-field mt-1"
                        value={draft.grade}
                        onChange={(event) =>
                          setDraft({ ...draft, grade: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="label">Chủ đề</span>
                      <input
                        className="form-field mt-1"
                        value={draft.topic}
                        onChange={(event) =>
                          setDraft({ ...draft, topic: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="label">Chủ đề con</span>
                      <input
                        className="form-field mt-1"
                        value={draft.subtopic}
                        onChange={(event) =>
                          setDraft({ ...draft, subtopic: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="label">Độ khó</span>
                      <select
                        className="form-field mt-1"
                        value={draft.difficulty}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            difficulty: event.target
                              .value as QuestionDifficulty,
                          })
                        }
                      >
                        {difficulties.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="label">Điểm</span>
                      <input
                        className="form-field mt-1"
                        type="number"
                        min="0"
                        step="0.25"
                        value={draft.score}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            score: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span className="label">Yêu cầu cần đạt</span>
                    <input
                      className="form-field mt-1"
                      value={draft.learningOutcome}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          learningOutcome: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="label">Tags</span>
                    <input
                      className="form-field mt-1"
                      value={draft.tags.join(", ")}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          tags: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="label">Đơn vị / sai số</span>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <input
                        className="form-field"
                        value={draft.unit}
                        onChange={(event) =>
                          setDraft({ ...draft, unit: event.target.value })
                        }
                      />
                      <input
                        className="form-field"
                        type="number"
                        min="0"
                        step="any"
                        value={draft.tolerance ?? ""}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            tolerance:
                              event.target.value === ""
                                ? undefined
                                : Math.max(0, Number(event.target.value)),
                          })
                        }
                      />
                    </div>
                  </label>
                  <label>
                    <span className="label">Lời giải</span>
                    <textarea
                      className="form-field mt-1 min-h-24"
                      value={draft.explanation}
                      onChange={(event) =>
                        setDraft({ ...draft, explanation: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span className="label">LaTeX / TikZ / mô tả hình</span>
                    <textarea
                      className="form-field mt-1 min-h-20"
                      value={draft.visuals[0]?.content || ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          visuals: event.target.value
                            ? [
                                {
                                  id:
                                    draft.visuals[0]?.id || crypto.randomUUID(),
                                  type: event.target.value.includes(
                                    "tikzpicture",
                                  )
                                    ? "tikz"
                                    : "formula",
                                  content: event.target.value,
                                  alt: "Nội dung trực quan của câu hỏi",
                                },
                              ]
                            : [],
                        })
                      }
                    />
                  </label>
                  {draft.quality.issues.length ? (
                    <div
                      className={`rounded-xl p-3 text-sm ${qualityClasses[draft.quality.status]}`}
                    >
                      <strong>{qualityLabels[draft.quality.status]}</strong>
                      {draft.quality.issues.map((issue) => (
                        <p key={issue} className="mt-1">
                          • {issue}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-primary">
                      <Save size={15} />
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        if (saveDraft()) startNew();
                      }}
                    >
                      Lưu và thêm câu khác
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setDraft(auditAndUpdate(draft))}
                    >
                      <CheckCircle2 size={15} />
                      Kiểm tra câu hỏi
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => duplicate(draft)}
                    >
                      <Copy size={15} />
                      Nhân bản
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm
                    tra, chỉnh sửa trước khi sử dụng chính thức.
                  </p>
                </form>
              </aside>
            </>
          ) : null}
        </div>
        <section className="rounded-[24px] border bg-white p-5">
          <h2 className="font-black">Mẫu nhập dữ liệu</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="btn-secondary"
              href="/templates/mau-ngan-hang-cau-hoi-trac-nghiem.xlsx"
              download
            >
              Excel trắc nghiệm
            </Link>
            <Link
              className="btn-secondary"
              href="/templates/mau-ngan-hang-cau-hoi-dung-sai.xlsx"
              download
            >
              Excel đúng/sai
            </Link>
            <Link
              className="btn-secondary"
              href="/templates/mau-ngan-hang-cau-hoi-tra-loi-ngan.xlsx"
              download
            >
              Excel trả lời ngắn
            </Link>
            <Link
              className="btn-secondary"
              href="/templates/mau-ngan-hang-cau-hoi-hon-hop.xlsx"
              download
            >
              Excel hỗn hợp
            </Link>
            <Link
              className="btn-secondary"
              href="/templates/mau-ngan-hang-cau-hoi-soan-lab.csv"
              download
            >
              CSV đơn giản
            </Link>
            <Link className="btn-secondary" href="/tools/document-recognition">
              PDF quét: Đọc đề từ ảnh/PDF
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
