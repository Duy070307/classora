"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { InputField } from "@/components/fields/InputField";
import { SelectField } from "@/components/fields/SelectField";
import { TextAreaField } from "@/components/fields/TextAreaField";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { PresetSelect } from "@/components/tools/PresetSelect";
import { TemplateSelect } from "@/components/TemplateSelect";
import { createDocument, saveDocument } from "@/lib/history";
import { saveRecentTool } from "@/lib/recent-tools";
import { incrementUsage } from "@/lib/usage";
import { applyTemplate, resolveTemplate } from "@/lib/templates";
import type { GeneratedDocument, GenericToolInput, ToolConfig, ToolField } from "@/lib/types";
import { useFormDraft } from "@/hooks/useFormDraft";
import { genericPresets } from "@/lib/presets";

function getInitialInput(fields: ToolField[]): GenericToolInput {
  return fields.reduce<GenericToolInput>((acc, field) => {
    acc[field.name] = field.defaultValue;
    return acc;
  }, {});
}

function polishGeneratedContent(type: string, input: GenericToolInput, content: string) {
  if (type === "answer-key" && !/ĐÁP ÁN VÀ THANG ĐIỂM/i.test(content)) {
    return `ĐÁP ÁN VÀ THANG ĐIỂM\n\n${content}\n\nLƯU Ý KHI CHẤM\n- Chấp nhận cách diễn đạt tương đương nếu đúng bản chất.\n- Giáo viên có thể điều chỉnh điểm chi tiết theo thực tế lớp học.\n- Kiểm tra lại lỗi thường gặp trước khi trả bài.`;
  }
  if (type === "matrix") {
    const totalQuestions = Number(input.questionCount || 0);
    const totalScore = Number(input.totalScore || 10);
    const rates = {
      recognitionRate: Number(input.recognitionRate || 0),
      understandingRate: Number(input.understandingRate || 0),
      applicationRate: Number(input.applicationRate || 0),
      advancedRate: Number(input.advancedRate || 0)
    };
    const row = `| ${input.topic || "Chủ đề kiểm tra"} | ${rates.recognitionRate}% | ${rates.understandingRate}% | ${rates.applicationRate}% | ${rates.advancedRate}% | ${totalQuestions || "…"} | ${totalScore} | ${rates.recognitionRate + rates.understandingRate + rates.applicationRate + rates.advancedRate}% |`;
    return `MA TRẬN ĐỀ\nMôn: ${input.subject || ""} - Lớp: ${input.grade || ""}\n\n| Nội dung/chủ đề | Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao | Tổng số câu | Tổng điểm | Tỉ lệ |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${row}\n| Tổng cộng | ${rates.recognitionRate}% | ${rates.understandingRate}% | ${rates.applicationRate}% | ${rates.advancedRate}% | ${totalQuestions || "…"} | ${totalScore} | 100% |\n\n${content}`;
  }
  return content;
}

