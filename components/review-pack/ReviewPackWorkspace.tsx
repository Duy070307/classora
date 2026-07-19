"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthoringWorkspace } from "@/components/authoring/AuthoringWorkspace";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { ToolPageHeader } from "@/components/tools/ToolPageHeader";
import { SourceModeTabs, WorkflowStageNavigation } from "@/components/tools/WorkflowNavigation";
import { generateToolContent } from "@/lib/ai/client";
import { listCloudDocuments } from "@/lib/data/documents-store";
import { getHistory, saveDocument } from "@/lib/history";
import { openLessonSlides } from "@/lib/lesson-slides/source";
import { addQuestions } from "@/lib/question-bank";
import {
  downloadReviewPackDocx,
  downloadReviewPackZip,
  printReviewPackPdf,
} from "@/lib/review-pack/export";
import { readReviewPackSession } from "@/lib/review-pack/session";
import type {
  ReviewInputMode,
  ReviewOutlineItem,
  ReviewPack,
  ReviewPurpose,
  ReviewSectionType,
  ReviewSourcePreview,
} from "@/lib/review-pack/types";
import {
  createReviewOutline,
  createReviewPackDraft,
  generateReviewSection,
  normalizeReviewPack,
  parseGeneratedReviewSection,
  reviewPackQuestions,
  reviewPackQuizDocument,
  reviewPackToDocument,
  reviewPackToText,
  reviewPackWorksheetDocument,
  reviewSectionCacheKey,
  reviewSourceFromDocument,
  validateReviewPack,
} from "@/lib/review-pack/workflow";
import type { GeneratedDocument } from "@/lib/types";
import { openWorksheetGenerator } from "@/lib/worksheet/session";

type Stage = "setup" | "outline" | "editor";
type Audience = "student" | "teacher";
const modes: Array<[ReviewInputMode, string]> = [
  ["topic", "Nhập chủ đề"],
  ["document", "Từ tài liệu"],
  ["saved", "Nội dung đã lưu"],
  ["grading_result", "Kết quả chấm bài"],
];
const purposes: Array<[ReviewPurpose, string]> = [
  ["lesson", "Một bài"],
  ["chapter", "Một chương"],
  ["midterm", "Giữa kỳ"],
  ["final", "Cuối kỳ"],
  ["exam_prep", "Ôn thi"],
  ["remediation", "Củng cố sau chấm bài"],
];
const sectionLabels: Record<ReviewSectionType, string> = {
  knowledge: "Kiến thức trọng tâm",
  formula: "Công thức cần nhớ",
  summary_table: "Bảng tổng hợp",
  exercise_types: "Các dạng bài",
  worked_examples: "Ví dụ mẫu",
  basic_practice: "Bài tập cơ bản",
  application_practice: "Bài tập vận dụng",
  advanced_practice: "Bài tập nâng cao",
  quick_quiz: "Tự kiểm tra nhanh",
  answers: "Đáp án",
  solutions: "Lời giải chi tiết",
  teacher_notes: "Ghi chú giáo viên",
};

