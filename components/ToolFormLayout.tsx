"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { InputField } from "@/components/fields/InputField";
import { SelectField } from "@/components/fields/SelectField";
import { TextAreaField } from "@/components/fields/TextAreaField";
import { OutputPreview } from "@/components/OutputPreview";
import { AppShell } from "@/components/AppShell";
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
import { ToolPageHeader } from "@/components/tools/ToolPageHeader";
import { ToolOutputPanel } from "@/components/tools/ToolOutputPanel";
import { ToolWorkspaceLayout } from "@/components/tools/ToolWorkspaceLayout";
import { getCurrentSampleId, getGenericSamplePrefill, mergeDefined } from "@/lib/sample-prefill";
import { generateToolContent } from "@/lib/ai/client";
import { withSourceAlignmentNote } from "@/lib/curriculum";

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

const serverAIToolTypes = new Set(["lesson-plan", "rubric", "parent-message", "bulk-student-comments"]);

export function ToolFormLayout({ config }: { config: ToolConfig }) {
  const initialInput = useMemo(() => getInitialInput(config.fields), [config.fields]);
  const [input, setInput] = useState<GenericToolInput>(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const draft = useFormDraft(config.href, input, setInput);
  const templateType = config.type === "lesson-plan" ? "Giáo án" : config.type === "matrix" ? "Ma trận đề" : config.type === "answer-key" ? "Đáp án và thang điểm" : config.type === "exam-shuffler" ? "Đề kiểm tra" : config.type === "parent-message" ? "Tin nhắn phụ huynh" : "";

  useEffect(() => {
    const sampleId = getCurrentSampleId();
    const sample = getGenericSamplePrefill(sampleId, config.href);
    if (!sample) return;
    queueMicrotask(() => {
      setInput((current) => mergeDefined({ ...initialInput, ...current }, sample));
      setMessage("Đã điền mẫu nhanh. Thầy/cô có thể chỉnh sửa trước khi tạo.");
    });
  }, [config.href, initialInput]);

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
    let rawGenerated: string;
    try {
      if (serverAIToolTypes.has(config.type)) {
        const aiResult = await generateToolContent({ tool: config.type, input: input as Record<string, unknown> });
        rawGenerated = aiResult.content;
      } else {
        rawGenerated = await config.generate(input);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo tài liệu lúc này.");
      setLoading(false);
      return;
    }
    const generated = withSourceAlignmentNote(polishGeneratedContent(config.type, input, rawGenerated), input as Record<string, unknown>);
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
    setMessage("Đã tinh chỉnh nội dung.");
  }

  return (
    <AppShell title={config.title}>
        <ToolPageHeader title={config.title} description={config.description} />
        <ToolWorkspaceLayout
          form={
          <form onSubmit={handleSubmit} className="tool-form-card">
            {config.sampleInput ? (
              <button type="button" onClick={() => setInput(config.sampleInput ?? initialInput)} className="btn-secondary w-full">
                Điền thử mẫu nhanh
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
                  return <div key={field.name}><TextAreaField label={field.label} value={String(value ?? "")} placeholder={field.placeholder} onChange={(next) => update(field.name, next)} />{"helperText" in field && field.helperText ? <p className="mt-1 text-xs leading-5 text-muted">{field.helperText}</p> : null}</div>;
                }
                if (field.type === "select") {
                  return <div key={field.name}><SelectField label={field.label} value={String(value ?? "")} options={field.options} onChange={(next) => update(field.name, next)} />{"helperText" in field && field.helperText ? <p className="mt-1 text-xs leading-5 text-muted">{field.helperText}</p> : null}</div>;
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
                  <div key={field.name}>
                    <InputField
                      label={field.label}
                      type={field.type}
                      value={(value as string | number) ?? ""}
                      placeholder={field.placeholder}
                      onChange={(next) => update(field.name, next)}
                    />
                    {"helperText" in field && field.helperText ? <p className="mt-1 text-xs leading-5 text-muted">{field.helperText}</p> : null}
                  </div>
                );
              })}
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Đang tạo bản nháp…" : `Tạo ${config.title.toLowerCase()}`}
            </button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          }
          output={
            <ToolOutputPanel loading={loading} loadingTitle="Đang tạo bản nháp…" loadingDescription="Soạn Lab đang chuẩn bị nội dung để thầy cô rà soát." hasOutput={Boolean(document)} showWarning={false}>
              {document ? <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool={config.type} input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </> : null}
            </ToolOutputPanel>
          }
        />
    </AppShell>
  );
}