export function ToolFormLayout({ config }: { config: ToolConfig }) {
  const initialInput = useMemo(() => getInitialInput(config.fields), [config.fields]);
  const [input, setInput] = useState<GenericToolInput>(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const draft = useFormDraft(config.href, input, setInput);
  const templateType = config.type === "lesson-plan" ? "Giáo án" : config.type === "matrix" ? "Ma trận đề" : config.type === "answer-key" ? "Đáp án và thang điểm" : config.type === "exam-shuffler" ? "Đề kiểm tra" : config.type === "parent-message" ? "Tin nhắn phụ huynh" : "";

  function update(name: string, value: string | number | boolean | string[]) {
    setInput((current) => ({ ...current, [name]: value }));
  }

  async function generate() {
    const required = config.fields.find((field) => field.type !== "checkbox" && field.type !== "multicheckbox" && field.defaultValue !== "" && String(input[field.name] ?? "").trim() === "");
    if (required) return setMessage(`Vui lòng nhập ${required.label.toLowerCase()}.`);
    const negativeNumber = config.fields.find((field) => field.type === "number" && Number(input[field.name]) < 0);
    if (negativeNumber) return setMessage(`${negativeNumber.label} không được âm.`);
    const positiveNumber = config.fields.find((field) => field.type === "number" && /(count|score|totalScore|levelCount|slideCount|exerciseCount|codeCount|questionCount|classSize|parentCount)/i.test(field.name) && Number(input[field.name]) <= 0);
    if (positiveNumber) return setMessage(`${positiveNumber.label} phải lớn hơn 0.`);
    if (config.type === "matrix") {
      const total = ["recognitionRate", "understandingRate", "applicationRate", "advancedRate"].reduce((sum, key) => sum + Number(input[key] || 0), 0);
      if (total !== 100) return setMessage("Tổng tỉ lệ mức độ nên bằng 100%.");
    }
    if (config.type === "exam-shuffler" && !/Câu\s*\d+/i.test(String(input.questions || ""))) {
      return setMessage("Không tìm thấy khối câu hỏi. Hãy nhập câu bắt đầu bằng “Câu 1”, “Câu 2”...");
    }
    setLoading(true);
    setMessage("");
    const generated = polishGeneratedContent(config.type, input, await config.generate(input));
    const values = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)]));
    const content = applyTemplate(resolveTemplate(templateId), generated, values);
    const next = createDocument(config.makeTitle(input), config.type, content);
    setDocument(next);
    incrementUsage();
    saveRecentTool({ title: config.title, href: config.href });
    setMessage("Đã tạo tài liệu thành công.");
    setLoading(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate();
  }

  function handleSave() {
    if (!document) return;
    saveDocument(document);
    setMessage("Đã lưu vào lịch sử.");
  }

  function handleRefined(content: string) {
    if (!document) return;
    setDocument({ ...document, content });
    setMessage("Đã tinh chỉnh nội dung bằng Mock AI.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title={config.title} description={config.description} />
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <form onSubmit={handleSubmit} className="card space-y-5 p-5">
            {config.sampleInput ? (
              <button type="button" onClick={() => setInput(config.sampleInput ?? initialInput)} className="btn-secondary w-full">
                Dùng dữ liệu mẫu
              </button>
            ) : null}
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <PresetSelect presets={genericPresets[config.href] ?? []} onApply={(values) => setInput((current) => ({ ...current, ...values }))} />
            {templateType ? <TemplateSelect type={templateType} value={templateId} onChange={setTemplateId} /> : null}
            <div className="form-section space-y-4">
              <p className="form-section-title">Thông tin tạo tài liệu</p>
              {config.fields.map((field) => {
                const value = input[field.name];
                if (field.type === "textarea") {
                  return <TextAreaField key={field.name} label={field.label} value={String(value ?? "")} placeholder={field.placeholder} onChange={(next) => update(field.name, next)} />;
                }
                if (field.type === "select") {
                  return <SelectField key={field.name} label={field.label} value={String(value ?? "")} options={field.options} onChange={(next) => update(field.name, next)} />;
                }
                if (field.type === "checkbox") {
                  return (
                    <label key={field.name} className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={Boolean(value)} onChange={(event) => update(field.name, event.target.checked)} />
                      {field.label}
                    </label>
                  );
                }
                if (field.type === "multicheckbox") {
                  const selected = Array.isArray(value) ? value : [];
                  return (
                    <div key={field.name}>
                      <p className="label">{field.label}</p>
                      <div className="mt-2 space-y-2">
                        {field.options.map((option) => (
                          <label key={option} className="flex items-center gap-2 text-sm text-ink">
                            <input
                              type="checkbox"
                              checked={selected.includes(option)}
                              onChange={(event) => {
                                const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option);
                                update(field.name, next);
                              }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <InputField
                    key={field.name}
                    label={field.label}
                    type={field.type}
                    value={(value as string | number) ?? ""}
                    placeholder={field.placeholder}
                    onChange={(next) => update(field.name, next)}
                  />
                );
              })}
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Đang tạo..." : `Tạo ${config.title.toLowerCase()}`}
            </button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          <div className="space-y-4">
            {loading ? (
              <div className="card flex min-h-80 items-center justify-center p-8 text-center">
                <div>
                  <Loader2 className="mx-auto animate-spin text-brand" size={34} />
                  <p className="mt-4 font-semibold text-ink">Đang tạo tài liệu...</p>
                  <p className="mt-1 text-sm text-muted">Classora đang dùng AI mô phỏng để soạn bản nháp.</p>
                </div>
              </div>
            ) : document ? (
              <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool={config.type} input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
            ) : (
              <div className="empty-state">Kết quả sẽ hiển thị tại đây sau khi tạo.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
