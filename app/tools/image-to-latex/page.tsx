"use client";

import { Copy, Download, FileImage, RotateCcw, Save, Sparkles } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import katex from "katex";
import { Sidebar } from "@/components/Sidebar";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { createDocument, saveDocument } from "@/lib/history";
import { saveRecentTool } from "@/lib/recent-tools";

type Mode = "auto" | "formula" | "geometry";

type ApiResult = {
  ok: true;
  type?: "latex" | "tikz";
  latex: string;
  displayLatex?: string;
  tikzCode?: string;
  standaloneLatex?: string;
  explanation?: string;
  confidence?: "high" | "medium" | "low";
  warnings?: string[];
  provider: string;
  model: string;
} | {
  ok: false;
  error: string;
};

const modes: Array<{ value: Mode; label: string }> = [
  { value: "auto", label: "Tự động" },
  { value: "formula", label: "Công thức → LaTeX" },
  { value: "geometry", label: "Hình học → TikZ" },
];

const maxSize = 5 * 1024 * 1024;

export default function ImageToLatexPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [latex, setLatex] = useState("");
  const [displayLatex, setDisplayLatex] = useState("");
  const [outputType, setOutputType] = useState<"latex" | "tikz">("latex");
  const [tikzCode, setTikzCode] = useState("");
  const [standaloneLatex, setStandaloneLatex] = useState("");
  const [explanation, setExplanation] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | "">("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isGeometryMode = mode === "geometry";
  const isTikzOutput = outputType === "tikz" || isGeometryMode;

  const preview = useMemo(() => {
    const source = displayLatex || latex;
    if (!source.trim()) return { html: "", error: "" };
    try {
      return {
        html: katex.renderToString(source, {
          displayMode: true,
          throwOnError: true,
          strict: "warn",
        }),
        error: "",
      };
    } catch (renderError) {
      return {
        html: "",
        error: renderError instanceof Error ? renderError.message : "LaTeX chưa render được.",
      };
    }
  }, [displayLatex, latex]);

  function showMessage(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 1800);
  }

  function pickFile(nextFile: File | null) {
    setError("");
    setMessage("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!nextFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(nextFile.type)) {
      setError("Vui lòng dùng ảnh PNG, JPG/JPEG hoặc WEBP.");
      return;
    }
    if (nextFile.size > maxSize) {
      setError("Ảnh quá lớn. Vui lòng dùng ảnh tối đa 5MB.");
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function generate() {
    if (!file) {
      setError("Vui lòng upload ảnh công thức hoặc hình học đã cắt gọn.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("mode", mode);
      const response = await fetch("/api/ai/image-to-latex", {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as ApiResult;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLatex(result.latex);
      setDisplayLatex(result.displayLatex || result.latex);
      setOutputType(result.type || (mode === "geometry" ? "tikz" : "latex"));
      setTikzCode(result.tikzCode || "");
      setStandaloneLatex(result.standaloneLatex || "");
      setExplanation(result.explanation || "");
      setWarnings(result.warnings || []);
      setConfidence(result.confidence || "medium");
      setProvider(`${result.provider}${result.model ? ` · ${result.model}` : ""}`);
      saveRecentTool({ title: "Ảnh công thức → LaTeX", href: "/tools/image-to-latex" });
      showMessage(mode === "geometry" ? "Đã chuyển ảnh thành TikZ." : "Đã chuyển ảnh thành LaTeX.");
    } catch {
      setError("Soạn Lab chưa nhận diện được ảnh này. Vui lòng thử ảnh rõ hơn và đã cắt gọn.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLatex() {
    await navigator.clipboard.writeText(latex);
    showMessage(isTikzOutput ? "Đã copy TikZ." : "Đã copy LaTeX.");
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setLatex("");
    setDisplayLatex("");
    setOutputType("latex");
    setTikzCode("");
    setStandaloneLatex("");
    setExplanation("");
    setWarnings([]);
    setConfidence("");
    setProvider("");
    setError("");
    setMessage("");
  }

  function download(extension: "txt" | "md") {
    const body = extension === "md"
      ? `# Ảnh công thức → LaTeX\n\n## ${isTikzOutput ? "TikZ/LaTeX" : "LaTeX"}\n\n\`\`\`latex\n${latex}\n\`\`\`\n\n${standaloneLatex ? `## Standalone LaTeX\n\n\`\`\`latex\n${standaloneLatex}\n\`\`\`\n\n` : ""}${explanation ? `## Ghi chú\n\n${explanation}\n` : ""}`
      : latex;
    const blob = new Blob([body], { type: extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `soan-lab-image-to-latex.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function saveToHistory() {
    const content = [
      "# Ảnh công thức → LaTeX",
      "",
      "```latex",
      latex,
      "```",
      standaloneLatex ? `\nStandalone LaTeX:\n\n\`\`\`latex\n${standaloneLatex}\n\`\`\`` : "",
      explanation ? `\nGhi chú: ${explanation}` : "",
      provider ? `\nNguồn tạo: ${provider}` : "",
    ].filter(Boolean).join("\n");
    saveDocument(createDocument("Ảnh công thức → LaTeX", "image-to-latex", content));
    showMessage("Đã lưu vào lịch sử.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader
          title="Ảnh công thức → LaTeX"
          description="Upload ảnh công thức hoặc hình học đã cắt gọn, Soạn Lab sẽ chuyển thành mã LaTeX có thể sao chép."
          category="Công thức & LaTeX"
          iconName="latex"
          exportable={false}
        />

        <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
          <section className="tool-form-card">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-extrabold">Cắt ảnh trước khi upload</p>
              <p className="mt-1">
                Để kết quả chính xác hơn, vui lòng cắt ảnh chỉ chứa công thức hoặc hình cần nhận diện.
                Tránh để lẫn chữ thừa, đáp án, phần trang giấy xung quanh hoặc nhiều bài trong cùng một ảnh.
              </p>
            </div>

            {isGeometryMode ? (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
                <p className="font-extrabold">Lưu ý khi vẽ lại hình học</p>
                <p className="mt-1">
                  Để vẽ lại hình chính xác hơn, vui lòng cắt ảnh chỉ chứa hình học cần nhận diện.
                  Tránh để lẫn đề bài, lời giải, đáp án hoặc nhiều hình trong cùng một ảnh.
                </p>
                <p className="mt-2 font-semibold">
                  Mã TikZ được tạo là bản nháp hỗ trợ vẽ lại hình. Giáo viên cần kiểm tra lại vị trí điểm, độ dài, góc, nét đứt và ký hiệu trước khi sử dụng.
                </p>
              </div>
            ) : null}

            <div className="form-section">
              <p className="form-section-title">Ảnh đầu vào</p>
              <label
                className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5 text-center transition hover:border-blue-500 hover:bg-blue-50"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  pickFile(event.dataTransfer.files.item(0));
                }}
              >
                <FileImage className="text-blue-600" size={34} />
                <span className="mt-3 text-sm font-extrabold text-ink">Upload hoặc kéo thả ảnh</span>
                <span className="mt-1 text-xs leading-5 text-muted">PNG, JPG/JPEG, WEBP · tối đa 5MB</span>
                <input
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => pickFile(event.target.files?.item(0) || null)}
                />
              </label>
            </div>

            {previewUrl ? (
              <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white p-3 shadow-sm">
                <div className="relative h-80 w-full">
                  <Image src={previewUrl} alt="Ảnh công thức đã upload" fill className="rounded-2xl object-contain" unoptimized />
                </div>
              </div>
            ) : null}

            <div>
              <label className="label">Chế độ nhận diện</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {modes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-bold transition ${mode === item.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-blue-100 bg-white text-slate-600 hover:border-blue-300"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={generate} disabled={busy} className="btn-primary flex-1 disabled:opacity-60">
                <Sparkles size={16} />
                {busy ? "Đang nhận diện..." : isGeometryMode ? "Chuyển thành TikZ" : "Chuyển thành LaTeX"}
              </button>
              <button type="button" onClick={reset} className="btn-secondary">
                <RotateCcw size={16} />
                Xóa
              </button>
            </div>

            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? <p className="text-sm font-bold text-mint">{message}</p> : null}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
              <h2 className="text-xl font-extrabold text-ink">{isTikzOutput ? "Mã TikZ/LaTeX" : "Kết quả LaTeX"}</h2>
              <p className="mt-1 text-sm text-muted">
                {isTikzOutput
                  ? "Mã TikZ là bản nháp hỗ trợ giáo viên vẽ lại hình. Cần kiểm tra vị trí điểm, độ dài, góc, nét đứt và ký hiệu trước khi dùng chính thức."
                  : "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra lại trước khi sử dụng chính thức."}
              </p>
            </div>
            <div className="space-y-5 p-5">
              <textarea
                className="form-field min-h-52 font-mono"
                value={latex}
                onChange={(event) => {
                  setLatex(event.target.value);
                  setDisplayLatex(event.target.value);
                }}
                placeholder={isGeometryMode ? "Mã TikZ/LaTeX sẽ hiển thị ở đây sau khi nhận diện ảnh." : "LaTeX sẽ hiển thị ở đây sau khi nhận diện ảnh."}
              />

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyLatex} disabled={!latex} className="btn-primary disabled:opacity-50">
                  <Copy size={16} />
                  {isTikzOutput ? "Copy TikZ" : "Copy LaTeX"}
                </button>
                <button type="button" onClick={() => download("txt")} disabled={!latex} className="btn-secondary disabled:opacity-50">
                  <Download size={16} />
                  TXT
                </button>
                <button type="button" onClick={() => download("md")} disabled={!latex} className="btn-secondary disabled:opacity-50">
                  <Download size={16} />
                  Markdown
                </button>
                <button type="button" onClick={saveToHistory} disabled={!latex} className="btn-secondary disabled:opacity-50">
                  <Save size={16} />
                  Lưu lịch sử
                </button>
              </div>

              {provider || confidence || explanation || warnings.length ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-900">
                  {provider ? <p><span className="font-bold">Nguồn tạo:</span> {provider}</p> : null}
                  {confidence ? <p><span className="font-bold">Độ tin cậy:</span> {confidence}</p> : null}
                  {explanation ? <p><span className="font-bold">Ghi chú:</span> {explanation}</p> : null}
                  {warnings.length ? (
                    <ul className="mt-2 list-disc pl-5">
                      {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <div>
                <p className="label">{isTikzOutput ? "Bản xem trước hình vẽ" : "Preview nếu LaTeX render được"}</p>
                <div className="mt-2 min-h-36 overflow-auto rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-5 text-center text-xl shadow-inner">
                  {!latex ? (
                    <p className="text-sm text-muted">{isGeometryMode ? "Chưa có mã TikZ để xem trước." : "Chưa có LaTeX để preview."}</p>
                  ) : isTikzOutput ? (
                    <div className="text-left text-sm leading-6 text-slate-700">
                      <p className="font-bold text-ink">TikZ cần được biên dịch bằng LaTeX để xem hình hoàn chỉnh.</p>
                      <p className="mt-1 text-muted">Soạn Lab đã tạo mã TikZ bên trên. Hãy copy vào tài liệu LaTeX có gói TikZ hoặc dùng bản standalone nếu có.</p>
                      {tikzCode ? <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100">{tikzCode}</pre> : null}
                      {standaloneLatex ? <details className="mt-3 rounded-2xl border border-blue-100 bg-white p-3"><summary className="cursor-pointer font-bold text-blue-700">Xem standalone LaTeX</summary><pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100">{standaloneLatex}</pre></details> : null}
                    </div>
                  ) : preview.error ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-800">
                      <p className="font-bold">LaTeX cần kiểm tra trước khi render.</p>
                      <p className="mt-1">{preview.error}</p>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: preview.html }} />
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
