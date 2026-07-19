"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Play, RefreshCw, Save, Sparkles } from "lucide-react";
import { createDocument, saveDocument } from "@/lib/history";

const examples = [
  "Tạo mô hình chóp cụt tứ giác, đáy lớn ở dưới, đáy nhỏ ở trên, có nhãn đáy lớn, đáy nhỏ và chiều cao.",
  "Tạo mô hình nón cụt có đáy lớn, đáy nhỏ và đường sinh.",
  "Tạo hình chóp tứ giác đều có đáy, đỉnh và các mặt bên.",
  "Tạo hình lăng trụ tam giác có nhãn các cạnh.",
  "Tạo hình trụ có chiều cao h và bán kính r.",
  "Mô phỏng Trái Đất quay quanh Mặt Trời, có quỹ đạo và nhãn tên.",
  "Mô phỏng con lắc đơn dao động qua lại, có dây, quả nặng và vị trí cân bằng.",
  "Mô phỏng chuyển động ném xiên của một quả bóng, có quỹ đạo parabol.",
  "Mô phỏng phân tử nước H2O với một nguyên tử O và hai nguyên tử H.",
  "Mô phỏng khối lập phương quay quanh trục để học sinh quan sát các mặt.",
] as const;

const styles = ["Đơn giản", "Khoa học", "Dễ hiểu cho học sinh", "Màu sắc nhẹ"] as const;
const simulationTypes = ["Tự động", "Hình học 3D", "Vật lí", "Hóa học", "Khác"] as const;

function looksLikeGeometryPrompt(value: string) {
  return /chóp|nón|trụ|cầu|lăng trụ|lập phương|hộp chữ nhật/i.test(value);
}

type AnimationResult = {
  title: string;
  description: string;
  html: string;
  notes: string[];
  warnings: string[];
};

