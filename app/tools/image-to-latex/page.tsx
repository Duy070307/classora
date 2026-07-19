"use client";

import { Copy, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import { Sidebar } from "@/components/Sidebar";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { SourceModeTabs } from "@/components/tools/WorkflowNavigation";
import { SaveToTikzBankButton } from "@/components/tikz/SaveToTikzBankButton";
import { TikzReviewWorkspace } from "@/components/tikz/TikzReviewWorkspace";
import { TikzUploadState } from "@/components/tikz/TikzUploadState";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import { createDocument, saveDocument } from "@/lib/history";
import { saveRecentTool } from "@/lib/recent-tools";
import type { TikzDiagramDraft } from "@/lib/tikz/types";
import { normalizeLegacyTikzDraft } from "@/lib/tikz/model";
import { createDraftFromDescription } from "@/lib/tikz/description";
import { getStorageMode } from "@/lib/data/storage-mode";
import { fileToPrivateDataUrl, privateTikzAssetUrl, uploadPrivateTikzAsset } from "@/lib/tikz/private-assets";

type Mode = "auto" | "formula" | "geometry";

type GeometryDiagnosticUi = {
  labels: string[];
  pointOnSegment: Array<{ relation: string; passed: boolean }>;
    perpendicular: Array<{ relation: string; passed: boolean }>;
    intersections?: Array<{ relation: string; passed: boolean }>;
    basic?: Array<{ relation: string; passed: boolean }>;
  warnings: string[];
  valid: boolean;
};

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
  geometryDiagnostic?: GeometryDiagnosticUi;
  geometryStructure?: unknown;
  diagramType?: string;
  diagramConfidence?: number;
  diagramStatus?: "valid" | "draft_with_warnings" | "invalid";
  retryCount?: number;
  fallbackUsed?: boolean;
  detectedStructure?: unknown;
  diagramValidation?: {
    valid: boolean;
    status: "valid" | "draft_with_warnings" | "invalid";
    warnings: string[];
    missingComponents: string[];
    failureReasons: string[];
    detected: { lines: number; points: number; axes: number; curves: number; guides: number; labels: number };
    generated: { lines: number; points: number; axes: number; curves: number; guides: number; labels: number };
  };
  tikzDraft?: TikzDiagramDraft;
} | {
  ok: false;
  error: string;
};

const modes: Array<{ value: Mode; label: string }> = [
  { value: "auto", label: "Tự động" },
  { value: "formula", label: "Công thức → LaTeX" },
  { value: "geometry", label: "Hình học → TikZ" },
];

const maxSize = 10 * 1024 * 1024;

