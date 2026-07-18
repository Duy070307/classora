"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Copy,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthoringWorkspace } from "@/components/authoring/AuthoringWorkspace";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { listCloudDocuments } from "@/lib/data/documents-store";
import { getHistory, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { rubricCoverage } from "@/lib/rubric/coverage";
import {
  downloadRubricDocx,
  downloadRubricXlsx,
  printRubricPdf,
} from "@/lib/rubric/export";
import { importRubricFile, importRubricText } from "@/lib/rubric/import";
import { readRubricSession } from "@/lib/rubric/session";
import { RUBRIC_TEMPLATES, rubricFromTemplate } from "@/lib/rubric/templates";
import type {
  Rubric,
  RubricCriterion,
  RubricInputMode,
  RubricType,
} from "@/lib/rubric/types";
import { validateRubric } from "@/lib/rubric/validation";
import {
  changeLevelCount,
  createRubricDraft,
  createRubricOutline,
  makeCriterion,
  normalizeRubric,
  rubricFromDocument,
  rubricFromSource,
  rubricToDocument,
} from "@/lib/rubric/workflow";

type Stage = "setup" | "outline" | "editor";
const types: Array<[RubricType, string]> = [
  ["analytic", "Phân tích theo tiêu chí"],
  ["holistic", "Tổng thể"],
  ["checklist", "Bảng kiểm"],
  ["point_based", "Theo điểm"],
  ["weighted", "Theo trọng số"],
];
const modes: Array<[RubricInputMode, string]> = [
  ["manual", "Nhập thủ công"],
  ["lesson_plan", "Từ giáo án"],
  ["worksheet", "Từ phiếu học tập"],
  ["saved", "Rubric đã lưu"],
  ["import", "Nhập từ tệp"],
];

export function RubricWorkspace() {
  const [stage, setStage] = useState<Stage>("setup");
  const [rubric, setRubric] = useState<Rubric>(() => createRubricDraft());
  const [mode, setMode] = useState<RubricInputMode>("manual");
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedCriterionId, setSelectedCriterionId] = useState("");
  const [criteriaText, setCriteriaText] = useState(
    "Độ chính xác nội dung\nThực hiện nhiệm vụ\nChất lượng sản phẩm\nTrình bày và hợp tác",
  );
  const [objectiveText, setObjectiveText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const docs = (await listCloudDocuments()) ?? getHistory();
      setDocuments(docs);
      const session = readRubricSession();
      const historyId = new URLSearchParams(window.location.search).get(
        "history",
      );
      const existing =
        session?.document || docs.find((item) => item.id === historyId);
      if (session?.document) {
        const created = rubricFromSource(
          session.document,
          session.sourceActivityId,
        );
        const next = {
          ...created,
          metadata: {
            ...created.metadata,
            sourceDocumentId: session.document.id,
            sourceActivityId: session.sourceActivityId,
            sourceTitle: session.document.title,
          },
        };
        setRubric(next);
        setMode(
          session.document.lessonPlan
            ? "lesson_plan"
            : session.document.worksheet
              ? "worksheet"
              : "saved",
        );
        setCriteriaText(next.criteria.map((item) => item.title).join("\n"));
        setObjectiveText(next.objectives.map((item) => item.text).join("\n"));
        setSelectedDocumentId(session.document.id);
        setMessage(
          "Đã lấy mục tiêu, sản phẩm và tiêu chí từ tài liệu nguồn. Vui lòng rà soát dàn ý.",
        );
      } else if (existing?.rubric || existing?.type === "rubric") {
        const next = rubricFromDocument(existing);
        setRubric(next);
        setMode("saved");
        setStage("editor");
        setSelectedCriterionId(next.criteria[0]?.id || "");
        setSavedOnce(true);
      }
    });
  }, []);

  useEffect(() => {
    if (stage !== "editor" || !savedOnce) return;
    const timer = setTimeout(
      () => saveDocument(rubricToDocument(rubric)),
      1200,
    );
    return () => clearTimeout(timer);
  }, [rubric, savedOnce, stage]);
  const validation = useMemo(() => validateRubric(rubric), [rubric]);
  const coverage = useMemo(() => rubricCoverage(rubric), [rubric]);
  const selected =
    rubric.criteria.find((item) => item.id === selectedCriterionId) ||
    rubric.criteria[0];

  function update(patch: Partial<Rubric>) {
    setRubric((current) =>
      normalizeRubric({
        ...current,
        ...patch,
        metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
      }),
    );
  }
  function chooseSource(id: string) {
    const doc = documents.find((item) => item.id === id);
    if (!doc) return;
    const next =
      doc.type === "rubric" ? rubricFromDocument(doc) : rubricFromSource(doc);
    setSelectedDocumentId(id);
    setRubric(next);
    setCriteriaText(next.criteria.map((item) => item.title).join("\n"));
    setObjectiveText(next.objectives.map((item) => item.text).join("\n"));
  }
  function prepareOutline() {
    if (!rubric.title.trim()) return setMessage("Vui lòng nhập tên rubric.");
    const next = createRubricOutline({
      title: rubric.title,
      subject: rubric.subject,
      grade: rubric.grade,
      assignmentType: rubric.assignmentType,
      rubricType: rubric.rubricType,
      totalScore: rubric.totalScore,
      criteriaText,
      objectives: objectiveText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
      inputMode: mode,
    });
    setRubric({
      ...next,
      id: rubric.id,
      metadata: {
        ...next.metadata,
        sourceDocumentId: selectedDocumentId || undefined,
        sourceActivityId: rubric.metadata.sourceActivityId,
        sourceTitle: documents.find((item) => item.id === selectedDocumentId)
          ?.title,
      },
    });
    setSelectedCriterionId(next.criteria[0]?.id || "");
    setStage("outline");
    setMessage(
      "Đã tạo dàn ý tiêu chí. Chưa có nội dung nào được công bố; giáo viên có thể chỉnh trước khi tạo mô tả mức độ.",
    );
  }
  function setCriteria(criteria: RubricCriterion[]) {
    update({
      criteria: criteria.map((item, index) => ({ ...item, order: index + 1 })),
    });
  }
  function updateCriterion(id: string, patch: Partial<RubricCriterion>) {
    setRubric((current) =>
      normalizeRubric({
        ...current,
        criteria: current.criteria.map((item) =>
          item.id === id ? { ...item, ...patch, teacherEdited: true } : item,
        ),
        metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
      }),
    );
  }
  function regenerateCriterion(criterion: RubricCriterion) {
    if (
      criterion.teacherEdited &&
      !window.confirm(
        "Tiêu chí này đã được chỉnh sửa. Tạo lại sẽ thay các mô tả của riêng tiêu chí này?",
      )
    )
      return;
    const regenerated = makeCriterion(
      criterion.title,
      criterion.order,
      rubric.levels,
      criterion.weight,
    );
    updateCriterion(criterion.id, {
      descriptors: regenerated.descriptors,
      teacherEdited: false,
    });
    setMessage(
      "Đã tạo lại mô tả cho riêng tiêu chí. Các tiêu chí khác được giữ nguyên.",
    );
  }
  function finishOutline() {
    setRubric((current) =>
      normalizeRubric({
        ...current,
        criteria: current.criteria.map((criterion) =>
          criterion.descriptors.length
            ? criterion
            : makeCriterion(
                criterion.title,
                criterion.order,
                current.levels,
                criterion.weight,
              ),
        ),
      }),
    );
    setStage("editor");
    setMessage(
      "Đã tạo rubric theo dàn ý được xác nhận. Nội dung là bản nháp cần giáo viên rà soát.",
    );
  }
  function save() {
    const result = validateRubric(rubric);
    if (result.status === "blocked")
      return setMessage(result.errors[0]?.message || "Rubric còn lỗi cần sửa.");
    const saved = {
      ...rubric,
      metadata: { ...rubric.metadata, validationStatus: result.status },
    } as Rubric;
    saveDocument(rubricToDocument(saved));
    const source = documents.find(
      (item) => item.id === saved.metadata.sourceDocumentId,
    );
    if (source?.lessonPlan) {
      const lessonPlan = {
        ...source.lessonPlan,
        linkedMaterials: {
          ...source.lessonPlan.linkedMaterials,
          rubricIds: [
            ...new Set([
              ...(source.lessonPlan.linkedMaterials?.rubricIds || []),
              saved.id,
            ]),
          ],
        },
        periods: source.lessonPlan.periods.map((period) => ({
          ...period,
          activities: period.activities.map((activity) =>
            activity.id === saved.metadata.sourceActivityId
              ? {
                  ...activity,
                  materials: [
                    ...(activity.materials || []).filter(
                      (item) => item.type !== "rubric",
                    ),
                    {
                      id: crypto.randomUUID(),
                      type: "rubric" as const,
                      title: saved.title,
                      documentId: saved.id,
                    },
                  ],
                }
              : activity,
          ),
        })),
      };
      saveDocument({ ...source, lessonPlan });
    }
    if (source?.worksheet) {
      saveDocument({
        ...source,
        worksheet: {
          ...source.worksheet,
          activities: source.worksheet.activities.map((activity) =>
            activity.id === saved.metadata.sourceActivityId
              ? { ...activity, rubricId: saved.id }
              : activity,
          ),
        },
      });
    }
    setSavedOnce(true);
    setMessage(
      source
        ? "Đã lưu rubric và liên kết ID với hoạt động nguồn."
        : "Đã lưu rubric có cấu trúc vào lịch sử.",
    );
  }
  async function importFile(file?: File) {
    if (!file) return;
    const result = await importRubricFile(file);
    if (!result.rubric) return setMessage(result.errors.join(" "));
    setRubric(result.rubric);
    setMode("import");
    setStage("outline");
    setSelectedCriterionId(result.rubric.criteria[0]?.id || "");
    setMessage(
      `Đã đọc ${result.sourceRows} hàng. ${result.warnings.join(" ")}`,
    );
  }
  function importPasted() {
    const result = importRubricText(pasteText);
    if (!result.rubric) return setMessage(result.errors.join(" "));
    setRubric(result.rubric);
    setStage("outline");
    setSelectedCriterionId(result.rubric.criteria[0]?.id || "");
    setMessage(result.warnings.join(" "));
  }
  function applyTemplate(id: string) {
    const template = RUBRIC_TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    const next = rubricFromTemplate(template);
    setRubric(next);
    setCriteriaText(next.criteria.map((item) => item.title).join("\n"));
    setObjectiveText(next.objectives.map((item) => item.text).join("\n"));
    setMode("manual");
    setMessage(
      `Đã nạp mẫu ${template.title}. Vui lòng chỉnh theo nhiệm vụ thực tế.`,
    );
  }

  return (
    <AppShell title="Tạo rubric">
      <div className="mx-auto max-w-[1580px] space-y-5">
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
              <span className="soft-badge">Đánh giá học tập</span>
              <h1 className="mt-3 text-3xl font-black">Tạo rubric chấm bài</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Tạo tiêu chí, mức độ, mô tả minh chứng và thang điểm có cấu
                trúc. Giáo viên luôn là người xác nhận kết quả cuối cùng.
              </p>
            </div>
            {stage === "editor" ? (
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={save}>
                  <Save size={16} />
                  Lưu
                </button>
                <ActionMenu
                  label="Xuất"
                  items={[
                    {
                      label: "Word giáo viên",
                      onSelect: () => downloadRubricDocx(rubric, "teacher"),
                    },
                    {
                      label: "Excel",
                      onSelect: () => downloadRubricXlsx(rubric),
                    },
                    {
                      label: "In hoặc lưu PDF",
                      onSelect: () => printRubricPdf(rubric, "teacher"),
                    },
                  ]}
                />
              </div>
            ) : null}
          </div>
        </header>
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <Step active={stage === "setup"} label="1. Thiết lập" />
          <span>→</span>
          <Step active={stage === "outline"} label="2. Dàn ý tiêu chí" />
          <span>→</span>
          <Step active={stage === "editor"} label="3. Chỉnh sửa & xuất" />
        </div>
        {message ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900">
            {message}
          </div>
        ) : null}
        {stage === "setup" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <main className="space-y-4">
              <section className="rounded-[24px] border bg-white p-5">
                <h2 className="font-black">Nguồn tạo rubric</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {modes.map(([key, label]) => (
                    <button
                      key={key}
                      className={`rounded-2xl border p-4 text-left ${mode === key ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}
                      onClick={() => setMode(key)}
                    >
                      <strong>{label}</strong>
                    </button>
                  ))}
                </div>
                {mode !== "manual" && mode !== "import" ? (
                  <label className="mt-4 block">
                    <span className="label">Chọn tài liệu</span>
                    <select
                      className="form-field mt-1"
                      value={selectedDocumentId}
                      onChange={(event) => chooseSource(event.target.value)}
                    >
                      <option value="">Chọn…</option>
                      {documents
                        .filter((doc) =>
                          mode === "lesson_plan"
                            ? Boolean(doc.lessonPlan)
                            : mode === "worksheet"
                              ? Boolean(doc.worksheet)
                              : doc.type === "rubric",
                        )
                        .map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.title}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
                {mode === "import" ? (
                  <div className="mt-4 space-y-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.csv,.docx,.txt"
                      className="hidden"
                      onChange={(event) =>
                        void importFile(event.target.files?.[0])
                      }
                    />
                    <button
                      className="btn-secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={16} />
                      Chọn XLSX, CSV hoặc DOCX
                    </button>
                    <textarea
                      className="form-field min-h-32"
                      value={pasteText}
                      onChange={(event) => setPasteText(event.target.value)}
                      placeholder="Hoặc dán bảng tiêu chí tại đây…"
                    />
                    <button className="btn-secondary" onClick={importPasted}>
                      Đọc dữ liệu đã dán
                    </button>
                  </div>
                ) : null}
              </section>
              <section className="rounded-[24px] border bg-white p-5">
                <h2 className="font-black">Thông tin nhiệm vụ</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Tên rubric"
                    value={rubric.title}
                    onChange={(value) => update({ title: value })}
                  />
                  <Field
                    label="Loại sản phẩm/nhiệm vụ"
                    value={rubric.assignmentType || ""}
                    onChange={(value) => update({ assignmentType: value })}
                  />
                  <Field
                    label="Môn học"
                    value={rubric.subject || ""}
                    onChange={(value) => update({ subject: value })}
                  />
                  <Field
                    label="Khối lớp"
                    value={rubric.grade || ""}
                    onChange={(value) => update({ grade: value })}
                  />
                  <Select
                    label="Loại rubric"
                    value={rubric.rubricType}
                    options={types}
                    onChange={(value) =>
                      update({ rubricType: value as RubricType })
                    }
                  />
                  <NumberField
                    label="Tổng điểm"
                    value={rubric.totalScore}
                    min={1}
                    max={1000}
                    onChange={(value) => update({ totalScore: value })}
                  />
                </div>
                <label className="mt-4 block">
                  <span className="label">Mục tiêu, mỗi dòng một mục</span>
                  <textarea
                    className="form-field mt-1 min-h-28"
                    value={objectiveText}
                    onChange={(event) => setObjectiveText(event.target.value)}
                  />
                </label>
                <label className="mt-4 block">
                  <span className="label">
                    Tiêu chí gợi ý, mỗi dòng một tiêu chí
                  </span>
                  <textarea
                    className="form-field mt-1 min-h-32"
                    value={criteriaText}
                    onChange={(event) => setCriteriaText(event.target.value)}
                  />
                </label>
              </section>
            </main>
            <aside className="space-y-4">
              <section className="rounded-[24px] border bg-white p-5">
                <h2 className="font-black">Mẫu khởi đầu</h2>
                <div className="mt-3 grid gap-2">
                  {RUBRIC_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      className="rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-blue-300"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <strong>{template.title}</strong>
                      <span className="mt-1 block text-xs text-slate-500">
                        {template.criteria.length} tiêu chí
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <button className="btn-primary w-full" onClick={prepareOutline}>
                Tạo dàn ý rubric
              </button>
            </aside>
          </div>
        ) : null}
        {stage === "outline" ? (
          <Outline
            rubric={rubric}
            setRubric={setRubric}
            setCriteria={setCriteria}
            updateCriterion={updateCriterion}
            back={() => setStage("setup")}
            finish={finishOutline}
          />
        ) : null}
        {stage === "editor" ? (
          <Editor
            rubric={rubric}
            selected={selected}
            select={setSelectedCriterionId}
            setRubric={setRubric}
            update={update}
            updateCriterion={updateCriterion}
            setCriteria={setCriteria}
            regenerate={regenerateCriterion}
            validation={validation}
            coverage={coverage}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function Outline({
  rubric,
  setRubric,
  setCriteria,
  updateCriterion,
  back,
  finish,
}: {
  rubric: Rubric;
  setRubric: React.Dispatch<React.SetStateAction<Rubric>>;
  setCriteria: (items: RubricCriterion[]) => void;
  updateCriterion: (id: string, patch: Partial<RubricCriterion>) => void;
  back: () => void;
  finish: () => void;
}) {
  return (
    <section className="rounded-[24px] border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Dàn ý tiêu chí</h2>
          <p className="text-sm text-slate-500">
            Sắp xếp tiêu chí, trọng số và liên kết mục tiêu trước khi tạo bảng
            hoàn chỉnh.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={back}>
            Quay lại
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              setCriteria([
                ...rubric.criteria,
                makeCriterion(
                  "Tiêu chí mới",
                  rubric.criteria.length + 1,
                  rubric.levels,
                  0,
                ),
              ])
            }
          >
            <Plus size={15} />
            Thêm tiêu chí
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {rubric.criteria.map((criterion, index) => (
          <article
            key={criterion.id}
            className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[48px_1fr_140px_1fr_auto]"
          >
            <strong>#{index + 1}</strong>
            <input
              className="form-field"
              value={criterion.title}
              onChange={(event) =>
                updateCriterion(criterion.id, {
                  title: event.target.value,
                  teacherEdited: false,
                })
              }
            />
            <NumberField
              label="Trọng số %"
              value={criterion.weight}
              min={0}
              max={100}
              onChange={(value) =>
                updateCriterion(criterion.id, {
                  weight: value,
                  teacherEdited: false,
                })
              }
            />
            <select
              multiple
              className="form-field min-h-16"
              value={criterion.objectiveIds}
              onChange={(event) =>
                updateCriterion(criterion.id, {
                  objectiveIds: Array.from(
                    event.target.selectedOptions,
                    (item) => item.value,
                  ),
                  teacherEdited: false,
                })
              }
            >
              {rubric.objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.text}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                aria-label="Lên"
                onClick={() => {
                  if (index > 0) {
                    const next = [...rubric.criteria];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    setCriteria(next);
                  }
                }}
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label="Xuống"
                onClick={() => {
                  if (index < rubric.criteria.length - 1) {
                    const next = [...rubric.criteria];
                    [next[index + 1], next[index]] = [
                      next[index],
                      next[index + 1],
                    ];
                    setCriteria(next);
                  }
                }}
              >
                <ArrowDown size={16} />
              </button>
              <button
                aria-label="Nhân bản"
                onClick={() =>
                  setCriteria([
                    ...rubric.criteria.slice(0, index + 1),
                    {
                      ...structuredClone(criterion),
                      id: crypto.randomUUID(),
                      title: `${criterion.title} (bản sao)`,
                    },
                    ...rubric.criteria.slice(index + 1),
                  ])
                }
              >
                <Copy size={16} />
              </button>
              <button
                aria-label="Xóa"
                className="text-red-600"
                onClick={() =>
                  setCriteria(
                    rubric.criteria.filter((item) => item.id !== criterion.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold">
          Tổng trọng số:{" "}
          {Math.round(
            rubric.criteria.reduce((sum, item) => sum + item.weight, 0) * 100,
          ) / 100}
          %
        </p>
        <button
          className="btn-primary"
          disabled={!rubric.criteria.length}
          onClick={() => {
            setRubric(normalizeRubric(rubric));
            finish();
          }}
        >
          Xác nhận dàn ý và tạo mô tả
        </button>
      </div>
    </section>
  );
}

function Editor({
  rubric,
  selected,
  select,
  setRubric,
  update,
  updateCriterion,
  setCriteria,
  regenerate,
  validation,
  coverage,
}: {
  rubric: Rubric;
  selected?: RubricCriterion;
  select: (id: string) => void;
  setRubric: React.Dispatch<React.SetStateAction<Rubric>>;
  update: (patch: Partial<Rubric>) => void;
  updateCriterion: (id: string, patch: Partial<RubricCriterion>) => void;
  setCriteria: (items: RubricCriterion[]) => void;
  regenerate: (criterion: RubricCriterion) => void;
  validation: ReturnType<typeof validateRubric>;
  coverage: ReturnType<typeof rubricCoverage>;
}) {
  const [previewAudience, setPreviewAudience] = useState<"teacher" | "student">(
    "teacher",
  );
  const [selectedLevelId, setSelectedLevelId] = useState(
    rubric.levels[0]?.id || "",
  );
  const selectedLevel =
    rubric.levels.find((level) => level.id === selectedLevelId) ||
    rubric.levels[0];
  return (
    <>
      <AuthoringWorkspace
        navigatorLabel="Tiêu chí"
        canvasLabel="Xem bảng rubric"
        inspectorLabel="Chỉnh tiêu chí"
        selectionLabel={
          selected
            ? `${selected.order}. ${selected.title} · ${selected.weight}%`
            : "Chưa chọn tiêu chí"
        }
        navigator={
          <aside className="rounded-[24px] border bg-white p-4">
            <h2 className="font-black">Tiêu chí</h2>
            <div className="mt-3 space-y-2">
              {rubric.criteria.map((criterion) => (
                <button
                  key={criterion.id}
                  className={`min-h-11 w-full rounded-xl border p-3 text-left text-sm ${selected?.id === criterion.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}
                  onClick={() => select(criterion.id)}
                >
                  <strong>
                    {criterion.order}. {criterion.title}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {criterion.weight}% · {criterion.maxScore} điểm mức cao nhất
                  </span>
                </button>
              ))}
            </div>
            <button
              className="btn-secondary mt-3 w-full"
              onClick={() =>
                setCriteria([
                  ...rubric.criteria,
                  makeCriterion(
                    "Tiêu chí mới",
                    rubric.criteria.length + 1,
                    rubric.levels,
                    0,
                  ),
                ])
              }
            >
              <Plus size={15} />
              Thêm tiêu chí
            </button>
          </aside>
        }
        canvas={
          <main className="min-w-0 rounded-[24px] border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black">Bảng rubric</h2>
                <p className="text-xs text-slate-500">
                  {previewAudience === "teacher"
                    ? "Bản giáo viên gồm trọng số, mức điểm và mô tả minh chứng."
                    : "Bản học sinh tập trung vào tiêu chí và mô tả mức độ."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="ui-segmented-control grid grid-cols-2"
                  role="tablist"
                  aria-label="Chọn bản rubric"
                >
                  {(["teacher", "student"] as const).map((audience) => (
                    <button
                      key={audience}
                      type="button"
                      role="tab"
                      aria-selected={previewAudience === audience}
                      className={
                        previewAudience === audience
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "text-slate-600"
                      }
                      onClick={() => setPreviewAudience(audience)}
                    >
                      {audience === "teacher" ? "Giáo viên" : "Học sinh"}
                    </button>
                  ))}
                </div>
                {validation.status === "ready" ? (
                  <span className="text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="inline" size={16} /> Sẵn sàng
                  </span>
                ) : (
                  <span className="text-sm font-bold text-amber-700">
                    <AlertTriangle className="inline" size={16} /> Cần rà soát
                  </span>
                )}
              </div>
            </div>
            <div className="ui-table-wrap mt-4">
              <table className="ui-table min-w-[850px]">
                <thead>
                  <tr>
                    {[
                      "Tiêu chí",
                      "Trọng số",
                      ...rubric.levels.map(
                        (item) => `${item.label} (${item.score})`,
                      ),
                    ].map((item) => (
                      <th
                        key={item}
                        className="border bg-slate-100 p-3 text-left"
                      >
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rubric.criteria.map((criterion) => (
                    <tr key={criterion.id}>
                      <td className="border p-3 font-bold">
                        {criterion.title}
                      </td>
                      <td className="border p-3">{criterion.weight}%</td>
                      {rubric.levels.map((level) => (
                        <td key={level.id} className="border p-3 align-top">
                          {
                            criterion.descriptors.find(
                              (item) => item.levelId === level.id,
                            )?.text
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1">
              {[...validation.errors, ...validation.warnings].map((issue) => (
                <p
                  key={`${issue.code}-${issue.criterionId}-${issue.levelId}`}
                  className="text-xs font-semibold text-amber-800"
                >
                  • {issue.message}
                </p>
              ))}
            </div>
          </main>
        }
        inspector={
          <aside className="rounded-[24px] border bg-white p-4">
            {selected ? (
              <>
                <h2 className="font-black">Chỉnh tiêu chí {selected.order}</h2>
                <div className="mt-3 space-y-3">
                  <Field
                    label="Tên tiêu chí"
                    value={selected.title}
                    onChange={(value) =>
                      updateCriterion(selected.id, { title: value })
                    }
                  />
                  <NumberField
                    label="Trọng số (%)"
                    value={selected.weight}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateCriterion(selected.id, { weight: value })
                    }
                  />
                  <NumberField
                    label="Điểm mức cao nhất"
                    value={selected.maxScore}
                    min={0}
                    max={1000}
                    onChange={(value) =>
                      updateCriterion(selected.id, { maxScore: value })
                    }
                  />
                  <label>
                    <span className="label">Minh chứng cần quan sát</span>
                    <textarea
                      className="form-field mt-1 min-h-20"
                      value={selected.evidence || ""}
                      onChange={(event) =>
                        updateCriterion(selected.id, {
                          evidence: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="2xl:hidden">
                    <span className="label">Mức đang chỉnh</span>
                    <select
                      className="form-field"
                      value={selectedLevel?.id || ""}
                      onChange={(event) =>
                        setSelectedLevelId(event.target.value)
                      }
                    >
                      {rubric.levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedLevel ? (
                    <label className="2xl:hidden">
                      <span className="label">{selectedLevel.label}</span>
                      <textarea
                        className="form-field mt-1 min-h-32"
                        value={
                          selected.descriptors.find(
                            (item) => item.levelId === selectedLevel.id,
                          )?.text || ""
                        }
                        onChange={(event) =>
                          updateCriterion(selected.id, {
                            descriptors: selected.descriptors.map((item) =>
                              item.levelId === selectedLevel.id
                                ? { ...item, text: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                  ) : null}
                  {rubric.levels.map((level) => {
                    const descriptor = selected.descriptors.find(
                      (item) => item.levelId === level.id,
                    );
                    return (
                      <label key={level.id} className="hidden 2xl:block">
                        <span className="label">{level.label}</span>
                        <textarea
                          className="form-field mt-1 min-h-24"
                          value={descriptor?.text || ""}
                          onChange={(event) =>
                            updateCriterion(selected.id, {
                              descriptors: selected.descriptors.map((item) =>
                                item.levelId === level.id
                                  ? { ...item, text: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </label>
                    );
                  })}
                  <ActionMenu
                    label="Tạo lại"
                    className="btn-secondary w-full"
                    items={[
                      {
                        label: "Tạo lại riêng tiêu chí này",
                        onSelect: () => regenerate(selected),
                      },
                    ]}
                  />
                  <button
                    className="btn-secondary w-full text-red-600"
                    onClick={() => {
                      if (!window.confirm("Xóa tiêu chí đang chọn?")) return;
                      setCriteria(
                        rubric.criteria.filter(
                          (item) => item.id !== selected.id,
                        ),
                      );
                    }}
                  >
                    <Trash2 size={15} />
                    Xóa tiêu chí
                  </button>
                </div>
              </>
            ) : (
              <p>Chọn tiêu chí để chỉnh sửa.</p>
            )}
          </aside>
        }
      />
      <section className="rounded-[24px] border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">Thiết lập mức và đầu ra</h2>
            <p className="text-sm text-slate-500">
              Đổi số mức sẽ giữ ID còn phù hợp và bổ sung mô tả còn thiếu.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <NumberField
              label="Số mức"
              value={rubric.levels.length}
              min={2}
              max={6}
              onChange={(value) => setRubric(changeLevelCount(rubric, value))}
            />
            <NumberField
              label="Tổng điểm"
              value={rubric.totalScore}
              min={1}
              max={1000}
              onChange={(value) => update({ totalScore: value })}
            />
            <ActionMenu
              label="Xuất đầu ra khác"
              items={[
                {
                  label: "Word học sinh",
                  onSelect: () => downloadRubricDocx(rubric, "student"),
                },
                {
                  label: "Phiếu tự đánh giá",
                  onSelect: () => downloadRubricDocx(rubric, "self"),
                },
                {
                  label: "Phiếu đồng đẳng",
                  onSelect: () => downloadRubricDocx(rubric, "peer"),
                },
                {
                  label: "PDF học sinh",
                  onSelect: () => printRubricPdf(rubric, "student"),
                },
              ]}
            />
          </div>
        </div>
      </section>
      <section className="rounded-[24px] border bg-white p-5">
        <h2 className="font-black">Bao phủ mục tiêu</h2>
        <div className="ui-table-wrap mt-3">
          <table className="ui-table min-w-[700px]">
            <thead>
              <tr className="text-left">
                <th className="p-2">Mục tiêu</th>
                <th className="p-2">Tiêu chí</th>
                <th className="p-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((item) => (
                <tr key={item.objectiveId} className="border-t">
                  <td className="p-2">{item.objective}</td>
                  <td className="p-2">
                    {item.criterionTitles.join("; ") || "—"}
                  </td>
                  <td
                    className={`p-2 font-bold ${item.status === "covered" ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {item.status === "covered"
                      ? "Đã bao phủ"
                      : "Chưa có tiêu chí"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Step({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
    >
      {label}
    </span>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="form-field mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="form-field mt-1"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <select
        className="form-field mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