export function ReviewPackWorkspace() {
  const [stage, setStage] = useState<Stage>("setup");
  const [mode, setMode] = useState<ReviewInputMode>("topic");
  const [pack, setPack] = useState<ReviewPack>(() => createReviewPackDraft());
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [source, setSource] = useState<ReviewSourcePreview | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [selectedOutlineId, setSelectedOutlineId] = useState("");
  const [audience, setAudience] = useState<Audience>("student");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    queueMicrotask(async () => {
      const docs = (await listCloudDocuments()) ?? getHistory();
      setDocuments(docs);
      const session = readReviewPackSession();
      const historyId = new URLSearchParams(window.location.search).get(
        "history",
      );
      const initial =
        session?.document || docs.find((item) => item.id === historyId);
      if (initial?.reviewPack) {
        setPack(normalizeReviewPack(initial.reviewPack));
        setStage("editor");
        setSelectedOutlineId(initial.reviewPack.outline[0]?.id || "");
        return;
      }
      if (initial) loadSource(initial, session?.sourceActivityIds);
    });
  }, []);

  useEffect(() => {
    if (stage !== "editor") return;
    const timer = window.setTimeout(
      () => saveDocument(reviewPackToDocument(pack, "teacher")),
      1400,
    );
    return () => window.clearTimeout(timer);
  }, [pack, stage]);
  const validation = useMemo(() => validateReviewPack(pack), [pack]);
  const selected =
    pack.outline.find((item) => item.id === selectedOutlineId) ||
    pack.outline[0];
  const update = (patch: Partial<ReviewPack>) =>
    setPack((current) =>
      normalizeReviewPack({
        ...current,
        ...patch,
        metadata: { ...current.metadata, updatedAt: new Date().toISOString() },
      }),
    );
  const updateSettings = (patch: Partial<ReviewPack["settings"]>) =>
    update({ settings: { ...pack.settings, ...patch } });

  function loadSource(
    document: GeneratedDocument,
    sourceActivityIds: string[] = [],
  ) {
    const preview = reviewSourceFromDocument(document, sourceActivityIds);
    setSource(preview);
    setSourceText(preview.text);
    setMode(
      preview.sourceType === "grading_result"
        ? "grading_result"
        : preview.sourceType === "document"
          ? "document"
          : "saved",
    );
    setPack((current) =>
      createReviewPackDraft({
        ...current,
        subject: preview.subject || current.subject,
        grade: preview.grade || current.grade,
        topic: preview.topic || document.title,
        settings: { ...current.settings, sourceOnly: true },
        metadata: {
          ...current.metadata,
          sourceType: preview.sourceType,
          sourceDocumentId: document.id,
          sourceActivityIds,
        },
      }),
    );
    setMessage(
      preview.confirmed
        ? "Đã đọc nguồn. Thầy cô kiểm tra thông tin trước khi tạo dàn ý."
        : preview.warnings.join(" "),
    );
  }

  async function parseFile(file: File) {
    if (file.size > 12 * 1024 * 1024) return setMessage("Tệp vượt quá 12 MB.");
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/lesson-slides/parse", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || !data.ok)
        throw new Error(data.error || "Chưa thể đọc tệp.");
      const preview: ReviewSourcePreview = {
        title: data.source.title || file.name,
        sourceType: "document",
        text: data.source.text || "",
        objectives: data.source.extracted?.objectives || [],
        keyKnowledge: (data.source.text || "")
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(0, 30),
        confirmed: true,
        warnings: data.source.warnings || [],
      };
      setSource(preview);
      setSourceText(preview.text);
      update({
        topic: pack.topic || preview.title,
        settings: { ...pack.settings, sourceOnly: true },
        metadata: { ...pack.metadata, sourceType: "document" },
      });
      setMessage("Đã đọc tài liệu. Tệp gốc không được lưu cùng đề cương.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa thể đọc tệp.");
    } finally {
      setBusy(false);
    }
  }

  function prepareOutline() {
    if (!pack.topic?.trim()) return setMessage("Vui lòng nhập chủ đề ôn tập.");
    if (
      mode !== "topic" &&
      (!sourceText.trim() || (source && !source.confirmed))
    )
      return setMessage(
        source?.warnings.join(" ") || "Nguồn chưa được giáo viên xác nhận.",
      );
    const effectiveSource =
      source ||
      (sourceText.trim()
        ? ({
            title: "Nội dung đã nhập",
            sourceType: "document",
            text: sourceText,
            objectives: [],
            keyKnowledge: sourceText
              .split(/\r?\n/)
              .filter(Boolean)
              .slice(0, 30),
            confirmed: true,
            warnings: [],
          } satisfies ReviewSourcePreview)
        : undefined);
    const outline = createReviewOutline(pack, effectiveSource);
    update({ outline });
    setSelectedOutlineId(outline[0]?.id || "");
    setStage("outline");
    setMessage(
      "Đã tạo dàn ý. Thầy cô có thể sắp xếp và sửa từng phần trước khi tạo nội dung.",
    );
  }

  function setOutline(items: ReviewOutlineItem[]) {
    update({
      outline: items.map((item, index) => ({ ...item, order: index + 1 })),
    });
  }
  async function generateAll() {
    setBusy(true);
    let next = pack;
    const effective =
      source ||
      (sourceText
        ? ({
            title: "Nguồn nhập",
            sourceType: "document",
            text: sourceText,
            objectives: [],
            keyKnowledge: sourceText.split(/\r?\n/).filter(Boolean),
            confirmed: true,
            warnings: [],
          } satisfies ReviewSourcePreview)
        : undefined);
    for (let index = 0; index < pack.outline.length; index += 1) {
      const item = pack.outline[index];
      setProgress(`Đang tạo phần ${index + 1}/${pack.outline.length}`);
      const key = `soanlab:review-pack-cache:${reviewSectionCacheKey(next, item, effective)}`;
      try {
        const cached = sessionStorage.getItem(key);
        if (cached)
          next = normalizeReviewPack(JSON.parse(cached) as ReviewPack);
        else if (["answers", "solutions"].includes(item.type))
          next = generateReviewSection(next, item.id, effective);
        else {
          const mixedMultipleChoice = Math.ceil(item.exerciseCount / 3);
          const mixedTrueFalse = Math.floor(item.exerciseCount / 3);
          const mixedShortAnswer =
            item.exerciseCount - mixedMultipleChoice - mixedTrueFalse;
          const quizInput = {
            subject: next.subject,
            grade: next.grade,
            topic: next.topic,
            duration: `${Math.max(5, item.exerciseCount * 2)} phút`,
            examStyle: "Kiểm tra nhanh",
            examCode: "REVIEW",
            totalScore: 10,
            multipleChoiceCount:
              next.settings.quizType === "mixed"
                ? mixedMultipleChoice
                : next.settings.quizType === "multiple_choice"
                  ? item.exerciseCount
                  : 0,
            trueFalseCount:
              next.settings.quizType === "mixed"
                ? mixedTrueFalse
                : next.settings.quizType === "true_false"
                  ? item.exerciseCount
                  : 0,
            shortAnswerCount:
              next.settings.quizType === "mixed"
                ? mixedShortAnswer
                : next.settings.quizType === "short_answer"
                  ? item.exerciseCount
                  : 0,
            essayCount: 0,
            includeAnswers: true,
          };
          const sectionInput = {
            sectionType: item.type,
            title: item.title,
            purpose: item.purpose,
            level: item.level,
            exerciseCount: item.exerciseCount,
            subject: next.subject,
            grade: next.grade,
            topic: next.topic,
            bookSeries: next.textbookSeries,
            detailLevel: next.settings.detailLevel,
            differentiation: next.settings.differentiation,
            sourceOnly: next.settings.sourceOnly,
            sourceContent: effective?.text.slice(0, 12000) || "",
            notes: next.notes,
          };
          const result = await generateToolContent({
            tool:
              item.type === "quick_quiz"
                ? "exam-generator"
                : "review-pack-section",
            input: item.type === "quick_quiz" ? quizInput : sectionInput,
          });
          next = parseGeneratedReviewSection(
            result.content,
            next,
            item.id,
            effective,
            result.structuredExam,
          );
          sessionStorage.setItem(key, JSON.stringify(next));
        }
      } catch {
        next = generateReviewSection(next, item.id, effective);
      }
    }
    setPack(next);
    setStage("editor");
    setSelectedOutlineId(next.outline[0]?.id || "");
    setBusy(false);
    setProgress("");
    setMessage("Đã tạo đề cương. Nội dung là bản nháp cần giáo viên rà soát.");
  }
  function regenerate(item: ReviewOutlineItem) {
    const hasEdit =
      item.teacherEdited ||
      pack.knowledgeSections.some(
        (entry) => entry.id === item.id && entry.teacherEdited,
      ) ||
      pack.practiceActivities.some(
        (entry) => entry.sourceSectionId === item.id && entry.teacherEdited,
      );
    if (
      hasEdit &&
      !window.confirm(
        "Phần này đã được chỉnh sửa. Tạo lại sẽ thay nội dung riêng của phần này?",
      )
    )
      return;
    setPack(generateReviewSection(pack, item.id, source || undefined, true));
  }
  function save() {
    saveDocument(reviewPackToDocument(pack, "teacher"));
    setMessage("Đã lưu đề cương vào lịch sử.");
  }
  function sendToQuestionBank() {
    const questions = reviewPackQuestions(pack);
    addQuestions(questions);
    setMessage(`Đã thêm ${questions.length} câu hợp lệ vào ngân hàng cá nhân.`);
  }

  return (
    <AppShell title="Đề cương ôn tập">
      <div className="mx-auto max-w-[1560px] space-y-5">
        <ToolPageHeader
          title="Đề cương ôn tập"
          category="Tài liệu dạy học"
          description="Tạo gói ôn tập hoàn chỉnh từ chủ đề, tài liệu, nội dung đã lưu hoặc kết quả chấm bài đã xác nhận."
          actions={stage === "editor" ? (
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={save}>
                  <Save size={16} />
                  Lưu
                </button>
                <ActionMenu
                  label="Xuất"
                  items={[
                    {
                      label: "Word học sinh",
                      onSelect: () => downloadReviewPackDocx(pack, "student"),
                    },
                    {
                      label: "Word giáo viên",
                      onSelect: () => downloadReviewPackDocx(pack, "teacher"),
                    },
                    {
                      label: `In/PDF ${audience === "student" ? "học sinh" : "giáo viên"}`,
                      onSelect: () => printReviewPackPdf(pack, audience),
                    },
                    {
                      label: "ZIP đầy đủ",
                      onSelect: () => downloadReviewPackZip(pack),
                    },
                  ]}
                />
              </div>
            ) : null}
        />
        <WorkflowStageNavigation
          activeId={stage}
          items={[{ id: "setup", label: "Thiết lập" }, { id: "outline", label: "Dàn ý" }, { id: "editor", label: "Biên tập & xuất" }]}
        />
        {stage === "setup" ? (
          <Setup
            pack={pack}
            mode={mode}
            setMode={setMode}
            update={update}
            updateSettings={updateSettings}
            documents={documents}
            loadSource={loadSource}
            source={source}
            sourceText={sourceText}
            setSourceText={setSourceText}
            parseFile={parseFile}
            prepare={prepareOutline}
            busy={busy}
          />
        ) : null}
        {stage === "outline" ? (
          <Outline
            pack={pack}
            setOutline={setOutline}
            setStage={setStage}
            generateAll={generateAll}
            busy={busy}
            progress={progress}
          />
        ) : null}
        {stage === "editor" ? (
          <Editor
            pack={pack}
            update={update}
            selected={selected}
            select={setSelectedOutlineId}
            audience={audience}
            setAudience={setAudience}
            regenerate={regenerate}
            validation={validation}
          />
        ) : null}
        {stage === "editor" ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-5">
            <h2 className="font-black">Dùng tiếp nội dung này</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn bước tiếp theo phù hợp với gói ôn tập đang mở.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={() =>
                  openLessonSlides(
                    reviewPackToDocument(pack, "teacher"),
                    "review",
                  )
                }
              >
                Tạo slide ôn tập
              </button>
              <ActionMenu
                label="Thao tác khác"
                items={[
                  {
                    label: "Tạo phiếu luyện tập",
                    onSelect: () =>
                      openWorksheetGenerator(
                        reviewPackWorksheetDocument(pack),
                        "review",
                      ),
                  },
                  ...(reviewPackQuizDocument(pack)
                    ? [
                        {
                          label: "Mở bài kiểm tra nhanh",
                          onSelect: () => {
                            const doc = reviewPackQuizDocument(pack);
                            if (doc) {
                              saveDocument(doc);
                              window.location.assign(`/history/${doc.id}`);
                            }
                          },
                        },
                      ]
                    : []),
                  {
                    label: "Lưu câu hỏi vào ngân hàng",
                    onSelect: sendToQuestionBank,
                  },
                ]}
              />
            </div>
          </section>
        ) : null}
        {stage === "editor" ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-5">
            <h2 className="font-black">Tệp chuyên biệt</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tải riêng từng phần khi không cần gói đầy đủ.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionMenu
                label="Chọn tệp cần tải"
                items={[
                  {
                    label: "Word công thức",
                    onSelect: () => downloadReviewPackDocx(pack, "formula"),
                  },
                  {
                    label: "Word luyện tập",
                    onSelect: () => downloadReviewPackDocx(pack, "practice"),
                  },
                  {
                    label: "Word đáp án & lời giải",
                    onSelect: () => downloadReviewPackDocx(pack, "solutions"),
                  },
                  {
                    label: "PDF học sinh",
                    onSelect: () => printReviewPackPdf(pack, "student"),
                  },
                  {
                    label: "PDF giáo viên",
                    onSelect: () => printReviewPackPdf(pack, "teacher"),
                  },
                ]}
              />
            </div>
          </section>
        ) : null}
        {message ? (
          <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-950">
            {message}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

function Setup({
  pack,
  mode,
  setMode,
  update,
  updateSettings,
  documents,
  loadSource,
  source,
  sourceText,
  setSourceText,
  parseFile,
  prepare,
  busy,
}: {
  pack: ReviewPack;
  mode: ReviewInputMode;
  setMode: (value: ReviewInputMode) => void;
  update: (patch: Partial<ReviewPack>) => void;
  updateSettings: (patch: Partial<ReviewPack["settings"]>) => void;
  documents: GeneratedDocument[];
  loadSource: (document: GeneratedDocument) => void;
  source: ReviewSourcePreview | null;
  sourceText: string;
  setSourceText: (value: string) => void;
  parseFile: (file: File) => void;
  prepare: () => void;
  busy: boolean;
}) {
  const toggles: Array<[keyof ReviewPack["settings"], string]> = [
    ["includeKnowledge", "Kiến thức trọng tâm"],
    ["includeFormulas", "Công thức"],
    ["includeSummaryTable", "Bảng tổng hợp"],
    ["includeExerciseTypes", "Các dạng bài"],
    ["includeWorkedExamples", "Ví dụ mẫu"],
    ["includeBasicPractice", "Bài cơ bản"],
    ["includeApplicationPractice", "Bài vận dụng"],
    ["includeAdvancedPractice", "Bài nâng cao"],
    ["includeQuickQuiz", "Tự kiểm tra nhanh"],
    ["includeAnswers", "Đáp án"],
    ["includeDetailedSolutions", "Lời giải chi tiết"],
    ["includeTeacherNotes", "Ghi chú giáo viên"],
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <main className="space-y-5">
        <SourceModeTabs
          value={mode}
          onChange={(value) => setMode(value as ReviewInputMode)}
          items={modes.map(([id, label]) => ({ id, label }))}
        />
        {mode !== "topic" ? (
          <section className="rounded-[24px] border bg-white p-5">
            <h2 className="font-black">Nguồn nội dung</h2>
            {mode === "document" ? (
              <label className="mt-3 block rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-5 text-center text-sm font-bold text-blue-900">
                <FileText className="mx-auto mb-2" />
                <span>
                  {busy ? "Đang đọc tệp…" : "Chọn DOCX, PDF, PPTX hoặc TXT"}
                </span>
                <input
                  className="sr-only"
                  type="file"
                  accept=".docx,.pdf,.pptx,.txt"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void parseFile(file);
                  }}
                />
              </label>
            ) : (
              <select
                className="form-field mt-3"
                value={source?.sourceDocumentId || ""}
                onChange={(event) => {
                  const found = documents.find(
                    (item) => item.id === event.target.value,
                  );
                  if (found) loadSource(found);
                }}
              >
                <option value="">Chọn nội dung đã lưu</option>
                {documents
                  .filter((item) =>
                    mode !== "grading_result"
                      ? item.type !== "grading-assistant"
                      : item.type === "grading-assistant" ||
                        Boolean(item.gradingJob),
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            )}
            <textarea
              className="form-field mt-3 min-h-44"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Nội dung nguồn đã nhận dạng hoặc dán trực tiếp"
            />
            {source ? (
              <p
                className={`mt-3 rounded-xl p-3 text-sm ${source.confirmed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
              >
                {source.confirmed
                  ? "Nguồn đã sẵn sàng."
                  : source.warnings.join(" ")}
              </p>
            ) : null}
          </section>
        ) : null}
        <section className="rounded-[24px] border bg-white p-5">
          <h2 className="font-black">Thông tin đề cương</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Môn học"
              value={pack.subject || ""}
              onChange={(value) => update({ subject: value })}
            />
            <Field
              label="Khối lớp"
              value={pack.grade || ""}
              onChange={(value) => update({ grade: value })}
            />
            <Field
              label="Chủ đề"
              value={pack.topic || ""}
              onChange={(value) =>
                update({
                  topic: value,
                  title: `ĐỀ CƯƠNG ÔN TẬP - ${value.toUpperCase()}`,
                })
              }
            />
            <Field
              label="Bộ sách"
              value={pack.textbookSeries || ""}
              onChange={(value) => update({ textbookSeries: value })}
            />
            <Select
              label="Mục đích"
              value={pack.purpose}
              options={purposes}
              onChange={(value) => update({ purpose: value as ReviewPurpose })}
            />
            <NumberField
              label="Thời lượng dự kiến"
              value={pack.estimatedMinutes}
              min={15}
              max={600}
              onChange={(value) => update({ estimatedMinutes: value })}
            />
          </div>
          <label className="mt-3 block">
            <span className="label">Yêu cầu thêm</span>
            <textarea
              className="form-field mt-1 min-h-24"
              value={pack.notes || ""}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </label>
        </section>
      </main>
      <aside>
        <section className="sticky top-4 rounded-[24px] border bg-white p-5">
          <h2 className="font-black">Cấu hình nội dung</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {toggles.map(([key, label]) => (
              <Check
                key={key}
                label={label}
                checked={Boolean(pack.settings[key])}
                onChange={(value) => updateSettings({ [key]: value })}
              />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <NumberField
              label="Số bài luyện tập"
              value={pack.settings.exerciseCount}
              min={2}
              max={40}
              onChange={(value) => updateSettings({ exerciseCount: value })}
            />
            <NumberField
              label="Số câu kiểm tra nhanh"
              value={pack.settings.quizCount}
              min={1}
              max={20}
              onChange={(value) => updateSettings({ quizCount: value })}
            />
            <Select
              label="Mức chi tiết"
              value={pack.settings.detailLevel}
              options={[
                ["concise", "Ngắn gọn"],
                ["standard", "Tiêu chuẩn"],
                ["detailed", "Chi tiết"],
              ]}
              onChange={(value) =>
                updateSettings({
                  detailLevel: value as ReviewPack["settings"]["detailLevel"],
                })
              }
            />
            <Select
              label="Phân hóa"
              value={pack.settings.differentiation}
              options={[
                ["single", "Một mức chung"],
                ["basic_advanced", "Cơ bản + nâng cao"],
                ["three_levels", "Ba mức độ"],
              ]}
              onChange={(value) =>
                updateSettings({
                  differentiation:
                    value as ReviewPack["settings"]["differentiation"],
                })
              }
            />
            {mode !== "topic" ? (
              <Check
                label="Chỉ dùng kiến thức trong nguồn"
                checked={pack.settings.sourceOnly}
                onChange={(value) => updateSettings({ sourceOnly: value })}
              />
            ) : null}
          </div>
          <button className="btn-primary mt-5 w-full" onClick={prepare}>
            Tạo dàn ý đề cương
          </button>
        </section>
      </aside>
    </div>
  );
}

function Outline({
  pack,
  setOutline,
  setStage,
  generateAll,
  busy,
  progress,
}: {
  pack: ReviewPack;
  setOutline: (items: ReviewOutlineItem[]) => void;
  setStage: (stage: Stage) => void;
  generateAll: () => void;
  busy: boolean;
  progress: string;
}) {
  return (
    <section className="rounded-[24px] border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Dàn ý đề cương</h2>
          <p className="text-sm text-slate-500">
            Sắp xếp, thêm hoặc bỏ phần trước khi tạo nội dung.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setStage("setup")}>
          Quay lại thiết lập
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {pack.outline.map((item, index) => (
          <article
            key={item.id}
            className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[55px_1fr_170px_130px_auto]"
          >
            <strong>#{index + 1}</strong>
            <div>
              <input
                className="form-field"
                value={item.title}
                onChange={(event) =>
                  setOutline(
                    pack.outline.map((entry) =>
                      entry.id === item.id
                        ? {
                            ...entry,
                            title: event.target.value,
                            teacherEdited: true,
                          }
                        : entry,
                    ),
                  )
                }
              />
              <input
                className="form-field mt-2"
                value={item.purpose}
                onChange={(event) =>
                  setOutline(
                    pack.outline.map((entry) =>
                      entry.id === item.id
                        ? {
                            ...entry,
                            purpose: event.target.value,
                            teacherEdited: true,
                          }
                        : entry,
                    ),
                  )
                }
              />
            </div>
            <select
              className="form-field"
              value={item.level}
              onChange={(event) =>
                setOutline(
                  pack.outline.map((entry) =>
                    entry.id === item.id
                      ? {
                          ...entry,
                          level: event.target
                            .value as ReviewOutlineItem["level"],
                        }
                      : entry,
                  ),
                )
              }
            >
              <option value="basic">Cơ bản</option>
              <option value="standard">Tiêu chuẩn</option>
              <option value="advanced">Nâng cao</option>
              <option value="mixed">Kết hợp</option>
            </select>
            <NumberField
              label="Số bài/câu"
              value={item.exerciseCount}
              min={0}
              max={30}
              onChange={(value) =>
                setOutline(
                  pack.outline.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, exerciseCount: value }
                      : entry,
                  ),
                )
              }
            />
            <div className="flex gap-1">
              <button
                aria-label="Lên"
                onClick={() => {
                  if (index > 0) {
                    const next = [...pack.outline];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    setOutline(next);
                  }
                }}
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label="Xuống"
                onClick={() => {
                  if (index < pack.outline.length - 1) {
                    const next = [...pack.outline];
                    [next[index + 1], next[index]] = [
                      next[index],
                      next[index + 1],
                    ];
                    setOutline(next);
                  }
                }}
              >
                <ArrowDown size={16} />
              </button>
              <button
                className="text-red-600"
                aria-label="Xóa"
                onClick={() =>
                  setOutline(
                    pack.outline.filter((entry) => entry.id !== item.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <button
          className="btn-secondary"
          onClick={() =>
            setOutline([
              ...pack.outline,
              {
                id: crypto.randomUUID(),
                order: pack.outline.length + 1,
                type: "knowledge",
                title: "Phần mới",
                purpose: "Nội dung bổ sung",
                estimatedLength: "medium",
                exerciseCount: 0,
                level: "standard",
                sourceCoverage: [],
                generationStatus: "outline",
              },
            ])
          }
        >
          <Plus size={16} />
          Thêm phần
        </button>
        <button
          className="btn-primary"
          disabled={busy || !pack.outline.length}
          onClick={generateAll}
        >
          {busy ? progress : "Xác nhận dàn ý và tạo nội dung"}
        </button>
      </div>
    </section>
  );
}

function Editor({
  pack,
  update,
  selected,
  select,
  audience,
  setAudience,
  regenerate,
  validation,
}: {
  pack: ReviewPack;
  update: (patch: Partial<ReviewPack>) => void;
  selected?: ReviewOutlineItem;
  select: (id: string) => void;
  audience: Audience;
  setAudience: (value: Audience) => void;
  regenerate: (item: ReviewOutlineItem) => void;
  validation: ReturnType<typeof validateReviewPack>;
}) {
  const preview = reviewPackToText(pack, audience);
  return (
    <AuthoringWorkspace
      navigatorLabel="Các phần"
      canvasLabel="Xem đề cương"
      inspectorLabel="Chỉnh phần"
      selectionLabel={
        selected ? `${selected.order}. ${selected.title}` : "Chưa chọn phần"
      }
      navigator={
        <aside className="rounded-[24px] border bg-white p-4">
          <h2 className="font-black">Các phần</h2>
          <div className="mt-3 space-y-2">
            {pack.outline.map((item) => (
              <button
                key={item.id}
                className={`min-h-11 w-full rounded-lg border p-3 text-left text-sm ${selected?.id === item.id ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}
                onClick={() => select(item.id)}
              >
                <strong>
                  {item.order}. {item.title}
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {sectionLabels[item.type]}
                </span>
              </button>
            ))}
          </div>
        </aside>
      }
      canvas={
        <main className="min-w-0 rounded-[24px] border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${audience === "student" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
                onClick={() => setAudience("student")}
              >
                Bản học sinh
              </button>
              <button
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${audience === "teacher" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
                onClick={() => setAudience("teacher")}
              >
                Bản giáo viên
              </button>
            </div>
            {validation.valid ? (
              <span className="text-sm font-bold text-emerald-700">
                <CheckCircle2 className="mr-1 inline" size={16} />
                Sẵn sàng
              </span>
            ) : (
              <span className="text-sm font-bold text-amber-800">
                <AlertTriangle className="mr-1 inline" size={16} />
                Cần rà soát
              </span>
            )}
          </div>
          <pre className="mt-4 max-h-[780px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-sans text-sm leading-7">
            {preview}
          </pre>
          {[...validation.errors, ...validation.warnings].map((item) => (
            <p className="mt-2 text-xs font-semibold text-amber-800" key={item}>
              • {item}
            </p>
          ))}
        </main>
      }
      inspector={
        <aside className="rounded-[24px] border bg-white p-4">
          {selected ? (
            <SectionEditor
              pack={pack}
              update={update}
              item={selected}
              regenerate={regenerate}
            />
          ) : (
            <p>Chọn một phần để chỉnh sửa.</p>
          )}
        </aside>
      }
    />
  );
}

function SectionEditor({
  pack,
  update,
  item,
  regenerate,
}: {
  pack: ReviewPack;
  update: (patch: Partial<ReviewPack>) => void;
  item: ReviewOutlineItem;
  regenerate: (item: ReviewOutlineItem) => void;
}) {
  const knowledge = pack.knowledgeSections.find(
    (entry) => entry.id === item.id,
  );
  const formula = pack.formulaSections.find((entry) => entry.id === item.id);
  const exercises = pack.practiceActivities.filter(
    (entry) => entry.sourceSectionId === item.id,
  );
  return (
    <>
      <h2 className="font-black">Chỉnh phần {item.order}</h2>
      <p className="mt-1 text-xs text-slate-500">{sectionLabels[item.type]}</p>
      <div className="mt-4 space-y-3">
        {knowledge ? (
          <>
            <TextArea
              label="Tóm tắt"
              value={knowledge.summary}
              onChange={(value) =>
                update({
                  knowledgeSections: pack.knowledgeSections.map((entry) =>
                    entry.id === knowledge.id
                      ? { ...entry, summary: value, teacherEdited: true }
                      : entry,
                  ),
                })
              }
            />
            <TextArea
              label="Ý chính, mỗi dòng một ý"
              value={knowledge.keyPoints.join("\n")}
              onChange={(value) =>
                update({
                  knowledgeSections: pack.knowledgeSections.map((entry) =>
                    entry.id === knowledge.id
                      ? {
                          ...entry,
                          keyPoints: value.split(/\r?\n/).filter(Boolean),
                          teacherEdited: true,
                        }
                      : entry,
                  ),
                })
              }
            />
            <TextArea
              label="Lỗi thường gặp"
              value={knowledge.commonMistake || ""}
              onChange={(value) =>
                update({
                  knowledgeSections: pack.knowledgeSections.map((entry) =>
                    entry.id === knowledge.id
                      ? { ...entry, commonMistake: value, teacherEdited: true }
                      : entry,
                  ),
                })
              }
            />
          </>
        ) : null}
        {formula ? (
          <>
            <TextArea
              label="Công thức LaTeX"
              value={formula.latex}
              onChange={(value) =>
                update({
                  formulaSections: pack.formulaSections.map((entry) =>
                    entry.id === formula.id
                      ? { ...entry, latex: value, teacherEdited: true }
                      : entry,
                  ),
                })
              }
            />
            <TextArea
              label="Điều kiện áp dụng"
              value={formula.conditions || ""}
              onChange={(value) =>
                update({
                  formulaSections: pack.formulaSections.map((entry) =>
                    entry.id === formula.id
                      ? { ...entry, conditions: value, teacherEdited: true }
                      : entry,
                  ),
                })
              }
            />
          </>
        ) : null}
        {exercises.map((activity) => (
          <div key={activity.id} className="rounded-xl border p-3">
            <Field
              label={`Bài ${activity.order}`}
              value={activity.prompt}
              onChange={(value) =>
                update({
                  practiceActivities: pack.practiceActivities.map((entry) =>
                    entry.id === activity.id
                      ? { ...entry, prompt: value, teacherEdited: true }
                      : entry,
                  ),
                })
              }
            />
            <TextArea
              label="Đáp án"
              value={activity.answer || ""}
              onChange={(value) =>
                update({
                  practiceActivities: pack.practiceActivities.map((entry) =>
                    entry.id === activity.id
                      ? { ...entry, answer: value, teacherEdited: true }
                      : entry,
                  ),
                })
              }
            />
          </div>
        ))}
        {!knowledge && !formula && !exercises.length ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm">
            Phần này được quản lý trong bản xem trước có cấu trúc. Có thể tạo
            lại riêng mà không ảnh hưởng phần khác.
          </p>
        ) : null}
        <ActionMenu
          label="Tạo lại"
          className="btn-secondary w-full"
          items={[
            {
              label: "Tạo lại riêng phần này",
              onSelect: () => regenerate(item),
            },
          ]}
        />
      </div>
    </>
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
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        className="form-field mt-1 min-h-24"
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
        value={value ?? 0}
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