export function ThreeDAnimationTool() {
  const [prompt, setPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [objective, setObjective] = useState("");
  const [style, setStyle] = useState<(typeof styles)[number]>("Đơn giản");
  const [simulationType, setSimulationType] = useState<(typeof simulationTypes)[number]>("Tự động");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnimationResult | null>(null);
  const [editedHtml, setEditedHtml] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const html = editedHtml || result?.html || "";
  const canUseResult = Boolean(result && html);
  const documentContent = useMemo(() => {
    if (!result) return "";
    return [
      `# ${result.title}`,
      "",
      result.description,
      "",
      "## Ghi chú",
      ...(result.notes.length ? result.notes.map((note) => `- ${note}`) : ["- Có thể tải file HTML để chạy độc lập."]),
      "",
      "## Lưu ý",
      ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- Mô phỏng là bản nháp minh họa, cần kiểm tra trước khi dùng."]),
      "",
      "## Mã HTML",
      "```html",
      html,
      "```",
    ].join("\n");
  }, [html, result]);

  async function generate() {
    if (!prompt.trim()) {
      setError("Vui lòng nhập nội dung cần mô phỏng.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/ai/3d-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, subject, grade, objective, style, simulationType }),
      });
      const data = await response.json() as ({ ok: true } & AnimationResult) | { ok: false; error?: string };
      if (!data.ok) {
        setError(data.error || "Chưa tạo được mô phỏng. Vui lòng thử mô tả ngắn gọn và rõ hơn.");
        return;
      }
      if (!response.ok) {
        setError("Chưa tạo được mô phỏng. Vui lòng thử mô tả ngắn gọn và rõ hơn.");
        return;
      }
      setResult({
        title: data.title,
        description: data.description,
        html: data.html,
        notes: data.notes || [],
        warnings: data.warnings || [],
      });
      setEditedHtml(data.html);
      setPreviewKey((value) => value + 1);
      setMessage("Đã tạo mô phỏng 3D. Thầy cô vui lòng xem trước và kiểm tra lại nội dung.");
    } catch {
      setError("Chưa tạo được mô phỏng. Vui lòng thử mô tả ngắn gọn và rõ hơn.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setMessage("Đã copy mã mô phỏng.");
  }

  function downloadHtml() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soan-lab-mo-phong-3d.html";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Đã tải file HTML mô phỏng.");
  }

  function saveToHistory() {
    if (!result) return;
    saveDocument(createDocument(result.title || "Mô phỏng 3D", "3d-animation", documentContent));
    setMessage("Đã lưu mô phỏng vào lịch sử.");
  }

  function applyExample(example: string) {
    setPrompt(example);
    if (looksLikeGeometryPrompt(example)) setSimulationType("Hình học 3D");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="space-y-5">
        <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">Beta</span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Công cụ trực quan</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Tạo mô phỏng 3D</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Mô tả chuyển động hoặc mô hình cần minh họa, Soạn Lab sẽ tạo một mô phỏng 3D đơn giản để thầy cô xem thử, chỉnh sửa và dùng trong bài giảng.
          </p>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Tính năng này đang thử nghiệm. Mô phỏng được tạo tự động chỉ mang tính minh họa, có thể chưa chính xác hoàn toàn về chuyên môn, tỉ lệ, chuyển động hoặc ký hiệu. Thầy cô cần kiểm tra lại trước khi sử dụng.
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <label className="label" htmlFor="animation-prompt">Nội dung cần mô phỏng</label>
          <textarea
            id="animation-prompt"
            className="form-field mt-1 min-h-36"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ví dụ: Tạo mô phỏng Trái Đất quay quanh Mặt Trời, có quỹ đạo tròn, Mặt Trời ở giữa, Trái Đất chuyển động chậm và có nhãn tên."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Môn học</label>
              <input className="form-field mt-1" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ví dụ: Vật lý" />
            </div>
            <div>
              <label className="label">Lớp</label>
              <input className="form-field mt-1" value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="Ví dụ: 10" />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Mục tiêu minh họa</label>
            <input className="form-field mt-1" value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ví dụ: giúp học sinh quan sát quỹ đạo và tốc độ chuyển động" />
          </div>
          <div className="mt-3">
            <label className="label">Loại mô phỏng</label>
            <select className="form-field mt-1" value={simulationType} onChange={(event) => setSimulationType(event.target.value as (typeof simulationTypes)[number])}>
              {simulationTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
            {simulationType === "Hình học 3D" ? (
              <p className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">
                Phù hợp để tạo các khối như hình chóp, chóp cụt, hình nón, nón cụt, hình trụ, hình cầu, lăng trụ.
              </p>
            ) : null}
          </div>
          <div className="mt-3">
            <label className="label">Phong cách hiển thị</label>
            <select className="form-field mt-1" value={style} onChange={(event) => setStyle(event.target.value as (typeof styles)[number])}>
              {styles.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <button type="button" className="btn-primary mt-5 w-full" onClick={generate} disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" size={17} /> : <Sparkles size={17} />}
            {loading ? "Đang tạo mô phỏng…" : "Tạo mô phỏng 3D"}
          </button>
          {error ? <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {message ? <p className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">{message}</p> : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-950">Ví dụ mô tả</h2>
          <div className="mt-3 space-y-2">
            {examples.map((example) => (
              <button
                type="button"
                key={example}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold leading-6 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                onClick={() => applyExample(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Kết quả mô phỏng</h2>
              <p className="mt-1 text-sm text-slate-500">Preview chạy trong iframe sandbox, tách khỏi trang chính.</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button type="button" className="btn-secondary" disabled={!canUseResult} onClick={() => setPreviewKey((value) => value + 1)}>
                <Play size={16} /> Chạy lại
              </button>
              <button type="button" className="btn-secondary" disabled={!canUseResult} onClick={copyCode}>
                <Copy size={16} /> Copy mã
              </button>
              <button type="button" className="btn-secondary" disabled={!canUseResult} onClick={downloadHtml}>
                <Download size={16} /> Tải file HTML
              </button>
              <button type="button" className="btn-secondary" disabled={!canUseResult} onClick={saveToHistory}>
                <Save size={16} /> Lưu lịch sử
              </button>
            </div>
          </div>

          {html ? (
            <div className="mt-5 h-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:h-[520px] xl:h-[580px]">
              <iframe
                key={previewKey}
                title="Kết quả mô phỏng 3D"
                srcDoc={html}
                sandbox="allow-scripts"
                className="block h-full w-full border-0 bg-slate-50"
              />
            </div>
          ) : loading ? (
            <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center sm:min-h-[420px]">
              <div>
                <RefreshCw className="mx-auto animate-spin text-blue-500" size={34} />
                <p className="mt-3 font-bold text-slate-900">Đang tạo mô phỏng 3D…</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Soạn Lab đang dựng bản nháp minh họa để thầy cô xem trước.</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center sm:min-h-[420px]">
              <div>
                <Sparkles className="mx-auto text-blue-500" size={34} />
                <p className="mt-3 font-bold text-slate-900">Nhập mô tả để tạo mô phỏng 3D đầu tiên.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Mô phỏng sẽ hiển thị tại đây sau khi tạo.</p>
              </div>
            </div>
          )}
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Mô phỏng 3D được tạo tự động để minh họa ý tưởng. Với nội dung khoa học, thầy cô cần kiểm tra lại tính đúng đắn trước khi dùng trong bài giảng.
          </p>
          {(simulationType === "Hình học 3D" || looksLikeGeometryPrompt(prompt)) ? (
            <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900">
              Mô hình hình học 3D là bản minh họa để quan sát. Thầy cô cần kiểm tra lại kích thước, tỉ lệ và ký hiệu trước khi sử dụng.
            </p>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Mã mô phỏng</h2>
              <p className="mt-1 text-sm text-slate-500">Có thể copy hoặc tải file HTML để chạy độc lập.</p>
            </div>
            <button type="button" className="btn-secondary" disabled={!canUseResult} onClick={() => setPreviewKey((value) => value + 1)}>
              <RefreshCw size={16} /> Chạy lại mô phỏng
            </button>
          </div>
          <textarea
            className="mt-4 min-h-[320px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            value={html}
            onChange={(event) => setEditedHtml(event.target.value)}
            placeholder="Mã HTML mô phỏng sẽ xuất hiện ở đây."
            spellCheck={false}
          />
        </div>
      </section>
    </div>
  );
}
