"use client";
/* eslint-disable @next/next/no-img-element -- Ảnh do giáo viên tải lên là data URL cục bộ và cần giữ nguyên tỷ lệ. */
/* eslint-disable react-hooks/rules-of-hooks -- useDocument là callback chọn tài liệu, không phải React hook. */

import katex from "katex";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Download, Eye, EyeOff, FileText, FileUp, ImagePlus, LoaderCircle, Plus, Presentation, Redo2, Save, Sparkles, Trash2, Undo2 } from "lucide-react";
import { createSlideOutline, duplicateOutlineSlide } from "@/lib/lesson-slides/outline";
import { defaultSlideSettings, densityWarnings, makeStableId, normalizeDeck, normalizeSlideCount, validateDeckForExport } from "@/lib/lesson-slides/normalize";
import { downloadLessonSlidesPptx } from "@/lib/lesson-slides/pptx";
import { LESSON_SLIDES_SOURCE_KEY, sourceFromDocument, sourceTypeLabel } from "@/lib/lesson-slides/source";
import { getSlideTheme, slideThemes } from "@/lib/lesson-slides/themes";
import type { Slide, SlideBlock, SlideDeck, SlideGenerationSettings, SlideSource, SlideSourceType, SlideType } from "@/lib/lesson-slides/types";
import { createDocument, getHistory, saveDocument } from "@/lib/history";
import { getCloudDocument, listCloudDocuments } from "@/lib/data/documents-store";
import type { GeneratedDocument } from "@/lib/types";
import { canUseAIGeneration, getAILimitMessage, incrementAIUsage } from "@/lib/ai/usage-limit";
import { openWorksheetGenerator } from "@/lib/worksheet/session";
import { openReviewPack } from "@/lib/review-pack/session";
import { openLessonPlanGenerator } from "@/lib/lesson-plan/session";

type Stage = "source" | "outline" | "editor";
const sourceModes: Array<{ value: SlideSourceType; label: string }> = [
  { value: "manual", label: "Nhập chủ đề" }, { value: "lesson_plan", label: "Từ giáo án" }, { value: "document", label: "Từ tài liệu" }, { value: "saved_content", label: "Từ nội dung đã lưu" },
];
const slideTypes: SlideType[] = ["cover", "objectives", "warm_up", "section", "content", "two_column", "example", "formula", "figure", "table", "question", "practice", "activity", "summary", "homework", "end"];
const typeLabels: Record<SlideType, string> = { cover: "Trang bìa", objectives: "Mục tiêu", warm_up: "Khởi động", section: "Phân đoạn", content: "Nội dung", two_column: "Hai cột", example: "Ví dụ", formula: "Công thức", figure: "Hình vẽ", table: "Bảng", question: "Câu hỏi", practice: "Luyện tập", activity: "Hoạt động", summary: "Tổng kết", homework: "Bài tập về nhà", end: "Kết thúc" };

