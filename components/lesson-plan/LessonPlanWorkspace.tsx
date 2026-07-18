"use client";
/* eslint-disable @typescript-eslint/no-unused-vars -- Contract editor giữ hàm cập nhật toàn giáo án cho phần bài tập về nhà mở rộng. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  FileText,
  Link2,
  Plus,
  Presentation,
  Save,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  AuthoringActionBar,
  AuthoringDisclosure,
  AuthoringWorkspace,
} from "@/components/authoring/AuthoringWorkspace";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { ToolPageHeader } from "@/components/tools/ToolPageHeader";
import { generateToolContent } from "@/lib/ai/client";
import { listCloudDocuments } from "@/lib/data/documents-store";
import { getHistory, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import type {
  ActivityStep,
  LessonActivity,
  LessonDetailLevel,
  LessonLayout,
  LessonPhase,
  LessonPlan,
  LessonPlanInputMode,
  LessonType,
  LessonWorkMode,
} from "@/lib/lesson-plan/types";
import {
  createLessonOutline,
  createLessonPlanDraft,
  lessonPlanToDocument,
  lessonPlanToText,
  lessonSourceFromDocument,
  normalizeLessonPlan,
  objectiveCoverage,
  parseLessonActivityResponse,
  phaseLabel,
  redistributePeriod,
  stableLessonPlanHash,
  validateLessonPlan,
  validateLessonTiming,
} from "@/lib/lesson-plan/workflow";
import {
  downloadLessonPlanDocx,
  printLessonPlanPdf,
} from "@/lib/lesson-plan/export";
import { readLessonPlanSession } from "@/lib/lesson-plan/session";
import { openLessonSlides } from "@/lib/lesson-slides/source";
import { openWorksheetGenerator } from "@/lib/worksheet/session";
import { openRubricGenerator } from "@/lib/rubric/session";
import { openReviewPack } from "@/lib/review-pack/session";
// Tuyến cũ /tools/rubric-generator vẫn được giữ để chuyển hướng tương thích.

type Stage = "setup" | "outline" | "editor";
const phases: Array<[LessonPhase, string]> = [
  ["warm_up", "Khởi động"],
  ["knowledge", "Hình thành kiến thức"],
  ["practice", "Luyện tập"],
  ["application", "Vận dụng"],
  ["consolidation", "Củng cố"],
  ["assessment", "Đánh giá"],
  ["homework", "Bài tập về nhà"],
  ["other", "Khác"],
];
const lessonTypes: Array<[LessonType, string]> = [
  ["new_lesson", "Bài mới"],
  ["practice", "Luyện tập"],
  ["review", "Ôn tập"],
  ["solution", "Chữa bài"],
  ["experiment", "Thực hành"],
  ["assessment", "Kiểm tra"],
  ["experience", "Hoạt động trải nghiệm"],
  ["summary", "Tổng kết"],
];
const workModes: Array<[LessonWorkMode, string]> = [
  ["individual", "Cá nhân"],
  ["pair", "Cặp đôi"],
  ["group", "Nhóm"],
  ["whole_class", "Cả lớp"],
  ["mixed", "Kết hợp"],
];
const detailLevels: Array<[LessonDetailLevel, string]> = [
  ["short", "Rút gọn"],
  ["standard", "Tiêu chuẩn"],
  ["detailed", "Chi tiết"],
];
const layouts: Array<[LessonLayout, string]> = [
  ["activities", "Theo hoạt động dạy học"],
  ["teacher_student_table", "Bảng giáo viên/học sinh"],
  ["timeline", "Kế hoạch theo tiến trình"],
  ["simple", "Mẫu đơn giản"],
];
const sourceTypes = new Set([
  "lesson-plan",
  "lesson-slides",
  "worksheet",
  "exam",
  "rubric",
  "document-recognition",
]);
const cacheKey = (plan: LessonPlan, activity: LessonActivity) =>
  `soanlab:lesson-plan-activity:${stableLessonPlanHash(`${plan.metadata.sourceHash || "manual"}:${JSON.stringify({ phase: activity.phase, title: activity.title, duration: activity.durationMinutes, objectives: activity.objectiveIds, topic: plan.topic })}`)}`;

function mergeDocuments(
  local: GeneratedDocument[],
  cloud: GeneratedDocument[],
) {
  return [
    ...new Map([...cloud, ...local].map((item) => [item.id, item])).values(),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function rows(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function sourceActivityDocument(
  plan: LessonPlan,
  activity: LessonActivity,
): GeneratedDocument {
  const period = plan.periods.find((item) =>
    item.activities.some((candidate) => candidate.id === activity.id),
  );
  return lessonPlanToDocument(
    {
      ...plan,
      id: crypto.randomUUID(),
      title: `${plan.title} - ${activity.title}`,
      periodCount: 1,
      periods: period
        ? [
            {
              ...period,
              id: crypto.randomUUID(),
              periodNumber: 1,
              durationMinutes: activity.durationMinutes,
              activities: [activity],
            },
          ]
        : [],
    },
    "full",
  );
}
function openPreset(path: string, values: Record<string, string | number>) {
  const params = new URLSearchParams({ preset: "public-beta" });
  Object.entries(values).forEach(([key, value]) =>
    params.set(key, String(value)),
  );
  window.location.assign(`${path}?${params}`);
}
function initialPlanFromQuery() {
  if (typeof window === "undefined") return createLessonPlanDraft();
  const params = new URLSearchParams(window.location.search);
  if (params.get("preset") !== "public-beta") return createLessonPlanDraft();
  const topic = params.get("topic") || params.get("lessonName") || "";
  const objectiveText =
    params.get("objectives") || params.get("curriculumRequirement") || "";
  return createLessonPlanDraft({
    subject: params.get("subject") || "",
    grade: params.get("grade") || "",
    topic,
    title: topic ? `Giáo án - ${topic}` : undefined,
    textbookSeries: params.get("bookSeries") || "",
    minutesPerPeriod: Number.parseInt(params.get("duration") || "45", 10) || 45,
    objectives: rows(objectiveText).map((content, index) => ({
      id: `objective-${index + 1}-${stableLessonPlanHash(content)}`,
      category: index ? "skill" : "knowledge",
      content,
      evidence: "Sản phẩm học tập trong hoạt động liên quan.",
    })),
    methods: rows(params.get("methods") || "Kết hợp"),
    preparation: {
      teacher: [],
      students: [],
      equipment: [],
      materials: rows(params.get("materials") || ""),
    },
  });
}

export function LessonPlanWorkspace() {
  const [stage, setStage] = useState<Stage>("setup");
  const [mode, setMode] = useState<LessonPlanInputMode>("topic");
  const [plan, setPlan] = useState(() => createLessonPlanDraft());
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceMessage, setSourceMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [regenTarget, setRegenTarget] = useState<LessonActivity | null>(null);
  const [undoActivity, setUndoActivity] = useState<LessonActivity | null>(null);
  const initialized = useRef(false);
  const autosave = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    queueMicrotask(async () => {
      const local = getHistory();
      const cloud = await listCloudDocuments();
      const docs = mergeDocuments(local, cloud || []);
      setDocuments(
        docs.filter(
          (item) => sourceTypes.has(item.type) || Boolean(item.examSolutionSet),
        ),
      );
      const session = readLessonPlanSession();
      const historyId = new URLSearchParams(window.location.search).get(
        "history",
      );
      const initial =
        session?.document || docs.find((item) => item.id === historyId);
      if (initial) {
        loadDocument(initial);
        if (session?.lessonType)
          setPlan((current) => ({
            ...current,
            lessonType: session.lessonType!,
          }));
      } else setPlan(initialPlanFromQuery());
    });
  }, []);
  useEffect(() => {
    if (stage !== "editor" || !autosave.current || !plan.periods.length) return;
    const timer = setTimeout(
      () => saveDocument(lessonPlanToDocument(plan, "full")),
      1400,
    );
    return () => clearTimeout(timer);
  }, [plan, stage]);
  const activities = plan.periods.flatMap((period) => period.activities);
  const selected =
    activities.find((item) => item.id === selectedId) || activities[0];
  const validation = useMemo(() => validateLessonPlan(plan), [plan]);

  function update(patch: Partial<LessonPlan>) {
    setPlan((current) =>
      normalizeLessonPlan({
        ...current,
        ...patch,
        metadata: {
          ...current.metadata,
          ...patch.metadata,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  }
  function loadDocument(document: GeneratedDocument) {
    const source = lessonSourceFromDocument(document);
    setSourceId(document.id);
    setSourceText(source.text);
    setSourceMessage(
      source.confirmed
        ? `Đã trích xuất ${source.objectives.length} mục tiêu và ${source.concepts.length} ý nội dung. Vui lòng kiểm tra trước khi tạo dàn ý.`
        : source.warnings.join(" "),
    );
    setMode(
      document.lessonPlan
        ? "existing"
        : document.type === "document-recognition"
          ? "document"
          : "saved",
    );
    if (document.lessonPlan) {
      setPlan(normalizeLessonPlan(document.lessonPlan));
      setStage("editor");
      setSelectedId(document.lessonPlan.periods[0]?.activities[0]?.id || "");
      autosave.current = true;
      return;
    }
    setPlan((current) =>
      createLessonPlanDraft({
        ...current,
        subject: source.subject || current.subject,
        grade: source.grade || current.grade,
        topic: source.topic || document.title,
        objectives: source.objectives.length
          ? source.objectives.map((content, index) => ({
              id: `objective-${index + 1}-${stableLessonPlanHash(content)}`,
              category: index ? "skill" : "knowledge",
              content,
              evidence: "Sản phẩm học tập trong hoạt động liên quan.",
            }))
          : current.objectives,
        keyKnowledge: source.concepts,
        metadata: {
          ...current.metadata,
          sourceType: source.sourceType,
          sourceDocumentId: document.id,
          sourceTitle: document.title,
          sourceHash: stableLessonPlanHash(source.text),
        },
      }),
    );
  }
  function chooseSource(id: string) {
    const found = documents.find((item) => item.id === id);
    if (found) loadDocument(found);
  }
  function prepareOutline() {
    if (!plan.topic?.trim())
      return setMessage("Vui lòng nhập chủ đề hoặc bài học.");
    if (mode !== "topic" && !sourceText.trim())
      return setMessage("Vui lòng chọn hoặc dán nội dung nguồn đã xác nhận.");
    const source = sourceId
      ? documents.find((item) => item.id === sourceId)
      : undefined;
    if (
      source?.recognitionDraft?.reviewStatus !== undefined &&
      source.recognitionDraft.reviewStatus !== "confirmed"
    )
      return setMessage("Tài liệu nhận dạng chưa được giáo viên xác nhận.");
    if (
      mode !== "topic" &&
      plan.settings.sourceOnly &&
      sourceText.trim().length < 80
    )
      return setMessage("Tài liệu chưa đủ nội dung để tạo tiến trình đã chọn.");
    const periods = createLessonOutline(plan);
    setPlan((current) =>
      normalizeLessonPlan({
        ...current,
        periods,
        metadata: {
          ...current.metadata,
          sourceHash:
            current.metadata.sourceHash || stableLessonPlanHash(sourceText),
        },
      }),
    );
    setSelectedId(periods[0]?.activities[0]?.id || "");
    setStage("outline");
    setMessage("");
  }
  function setPeriods(periods: LessonPlan["periods"]) {
    setPlan((current) => normalizeLessonPlan({ ...current, periods }));
  }
  function updateActivity(
    id: string,
    patch: Partial<LessonActivity>,
    edited = true,
  ) {
    setPlan((current) =>
      normalizeLessonPlan({
        ...current,
        periods: current.periods.map((period) => ({
          ...period,
          activities: period.activities.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...patch,
                  teacherEdited: edited || item.teacherEdited,
                }
              : item,
          ),
        })),
      }),
    );
  }
  function removeActivity(id: string) {
    setPeriods(
      plan.periods.map((period) => ({
        ...period,
        activities: period.activities.filter((item) => item.id !== id),
      })),
    );
  }
  function duplicateActivity(activity: LessonActivity) {
    const period = plan.periods.find((item) =>
      item.activities.some((candidate) => candidate.id === activity.id),
    );
    if (!period) return;
    const copy = {
      ...structuredClone(activity),
      id: crypto.randomUUID(),
      title: `${activity.title} (bản sao)`,
      teacherEdited: true,
    };
    setPeriods(
      plan.periods.map((item) =>
        item.id === period.id
          ? { ...item, activities: [...item.activities, copy] }
          : item,
      ),
    );
  }
  function moveActivity(activity: LessonActivity, direction: -1 | 1) {
    const period = plan.periods.find((item) =>
      item.activities.some((candidate) => candidate.id === activity.id),
    );
    if (!period) return;
    const index = period.activities.findIndex(
      (item) => item.id === activity.id,
    );
    const target = index + direction;
    if (target < 0 || target >= period.activities.length) return;
    const next = [...period.activities];
    [next[index], next[target]] = [next[target], next[index]];
    setPeriods(
      plan.periods.map((item) =>
        item.id === period.id ? { ...item, activities: next } : item,
      ),
    );
  }
  function moveToPeriod(activity: LessonActivity, periodId: string) {
    const target = plan.periods.find((item) => item.id === periodId);
    if (!target) return;
    setPeriods(
      plan.periods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              activities: [
                ...period.activities.filter((item) => item.id !== activity.id),
                activity,
              ],
            }
          : {
              ...period,
              activities: period.activities.filter(
                (item) => item.id !== activity.id,
              ),
            },
      ),
    );
  }
  function addActivity(periodId = plan.periods[0]?.id) {
    const period = plan.periods.find((item) => item.id === periodId);
    if (!period) return;
    const item: LessonActivity = {
      id: crypto.randomUUID(),
      order: period.activities.length + 1,
      phase: "other",
      title: "Hoạt động mới",
      durationMinutes: 5,
      objectiveIds: plan.objectives[0] ? [plan.objectives[0].id] : [],
      content: "Chưa tạo nội dung chi tiết.",
      steps: [],
      teacherActions: [],
      studentActions: [],
      expectedProduct: "Sản phẩm học tập",
      assessmentMethod: "observation",
      assessmentEvidence: "Sản phẩm học tập",
      workMode: plan.settings.defaultWorkMode,
      generationStatus: "outline",
    };
    setPeriods(
      plan.periods.map((candidate) =>
        candidate.id === period.id
          ? { ...candidate, activities: [...candidate.activities, item] }
          : candidate,
      ),
    );
    setSelectedId(item.id);
  }
  async function generateOne(activity: LessonActivity, bypass = false) {
    const key = cacheKey(plan, activity);
    if (!bypass) {
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) return JSON.parse(cached) as LessonActivity;
      } catch {
        /* tạo mới */
      }
    }
    const result = await generateToolContent({
      tool: "lesson-plan-activity",
      input: {
        subject: plan.subject,
        grade: plan.grade,
        topic: plan.topic,
        lessonType: plan.lessonType,
        objective: activity.objectiveIds
          .map((id) => plan.objectives.find((item) => item.id === id)?.content)
          .filter(Boolean),
        phase: activity.phase,
        title: activity.title,
        durationMinutes: activity.durationMinutes,
        workMode: activity.workMode,
        expectedProduct: activity.expectedProduct,
        differentiation: plan.differentiation,
        sourceOnly: plan.settings.sourceOnly,
        sourceContent: sourceText.slice(0, 8000),
      },
    });
    const next = parseLessonActivityResponse(result.content, plan, activity);
    sessionStorage.setItem(key, JSON.stringify(next));
    return next;
  }
  async function generateAll() {
    setBusy(true);
    const total = activities.length;
    for (let index = 0; index < total; index++) {
      const current =
        plan.periods
          .flatMap((period) => period.activities)
          .find((item) => item.id === activities[index].id) ||
        activities[index];
      setProgress(`Đang tạo hoạt động ${index + 1}/${total}`);
      updateActivity(current.id, { generationStatus: "generating" }, false);
      try {
        const generated = await generateOne(current);
        updateActivity(current.id, generated, false);
      } catch {
        updateActivity(
          current.id,
          {
            generationStatus: "failed",
            generationError:
              "Hoạt động này chưa tạo được nội dung. Thầy cô có thể thử lại riêng.",
          },
          false,
        );
      }
    }
    setBusy(false);
    setProgress("");
    setStage("editor");
    autosave.current = true;
    setMessage(
      "Đã tạo bản nháp giáo án. Giáo viên cần rà soát trước khi sử dụng.",
    );
  }
  async function replaceActivity(activity: LessonActivity, makeCopy = false) {
    setBusy(true);
    try {
      const generated = await generateOne(
        {
          ...activity,
          id: makeCopy ? crypto.randomUUID() : activity.id,
          teacherEdited: false,
        },
        true,
      );
      if (makeCopy) {
        const period = plan.periods.find((item) =>
          item.activities.some((candidate) => candidate.id === activity.id),
        );
        if (period)
          setPeriods(
            plan.periods.map((item) =>
              item.id === period.id
                ? { ...item, activities: [...item.activities, generated] }
                : item,
            ),
          );
      } else {
        setUndoActivity(activity);
        updateActivity(activity.id, generated, false);
      }
    } catch {
      updateActivity(
        activity.id,
        {
          generationStatus: "failed",
          generationError:
            "Hoạt động này chưa tạo được nội dung. Thầy cô có thể thử lại riêng.",
        },
        false,
      );
    } finally {
      setBusy(false);
      setRegenTarget(null);
    }
  }
  function requestRegenerate(activity: LessonActivity) {
    if (activity.teacherEdited) setRegenTarget(activity);
    else void replaceActivity(activity);
  }
  function save() {
    saveDocument(lessonPlanToDocument(plan, "full"));
    autosave.current = true;
    setMessage("Đã lưu giáo án vào lịch sử.");
  }
  function attach(
    type: "worksheet" | "slides" | "rubric" | "review" | "exam",
    activity?: LessonActivity,
  ) {
    const doc = activity
      ? sourceActivityDocument(plan, activity)
      : lessonPlanToDocument(plan, "full");
    if (type === "worksheet")
      openWorksheetGenerator(
        doc,
        activity?.phase === "assessment" ? "quick_check" : "practice",
      );
    else if (type === "slides")
      openLessonSlides(doc, activity ? "new_lesson" : undefined);
    else if (type === "rubric")
      openRubricGenerator(lessonPlanToDocument(plan, "full"), activity?.id);
    else if (type === "review")
      openReviewPack(
        lessonPlanToDocument(plan, "full"),
        activity?.id ? [activity.id] : undefined,
      );
    else
      openPreset("/tools/exam-generator", {
        subject: plan.subject || "",
        grade: plan.grade || "",
        topic: plan.topic || "",
        multipleChoiceCount: 5,
        trueFalseCount: 0,
        shortAnswerCount: 0,
      });
  }
  return (
    <AppShell title="Giáo án">
      <ToolPageHeader
        title="Giáo án"
        description="Xây dựng tiến trình dạy học có mục tiêu, hoạt động giáo viên/học sinh, minh chứng đánh giá và tài liệu liên kết."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold">
        <Step active={stage === "setup"} label="1. Nguồn & thiết lập" />
        <Step active={stage === "outline"} label="2. Kiểm tra tiến trình" />
        <Step active={stage === "editor"} label="3. Chỉnh sửa & xuất" />
      </div>
      {message ? (
        <p className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-900">
          {message}
        </p>
      ) : null}
      {stage === "setup" ? (
        <Setup
          plan={plan}
          update={update}
          mode={mode}
          setMode={setMode}
          documents={documents}
          sourceId={sourceId}
          chooseSource={chooseSource}
          sourceText={sourceText}
          setSourceText={setSourceText}
          sourceMessage={sourceMessage}
          prepare={prepareOutline}
        />
      ) : stage === "outline" ? (
        <Outline
          plan={plan}
          setPeriods={setPeriods}
          updateActivity={updateActivity}
          addActivity={addActivity}
          removeActivity={removeActivity}
          duplicateActivity={duplicateActivity}
          moveActivity={moveActivity}
          moveToPeriod={moveToPeriod}
          back={() => setStage("setup")}
          generate={() => void generateAll()}
          busy={busy}
          progress={progress}
        />
      ) : (
        <Editor
          plan={plan}
          update={update}
          selected={selected}
          selectedId={selectedId}
          select={setSelectedId}
          updateActivity={updateActivity}
          addActivity={addActivity}
          removeActivity={removeActivity}
          duplicateActivity={duplicateActivity}
          moveActivity={moveActivity}
          moveToPeriod={moveToPeriod}
          requestRegenerate={requestRegenerate}
          busy={busy}
          validation={validation}
          save={save}
          attach={attach}
          undoActivity={undoActivity}
          undo={() => {
            if (undoActivity) {
              updateActivity(undoActivity.id, undoActivity, false);
              setUndoActivity(null);
            }
          }}
        />
      )}{" "}
      {regenTarget ? (
        <RegenerationDialog
          activity={regenTarget}
          onCopy={() => void replaceActivity(regenTarget, true)}
          onReplace={() => void replaceActivity(regenTarget)}
          onCancel={() => setRegenTarget(null)}
        />
      ) : null}
    </AppShell>
  );
}

