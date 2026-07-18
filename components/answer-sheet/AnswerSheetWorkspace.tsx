"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Printer,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AnswerSheetPreview } from "@/components/answer-sheet/AnswerSheetPreview";
import {
  AssessmentActionBar,
  AssessmentDisclosure,
  AssessmentStageNavigation,
  AssessmentStatus,
} from "@/components/assessment/AssessmentWorkspace";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import {
  getCloudDocument,
  listCloudDocuments,
} from "@/lib/data/documents-store";
import { getHistory, saveDocument } from "@/lib/history";
import type { GeneratedDocument } from "@/lib/types";
import { buildAnswerSheetLayout } from "@/lib/answer-sheet/layout";
import { answerSheetToDocument } from "@/lib/answer-sheet/history";
import {
  createAnswerSheetTemplate,
  configFromExam,
  defaultAnswerSheetConfig,
  structuralErrorsForAnswerSheet,
  templatesFromVariantSet,
  type AnswerSheetConfig,
} from "@/lib/answer-sheet/template";
import type {
  AnswerSheetLayout,
  AnswerSheetTemplate,
} from "@/lib/answer-sheet/types";
import {
  downloadAnswerSheetPdf,
  downloadAnswerSheetZip,
  downloadCombinedAnswerSheetPdf,
} from "@/lib/answer-sheet/export";
import { readAnswerSheetSourceSession } from "@/lib/answer-sheet/session";
import { openGradingAssistant } from "@/lib/grading/session";

function countLabel(template: AnswerSheetTemplate) {
  return template.sections
    .map(
      (section) =>
        `${section.type === "multiple_choice" ? "TN" : section.type === "true_false" ? "Đ/S" : section.type === "short_answer" ? "TL ngắn" : "Tự luận"}: ${section.questions.length}`,
    )
    .join(" · ");
}