function mergeHistory(local: GeneratedDocument[], cloud: GeneratedDocument[]) {
  return [...new Map([...cloud, ...local].map((item) => [item.id, item])).values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function documentForDeck(deck: SlideDeck): GeneratedDocument {
  const base = createDocument(deck.title, "lesson-slides", deck.slides.map((slide) => `${slide.order}. ${slide.title || "Slide"}`).join("\n"));
  return { ...base, id: deck.id || base.id, slideDeck: { ...deck, id: deck.id || base.id }, generationMeta: { subject: deck.subject, grade: deck.grade, topic: deck.topic, source: deck.metadata.sourceType, slideCount: deck.slides.length, themeId: deck.themeId, aspectRatio: deck.aspectRatio, exportStatus: deck.metadata.exportStatus } };
}

function blockText(block: SlideBlock) {
  if (block.type === "bullets") return block.content.join("\n");
  if (block.type === "table") return [block.headers.join(" | "), ...block.rows.map((row) => row.join(" | "))].join("\n");
  if (block.type === "process") return block.steps.join("\n");
  if (block.type === "formula") return block.latex;
  if (block.type === "tikz") return block.tikz;
  return block.content;
}

function updateBlockText(block: SlideBlock, value: string): SlideBlock {
  if (block.type === "bullets") return { ...block, content: value.split(/\n/).map((item) => item.trim()).filter(Boolean) };
  if (block.type === "table") { const rows = value.split(/\n/).map((line) => line.split("|").map((item) => item.trim())); return { ...block, headers: rows[0] || [], rows: rows.slice(1), content: "Bảng nội dung" }; }
  if (block.type === "process") return { ...block, steps: value.split(/\n/).map((item) => item.trim()).filter(Boolean) };
  if (block.type === "formula") return { ...block, latex: value, content: value };
  if (block.type === "tikz") return { ...block, tikz: value, content: "Hình TikZ" };
  return { ...block, content: value };
}

export function LessonSlidesWorkspace() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("source");
  const [mode, setMode] = useState<SlideSourceType>("manual");
  const [settings, setSettings] = useState<SlideGenerationSettings>(defaultSlideSettings);
  const [source, setSource] = useState<SlideSource>({ type: "manual", title: "", text: "", confirmed: true });
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [deck, setDeck] = useState<SlideDeck | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [undo, setUndo] = useState<SlideDeck[]>([]);
  const [regenTarget, setRegenTarget] = useState<Slide | null>(null);
  const loadedRef = useRef(false);
  const autosaveReady = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const local = getHistory();
    setDocuments(local);
    void listCloudDocuments().then((cloud) => { if (cloud) setDocuments(mergeHistory(local, cloud)); });
    const historyId = searchParams.get("history");
    if (historyId) {
      const found = local.find((item) => item.id === historyId);
      const apply = (item: GeneratedDocument | null | undefined) => { if (item?.slideDeck) { setDeck(normalizeDeck(item.slideDeck)); setSelectedId(item.slideDeck.slides[0]?.id || ""); setStage("editor"); autosaveReady.current = true; } };
      if (found) apply(found); else void getCloudDocument(historyId).then(apply);
      return;
    }
    const raw = sessionStorage.getItem(LESSON_SLIDES_SOURCE_KEY);
    if (raw) {
      sessionStorage.removeItem(LESSON_SLIDES_SOURCE_KEY);
      try { const value = JSON.parse(raw) as { source?: SlideSource; settings?: Partial<SlideGenerationSettings> }; queueMicrotask(() => { if (value.source) { setSource(value.source); setMode(value.source.type); } if (value.settings) setSettings((current) => ({ ...current, ...value.settings })); }); } catch { /* bỏ qua dữ liệu phiên không hợp lệ */ }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!deck || !autosaveReady.current || stage !== "editor") return;
    const timeout = setTimeout(() => saveDocument(documentForDeck(deck)), 900);
    return () => clearTimeout(timeout);
  }, [deck, stage]);

  const selected = deck?.slides.find((slide) => slide.id === selectedId) || deck?.slides[0];
  const theme = getSlideTheme(deck?.themeId || settings.themeId);
  const validation = useMemo(() => deck ? validateDeckForExport(deck, "student") : null, [deck]);

  function updateSettings<K extends keyof SlideGenerationSettings>(key: K, value: SlideGenerationSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); }
  function useDocument(document: GeneratedDocument) {
    const next = sourceFromDocument(document);
    setSource(next);
    setMode(document.type === "lesson-plan" ? "lesson_plan" : "saved_content");
    setSettings((current) => ({
      ...current,
      subject: document.examMeta?.subject || document.generationMeta?.subject || current.subject,
      grade: document.examMeta?.grade || document.generationMeta?.grade || current.grade,
      topic: document.examMeta?.topic || document.generationMeta?.topic || document.title,
      purpose: document.type === "worksheet" ? "solution" : document.type === "exam" ? "review" : current.purpose,
      objectives: next.extracted?.objectives?.join("\n") || current.objectives,
      keyKnowledge: next.extracted?.stages?.join("\n") || current.keyKnowledge,
    }));
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/lesson-slides/parse", { method: "POST", body: form });
      const data = await response.json() as { ok?: boolean; source?: SlideSource; error?: string; maintenance?: boolean };
      if (data.maintenance) return window.location.assign("/maintenance");
      if (!response.ok || !data.source) throw new Error(data.error || "Chưa thể đọc tài liệu.");
      setSource(data.source); setMode(data.source.type === "existing_presentation" ? "document" : data.source.type); setMessage("Đã đọc tài liệu. Hãy kiểm tra cấu trúc trước khi tạo dàn ý.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể đọc tài liệu."); } finally { setBusy(false); }
  }
  function makeOutline() {
    const manualText = [settings.objectives, settings.keyKnowledge, settings.additionalNotes].filter(Boolean).join("\n");
    const resolved = mode === "manual" ? { type: "manual" as const, title: settings.topic, text: manualText, confirmed: true } : source;
    if (!settings.topic.trim() && !resolved.title.trim()) return setMessage("Vui lòng nhập chủ đề bài học hoặc chọn một nội dung nguồn.");
    if (resolved.confirmed === false) return setMessage("Tài liệu vẫn còn nội dung chưa được xác nhận. Vui lòng hoàn tất rà soát trước khi tạo slide.");
    const next = createSlideOutline({ ...settings, slideCount: normalizeSlideCount(settings.slideCount), topic: settings.topic || resolved.title, objectives: settings.objectives || resolved.extracted?.objectives?.join("\n") || "", keyKnowledge: settings.keyKnowledge || resolved.extracted?.stages?.join("\n") || "" }, resolved);
    next.id = makeStableId("deck");
    setSource(resolved); setDeck(next); setSelectedId(next.slides[0]?.id || ""); setStage("outline"); setMessage("");
  }
  function updateDeck(mutator: (current: SlideDeck) => SlideDeck, teacherEdit = true) {
    setDeck((current) => {
      if (!current) return current;
      if (teacherEdit) setUndo((items) => [...items.slice(-19), current]);
      return normalizeDeck(mutator(current));
    });
  }
  function updateSlide(slideId: string, patch: Partial<Slide>, teacherEdit = true) { updateDeck((current) => ({ ...current, slides: current.slides.map((slide) => slide.id === slideId ? { ...slide, ...patch, teacherEdited: teacherEdit ? true : slide.teacherEdited } : slide) }), teacherEdit); }
  function moveSlide(index: number, direction: -1 | 1) { updateDeck((current) => { const slides = [...current.slides]; const target = index + direction; if (target < 0 || target >= slides.length) return current; [slides[index], slides[target]] = [slides[target], slides[index]]; return { ...current, slides }; }); }
  function deleteSlide(id: string) { updateDeck((current) => ({ ...current, slides: current.slides.filter((slide) => slide.id !== id) })); setSelectedId(deck?.slides.find((slide) => slide.id !== id)?.id || ""); }
  async function requestSlide(slide: Slide, action?: string) {
    if (!canUseAIGeneration()) throw new Error(getAILimitMessage());
    const response = await fetch("/api/lesson-slides/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slide, settings, sourceText: source.text, sourceHash: source.contentHash, sourceConfirmed: source.confirmed, action }) });
    const data = await response.json() as { ok?: boolean; slide?: Slide; error?: string; maintenance?: boolean; cached?: boolean };
    if (data.maintenance) { window.location.assign("/maintenance"); throw new Error("maintenance"); }
    if (!response.ok || !data.slide) throw new Error(data.error || "Slide chưa tạo được nội dung.");
    if (!data.cached) incrementAIUsage();
    return data.slide;
  }
  async function generateDeck() {
    if (!deck) return;
    setStage("editor"); setBusy(true); setMessage(""); autosaveReady.current = false;
    let current = deck;
    let interrupted = "";
    for (let index = 0; index < current.slides.length; index += 1) {
      const outline = current.slides[index];
      setProgress(`Đang tạo slide ${index + 1}/${current.slides.length}`);
      updateSlide(outline.id, { generationStatus: "generating" }, false);
      try {
        const generated = await requestSlide(outline);
        current = normalizeDeck({ ...current, slides: current.slides.map((slide) => slide.id === outline.id ? generated : slide) });
      } catch (error) {
        if (error instanceof Error && error.message === "maintenance") return;
        if (error instanceof Error && error.message === getAILimitMessage()) { interrupted = error.message; break; }
        current = normalizeDeck({ ...current, slides: current.slides.map((slide) => slide.id === outline.id ? { ...slide, generationStatus: "failed", generationError: "Slide này chưa tạo được nội dung. Thầy cô có thể thử lại riêng slide này." } : slide) });
      }
      setDeck(current);
    }
    autosaveReady.current = true; saveDocument(documentForDeck(current)); setBusy(false); setProgress(""); setMessage(interrupted || "Đã tạo xong bản nháp slide. Giáo viên cần rà soát trước khi sử dụng.");
  }
  async function regenerate(slide: Slide, createCopy: boolean) {
    setRegenTarget(null); setBusy(true);
    try {
      const generated = await requestSlide(slide, "regenerate");
      updateDeck((current) => {
        if (!createCopy) return { ...current, slides: current.slides.map((item) => item.id === slide.id ? { ...generated, teacherEdited: false } : item) };
        const index = current.slides.findIndex((item) => item.id === slide.id);
        if (index < 0) return current;
        const copy: Slide = { ...generated, id: makeStableId("slide"), title: `${generated.title || "Slide"} (viết lại)`, blocks: generated.blocks.map((block) => ({ ...block, id: makeStableId("block") })), teacherEdited: false };
        const slides = [...current.slides];
        slides.splice(index + 1, 0, copy);
        return { ...current, slides };
      });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể tạo lại slide."); } finally { setBusy(false); }
  }
  async function exportDeck(audience: "student" | "teacher") {
    if (!deck) return;
    const result = validateDeckForExport(deck, audience);
    if (result.status === "blocked") return setMessage(result.issues.filter((issue) => issue.level === "error").map((issue) => issue.message).join(" "));
    if (result.status === "warning" && !window.confirm("Bản trình chiếu còn cảnh báo về mật độ hoặc nội dung dành cho giáo viên. Vẫn tiếp tục xuất?")) return;
    setBusy(true); setMessage("");
    try { await downloadLessonSlidesPptx(deck, audience); setMessage(`Đã tạo bản ${audience === "student" ? "học sinh" : "giáo viên"}.`); } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể xuất PowerPoint."); } finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <header data-tool-accent="violet" className="rounded-[28px] border border-violet-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-800">Công cụ bài giảng</span><h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">Tạo slide bài giảng</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Tạo dàn ý, rà soát từng slide, chỉnh sửa nội dung và xuất PowerPoint có thể tiếp tục biên tập.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Nội dung là bản nháp hỗ trợ giáo viên và cần được kiểm tra trước khi trình chiếu.</div></div>
      <div className="mt-5 flex flex-wrap gap-2">{(["source", "outline", "editor"] as Stage[]).map((item, index) => <button key={item} type="button" disabled={item === "outline" && !deck || item === "editor" && !deck} onClick={() => setStage(item)} className={`rounded-full px-4 py-2 text-sm font-black ${stage === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{index + 1}. {item === "source" ? "Chọn nội dung" : item === "outline" ? "Kiểm tra dàn ý" : "Chỉnh sửa & xuất"}</button>)}</div>
    </header>
    {message ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">{message}</div> : null}
    {stage === "source" ? <SourceStep mode={mode} setMode={(value) => { setMode(value); setSource((current) => ({ ...current, type: value })); }} settings={settings} updateSettings={updateSettings} source={source} setSource={setSource} documents={documents} useDocument={useDocument} upload={upload} busy={busy} makeOutline={makeOutline} /> : null}
    {stage === "outline" && deck ? <OutlineStep deck={deck} selectedId={selectedId} setSelectedId={setSelectedId} updateSlide={updateSlide} moveSlide={moveSlide} deleteSlide={deleteSlide} updateDeck={updateDeck} busy={busy} generateDeck={generateDeck} /> : null}
    {stage === "editor" && deck ? <><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>openWorksheetGenerator(documentForDeck(deck),"practice")}><FileText size={16}/>Tạo phiếu theo bài trình chiếu</button><button className="btn-secondary" onClick={()=>openWorksheetGenerator(documentForDeck(deck),"solution")}><FileText size={16}/>Tạo phiếu luyện tập</button><button className="btn-secondary" onClick={()=>openLessonPlanGenerator(documentForDeck(deck),"new_lesson")}><FileText size={16}/>Tạo giáo án từ slide</button></div><EditorStep deck={deck} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} theme={theme} validation={validation} updateSlide={updateSlide} updateDeck={updateDeck} deleteSlide={deleteSlide} busy={busy} progress={progress} setRegenTarget={setRegenTarget} exportDeck={exportDeck} save={() => { saveDocument(documentForDeck(deck)); setMessage("Đã lưu slide vào lịch sử."); }} undo={() => { const previous = undo.at(-1); if (previous) { setDeck(previous); setUndo((items) => items.slice(0, -1)); } }} canUndo={Boolean(undo.length)} /></> : null}
    {regenTarget ? <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl"><h2 className="text-xl font-black">Slide này đã được chỉnh sửa</h2><p className="mt-2 text-sm leading-6 text-slate-600">Tạo lại có thể thay thế nội dung hiện tại.</p><div className="mt-5 flex flex-wrap gap-2"><button className="btn-primary" onClick={() => void regenerate(regenTarget, true)}>Tạo bản sao rồi viết lại</button><button className="btn-secondary" onClick={() => void regenerate(regenTarget, false)}>Thay thế nội dung</button><button className="btn-secondary" onClick={() => setRegenTarget(null)}>Hủy</button></div></div></div> : null}
    {stage === "editor" && deck ? <button className="btn-secondary" onClick={() => openReviewPack(documentForDeck(deck))}><FileText size={16}/>Tạo đề cương ôn tập từ slide</button> : null}
  </div>;
}

function SourceStep({ mode, setMode, settings, updateSettings, source, setSource, documents, useDocument, upload, busy, makeOutline }: { mode: SlideSourceType; setMode: (value: SlideSourceType) => void; settings: SlideGenerationSettings; updateSettings: <K extends keyof SlideGenerationSettings>(key: K, value: SlideGenerationSettings[K]) => void; source: SlideSource; setSource: React.Dispatch<React.SetStateAction<SlideSource>>; documents: GeneratedDocument[]; useDocument: (document: GeneratedDocument) => void; upload: (file?: File) => Promise<void>; busy: boolean; makeOutline: () => void }) {
  const eligible = documents.filter((item) => mode === "lesson_plan" ? item.type === "lesson-plan" : ["lesson-plan", "worksheet", "exam", "rubric", "document-recognition", "lesson-slides"].includes(item.type));
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{sourceModes.map((item) => <button key={item.value} type="button" onClick={() => setMode(item.value)} className={`rounded-2xl border px-3 py-3 text-sm font-black ${mode === item.value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}>{item.label}</button>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Môn học"><input className="form-field" value={settings.subject} onChange={(event) => updateSettings("subject", event.target.value)} /></Field><Field label="Khối lớp"><input className="form-field" value={settings.grade} onChange={(event) => updateSettings("grade", event.target.value)} /></Field><Field label="Chủ đề bài học"><input className="form-field" value={settings.topic} onChange={(event) => updateSettings("topic", event.target.value)} /></Field><Field label="Bộ sách (không bắt buộc)"><input className="form-field" value={settings.textbookSeries} onChange={(event) => updateSettings("textbookSeries", event.target.value)} /></Field><Field label="Thời lượng"><input className="form-field" value={settings.duration} onChange={(event) => updateSettings("duration", event.target.value)} /></Field><Field label="Số lượng slide (6–30)"><input type="number" min={6} max={30} className="form-field" value={settings.slideCount} onChange={(event) => updateSettings("slideCount", normalizeSlideCount(event.target.value))} /></Field></div>
    {mode === "manual" ? <div className="mt-4 grid gap-4"><Field label="Mục tiêu bài học"><textarea className="form-field min-h-24" value={settings.objectives} onChange={(event) => updateSettings("objectives", event.target.value)} /></Field><Field label="Kiến thức trọng tâm"><textarea className="form-field min-h-28" value={settings.keyKnowledge} onChange={(event) => updateSettings("keyKnowledge", event.target.value)} placeholder="Mỗi ý trên một dòng" /></Field></div> : null}
    {mode === "document" ? <div className="mt-4 space-y-3"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 font-black text-blue-800"><FileUp size={20}/>{busy ? "Đang đọc tài liệu…" : "Tải DOCX, PDF, PPTX hoặc TXT"}<input type="file" accept=".docx,.pdf,.pptx,.txt" className="hidden" disabled={busy} onChange={(event) => void upload(event.target.files?.[0])}/></label><Field label="Hoặc dán nội dung"><textarea className="form-field min-h-32" value={source.text} onChange={(event) => setSource((current) => ({ ...current, type: "document", title: "Nội dung đã dán", text: event.target.value, confirmed: true }))}/></Field></div> : null}
    {(mode === "lesson_plan" || mode === "saved_content") ? <div className="mt-4"><Field label={mode === "lesson_plan" ? "Chọn giáo án đã lưu" : "Chọn nội dung đã lưu"}><select className="form-field" value={source.sourceDocumentId || ""} onChange={(event) => { const found = documents.find((item) => item.id === event.target.value); if (found) useDocument(found); }}><option value="">Chọn nội dung…</option>{eligible.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field><Field label="Hoặc dán nội dung"><textarea className="form-field mt-3 min-h-32" value={source.text} onChange={(event) => setSource((current) => ({ ...current, type: mode, title: current.title || "Nội dung đã dán", text: event.target.value, confirmed: true }))}/></Field></div> : null}
    {source.text && mode !== "manual" ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black text-emerald-900">Cấu trúc đã đọc từ {sourceTypeLabel(source.type)}</p>{source.extracted?.slideTitles?.length ? <ol className="mt-2 list-decimal pl-5 text-sm text-emerald-900">{source.extracted.slideTitles.slice(0, 12).map((title) => <li key={title}>{title}</li>)}</ol> : <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm leading-6 text-emerald-800">{source.text.slice(0, 1200)}</p>}{source.warnings?.map((warning) => <p key={warning} className="mt-2 text-sm font-bold text-amber-800">{warning}</p>)}</div> : null}
  </section><SettingsPanel settings={settings} updateSettings={updateSettings} makeOutline={makeOutline}/></div>;
}

function SettingsPanel({ settings, updateSettings, makeOutline }: { settings: SlideGenerationSettings; updateSettings: <K extends keyof SlideGenerationSettings>(key: K, value: SlideGenerationSettings[K]) => void; makeOutline: () => void }) { return <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Thiết lập bài trình chiếu</h2><div className="mt-4 space-y-4"><Field label="Mục đích"><select className="form-field" value={settings.purpose} onChange={(event) => updateSettings("purpose", event.target.value as SlideGenerationSettings["purpose"])}><option value="new_lesson">Giảng bài mới</option><option value="review">Ôn tập</option><option value="practice">Luyện tập</option><option value="solution">Chữa bài</option><option value="summary">Tổng kết</option><option value="group_activity">Hoạt động nhóm</option></select></Field><Field label="Mức độ chi tiết"><select className="form-field" value={settings.detailLevel} onChange={(event) => updateSettings("detailLevel", event.target.value as SlideGenerationSettings["detailLevel"])}><option value="summary">Tóm tắt</option><option value="standard">Tiêu chuẩn</option><option value="detailed">Chi tiết</option></select></Field><Field label="Đối tượng"><select className="form-field" value={settings.audience} onChange={(event) => updateSettings("audience", event.target.value as SlideGenerationSettings["audience"])}><option value="primary">Tiểu học</option><option value="secondary">THCS</option><option value="high_school">THPT</option><option value="vocational">Giáo dục nghề nghiệp</option><option value="other">Khác</option></select></Field><Field label="Tỷ lệ màn hình"><select className="form-field" value={settings.aspectRatio} onChange={(event) => updateSettings("aspectRatio", event.target.value as "16:9" | "4:3")}><option>16:9</option><option>4:3</option></select></Field><Field label="Chủ đề giao diện"><select className="form-field" value={settings.themeId} onChange={(event) => updateSettings("themeId", event.target.value)}>{slideThemes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></Field><div><p className="label">Nội dung tùy chọn</p>{Object.entries({ objectives: "Có slide mục tiêu", warmUp: "Có hoạt động khởi động", examples: "Có ví dụ minh họa", interactiveQuestions: "Có câu hỏi tương tác", practice: "Có bài tập luyện tập", summary: "Có slide tổng kết", homework: "Có bài tập về nhà", teacherNotes: "Có ghi chú giáo viên" }).map(([key, label]) => <label key={key} className="mt-2 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={settings.options[key as keyof typeof settings.options]} onChange={(event) => updateSettings("options", { ...settings.options, [key]: event.target.checked })}/>{label}</label>)}</div><Field label="Ghi chú thêm"><textarea className="form-field min-h-20" value={settings.additionalNotes} onChange={(event) => updateSettings("additionalNotes", event.target.value)}/></Field><button type="button" className="btn-primary w-full" onClick={makeOutline}><Sparkles size={17}/>Tạo dàn ý slide</button></div></aside>; }

function OutlineStep({ deck, selectedId, setSelectedId, updateSlide, moveSlide, deleteSlide, updateDeck, busy, generateDeck }: { deck: SlideDeck; selectedId: string; setSelectedId: (id: string) => void; updateSlide: (id: string, patch: Partial<Slide>, teacherEdit?: boolean) => void; moveSlide: (index: number, direction: -1 | 1) => void; deleteSlide: (id: string) => void; updateDeck: (mutator: (current: SlideDeck) => SlideDeck, teacherEdit?: boolean) => void; busy: boolean; generateDeck: () => Promise<void> }) { return <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black">Kiểm tra dàn ý slide</h2><p className="mt-1 text-sm text-slate-600">Chỉnh tiêu đề, loại slide và thứ tự trước khi tạo nội dung.</p></div><button className="btn-primary" disabled={busy} onClick={() => void generateDeck()}><Check size={17}/>Xác nhận và tạo nội dung</button></div><div className="mt-5 space-y-3">{deck.slides.map((slide, index) => <article key={slide.id} onClick={() => setSelectedId(slide.id)} className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[56px_minmax(180px,1fr)_180px_minmax(200px,1fr)_auto] ${selectedId === slide.id ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-blue-700 shadow-sm">{index + 1}</span><input className="form-field" value={slide.title || ""} onChange={(event) => updateSlide(slide.id, { title: event.target.value })}/><select className="form-field" value={slide.type} onChange={(event) => updateSlide(slide.id, { type: event.target.value as SlideType })}>{slideTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select><div><input className="form-field" value={slide.expectedContent || ""} onChange={(event) => updateSlide(slide.id, { expectedContent: event.target.value })}/><p className="mt-1 text-xs text-slate-500">Mật độ dự kiến: {slide.estimatedDensity === "low" ? "Thưa" : slide.estimatedDensity === "high" ? "Dày" : "Vừa"}</p></div><div className="flex items-center gap-1"><IconButton label="Lên" disabled={index === 0} onClick={() => moveSlide(index, -1)}><ArrowUp size={16}/></IconButton><IconButton label="Xuống" disabled={index === deck.slides.length - 1} onClick={() => moveSlide(index, 1)}><ArrowDown size={16}/></IconButton><IconButton label="Nhân bản" onClick={() => updateDeck((current) => duplicateOutlineSlide(current, slide.id))}><Copy size={16}/></IconButton><IconButton label="Xóa" disabled={deck.slides.length <= 1} onClick={() => deleteSlide(slide.id)}><Trash2 size={16}/></IconButton></div></article>)}</div><button className="btn-secondary mt-4" onClick={() => updateDeck((current) => ({ ...current, slides: [...current.slides, { id: makeStableId("slide"), order: current.slides.length + 1, type: "content", layout: "title_content", title: "Slide mới", purpose: "Nội dung bổ sung", expectedContent: "Nội dung giáo viên muốn bổ sung", estimatedDensity: "medium", blocks: [], generationStatus: "outline" }] }))}><Plus size={16}/>Thêm slide</button></section>; }

function EditorStep({ deck, selected, selectedId, setSelectedId, theme, validation, updateSlide, updateDeck, deleteSlide, busy, progress, setRegenTarget, exportDeck, save, undo, canUndo }: { deck: SlideDeck; selected?: Slide; selectedId: string; setSelectedId: (id: string) => void; theme: ReturnType<typeof getSlideTheme>; validation: ReturnType<typeof validateDeckForExport> | null; updateSlide: (id: string, patch: Partial<Slide>, teacherEdit?: boolean) => void; updateDeck: (mutator: (current: SlideDeck) => SlideDeck, teacherEdit?: boolean) => void; deleteSlide: (id: string) => void; busy: boolean; progress: string; setRegenTarget: (slide: Slide | null) => void; exportDeck: (audience: "student" | "teacher") => Promise<void>; save: () => void; undo: () => void; canUndo: boolean }) {
  const [mobileSlides, setMobileSlides] = useState(false);
  if (!selected) return null;
  const active = selected;
  const ratio = deck.aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-video";
  function patchBlock(blockId: string, next: SlideBlock) { updateSlide(active.id, { blocks: active.blocks.map((block) => block.id === blockId ? next : block) }); }
  function addBlock(type: "text" | "bullets" | "formula" | "tikz" | "table" | "question") {
    const base = { id: makeStableId("block"), region: "main" as const, alignment: "left" as const };
    const block: SlideBlock = type === "bullets" ? { ...base, type, content: ["Ý chính mới"] } : type === "formula" ? { ...base, type, content: "Công thức", latex: "x = 1" } : type === "tikz" ? { ...base, type, content: "Hình TikZ", tikz: "\\begin{tikzpicture}\n\\draw (0,0)--(2,0)--(1,1.5)--cycle;\n\\end{tikzpicture}" } : type === "table" ? { ...base, type, content: "Bảng", headers: ["Tiêu chí", "Nội dung"], rows: [["1", ""]] } : type === "question" ? { ...base, type, content: "Câu hỏi dành cho học sinh", questionType: "quick_check", answerMode: "teacher_notes", answer: "Đáp án gợi ý" } : { ...base, type, content: "Nội dung mới" };
    updateSlide(active.id, { blocks: [...active.blocks, block] });
  }
  async function addImage(file?: File) { if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) return; const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); const image = new Image(); image.src = dataUrl; await image.decode(); const assetId = makeStableId("asset"); updateDeck((current) => ({ ...current, assets: [...current.assets, { id: assetId, kind: "image", mimeType: file.type, dataUrl, width: image.naturalWidth, height: image.naturalHeight, alt: file.name, sourceReference: file.name }], slides: current.slides.map((slide) => slide.id === active.id ? { ...slide, blocks: [...slide.blocks, { id: makeStableId("block"), type: "image", content: file.name, assetId, alt: file.name, region: "main", alignment: "center" }], teacherEdited: true } : slide) })); }
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex flex-wrap items-center gap-2"><button className="btn-secondary md:hidden" onClick={() => setMobileSlides(!mobileSlides)}><Presentation size={16}/>Danh sách slide</button><button className="btn-secondary" disabled={!canUndo} onClick={undo}><Undo2 size={16}/>Hoàn tác</button><button className="btn-secondary" onClick={save}><Save size={16}/>Lưu</button><span className={`rounded-full px-3 py-2 text-xs font-black ${validation?.status === "ready" ? "bg-emerald-100 text-emerald-800" : validation?.status === "blocked" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{validation?.status === "ready" ? "Sẵn sàng xuất" : validation?.status === "blocked" ? "Không thể xuất" : "Có cảnh báo"}</span></div><div className="flex flex-wrap gap-2"><button className="btn-primary" disabled={busy} onClick={() => void exportDeck("student")}><Download size={16}/>PowerPoint học sinh</button><button className="btn-secondary" disabled={busy} onClick={() => void exportDeck("teacher")}><Download size={16}/>Bản giáo viên</button></div></div>{progress ? <div className="flex items-center gap-2 rounded-2xl bg-blue-50 p-3 font-bold text-blue-800"><LoaderCircle className="animate-spin" size={18}/>{progress}</div> : null}
    <div className="grid min-w-0 gap-3 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_340px]"><aside className={`${mobileSlides ? "block" : "hidden"} max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 md:block`}>{deck.slides.map((slide) => <button key={slide.id} onClick={() => { setSelectedId(slide.id); setMobileSlides(false); }} className={`mb-2 w-full rounded-xl border p-2 text-left ${selectedId === slide.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><div className="flex items-center gap-2"><span className="text-xs font-black text-blue-700">{slide.order}</span><p className="min-w-0 flex-1 truncate text-xs font-bold">{slide.title}</p>{slide.hidden ? <EyeOff size={13}/> : null}</div><div className={`mt-2 aspect-video rounded-lg p-2 text-[8px] ${theme.id === "modern-dark" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600"}`}>{slide.blocks.slice(0, 3).map((block) => <div key={block.id} className="truncate">{blockText(block)}</div>)}</div></button>)}<button className="btn-secondary w-full" onClick={() => updateDeck((current) => ({ ...current, slides: [...current.slides, { id: makeStableId("slide"), order: current.slides.length + 1, type: "content", layout: "title_content", title: "Slide mới", blocks: [], generationStatus: "ready", teacherEdited: true }] }))}><Plus size={15}/>Thêm</button></aside>
      <main className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-5"><div className={`${ratio} mx-auto w-full max-w-5xl overflow-hidden rounded-xl shadow-xl`} style={{ background: `#${theme.background}`, color: `#${theme.bodyColor}` }}><div className="flex h-full flex-col border-l-[8px] p-[5%]" style={{ borderColor: `#${theme.primary}` }}><h2 className="shrink-0 text-[clamp(1rem,3vw,2.1rem)] font-black leading-tight" style={{ color: `#${theme.titleColor}`, fontFamily: theme.titleFont }}>{selected.title}</h2>{selected.subtitle ? <p className="mt-2 text-[clamp(.7rem,1.4vw,1rem)]">{selected.subtitle}</p> : null}<div className="mt-[4%] grid min-h-0 flex-1 content-center gap-[3%] overflow-hidden">{selected.generationStatus === "failed" ? <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">{selected.generationError}</div> : selected.blocks.map((block) => <PreviewBlock key={block.id} block={block} deck={deck}/>)}</div><p className="mt-auto self-end text-[10px] opacity-60">{selected.order}</p></div></div>{densityWarnings(selected).map((warning) => <p key={warning} className="mx-auto mt-3 max-w-5xl rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900">{warning}</p>)}</main>
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 xl:max-h-[78vh] xl:overflow-y-auto"><h3 className="font-black">Chỉnh sửa slide {selected.order}</h3><div className="mt-4 space-y-3"><Field label="Tiêu đề"><input className="form-field" value={selected.title || ""} onChange={(event) => updateSlide(selected.id, { title: event.target.value })}/></Field><div className="grid grid-cols-2 gap-2"><Field label="Loại"><select className="form-field" value={selected.type} onChange={(event) => updateSlide(selected.id, { type: event.target.value as SlideType })}>{slideTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></Field><Field label="Bố cục"><select className="form-field" value={selected.layout} onChange={(event) => updateSlide(selected.id, { layout: event.target.value as Slide["layout"] })}><option value="title_content">Tiêu đề & nội dung</option><option value="two_columns">Hai cột</option><option value="image_left">Ảnh trái</option><option value="image_right">Ảnh phải</option><option value="formula_focus">Công thức</option><option value="question_focus">Câu hỏi</option><option value="table_focus">Bảng</option><option value="summary_cards">Thẻ tổng kết</option></select></Field></div>{selected.blocks.map((block) => <div key={block.id} className="rounded-xl border border-slate-200 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{block.type}</span><button aria-label="Xóa khối" className="text-red-600" onClick={() => updateSlide(selected.id, { blocks: selected.blocks.filter((item) => item.id !== block.id) })}><Trash2 size={15}/></button></div>{block.type === "image" ? <p className="text-sm text-slate-600">{block.alt}</p> : <textarea className="form-field min-h-24 font-mono text-sm" value={blockText(block)} onChange={(event) => patchBlock(block.id, updateBlockText(block, event.target.value))}/>} {block.type === "question" ? <div className="mt-2 space-y-2"><Field label="Đáp án (chỉ bản giáo viên mặc định)"><textarea className="form-field min-h-16" value={block.answer || ""} onChange={(event) => patchBlock(block.id, { ...block, answer: event.target.value })}/></Field><select className="form-field" value={block.answerMode} onChange={(event) => patchBlock(block.id, { ...block, answerMode: event.target.value as typeof block.answerMode })}><option value="teacher_notes">Trong ghi chú giáo viên</option><option value="answer_slide">Slide đáp án riêng</option><option value="immediate">Hiện ngay</option><option value="hidden">Ẩn hoàn toàn</option></select></div> : null}</div>)}<div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => addBlock("text")}>Văn bản</button><button className="btn-secondary" onClick={() => addBlock("bullets")}>Bullet</button><button className="btn-secondary" onClick={() => addBlock("formula")}>Công thức</button><button className="btn-secondary" onClick={() => addBlock("table")}>Bảng</button><button className="btn-secondary" onClick={() => addBlock("question")}>Câu hỏi</button><label className="btn-secondary cursor-pointer"><ImagePlus size={15}/>Ảnh<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void addImage(event.target.files?.[0])}/></label></div><Field label="Ghi chú giáo viên"><textarea className="form-field min-h-24" value={selected.teacherNotes || ""} onChange={(event) => updateSlide(selected.id, { teacherNotes: event.target.value })}/></Field><div className="flex flex-wrap gap-2"><button className="btn-secondary" disabled={busy} onClick={() => selected.teacherEdited ? setRegenTarget(selected) : setRegenTarget(selected)}><Redo2 size={16}/>Tạo lại slide</button><button className="btn-secondary" onClick={() => updateSlide(selected.id, { hidden: !selected.hidden })}>{selected.hidden ? <Eye size={16}/> : <EyeOff size={16}/>} {selected.hidden ? "Hiện" : "Ẩn"}</button><button className="btn-secondary text-red-600" disabled={deck.slides.length <= 1} onClick={() => deleteSlide(selected.id)}><Trash2 size={16}/>Xóa</button></div><Field label="Theme toàn bộ"><select className="form-field" value={deck.themeId} onChange={(event) => updateDeck((current) => ({ ...current, themeId: event.target.value }))}>{slideThemes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div></aside></div>
  </div>;
}

function PreviewBlock({ block, deck }: { block: SlideBlock; deck: SlideDeck }) { if (block.type === "bullets") return <ul className="list-disc space-y-[1.5%] pl-[4%] text-[clamp(.65rem,1.6vw,1.2rem)]">{block.content.map((item) => <li key={item}>{item}</li>)}</ul>; if (block.type === "formula") { let html = ""; try { html = katex.renderToString(block.latex, { displayMode: true, throwOnError: false, strict: "ignore", trust: false }); } catch { html = block.latex; } return <div className="overflow-hidden text-center text-[clamp(.7rem,2vw,1.5rem)]" dangerouslySetInnerHTML={{ __html: html }}/>; } if (block.type === "image") { const asset = deck.assets.find((item) => item.id === block.assetId); return asset?.dataUrl ? <img src={asset.dataUrl} alt={block.alt} className="mx-auto max-h-full max-w-full object-contain"/> : <p>{block.alt}</p>; } if (block.type === "table") return <div className="overflow-auto"><table className="w-full border-collapse text-[clamp(.45rem,1.1vw,.9rem)]"><thead><tr>{block.headers.map((item) => <th key={item} className="border p-1">{item}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((item, cell) => <td key={cell} className="border p-1">{item}</td>)}</tr>)}</tbody></table></div>; if (block.type === "question") return <div className="rounded-xl border-2 border-current/20 bg-white/60 p-[3%] text-[clamp(.65rem,1.7vw,1.25rem)] font-bold"><p>{block.content}</p>{block.options?.map((option, index) => <p key={option} className="mt-1 font-normal">{String.fromCharCode(65 + index)}. {option}</p>)}{block.answerMode === "immediate" && block.answer ? <p className="mt-2 text-emerald-700">Đáp án: {block.answer}</p> : null}</div>; if (block.type === "process") return <div className="flex flex-wrap gap-2">{block.steps.map((step, index) => <div key={step} className="flex-1 rounded-xl border bg-white/60 p-2 text-center text-[clamp(.55rem,1vw,.9rem)]"><b>{index + 1}</b><br/>{step}</div>)}</div>; if (block.type === "callout") return <div className="rounded-xl border-l-4 bg-white/60 p-[3%] text-[clamp(.65rem,1.4vw,1rem)]">{block.label ? <b>{block.label}: </b> : null}{block.content}</div>; if (block.type === "tikz") return <pre className="overflow-hidden whitespace-pre-wrap text-[clamp(.4rem,.8vw,.7rem)]">{block.tikz}</pre>; return <p className="whitespace-pre-line text-[clamp(.65rem,1.6vw,1.15rem)]">{block.content}</p>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="label">{label}</span>{children}</label>; }
function IconButton({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={(event) => { event.stopPropagation(); onClick(); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40">{children}</button>; }