function Setup({
  plan,
  update,
  mode,
  setMode,
  documents,
  sourceId,
  chooseSource,
  sourceText,
  setSourceText,
  sourceMessage,
  prepare,
}: {
  plan: LessonPlan;
  update: (patch: Partial<LessonPlan>) => void;
  mode: LessonPlanInputMode;
  setMode: (value: LessonPlanInputMode) => void;
  documents: GeneratedDocument[];
  sourceId: string;
  chooseSource: (id: string) => void;
  sourceText: string;
  setSourceText: (value: string) => void;
  sourceMessage: string;
  prepare: () => void;
}) {
  const settings = plan.settings;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <main className="space-y-5">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2">
          {(
            [
              ["topic", "Nhập chủ đề"],
              ["document", "Từ tài liệu"],
              ["saved", "Từ nội dung đã lưu"],
              ["existing", "Chỉnh sửa giáo án cũ"],
            ] as Array<[LessonPlanInputMode, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${mode === key ? "bg-blue-600 text-white" : "text-slate-600"}`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        {mode !== "topic" ? (
          <section className="rounded-[24px] border bg-white p-5">
            <h2 className="font-black">Nguồn nội dung đã xác nhận</h2>
            <select
              className="form-field mt-3"
              value={sourceId}
              onChange={(event) => chooseSource(event.target.value)}
            >
              <option value="">Chọn nội dung trong lịch sử</option>
              {documents
                .filter(
                  (item) => mode !== "existing" || item.type === "lesson-plan",
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
            <textarea
              className="form-field mt-3 min-h-44"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Hoặc dán nội dung đã được giáo viên xác nhận"
            />
            {sourceMessage ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                {sourceMessage}
              </p>
            ) : null}
          </section>
        ) : null}
        <section className="rounded-[24px] border bg-white p-5">
          <h2 className="font-black">Thông tin bài dạy</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Môn học"
              value={plan.subject || ""}
              onChange={(value) => update({ subject: value })}
            />
            <Field
              label="Khối lớp"
              value={plan.grade || ""}
              onChange={(value) => update({ grade: value })}
            />
            <Field
              label="Chủ đề hoặc bài học"
              value={plan.topic || ""}
              onChange={(value) =>
                update({ topic: value, title: `Giáo án - ${value}` })
              }
            />
            <Field
              label="Bộ sách"
              value={plan.textbookSeries || ""}
              onChange={(value) => update({ textbookSeries: value })}
            />
            <Select
              label="Loại tiết học"
              value={plan.lessonType}
              options={lessonTypes}
              onChange={(value) => update({ lessonType: value as LessonType })}
            />
            <NumberField
              label="Số tiết"
              value={plan.periodCount}
              min={1}
              max={10}
              onChange={(value) => update({ periodCount: value })}
            />
            <NumberField
              label="Phút mỗi tiết"
              value={plan.minutesPerPeriod}
              min={1}
              max={180}
              onChange={(value) => update({ minutesPerPeriod: value })}
            />
            <Select
              label="Mức độ chi tiết"
              value={settings.detailLevel}
              options={detailLevels}
              onChange={(value) =>
                update({
                  settings: {
                    ...settings,
                    detailLevel: value as LessonDetailLevel,
                  },
                })
              }
            />
            <Select
              label="Cấu trúc trình bày"
              value={settings.layout}
              options={layouts}
              onChange={(value) =>
                update({
                  settings: { ...settings, layout: value as LessonLayout },
                })
              }
            />
            <Select
              label="Hình thức tổ chức"
              value={settings.defaultWorkMode}
              options={workModes}
              onChange={(value) =>
                update({
                  settings: {
                    ...settings,
                    defaultWorkMode: value as LessonWorkMode,
                  },
                })
              }
            />
          </div>
          <label className="mt-4 block">
            <span className="label">Mục tiêu bài học, mỗi dòng một mục</span>
            <textarea
              className="form-field mt-1 min-h-24"
              value={plan.objectives.map((item) => item.content).join("\n")}
              onChange={(event) =>
                update({
                  objectives: rows(event.target.value).map(
                    (content, index) => ({
                      id:
                        plan.objectives[index]?.id ||
                        `objective-${index + 1}-${stableLessonPlanHash(content)}`,
                      category:
                        plan.objectives[index]?.category ||
                        (!index ? "knowledge" : "skill"),
                      content,
                      evidence:
                        plan.objectives[index]?.evidence ||
                        "Sản phẩm học tập trong hoạt động liên quan.",
                    }),
                  ),
                })
              }
            />
          </label>
          <label className="mt-3 block">
            <span className="label">Yêu cầu cần đạt</span>
            <textarea
              className="form-field mt-1 min-h-20"
              value={(plan.requirements || []).join("\n")}
              onChange={(event) =>
                update({ requirements: rows(event.target.value) })
              }
            />
          </label>
          <label className="mt-3 block">
            <span className="label">Kiến thức trọng tâm</span>
            <textarea
              className="form-field mt-1 min-h-20"
              value={(plan.keyKnowledge || []).join("\n")}
              onChange={(event) =>
                update({ keyKnowledge: rows(event.target.value) })
              }
            />
          </label>
        </section>
      </main>
      <aside>
        <section className="sticky top-4 rounded-[24px] border bg-white p-5">
          <h2 className="font-black">Thành phần giáo án</h2>
          <div className="mt-4 space-y-3">
            <Check
              label="Có khởi động"
              checked={settings.includeWarmUp}
              onChange={(value) =>
                update({ settings: { ...settings, includeWarmUp: value } })
              }
            />
            <Check
              label="Có hình thành kiến thức"
              checked={settings.includeKnowledge}
              onChange={(value) =>
                update({ settings: { ...settings, includeKnowledge: value } })
              }
            />
            <Check
              label="Có luyện tập"
              checked={settings.includePractice}
              onChange={(value) =>
                update({ settings: { ...settings, includePractice: value } })
              }
            />
            <Check
              label="Có vận dụng"
              checked={settings.includeApplication}
              onChange={(value) =>
                update({ settings: { ...settings, includeApplication: value } })
              }
            />
            <Check
              label="Có củng cố"
              checked={settings.includeConsolidation}
              onChange={(value) =>
                update({
                  settings: { ...settings, includeConsolidation: value },
                })
              }
            />
            <Check
              label="Có bài tập về nhà"
              checked={settings.includeHomework}
              onChange={(value) =>
                update({ settings: { ...settings, includeHomework: value } })
              }
            />
            <Check
              label="Có đánh giá trong giờ"
              checked={settings.includeAssessment}
              onChange={(value) =>
                update({ settings: { ...settings, includeAssessment: value } })
              }
            />
            <Select
              label="Phân hóa"
              value={plan.differentiation?.mode || "none"}
              options={[
                ["none", "Không phân hóa"],
                ["support", "Hỗ trợ học sinh cần củng cố"],
                ["basic_advanced", "Cơ bản và nâng cao"],
                ["three_levels", "Ba mức độ"],
                ["product", "Theo sản phẩm"],
                ["time", "Theo thời gian"],
              ]}
              onChange={(value) =>
                update({
                  differentiation: {
                    ...plan.differentiation,
                    mode: value as NonNullable<
                      LessonPlan["differentiation"]
                    >["mode"],
                  },
                })
              }
            />
            {mode !== "topic" ? (
              <Check
                label="Chỉ sử dụng kiến thức trong tài liệu"
                checked={settings.sourceOnly}
                onChange={(value) =>
                  update({ settings: { ...settings, sourceOnly: value } })
                }
              />
            ) : null}
          </div>
          <button className="btn-primary mt-5 w-full" onClick={prepare}>
            Tạo dàn ý tiến trình
          </button>
          <p className="mt-3 text-xs text-slate-500">
            Bước này chỉ phân bổ tiến trình và thời gian, chưa tạo nội dung chi
            tiết.
          </p>
        </section>
      </aside>
    </div>
  );
}

function Outline({
  plan,
  setPeriods,
  updateActivity,
  addActivity,
  removeActivity,
  duplicateActivity,
  moveActivity,
  moveToPeriod,
  back,
  generate,
  busy,
  progress,
}: {
  plan: LessonPlan;
  setPeriods: (value: LessonPlan["periods"]) => void;
  updateActivity: (
    id: string,
    patch: Partial<LessonActivity>,
    edited?: boolean,
  ) => void;
  addActivity: (periodId?: string) => void;
  removeActivity: (id: string) => void;
  duplicateActivity: (activity: LessonActivity) => void;
  moveActivity: (activity: LessonActivity, direction: -1 | 1) => void;
  moveToPeriod: (activity: LessonActivity, periodId: string) => void;
  back: () => void;
  generate: () => void;
  busy: boolean;
  progress: string;
}) {
  const timing = validateLessonTiming(plan);
  return (
    <section className="rounded-[24px] border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Kiểm tra tiến trình bài dạy</h2>
          <p className="text-sm text-slate-500">
            Điều chỉnh hoạt động và thời lượng trước khi tạo nội dung chi tiết.
          </p>
        </div>
        <button className="btn-secondary" onClick={back}>
          Quay lại thiết lập
        </button>
      </div>
      {plan.periods.map((period) => (
        <section key={period.id} className="mt-5 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-black">
                Tiết {period.periodNumber}: {period.durationMinutes} phút
              </h3>
              <p
                className={`text-sm font-bold ${timing.find((item) => item.periodId === period.id)?.status === "match" ? "text-emerald-700" : "text-amber-700"}`}
              >
                {timing.find((item) => item.periodId === period.id)?.message}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={() =>
                  setPeriods(
                    plan.periods.map((item) =>
                      item.id === period.id ? redistributePeriod(item) : item,
                    ),
                  )
                }
              >
                Phân bổ lại thời gian
              </button>
              <button
                className="btn-secondary"
                onClick={() => addActivity(period.id)}
              >
                <Plus size={15} />
                Thêm
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {period.activities.map((activity) => (
              <article
                key={activity.id}
                className="grid gap-2 rounded-xl bg-slate-50 p-3 lg:grid-cols-[1fr_150px_100px_170px_auto]"
              >
                <div>
                  <input
                    className="form-field"
                    value={activity.title}
                    onChange={(event) =>
                      updateActivity(
                        activity.id,
                        { title: event.target.value },
                        false,
                      )
                    }
                  />
                  <input
                    className="form-field mt-2"
                    value={activity.expectedProduct || ""}
                    onChange={(event) =>
                      updateActivity(
                        activity.id,
                        { expectedProduct: event.target.value },
                        false,
                      )
                    }
                  />
                </div>
                <select
                  className="form-field"
                  value={activity.phase}
                  onChange={(event) =>
                    updateActivity(
                      activity.id,
                      { phase: event.target.value as LessonPhase },
                      false,
                    )
                  }
                >
                  {phases.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  className="form-field"
                  type="number"
                  min={1}
                  value={activity.durationMinutes}
                  onChange={(event) =>
                    updateActivity(
                      activity.id,
                      { durationMinutes: Number(event.target.value) || 0 },
                      false,
                    )
                  }
                />
                <select
                  className="form-field"
                  value={period.id}
                  onChange={(event) =>
                    moveToPeriod(activity, event.target.value)
                  }
                >
                  {plan.periods.map((item) => (
                    <option key={item.id} value={item.id}>
                      Tiết {item.periodNumber}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    aria-label="Lên"
                    onClick={() => moveActivity(activity, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    aria-label="Xuống"
                    onClick={() => moveActivity(activity, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    aria-label="Nhân bản"
                    onClick={() => duplicateActivity(activity)}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    aria-label="Xóa"
                    className="text-red-600"
                    onClick={() => removeActivity(activity.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      <div className="mt-5 flex justify-end">
        <button
          className="btn-primary"
          disabled={busy || !plan.periods.length}
          onClick={generate}
        >
          {busy ? progress : "Xác nhận tiến trình và tạo giáo án"}
        </button>
      </div>
    </section>
  );
}

function Editor({
  plan,
  update,
  selected,
  selectedId,
  select,
  updateActivity,
  addActivity,
  removeActivity,
  duplicateActivity,
  moveActivity,
  moveToPeriod,
  requestRegenerate,
  busy,
  validation,
  save,
  attach,
  undoActivity,
  undo,
}: {
  plan: LessonPlan;
  update: (patch: Partial<LessonPlan>) => void;
  selected?: LessonActivity;
  selectedId: string;
  select: (id: string) => void;
  updateActivity: (
    id: string,
    patch: Partial<LessonActivity>,
    edited?: boolean,
  ) => void;
  addActivity: (periodId?: string) => void;
  removeActivity: (id: string) => void;
  duplicateActivity: (activity: LessonActivity) => void;
  moveActivity: (activity: LessonActivity, direction: -1 | 1) => void;
  moveToPeriod: (activity: LessonActivity, periodId: string) => void;
  requestRegenerate: (activity: LessonActivity) => void;
  busy: boolean;
  validation: ReturnType<typeof validateLessonPlan>;
  save: () => void;
  attach: (
    type: "worksheet" | "slides" | "rubric" | "exam",
    activity?: LessonActivity,
  ) => void;
  undoActivity: LessonActivity | null;
  undo: () => void;
}) {
  const coverage = objectiveCoverage(plan);
  const [previewMode, setPreviewMode] = useState<
    "draft" | "print" | "teacher_student_table" | "timeline"
  >("draft");
  const selectedLabel = selected
    ? `${selected.order}. ${selected.title} · ${selected.durationMinutes} phút`
    : "Chưa chọn hoạt động";
  return (
    <>
      <AuthoringActionBar
        status={
          validation.valid
            ? "Sẵn sàng để lưu và xuất"
            : "Cần rà soát trước khi sử dụng"
        }
      >
        <button className="btn-primary" onClick={save}>
          <Save size={16} />
          Lưu giáo án
        </button>
        <ActionMenu
          label="Xuất"
          items={[
            {
              label: "Word đầy đủ",
              onSelect: () => downloadLessonPlanDocx(plan, "full"),
            },
            {
              label: "Word rút gọn",
              onSelect: () => downloadLessonPlanDocx(plan, "short"),
            },
            {
              label: "Word bảng giáo viên / học sinh",
              onSelect: () =>
                downloadLessonPlanDocx(plan, "teacher_student_table"),
            },
            {
              label: "In hoặc lưu PDF",
              onSelect: () => printLessonPlanPdf(plan, "full"),
            },
          ]}
        />
        <ActionMenu
          label="Dùng tài liệu này"
          items={[
            { label: "Tạo slide bài giảng", onSelect: () => attach("slides") },
            {
              label: "Tạo phiếu cho hoạt động đang chọn",
              onSelect: () => attach("worksheet", selected),
              disabled: !selected,
            },
            {
              label: "Tạo rubric cho hoạt động đang chọn",
              onSelect: () => attach("rubric", selected),
              disabled: !selected,
            },
            {
              label: "Tạo kiểm tra nhanh",
              onSelect: () => attach("exam", selected),
              disabled: !selected,
            },
          ]}
        />
        {undoActivity ? (
          <button className="btn-secondary" onClick={undo}>
            <Undo2 size={16} />
            Hoàn tác thay thế
          </button>
        ) : null}
      </AuthoringActionBar>
      <AuthoringWorkspace
        navigatorLabel="Tiết & hoạt động"
        canvasLabel="Xem giáo án"
        inspectorLabel="Chỉnh hoạt động"
        selectionLabel={selectedLabel}
        navigator={
          <aside className="rounded-[24px] border bg-white p-4">
            <h2 className="font-black">Tiết và hoạt động</h2>
            {plan.periods.map((period) => (
              <div key={period.id} className="mt-3">
                <p className="text-xs font-black uppercase text-slate-500">
                  Tiết {period.periodNumber}
                </p>
                {period.activities.map((activity) => (
                  <button
                    key={activity.id}
                    className={`mt-2 min-h-11 w-full rounded-xl border p-3 text-left text-sm ${selectedId === activity.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}
                    onClick={() => select(activity.id)}
                  >
                    <strong>
                      {activity.order}. {activity.title}
                    </strong>
                    <p className="mt-1 text-xs text-slate-500">
                      {phaseLabel(activity.phase)} · {activity.durationMinutes}{" "}
                      phút
                    </p>
                    {activity.generationStatus === "failed" ? (
                      <span className="text-xs font-bold text-red-600">
                        Chưa tạo được
                      </span>
                    ) : null}
                  </button>
                ))}
                <button
                  className="btn-secondary mt-2 w-full"
                  onClick={() => addActivity(period.id)}
                >
                  <Plus size={15} />
                  Thêm hoạt động
                </button>
              </div>
            ))}
          </aside>
        }
        canvas={
          <main className="min-w-0 space-y-4">
            <section className="rounded-[24px] border bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-black">Bản xem trước giáo án</h2>
                  <p className="text-xs text-slate-500">
                    Nội dung đang xem được đồng bộ với bản lưu và tệp xuất.
                  </p>
                </div>
                {validation.valid ? (
                  <span className="text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="inline" size={16} /> Hợp lệ
                  </span>
                ) : (
                  <span className="text-sm font-bold text-amber-700">
                    <AlertTriangle className="inline" size={16} /> Cần rà soát
                  </span>
                )}
              </div>
              <div
                className="ui-segmented-control mt-4 grid grid-cols-2 sm:grid-cols-4"
                role="tablist"
                aria-label="Chế độ xem giáo án"
              >
                {(
                  [
                    ["draft", "Soạn thảo"],
                    ["print", "Xem bản in"],
                    ["teacher_student_table", "Bảng GV/HS"],
                    ["timeline", "Tiến trình"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={previewMode === value}
                    className={
                      previewMode === value
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600"
                    }
                    onClick={() => setPreviewMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <pre
                className={`mt-4 max-h-[720px] overflow-auto whitespace-pre-wrap p-5 font-sans text-sm leading-7 ${previewMode === "print" ? "document-paper" : "rounded-xl bg-slate-50"}`}
              >
                {lessonPlanToText(
                  plan,
                  previewMode === "teacher_student_table"
                    ? "teacher_student_table"
                    : previewMode === "timeline"
                      ? "timeline"
                      : "full",
                )}
              </pre>
              {[...validation.errors, ...validation.warnings].map((item) => (
                <p
                  key={item}
                  className="mt-2 text-xs font-semibold text-amber-800"
                >
                  • {item}
                </p>
              ))}
            </section>
            <section className="rounded-[24px] border bg-white p-5">
              <h2 className="font-black">Bao phủ mục tiêu và minh chứng</h2>
              <div className="ui-table-wrap mt-3">
                <table className="ui-table min-w-[700px]">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">Mục tiêu</th>
                      <th className="p-2">Hoạt động</th>
                      <th className="p-2">Minh chứng</th>
                      <th className="p-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverage.map((item) => (
                      <tr key={item.objectiveId} className="border-t">
                        <td className="p-2">{item.objective}</td>
                        <td className="p-2">
                          {item.activityTitles.join("; ") || "—"}
                        </td>
                        <td className="p-2">
                          {item.evidence.join("; ") || "—"}
                        </td>
                        <td className="p-2 font-bold">
                          {
                            {
                              covered: "Đã được triển khai",
                              missing_activity: "Chưa có hoạt động",
                              missing_evidence: "Chưa có minh chứng",
                              needs_confirmation: "Cần giáo viên xác nhận",
                            }[item.status]
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        }
        inspector={
          <aside className="rounded-[24px] border bg-white p-4">
            {selected ? (
              <>
                <h2 className="font-black">Chỉnh hoạt động {selected.order}</h2>
                <div className="mt-3 space-y-3">
                  <Field
                    label="Tiêu đề"
                    value={selected.title}
                    onChange={(value) =>
                      updateActivity(selected.id, { title: value })
                    }
                  />
                  <Select
                    label="Giai đoạn"
                    value={selected.phase}
                    options={phases}
                    onChange={(value) =>
                      updateActivity(selected.id, {
                        phase: value as LessonPhase,
                      })
                    }
                  />
                  <NumberField
                    label="Thời lượng"
                    value={selected.durationMinutes}
                    min={1}
                    max={180}
                    onChange={(value) =>
                      updateActivity(selected.id, { durationMinutes: value })
                    }
                  />
                  <Select
                    label="Hình thức"
                    value={selected.workMode}
                    options={workModes}
                    onChange={(value) =>
                      updateActivity(selected.id, {
                        workMode: value as LessonWorkMode,
                      })
                    }
                  />
                  <label>
                    <span className="label">Nội dung</span>
                    <textarea
                      className="form-field mt-1 min-h-24"
                      value={selected.content}
                      onChange={(event) =>
                        updateActivity(selected.id, {
                          content: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="label">Sản phẩm dự kiến</span>
                    <textarea
                      className="form-field mt-1 min-h-20"
                      value={selected.expectedProduct || ""}
                      onChange={(event) =>
                        updateActivity(selected.id, {
                          expectedProduct: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="label">Minh chứng đánh giá</span>
                    <textarea
                      className="form-field mt-1 min-h-20"
                      value={selected.assessmentEvidence || ""}
                      onChange={(event) =>
                        updateActivity(selected.id, {
                          assessmentEvidence: event.target.value,
                        })
                      }
                    />
                  </label>
                  <AuthoringDisclosure
                    title="Các bước hoạt động"
                    description="Mở khi cần mô tả chi tiết hành động giáo viên và học sinh."
                  >
                    <StepEditor
                      activity={selected}
                      update={(steps) =>
                        updateActivity(selected.id, {
                          steps,
                          teacherActions: steps,
                          studentActions: steps,
                        })
                      }
                    />
                  </AuthoringDisclosure>
                  <AuthoringDisclosure
                    title="Phân hóa & ghi chú"
                    description="Các trường bổ sung, không bắt buộc cho mọi hoạt động."
                  >
                    <div className="space-y-3">
                      <label>
                        <span className="label">Hỗ trợ phân hóa</span>
                        <textarea
                          className="form-field mt-1 min-h-16"
                          value={selected.differentiation?.support || ""}
                          onChange={(event) =>
                            updateActivity(selected.id, {
                              differentiation: {
                                ...selected.differentiation,
                                support: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        <span className="label">Nhiệm vụ nâng cao</span>
                        <textarea
                          className="form-field mt-1 min-h-16"
                          value={selected.differentiation?.advanced || ""}
                          onChange={(event) =>
                            updateActivity(selected.id, {
                              differentiation: {
                                ...selected.differentiation,
                                advanced: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        <span className="label">Ghi chú giáo viên</span>
                        <textarea
                          className="form-field mt-1 min-h-16"
                          value={selected.teacherNote || ""}
                          onChange={(event) =>
                            updateActivity(selected.id, {
                              teacherNote: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </AuthoringDisclosure>
                  <ActionMenu
                    label="Tạo lại"
                    className="btn-secondary w-full"
                    items={[
                      {
                        label: "Tạo lại riêng hoạt động này",
                        onSelect: () => requestRegenerate(selected),
                        disabled: busy,
                      },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => attach("worksheet", selected)}
                    >
                      <FileText size={14} />
                      Tạo phiếu
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => attach("slides", selected)}
                    >
                      <Presentation size={14} />
                      Tạo slide
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => attach("rubric", selected)}
                    >
                      <Link2 size={14} />
                      Tạo rubric
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => attach("exam", selected)}
                    >
                      <Sparkles size={14} />
                      Kiểm tra nhanh
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => moveActivity(selected, -1)}>
                      <ArrowUp size={16} />
                    </button>
                    <button onClick={() => moveActivity(selected, 1)}>
                      <ArrowDown size={16} />
                    </button>
                    <button onClick={() => duplicateActivity(selected)}>
                      <Copy size={16} />
                    </button>
                    <select
                      className="form-field"
                      value={
                        plan.periods.find((item) =>
                          item.activities.some(
                            (candidate) => candidate.id === selected.id,
                          ),
                        )?.id
                      }
                      onChange={(event) =>
                        moveToPeriod(selected, event.target.value)
                      }
                    >
                      {plan.periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          Tiết {period.periodNumber}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ui-icon-button text-red-600"
                      aria-label="Xóa hoạt động"
                      onClick={() => {
                        if (window.confirm("Xóa hoạt động đang chọn?"))
                          removeActivity(selected.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p>Chọn một hoạt động để chỉnh sửa.</p>
            )}
          </aside>
        }
      />
    </>
  );
}

function StepEditor({
  activity,
  update,
}: {
  activity: LessonActivity;
  update: (steps: ActivityStep[]) => void;
}) {
  const steps = activity.steps || [];
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">Các bước hoạt động</span>
        <button
          className="text-xs font-bold text-blue-700"
          onClick={() =>
            update([
              ...steps,
              {
                id: crypto.randomUUID(),
                name: "Bước mới",
                teacherAction: "",
                studentAction: "",
                output: "",
              },
            ])
          }
        >
          + Thêm bước
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {steps.map((step, index) => (
          <div key={step.id} className="rounded-xl border p-2">
            <input
              className="form-field"
              value={step.name}
              onChange={(event) =>
                update(
                  steps.map((item) =>
                    item.id === step.id
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
            />
            <textarea
              className="form-field mt-1 min-h-14"
              value={step.teacherAction}
              placeholder="Hoạt động giáo viên"
              onChange={(event) =>
                update(
                  steps.map((item) =>
                    item.id === step.id
                      ? { ...item, teacherAction: event.target.value }
                      : item,
                  ),
                )
              }
            />
            <textarea
              className="form-field mt-1 min-h-14"
              value={step.studentAction}
              placeholder="Hoạt động học sinh"
              onChange={(event) =>
                update(
                  steps.map((item) =>
                    item.id === step.id
                      ? { ...item, studentAction: event.target.value }
                      : item,
                  ),
                )
              }
            />
            <div className="mt-1 flex justify-end gap-2">
              <button
                aria-label="Lên"
                onClick={() => {
                  if (index) {
                    const next = [...steps];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    update(next);
                  }
                }}
              >
                <ArrowUp size={14} />
              </button>
              <button
                aria-label="Xuống"
                onClick={() => {
                  if (index < steps.length - 1) {
                    const next = [...steps];
                    [next[index + 1], next[index]] = [
                      next[index],
                      next[index + 1],
                    ];
                    update(next);
                  }
                }}
              >
                <ArrowDown size={14} />
              </button>
              <button
                aria-label="Xóa"
                className="text-red-600"
                onClick={() =>
                  update(steps.filter((item) => item.id !== step.id))
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function RegenerationDialog({
  activity,
  onCopy,
  onReplace,
  onCancel,
}: {
  activity: LessonActivity;
  onCopy: () => void;
  onReplace: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-black">Hoạt động này đã được chỉnh sửa</h2>
        <p className="mt-2 text-sm text-slate-600">
          Chọn cách tạo lại để không làm mất thay đổi của giáo viên.
        </p>
        <div className="mt-5 grid gap-2">
          <button className="btn-primary" onClick={onCopy}>
            Tạo bản sao rồi viết lại
          </button>
          <button className="btn-secondary" onClick={onReplace}>
            Thay thế nội dung
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Hoạt động: {activity.title}
        </p>
      </div>
    </div>
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
        value={value}
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
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