export default function ImageToLatexPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "auto";
    const nextMode = new URLSearchParams(window.location.search).get("mode");
    return nextMode === "formula" || nextMode === "geometry" || nextMode === "auto" ? nextMode : "auto";
  });
  const [latex, setLatex] = useState("");
  const [displayLatex, setDisplayLatex] = useState("");
  const [outputType, setOutputType] = useState<"latex" | "tikz">("latex");
  const [tikzCode, setTikzCode] = useState("");
  const [standaloneLatex, setStandaloneLatex] = useState("");
  const [explanation, setExplanation] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | "">("");
  const [geometryDiagnostic, setGeometryDiagnostic] = useState<GeometryDiagnosticUi>();
  const [geometryStructure, setGeometryStructure] = useState<unknown>();
  const [diagramDiagnostic, setDiagramDiagnostic] = useState<{ type?: string; confidence?: number; status?: "valid" | "draft_with_warnings" | "invalid"; retryCount?: number; fallbackUsed?: boolean; structure?: unknown; validation?: Extract<ApiResult, { ok: true }>["diagramValidation"] }>({});
  const [tikzDraft, setTikzDraft] = useState<TikzDiagramDraft>();
  const [rotation, setRotation] = useState<-90 | 0 | 90 | 180>(0);
  const [enhanceContrast, setEnhanceContrast] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const [perspectiveCorrection, setPerspectiveCorrection] = useState(false);
  const [deskew, setDeskew] = useState(false);
  const [grayscale, setGrayscale] = useState(true);
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [lineEnhancement, setLineEnhancement] = useState(true);
  const [historyDocumentId, setHistoryDocumentId] = useState("");
  const [manualSource, setManualSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const isGeometryMode = mode === "geometry";
  const isTikzOutput = outputType === "tikz" || isGeometryMode;

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const image = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"))?.getAsFile();
      if (image) pickFile(new File([image], `anh-dan-${Date.now()}.${image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg"}`, { type: image.type }));
    }
    window.addEventListener("paste", handlePaste); return () => window.removeEventListener("paste", handlePaste);
  });

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const pending = sessionStorage.getItem("soanlab:tikz-open"); if (!pending) return;
        sessionStorage.removeItem("soanlab:tikz-open"); const raw = JSON.parse(pending) as Record<string, unknown>; const draft = normalizeLegacyTikzDraft(raw);
        if (typeof raw.historyDocumentId === "string") setHistoryDocumentId(raw.historyDocumentId);
        if (draft.source.localDataUrl) setPreviewUrl(draft.source.localDataUrl); else if (draft.source.sourceAsset?.id) setPreviewUrl(privateTikzAssetUrl(draft.source.sourceAsset.id));
        setMode("geometry"); setOutputType("tikz"); setTikzDraft(draft); setTikzCode(draft.tikz.snippet); setLatex(draft.tikz.snippet); setDisplayLatex(draft.tikz.snippet); setStandaloneLatex(draft.tikz.standalone); setWarnings(draft.validation.warnings);
      } catch { /* Bỏ qua dữ liệu phiên cũ không hợp lệ. */ }
    });
  }, []);

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

  function friendlyError(raw: string) {
    if (/gemini|openai|provider|model|api|key|supabase|database|fallback|local/i.test(raw)) {
      return "SOẠN LAB chưa xử lý được ảnh lúc này. Vui lòng thử lại sau.";
    }
    return raw || "SOẠN LAB chưa xử lý được ảnh lúc này. Vui lòng thử lại sau.";
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
      setError("Ảnh quá lớn. Vui lòng dùng ảnh tối đa 10MB.");
      return;
    }
    setLatex("");
    setDisplayLatex("");
    setTikzCode("");
    setStandaloneLatex("");
    setTikzDraft(undefined);
    setWarnings([]);
    setExplanation("");
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
      formData.set("rotation", String(rotation));
      formData.set("contrast", enhanceContrast ? "enhanced" : "normal");
      formData.set("useOriginal", String(useOriginal));
      formData.set("perspectiveCorrection", String(perspectiveCorrection));
      formData.set("deskew", String(deskew));
      formData.set("grayscale", String(grayscale));
      formData.set("thresholdMode", adaptiveThreshold ? "adaptive" : "none");
      formData.set("denoise", String(denoise));
      formData.set("lineEnhancement", String(lineEnhancement));
      const response = await fetch("/api/ai/image-to-latex", {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as ApiResult;
      if (!result.ok) {
        setError(friendlyError(result.error));
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
      setGeometryDiagnostic(result.geometryDiagnostic);
      setGeometryStructure(result.geometryStructure);
      setDiagramDiagnostic({ type: result.diagramType, confidence: result.diagramConfidence, status: result.diagramStatus, retryCount: result.retryCount, fallbackUsed: result.fallbackUsed, structure: result.detectedStructure, validation: result.diagramValidation });
      setTikzDraft(result.tikzDraft);
      saveRecentTool({ title: "Ảnh công thức & hình học → LaTeX/TikZ", href: "/tools/image-to-latex" });
      showMessage(mode === "geometry"
        ? result.diagramStatus === "draft_with_warnings" ? "Đã tạo bản nháp TikZ cần rà soát." : "Đã chuyển ảnh thành TikZ."
        : "Đã chuyển ảnh thành LaTeX.");
    } catch {
      setError("SOẠN LAB chưa xử lý được ảnh lúc này. Vui lòng thử lại sau.");
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
    setGeometryDiagnostic(undefined);
    setGeometryStructure(undefined);
    setDiagramDiagnostic({});
    setTikzDraft(undefined);
    setRotation(0);
    setEnhanceContrast(false);
    setUseOriginal(false);
    setPerspectiveCorrection(false);
    setDeskew(false);
    setGrayscale(true);
    setAdaptiveThreshold(false);
    setDenoise(false);
    setLineEnhancement(true);
    setHistoryDocumentId("");
    setManualSource("");
    setError("");
    setMessage("");
  }

  async function copyStandaloneLatex() {
    await navigator.clipboard.writeText(standaloneLatex);
    showMessage("Đã copy standalone LaTeX.");
  }

  function updateTikzDraft(next: TikzDiagramDraft) {
    setTikzDraft(next);
    setTikzCode(next.tikz.snippet);
    setLatex(next.tikz.snippet);
    setDisplayLatex(next.tikz.snippet);
    setStandaloneLatex(next.tikz.standalone);
    setWarnings(next.validation.warnings);
  }

  function openManualSource() {
    const value = manualSource.trim();
    if (!value) return setError("Vui lòng nhập mô tả hình hoặc mã TikZ.");
    const draft = /\\begin\{tikzpicture\}|\\draw\b/.test(value)
      ? normalizeLegacyTikzDraft({ content: value, title: "Mã TikZ nhập thủ công" }, value)
      : createDraftFromDescription(value);
    setMode("geometry"); setOutputType("tikz"); updateTikzDraft(draft); setError(""); showMessage("Đã mở bản nháp trong trình rà soát TikZ.");
  }

  function download(extension: "txt" | "md" | "tex") {
    const body = extension === "tex"
      ? standaloneLatex || latex
      : extension === "md"
      ? `# Ảnh công thức → LaTeX\n\n## ${isTikzOutput ? "TikZ/LaTeX" : "LaTeX"}\n\n\`\`\`latex\n${latex}\n\`\`\`\n\n${standaloneLatex ? `## Standalone LaTeX\n\n\`\`\`latex\n${standaloneLatex}\n\`\`\`\n\n` : ""}${explanation ? `## Ghi chú\n\n${explanation}\n` : ""}`
      : latex;
    const blob = new Blob([body], { type: extension === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${isTikzOutput ? "soan-lab-image-to-tikz" : "soan-lab-image-to-latex"}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function dataUrlBlob(value: string) { return fetch(value).then((response) => response.blob()); }

  async function saveToHistory() {
    const title = isTikzOutput ? "Ảnh hình học → TikZ" : "Ảnh công thức → LaTeX";
    const content = isTikzOutput
      ? latex
      : [
        `# ${title}`,
        "",
        "```latex",
        latex,
        "```",
        explanation ? `\nGhi chú: ${explanation}` : "",
      ].filter(Boolean).join("\n");
    const document = createDocument(title, isTikzOutput ? "image-to-tikz" : "image-to-latex", content); if (historyDocumentId) document.id = historyDocumentId;
    const savedDraft = tikzDraft ? structuredClone(tikzDraft) : undefined;
    if (isTikzOutput && savedDraft && file && !savedDraft.source.sourceAsset?.id && !savedDraft.source.localDataUrl) {
      const mode = await getStorageMode(); const privateAsset = mode.mode === "cloud" ? await uploadPrivateTikzAsset(file, "source") : null;
      if (privateAsset) { savedDraft.source.sourceAsset = privateAsset; savedDraft.source.sourceAssetId = privateAsset.id; savedDraft.source.sourceAvailable = true; }
      else if (mode.mode === "local") { savedDraft.source.localDataUrl = await fileToPrivateDataUrl(file); savedDraft.source.sourceAvailable = true; }
      else { savedDraft.source.sourceAvailable = false; setMessage("Chưa lưu được ảnh nguồn riêng tư; mã và bản xem trước vẫn được giữ. Cần áp dụng cấu hình lưu trữ TikZ trước khi dùng production."); }
    }
    if (savedDraft?.source.sourceAsset?.id && savedDraft.confirmedAsset) {
      const assetId = savedDraft.source.sourceAsset.id;
      if (savedDraft.confirmedAsset.svgDataUrl && !savedDraft.confirmedAsset.svgAssetId) savedDraft.confirmedAsset.svgAssetId = (await uploadPrivateTikzAsset(await dataUrlBlob(savedDraft.confirmedAsset.svgDataUrl), "svg", assetId))?.id;
      if (savedDraft.confirmedAsset.pngDataUrl && !savedDraft.confirmedAsset.pngAssetId) savedDraft.confirmedAsset.pngAssetId = (await uploadPrivateTikzAsset(await dataUrlBlob(savedDraft.confirmedAsset.pngDataUrl), "png", assetId))?.id;
    }
    saveDocument({
      ...document,
      tikzDiagramDraft: isTikzOutput ? savedDraft : undefined,
      diagramAssets: savedDraft?.confirmedAsset ? [savedDraft.confirmedAsset] : undefined,
      generationMeta: {
        mode: isTikzOutput ? "geometry" : mode,
        confidence: confidence || undefined,
        warnings,
        hasStandaloneLatex: Boolean(standaloneLatex),
        standaloneLatex: isTikzOutput ? standaloneLatex : undefined,
      },
    });
    if (savedDraft) { setTikzDraft(savedDraft); if (!historyDocumentId) setHistoryDocumentId(document.id); }
    showMessage(savedDraft?.source.sourceAvailable === false ? "Đã lưu mã; ảnh nguồn chưa được lưu dài hạn." : "Đã lưu vào lịch sử.");
  }

  const hasOutput = Boolean(latex.trim() || tikzDraft);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-[1280px]">
        <PageHeader
          title="Ảnh công thức & hình học → LaTeX/TikZ"
          description="Upload ảnh công thức hoặc hình học đã cắt gọn, Soạn Lab sẽ chuyển thành mã LaTeX hoặc TikZ có thể sao chép."
          category="Công thức & LaTeX"
          iconName="latex"
          exportable={false}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">Beta</span>
        </div>

        <section className="mb-5 border-y border-slate-200 bg-white py-3">
          <span className="label">Chế độ nhận diện</span>
          <SourceModeTabs value={mode} onChange={(value) => setMode(value as Mode)} items={modes.map((item) => ({ id: item.value, label: item.label }))} label="Chế độ nhận diện ảnh" />
        </section>

        {!previewUrl && !hasOutput ? (
          <TikzUploadState
            onFile={pickFile}
            onPasteHelp={() =>
              showMessage("Nhấn Ctrl+V để dán ảnh từ clipboard.")
            }
            manualSource={manualSource}
            onManualSourceChange={setManualSource}
            onOpenManualSource={openManualSource}
            geometryMode={isGeometryMode}
          />
        ) : null}

        {previewUrl || hasOutput ? (
        <div className={`grid gap-6 ${previewUrl && !hasOutput ? "" : "grid-cols-1"}`}>
          {previewUrl && !hasOutput ? <section className="tool-form-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Ảnh đã chọn</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Kiểm tra hướng ảnh và thiết lập xử lý trước khi nhận dạng.
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={reset}>
                <RotateCcw size={16} /> Chọn ảnh khác
              </button>
            </div>
            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-black text-slate-800">
                Mẹo để nhận diện tốt hơn
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cắt sát phần hình, dùng ảnh rõ và tránh để lẫn đề bài, đáp án hoặc nhiều hình trong cùng một ảnh.
              </p>
            </details>

            {previewUrl ? (
              <div className="overflow-hidden rounded-xl border border-blue-100 bg-white p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setRotation((rotation === -90 ? 180 : rotation - 90) as -90 | 0 | 90 | 180)}>Xoay trái</button>
                  <button type="button" className="btn-secondary" onClick={() => setRotation((rotation === 180 ? -90 : rotation + 90) as -90 | 0 | 90 | 180)}>Xoay phải</button>
                  <button type="button" className={`btn-secondary ${enhanceContrast ? "ring-2 ring-blue-500" : ""}`} onClick={() => setEnhanceContrast((value) => !value)}>Tăng tương phản</button>
                  <button type="button" className={`btn-secondary ${deskew ? "ring-2 ring-blue-500" : ""}`} onClick={() => setDeskew((value) => !value)}>Tự sửa nghiêng</button>
                  <button type="button" className={`btn-secondary ${perspectiveCorrection ? "ring-2 ring-blue-500" : ""}`} onClick={() => setPerspectiveCorrection((value) => !value)}>Cắt biên ảnh</button>
                  <button type="button" className={`btn-secondary ${adaptiveThreshold ? "ring-2 ring-blue-500" : ""}`} onClick={() => setAdaptiveThreshold((value) => !value)}>Ảnh photocopy</button>
                  <button type="button" className={`btn-secondary ${denoise ? "ring-2 ring-blue-500" : ""}`} onClick={() => setDenoise((value) => !value)}>Giảm nhiễu</button>
                  <button type="button" className={`btn-secondary ${lineEnhancement ? "ring-2 ring-blue-500" : ""}`} onClick={() => setLineEnhancement((value) => !value)}>Giữ nét mảnh</button>
                  <button type="button" className={`btn-secondary ${grayscale ? "ring-2 ring-blue-500" : ""}`} onClick={() => setGrayscale((value) => !value)}>Thang xám</button>
                  <button type="button" className={`btn-secondary ${useOriginal ? "ring-2 ring-blue-500" : ""}`} onClick={() => setUseOriginal((value) => !value)}>Dùng ảnh gốc</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><p className="mb-2 text-xs font-black text-slate-600">Ảnh gốc</p><div className="relative h-64 w-full"><Image src={previewUrl} alt="Ảnh gốc đã tải lên" fill className="rounded-2xl object-contain" unoptimized /></div></div>
                  <div><p className="mb-2 text-xs font-black text-slate-600">Ảnh sẽ xử lý</p><div className="relative h-64 w-full"><Image src={previewUrl} alt="Ảnh sau thiết lập xử lý" fill className="rounded-2xl object-contain" unoptimized style={{ transform: `rotate(${rotation}deg)`, filter: useOriginal ? "none" : `grayscale(1) contrast(${enhanceContrast ? 1.35 : 1.12})` }} /></div></div>
                </div>
              </div>
            ) : null}

            {busy ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4" role="status" aria-live="polite">
                <p className="font-bold text-blue-950">Đang xử lý ảnh</p>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  Đang nhận dạng · Đang dựng hình · Đang kiểm tra
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={generate} disabled={busy} className="btn-primary sm:min-w-52 disabled:opacity-60">
                <Sparkles size={16} />
                {busy ? "Đang nhận dạng…" : isGeometryMode ? "Nhận dạng hình" : "Chuyển thành LaTeX"}
              </button>
              <p className="text-sm font-semibold leading-6 text-slate-600">
                Kết quả là bản nháp; giáo viên cần rà soát trước khi sử dụng.
              </p>
            </div>

            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? <p className="text-sm font-bold text-mint">{message}</p> : null}
          </section> : null}

          {hasOutput ? <section className="card overflow-hidden">
            <div className="border-b border-cyan-100 border-l-2 border-l-cyan-600 bg-cyan-50/40 px-5 py-4">
              <h2 className="text-xl font-extrabold text-ink">{isTikzOutput ? "Mã TikZ" : "Kết quả LaTeX"}</h2>
              <p className="mt-1 text-sm text-muted">
                {isTikzOutput
                  ? "Mã TikZ là bản nháp hỗ trợ giáo viên vẽ lại hình. Cần kiểm tra vị trí điểm, độ dài, góc, nét đứt và ký hiệu trước khi dùng chính thức."
                  : "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra lại trước khi sử dụng chính thức."}
              </p>
            </div>
            <div className="space-y-5 p-5">
              {isTikzOutput && tikzDraft ? (
                <TikzReviewWorkspace key={tikzDraft.id} draft={tikzDraft} sourceUrl={previewUrl} onChange={updateTikzDraft} />
              ) : <div>
                <label className="label">{isTikzOutput ? "Mã TikZ" : "LaTeX"}</label>
                <textarea
                  className="form-field mt-1 min-h-52 font-mono"
                  value={latex}
                  onChange={(event) => {
                    setLatex(event.target.value);
                    setDisplayLatex(event.target.value);
                    if (isTikzOutput) setTikzCode(event.target.value);
                  }}
                  placeholder={isGeometryMode ? "Mã TikZ sẽ hiển thị ở đây sau khi nhận diện ảnh." : "LaTeX sẽ hiển thị ở đây sau khi nhận diện ảnh."}
                />
              </div>}

              {isTikzOutput && !tikzDraft ? (
                <div>
                  <label className="label">LaTeX standalone</label>
                  <textarea
                    className="form-field mt-1 min-h-52 font-mono"
                    value={standaloneLatex}
                    onChange={(event) => setStandaloneLatex(event.target.value)}
                    placeholder="Tài liệu .tex standalone hợp lệ sẽ hiển thị ở đây."
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={copyLatex} className={isTikzOutput ? "btn-secondary" : "btn-primary"}>
                  <Copy size={16} />
                  {isTikzOutput ? "Sao chép mã" : "Sao chép LaTeX"}
                </button>
                <ActionMenu
                  label="Xuất"
                  items={[
                    ...(isTikzOutput && standaloneLatex
                      ? [
                          {
                            label: "Sao chép LaTeX standalone",
                            onSelect: copyStandaloneLatex,
                          },
                          {
                            label: "Tải tệp TEX",
                            onSelect: () => download("tex"),
                          },
                        ]
                      : []),
                    { label: "Tải tệp TXT", onSelect: () => download("txt") },
                    { label: "Tải Markdown", onSelect: () => download("md") },
                  ]}
                />
                <ActionMenu
                  label="Lưu"
                  items={[
                    { label: "Lưu vào lịch sử", onSelect: saveToHistory },
                    ...(isTikzOutput
                      ? [
                          {
                            label: "Lưu vào Ngân hàng TikZ",
                            onSelect: () => setBankDialogOpen(true),
                          },
                        ]
                      : []),
                  ]}
                />
                {isTikzOutput ? <SaveToTikzBankButton tikzCode={tikzCode || latex} fullLatex={standaloneLatex} draft={tikzDraft} open={bankDialogOpen} onOpenChange={setBankDialogOpen} hideTrigger /> : null}
                <button type="button" onClick={reset} className="btn-secondary">
                  <RotateCcw size={16} /> Làm lại
                </button>
              </div>

              {explanation || warnings.length ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-900">
                  <p className="font-bold">Vui lòng rà soát trước khi sử dụng</p>
                  {explanation ? <p><span className="font-bold">Ghi chú:</span> {explanation}</p> : null}
                  {warnings.length ? (
                    <ul className="mt-2 list-disc pl-5">
                      {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {geometryDiagnostic ? (
                <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <summary className="cursor-pointer font-bold text-slate-900">Kiểm tra quan hệ hình học</summary>
                  <p className="mt-3"><span className="font-semibold">Nhãn phát hiện:</span> {geometryDiagnostic.labels.join(", ")}</p>
                  {[...(geometryDiagnostic.basic || []), ...geometryDiagnostic.pointOnSegment, ...geometryDiagnostic.perpendicular, ...(geometryDiagnostic.intersections || [])].map((item) => (
                    <p key={item.relation} className="mt-1">{item.passed ? "✓" : "✕"} {item.relation}</p>
                  ))}
                  {geometryDiagnostic.warnings.map((warning) => <p key={warning} className="mt-1 text-amber-700">• {warning}</p>)}
                  {geometryStructure ? <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(geometryStructure, null, 2)}</pre> : null}
                </details>
              ) : null}

              {process.env.NODE_ENV === "development" && diagramDiagnostic.type ? (
                <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <summary className="cursor-pointer font-bold text-slate-900">Chẩn đoán cấu trúc sơ đồ</summary>
                  <p className="mt-3">Loại: {diagramDiagnostic.type} · Độ tin cậy: {Math.round((diagramDiagnostic.confidence || 0) * 100)}%</p>
                  <p>Phát hiện: {JSON.stringify(diagramDiagnostic.validation?.detected || {})}</p>
                  <p>Đã sinh: {JSON.stringify(diagramDiagnostic.validation?.generated || {})}</p>
                  <p>Trạng thái: {diagramDiagnostic.status === "valid" ? "Đạt" : diagramDiagnostic.status === "draft_with_warnings" ? "Bản nháp cần rà soát" : "Không hợp lệ"}</p>
                  <p>Số lần thử lại: {diagramDiagnostic.retryCount || 0} · Fallback: {diagramDiagnostic.fallbackUsed ? "Có" : "Không"}</p>
                  {diagramDiagnostic.validation?.missingComponents.length ? <p>Thiếu: {diagramDiagnostic.validation.missingComponents.join(", ")}</p> : null}
                  {diagramDiagnostic.validation?.failureReasons.length ? <p>Lý do chặn: {diagramDiagnostic.validation.failureReasons.join(", ")}</p> : null}
                  {diagramDiagnostic.structure ? <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(diagramDiagnostic.structure, null, 2)}</pre> : null}
                </details>
              ) : null}

              {isTikzOutput && tikzDraft ? null : <div>
                <p className="label">{isTikzOutput ? "Bản xem trước hình vẽ" : "Preview nếu LaTeX render được"}</p>
                <div className="mt-2 min-h-36 overflow-auto rounded-xl border border-cyan-200 bg-white p-5 text-center text-xl">
                  {!latex ? (
                    <p className="text-sm text-muted">{isGeometryMode ? "Chưa có mã TikZ để xem trước." : "Chưa có LaTeX để preview."}</p>
                  ) : isTikzOutput ? (
                    <div className="text-left text-sm leading-6 text-slate-700">
                      <p className="font-bold text-ink">Bản xem trước TikZ trực tiếp sẽ được hỗ trợ sau.</p>
                      <p className="mt-1 text-muted">Hiện tại có thể sao chép mã để dùng trong Overleaf hoặc LaTeX editor. Gợi ý: dùng nút tải `.tex`, mở trong Overleaf để kiểm tra hình vẽ trước khi đưa vào tài liệu.</p>
                      {tikzCode ? <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100">{tikzCode}</pre> : null}
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
              </div>}
            </div>
          </section> : null}
        </div>
        ) : null}
        {error && !previewUrl ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {message && !previewUrl ? <p className="mt-4 text-sm font-semibold text-blue-700">{message}</p> : null}
        </div>
      </main>
    </div>
  );
}
