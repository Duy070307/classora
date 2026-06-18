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
import { createDocument, saveDocument } from "@/lib/history";
import { saveRecentTool } from "@/lib/recent-tools";
import { incrementUsage } from "@/lib/usage";
import type { GeneratedDocument, GenericToolInput, ToolConfig, ToolField } from "@/lib/types";

function getInitialInput(fields: ToolField[]): GenericToolInput {
  return fields.reduce<GenericToolInput>((acc, field) => {
    acc[field.name] = field.defaultValue;
    return acc;
  }, {});
}

export function ToolFormLayout({ config }: { config: ToolConfig }) {
  const initialInput = useMemo(() => getInitialInput(config.fields), [config.fields]);
  const [input, setInput] = useState<GenericToolInput>(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function update(name: string, value: string | number | boolean | string[]) {
    setInput((current) => ({ ...current, [name]: value }));
  }

  async function generate() {
    setLoading(true);
    setMessage("");
    const content = await config.generate(input);
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
