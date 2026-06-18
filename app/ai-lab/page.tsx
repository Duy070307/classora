"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { buildPrompt } from "@/lib/ai/prompts";
import type { AIResponse } from "@/lib/ai";

const tools = ["exam", "matrix", "answer-key", "exam-shuffler", "worksheet", "lesson-plan", "student-comments"];
const sample = JSON.stringify({ subject: "Toán", grade: "7", topic: "Tỉ lệ thức", duration: "45 phút" }, null, 2);

export default function AILabPage() {
  const [tool, setTool] = useState("exam");
  const [jsonInput, setJsonInput] = useState(sample);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parsed = useMemo(() => {
    try { return { value: JSON.parse(jsonInput), error: "" }; }
    catch { return { value: null, error: "JSON không hợp lệ." }; }
  }, [jsonInput]);
  const prompt = parsed.value ? buildPrompt(tool, parsed.value) : "";

  async function generate() {
    if (!parsed.value) return setError(parsed.error);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, input: parsed.value })
      });
      const data = await response.json() as AIResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể tạo mock output.");
      setOutput(JSON.stringify(data, null, 2));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Không thể tạo mock output.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <PageHeader title="AI Lab" description="Không gian dành cho developer/tester để xem prompt và thử kiến trúc Mock AI, không cần API key." />
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="card space-y-4 p-5">
            <div><label className="label">Tool</label><select className="form-field mt-1" value={tool} onChange={(event) => setTool(event.target.value)}>{tools.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label className="label">Sample JSON input</label><textarea className="form-field mt-1 min-h-64 font-mono text-xs" value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} /></div>
            {parsed.error || error ? <p className="text-sm text-red-600">{parsed.error || error}</p> : null}
            <button type="button" className="btn-primary" disabled={loading || !parsed.value} onClick={generate}>{loading ? "Đang tạo..." : "Tạo mock output"}</button>
          </section>
          <div className="space-y-6">
            <section className="card p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold text-ink">Prompt preview</h2><CopyButton text={prompt} label="Copy prompt" /></div><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-xs leading-6 text-slate-100">{prompt || "Nhập JSON hợp lệ để xem prompt."}</pre></section>
            <section className="card p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold text-ink">Mock output</h2><CopyButton text={output} label="Copy mock output" /></div><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-xs leading-6 text-slate-700">{output || "Mock output sẽ xuất hiện tại đây."}</pre></section>
          </div>
        </div>
      </main>
    </div>
  );
}