export function AnswerSheetWorkspace() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [source, setSource] = useState<GeneratedDocument | null>(null);
  const [config, setConfig] = useState<AnswerSheetConfig>(
    defaultAnswerSheetConfig(),
  );
  const [templates, setTemplates] = useState<AnswerSheetTemplate[]>([]);
  const [layouts, setLayouts] = useState<AnswerSheetLayout[]>([]);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [allVariants, setAllVariants] = useState(true);
  const [variantCode, setVariantCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"config" | "preview">("config");
  const [configStage, setConfigStage] = useState<
    "source" | "details" | "answers" | "preview"
  >("source");

  useEffect(() => {
    queueMicrotask(async () => {
      const docs = (await listCloudDocuments()) ?? getHistory();
      setHistory(docs);
      const historyId = new URLSearchParams(window.location.search).get(
        "history",
      );
      const saved = historyId
        ? (await getCloudDocument(historyId)) ||
          docs.find((item) => item.id === historyId)
        : null;
      if (saved?.answerSheetTemplate) {
        setTemplates([saved.answerSheetTemplate]);
        setLayouts([
          saved.answerSheetLayout ||
            buildAnswerSheetLayout(saved.answerSheetTemplate),
        ]);
        setConfig((current) => ({
          ...current,
          title: saved.answerSheetTemplate!.title,
          subject: saved.answerSheetTemplate!.subject || "",
          grade: saved.answerSheetTemplate!.grade || "",
          durationMinutes: saved.answerSheetTemplate!.durationMinutes || 45,
          variantCode: saved.answerSheetTemplate!.variantCode || "",
          schoolName: saved.answerSheetTemplate!.schoolName || "",
          teacherName: saved.answerSheetTemplate!.teacherName || "",
          pageSize: saved.answerSheetTemplate!.pageSize,
          density: saved.answerSheetTemplate!.density,
          studentFields: saved.answerSheetTemplate!.studentFields,
          qrEnabled: saved.answerSheetTemplate!.recognition.qrEnabled,
          printedVariantCode:
            saved.answerSheetTemplate!.recognition.printedVariantCode,
          cornerAnchorsEnabled:
            saved.answerSheetTemplate!.recognition.cornerAnchorsEnabled,
          pageNumbersEnabled:
            saved.answerSheetTemplate!.recognition.pageNumbersEnabled,
        }));
        setMode("preview");
        return;
      }
      const session = readAnswerSheetSourceSession();
      if (session?.document) applySource(session.document, session.variantCode);
    });
  }, []);

  function applySource(document: GeneratedDocument, preferredCode?: string) {
    setSource(document);
    setTemplates([]);
    setLayouts([]);
    setMode("config");
    const exam =
      preferredCode && document.examVariantSet
        ? document.examVariantSet.variants.find(
            (variant) => variant.code === preferredCode,
          )?.exam
        : document.structuredExam;
    if (exam) {
      setConfig((current) => ({
        ...configFromExam(exam),
        pageSize: current.pageSize,
        density: current.density,
        studentFields: current.studentFields,
        qrEnabled: current.qrEnabled,
        printedVariantCode: current.printedVariantCode,
        cornerAnchorsEnabled: current.cornerAnchorsEnabled,
        pageNumbersEnabled: current.pageNumbersEnabled,
      }));
    }
    if (document.examVariantSet) {
      const code =
        preferredCode || document.examVariantSet.variants[0]?.code || "";
      setVariantCode(code);
      setAllVariants(!preferredCode);
    }
    setMessage(
      document.examVariantSet
        ? "Đã nạp bộ mã đề. Có thể tạo một phiếu cho từng mã."
        : "Đã nạp cấu trúc đề mà không thay đổi câu hỏi.",
    );
  }

  function patch<K extends keyof AnswerSheetConfig>(
    key: K,
    value: AnswerSheetConfig[K],
  ) {
    setConfig((current) => ({ ...current, [key]: value }));
  }
  const selectedVariant = source?.examVariantSet?.variants.find(
    (variant) => variant.code === variantCode,
  );
  const structuralErrors = useMemo(() => {
    const exam = selectedVariant?.exam || source?.structuredExam;
    return exam ? structuralErrorsForAnswerSheet(exam) : [];
  }, [selectedVariant, source]);

  async function createPreview() {
    if (structuralErrors.length)
      return setMessage(
        "Đề vẫn còn lỗi cấu trúc. Thầy cô cần kiểm tra đề trước khi tạo phiếu trả lời.",
      );
    setBusy(true);
    setMessage("");
    try {
      let next: AnswerSheetTemplate[];
      if (source?.examVariantSet && allVariants)
        next = templatesFromVariantSet(source.examVariantSet, config);
      else if (selectedVariant && source?.examVariantSet)
        next = [
          createAnswerSheetTemplate({
            config: { ...config, variantCode: selectedVariant.code },
            variant: selectedVariant,
            variantSet: source.examVariantSet,
            examId: source.id,
          }),
        ];
      else if (source?.structuredExam)
        next = [
          createAnswerSheetTemplate({
            config,
            exam: source.structuredExam,
            examId: source.id,
          }),
        ];
      else next = [createAnswerSheetTemplate({ config })];
      const response = await fetch("/api/answer-sheet/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: next[0] }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        maintenance?: boolean;
        error?: string;
        layout?: AnswerSheetLayout;
      };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.layout)
        throw new Error(data.error || "Chưa thể tạo bố cục phiếu.");
      setTemplates(next);
      setLayouts(
        next.map((template, index) =>
          index === 0 ? data.layout! : buildAnswerSheetLayout(template),
        ),
      );
      setActiveTemplate(0);
      setActivePage(0);
      setMode("preview");
      setConfigStage("preview");
      setMessage(
        next.length > 1
          ? `Đã tạo ${next.length} phiếu theo đúng từng mã đề.`
          : "Đã tạo bản xem trước phiếu trả lời.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Chưa thể tạo phiếu trả lời.",
      );
    } finally {
      setBusy(false);
    }
  }

  function saveTemplates() {
    templates.forEach((template, index) =>
      saveDocument(answerSheetToDocument(template, layouts[index])),
    );
    setMessage(`Đã lưu ${templates.length} phiếu trả lời vào lịch sử.`);
  }
  const template = templates[activeTemplate];
  const layout = layouts[activeTemplate];
  const page = layout?.pages[activePage];

  return (
    <AppShell title="Phiếu trả lời" contentClassName="w-full p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1280px]">
        <header className="border-b border-slate-200 bg-white px-1 pb-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-sm font-black text-blue-700"
          >
            <ArrowLeft size={16} />
            Trung tâm công cụ
          </Link>
          <div className="mt-3">
            <div>
              <span className="soft-badge">Đánh giá xác định</span>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Phiếu trả lời
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Tạo phiếu chuẩn có QR, điểm định vị và ô trả lời ổn định để in,
                quét và chấm khách quan chính xác hơn.
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
                <CheckCircle2 size={17} aria-hidden="true" />
                Không đưa đáp án vào phiếu hoặc mã QR.
              </p>
            </div>
          </div>
        </header>
        {message ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-950">
            {message}
          </div>
        ) : null}
        <div className="mt-4">
          <AssessmentStageNavigation
            activeId={mode === "preview" ? "preview" : configStage}
            onChange={(next) => {
              if (next === "preview") {
                if (templates.length) {
                  setMode("preview");
                  setConfigStage("preview");
                }
                return;
              }
              setMode("config");
              setConfigStage(next as "source" | "details" | "answers");
            }}
            stages={[
              {
                id: "source",
                label: "Chọn nguồn",
                shortLabel: "Nguồn đề",
                completed: configStage !== "source" || mode === "preview",
              },
              {
                id: "details",
                label: "Thông tin bài kiểm tra",
                shortLabel: "Thông tin",
                completed:
                  configStage === "answers" || mode === "preview",
              },
              {
                id: "answers",
                label: "Cấu trúc và nhận diện",
                shortLabel: "Cấu trúc",
                completed: mode === "preview",
              },
              {
                id: "preview",
                label: "Xem trước và xuất",
                shortLabel: "Xem trước",
                disabled: !templates.length,
                disabledReason: "Cần tạo bản xem trước trước.",
              },
            ]}
          />
        </div>
        {mode === "config" ? (
          <div
            className={`mt-5 grid gap-5 ${configStage === "answers" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1"}`}
          >
            <main className="space-y-5">
              {configStage === "source" ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-black">1. Chọn nguồn đề</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="label">Đề hoặc bộ mã đề đã lưu</span>
                      <select
                        className="form-field mt-2"
                        value=""
                        onChange={(event) => {
                          const found = history.find(
                            (item) => item.id === event.target.value,
                          );
                          if (found) applySource(found);
                        }}
                      >
                        <option value="">Tạo thủ công hoặc chọn nguồn…</option>
                        {history
                          .filter(
                            (item) =>
                              item.structuredExam || item.examVariantSet,
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                              {item.examVariantSet ? " · Bộ mã đề" : ""}
                            </option>
                          ))}
                      </select>
                    </label>
                    {source?.examVariantSet ? (
                      <div>
                        <span className="label">Mã đề</span>
                        <select
                          className="form-field mt-2"
                          value={variantCode}
                          disabled={allVariants}
                          onChange={(event) => {
                            setVariantCode(event.target.value);
                            const exam = source.examVariantSet?.variants.find(
                              (variant) => variant.code === event.target.value,
                            )?.exam;
                            if (exam)
                              setConfig((current) => ({
                                ...current,
                                ...configFromExam(exam),
                                pageSize: current.pageSize,
                                density: current.density,
                                studentFields: current.studentFields,
                              }));
                          }}
                        >
                          {source.examVariantSet.variants.map((variant) => (
                            <option key={variant.code}>{variant.code}</option>
                          ))}
                        </select>
                        <label className="mt-2 flex items-center gap-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            checked={allVariants}
                            onChange={(event) =>
                              setAllVariants(event.target.checked)
                            }
                          />
                          Tạo phiếu cho cả {source.examVariantSet.variantCount}{" "}
                          mã đề
                        </label>
                      </div>
                    ) : null}
                  </div>
                  {structuralErrors.length ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      <AlertTriangle className="mr-2 inline" size={17} />
                      Đề vẫn còn lỗi cấu trúc. Thầy cô cần kiểm tra đề trước khi
                      tạo phiếu trả lời.
                    </div>
                  ) : null}
                  <AssessmentActionBar
                    status={
                      <span className="text-sm font-semibold text-slate-600">
                        Có thể tạo thủ công nếu chưa chọn đề đã lưu.
                      </span>
                    }
                  >
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setConfigStage("details")}
                    >
                      Bước tiếp theo: Thông tin bài kiểm tra
                    </button>
                  </AssessmentActionBar>
                </section>
              ) : null}
              {configStage === "details" ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-black">
                    2. Thông tin bài kiểm tra
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Tên bài kiểm tra"
                      value={config.title}
                      onChange={(value) => patch("title", value)}
                    />
                    <Field
                      label="Môn học"
                      value={config.subject}
                      onChange={(value) => patch("subject", value)}
                    />
                    <Field
                      label="Khối lớp"
                      value={config.grade}
                      onChange={(value) => patch("grade", value)}
                    />
                    <NumberField
                      label="Thời gian làm bài"
                      value={config.durationMinutes}
                      min={0}
                      max={600}
                      onChange={(value) => patch("durationMinutes", value)}
                    />
                    <Field
                      label="Mã đề"
                      value={config.variantCode}
                      onChange={(value) => patch("variantCode", value)}
                    />
                    <Field
                      label="Trường (không bắt buộc)"
                      value={config.schoolName}
                      onChange={(value) => patch("schoolName", value)}
                    />
                    <Field
                      label="Giáo viên (không bắt buộc)"
                      value={config.teacherName}
                      onChange={(value) => patch("teacherName", value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-primary mt-4"
                    onClick={() => setConfigStage("answers")}
                  >
                    Bước tiếp theo: Cấu trúc câu trả lời
                  </button>
                </section>
              ) : null}
              {configStage === "answers" ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-black">
                    3. Cấu trúc câu trả lời
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <NumberField
                      label="Số câu A/B/C/D"
                      value={config.multipleChoiceCount}
                      min={0}
                      max={100}
                      disabled={Boolean(source?.structuredExam)}
                      onChange={(value) => patch("multipleChoiceCount", value)}
                    />
                    <NumberField
                      label="Số câu đúng/sai"
                      value={config.trueFalseCount}
                      min={0}
                      max={30}
                      disabled={Boolean(source?.structuredExam)}
                      onChange={(value) => patch("trueFalseCount", value)}
                    />
                    <NumberField
                      label="Mệnh đề mỗi câu"
                      value={config.statementsPerTrueFalse}
                      min={1}
                      max={8}
                      disabled={Boolean(source?.structuredExam)}
                      onChange={(value) =>
                        patch("statementsPerTrueFalse", value)
                      }
                    />
                    <NumberField
                      label="Trả lời ngắn"
                      value={config.shortAnswerCount}
                      min={0}
                      max={30}
                      disabled={Boolean(source?.structuredExam)}
                      onChange={(value) => patch("shortAnswerCount", value)}
                    />
                    <NumberField
                      label="Số câu tự luận"
                      value={config.essayCount}
                      min={0}
                      max={10}
                      onChange={(value) => patch("essayCount", value)}
                    />
                    <SelectField
                      label="Dạng trả lời ngắn"
                      value={config.shortAnswerMode}
                      options={[
                        ["free", "Viết đáp án tự do"],
                        ["structured_numeric", "Ô số có cấu trúc"],
                        ["final_only", "Chỉ nhập kết quả cuối"],
                      ]}
                      onChange={(value) =>
                        patch(
                          "shortAnswerMode",
                          value as AnswerSheetConfig["shortAnswerMode"],
                        )
                      }
                    />
                    <SelectField
                      label="Vùng tự luận"
                      value={config.essaySpace}
                      options={[
                        ["none", "Không tạo vùng"],
                        ["short_lines", "Dòng viết ngắn"],
                        ["half_page", "Nửa trang"],
                        ["full_page", "Một trang"],
                        ["separate_page", "Trang riêng"],
                      ]}
                      onChange={(value) =>
                        patch(
                          "essaySpace",
                          value as AnswerSheetConfig["essaySpace"],
                        )
                      }
                    />
                  </div>
                </section>
              ) : null}
            </main>
            {configStage === "answers" ? (
              <aside className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="font-black">Thông tin học sinh</h2>
                  <div className="mt-3 space-y-2">
                    {(
                      [
                        ["fullName", "Họ và tên"],
                        ["className", "Lớp"],
                        ["candidateNumber", "Số báo danh"],
                        ["studentCode", "Mã học sinh"],
                        ["examDate", "Ngày kiểm tra"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-sm font-semibold"
                      >
                        <input
                          type="checkbox"
                          checked={config.studentFields[key]}
                          onChange={(event) =>
                            patch("studentFields", {
                              ...config.studentFields,
                              [key]: event.target.checked,
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="font-black">Khổ giấy &amp; mật độ</h2>
                  <SelectField
                    label="Khổ giấy"
                    value={config.pageSize}
                    options={[
                      ["A4_PORTRAIT", "A4 dọc"],
                      ["A4_LANDSCAPE", "A4 ngang"],
                      ["A5", "A5"],
                      ["A4_TWO_UP", "Hai phiếu trên A4"],
                    ]}
                    onChange={(value) =>
                      patch("pageSize", value as AnswerSheetConfig["pageSize"])
                    }
                  />
                  <div className="mt-3">
                    <SelectField
                      label="Mật độ"
                      value={config.density}
                      options={[
                        ["comfortable", "Thoáng"],
                        ["standard", "Tiêu chuẩn"],
                        ["compact", "Tiết kiệm giấy"],
                      ]}
                      onChange={(value) =>
                        patch("density", value as AnswerSheetConfig["density"])
                      }
                    />
                  </div>
                </section>
                <AssessmentDisclosure
                  title="Thiết lập nhận diện nâng cao"
                  description="QR, mã đề in và các điểm định vị khi quét phiếu."
                >
                  <div className="mt-3 space-y-2">
                    {(
                      [
                        ["qrEnabled", "In mã QR nhận diện phiếu"],
                        ["printedVariantCode", "In mã đề dạng chữ"],
                        ["cornerAnchorsEnabled", "In ô định vị bốn góc"],
                        ["pageNumbersEnabled", "In số trang"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-start gap-2 text-sm font-semibold"
                      >
                        <input
                          className="mt-1"
                          type="checkbox"
                          checked={config[key]}
                          onChange={(event) => patch(key, event.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </AssessmentDisclosure>
                <button
                  className="btn-primary w-full"
                  disabled={busy || Boolean(structuralErrors.length)}
                  onClick={() => void createPreview()}
                >
                  <Settings2 size={17} />
                  {busy ? "Đang tạo bố cục…" : "Xem trước phiếu trả lời"}
                </button>
              </aside>
            ) : null}
          </div>
        ) : template && layout && page ? (
          <section className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
            <aside className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Xem trước phiếu trả lời</h2>
              <p className="mt-2 text-sm text-slate-600">
                {countLabel(template)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {templates.map((item, index) => (
                  <button
                    key={item.recognition.templateId}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${index === activeTemplate ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                    onClick={() => {
                      setActiveTemplate(index);
                      setActivePage(0);
                    }}
                  >
                    {item.variantCode
                      ? `Mã ${item.variantCode}`
                      : `Phiếu ${index + 1}`}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {layout.pages.map((item, index) => (
                  <button
                    key={item.pageNumber}
                    className={`rounded-xl border p-2 text-xs font-black ${index === activePage ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
                    onClick={() => setActivePage(index)}
                  >
                    Trang {item.pageNumber}
                  </button>
                ))}
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Số trang</dt>
                  <dd className="font-black">{layout.pages.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Khổ giấy</dt>
                  <dd className="font-black">{template.pageSize}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Nhận diện</dt>
                  <dd className="font-black text-emerald-700">Sẵn sàng</dd>
                </div>
              </dl>
              {layout.warnings.map((warning) => (
                <p
                  key={warning}
                  className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"
                >
                  {warning}
                </p>
              ))}
            </aside>
            <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
              <div className="mx-auto max-w-[800px] overflow-hidden border border-slate-300 bg-white shadow-xl">
                <AnswerSheetPreview page={page} />
              </div>
            </div>
            <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-black">Xuất &amp; sử dụng</h2>
              <button
                className="btn-primary w-full justify-start"
                onClick={() => void downloadAnswerSheetPdf(template)}
              >
                <Download size={17} />
                Tải PDF mã này
              </button>
              <ActionMenu
                label="Thao tác khác"
                className="btn-secondary w-full"
                items={[
                  {
                    label: "PDF gộp tất cả mã",
                    disabled: templates.length <= 1,
                    onSelect: () => downloadCombinedAnswerSheetPdf(templates),
                  },
                  {
                    label: "ZIP từng mã đề",
                    disabled: templates.length <= 1,
                    onSelect: () => downloadAnswerSheetZip(templates),
                  },
                  { label: "Lưu làm mẫu", onSelect: saveTemplates },
                  {
                    label: "Sao chép mã mẫu",
                    onSelect: () =>
                      navigator.clipboard.writeText(
                        template.recognition.templateId,
                      ),
                  },
                ]}
              />
              {source ? (
                <button
                  className="btn-secondary w-full justify-start"
                  onClick={() => openGradingAssistant(source)}
                >
                  <ClipboardCheck size={17} />
                  Mở công cụ chấm bài
                </button>
              ) : null}
              <button
                className="btn-secondary w-full justify-start"
                onClick={() => {
                  setMode("config");
                  setConfigStage("answers");
                }}
              >
                <Settings2 size={17} />
                Quay lại cấu hình
              </button>
              <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                <Printer className="mb-2 text-blue-600" size={18} />
                <strong>In đúng tỉ lệ 100%.</strong> PDF là định dạng chính để
                giữ chính xác QR, anchor và tọa độ ô. Word chưa được cung cấp vì
                có thể làm lệch bản đồ nhận diện.
              </div>
              <AssessmentStatus
                tone="ready"
                label="Sẵn sàng xuất"
                detail="Đang xem một mã đề và một trang tại mỗi thời điểm."
              />
            </aside>
          </section>
        ) : null}
      </div>
    </AppShell>
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
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="form-field mt-1"
        type="number"
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(min, Math.min(max, Number(event.target.value) || 0)),
          )
        }
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
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
        {options.map(([key, labelValue]) => (
          <option key={key} value={key}>
            {labelValue}
          </option>
        ))}
      </select>
    </label>
  );
}
