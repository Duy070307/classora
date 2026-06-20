"use client";

import { Copy } from "lucide-react";
import { useMemo, useState } from "react";
import katex from "katex";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { Sidebar } from "@/components/Sidebar";

const examples = [
  "\\frac{a}{b} + \\sqrt{x}",
  "E = mc^2",
  "\\int_0^1 x^2 dx = \\frac{1}{3}",
  "\\Delta = b^2 - 4ac"
];

export default function LatexPreviewPage() {
  const [latex, setLatex] = useState("\\frac{a}{b} + \\sqrt{x}");
  const [displayMode, setDisplayMode] = useState(true);
  const [message, setMessage] = useState("");

  const preview = useMemo(() => {
    try {
      return {
        html: katex.renderToString(latex, {
          displayMode,
          throwOnError: true,
          strict: "warn"
        }),
        error: ""
      };
    } catch (error) {
      return {
        html: "",
        error: error instanceof Error ? error.message : "Công thức chưa render được."
      };
    }
  }, [displayMode, latex]);

  async function copyLatex() {
    await navigator.clipboard.writeText(latex);
    setMessage("Đã copy LaTeX.");
    setTimeout(() => setMessage(""), 1800);
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Preview LaTeX" description="Nhập LaTeX để xem công thức. Nếu công thức lỗi, Soạn Lab sẽ hiển thị ghi chú thay vì làm hỏng trang." exportable={false} />
        <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
          <section className="tool-form-card">
            <div className="form-section">
              <p className="form-section-title">Editor LaTeX</p>
              <label className="label">Nhập công thức</label>
              <textarea className="form-field mt-1 min-h-40 font-mono" value={latex} onChange={(event) => setLatex(event.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={displayMode} onChange={(event) => setDisplayMode(event.target.checked)} />
              Display mode
            </label>
            <button type="button" onClick={copyLatex} className="btn-primary w-full">
              <Copy size={16} />
              Copy LaTeX
            </button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
            <div className="tool-tip-card">
              <p className="font-bold text-blue-800">Mẹo nhanh</p>
              <p className="mt-1">Dùng dấu ngoặc đủ cặp và thử các ví dụ bên dưới nếu công thức báo lỗi.</p>
            </div>
            <div>
              <p className="label">Ví dụ thường dùng</p>
              <div className="mt-2 grid gap-2">
                {examples.map((example) => (
                  <button key={example} type="button" onClick={() => setLatex(example)} className="block w-full rounded-2xl border border-blue-100 bg-white px-3 py-2 text-left font-mono text-sm text-muted shadow-sm hover:border-brand hover:text-brand">
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
              <h2 className="text-xl font-bold text-ink">Bản xem trước công thức</h2>
              <p className="mt-1 text-sm text-muted">Công cụ này chỉ preview LaTeX đã nhập, không dùng OCR.</p>
            </div>
            <div className="space-y-5 p-5">
              <div className="min-h-48 rounded-[1.35rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-6 text-center text-xl shadow-inner">
                {preview.error ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-sm leading-6 text-red-700">
                    <p className="font-semibold">Công thức cần kiểm tra</p>
                    <p>Công thức chưa render được. Hãy kiểm tra dấu ngoặc, lệnh LaTeX hoặc ký tự đặc biệt.</p>
                    <p className="mt-2 font-mono">{preview.error}</p>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: preview.html }} />
                )}
              </div>
              <div>
                <p className="label">Raw LaTeX</p>
                <pre className="mt-2 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">{latex}</pre>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
