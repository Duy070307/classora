"use client";

import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { CommandPaletteButton } from "@/components/CommandPalette";
import { getHistory } from "@/lib/history";
import { getQuestions } from "@/lib/question-bank";
import { getTemplates } from "@/lib/templates";
import { downloadLocalDataBackup } from "@/lib/local-data-manager";
import { toolRegistry } from "@/lib/tool-registry";

type Status = {
  history: number;
  templates: number;
  questions: number;
  tools: number;
};

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<Status>({ history: 0, templates: 0, questions: 0, tools: 0 });
  const refresh = () => setStatus({
    history: getHistory().length,
    templates: getTemplates().length,
    questions: getQuestions().length,
    tools: toolRegistry.length,
  });

  useEffect(() => {
    queueMicrotask(refresh);
  }, []);

  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8">
    <PageHeader title="Kiểm tra trạng thái ứng dụng" description="Thông tin dễ đọc để kiểm tra dữ liệu cục bộ và các route quan trọng." />
    <div className="mt-5 flex flex-wrap gap-2">
      <button className="btn-primary" onClick={refresh}><RefreshCw size={16} />Kiểm tra lại</button>
      <CommandPaletteButton />
      <Link href="/data" className="btn-secondary">Quản lý dữ liệu</Link>
      <Link href="/tools" className="btn-secondary">Công cụ</Link>
      <button className="btn-secondary" onClick={downloadLocalDataBackup}><Download size={16} />Xuất sao lưu</button>
    </div>
    <section className="card mt-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Lịch sử", status.history],
        ["Mẫu cá nhân", status.templates],
        ["Câu hỏi", status.questions],
        ["Công cụ", status.tools],
      ].map(([label, value]) => <div key={label} className="rounded-2xl bg-blue-50 p-4 text-center"><p className="text-2xl font-black text-blue-700">{value}</p><p className="mt-1 text-sm font-bold text-slate-600">{label}</p></div>)}
    </section>
  </main></div>;
}
