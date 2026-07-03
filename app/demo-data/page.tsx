"use client";

import { Database, Eraser, RotateCcw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { clearAllDemoData, loadSampleQuestionBank, loadSampleSettings, loadSampleTemplates, resetDemoData } from "@/lib/sample-data";

export default function DemoDataPage() {
  const [message, setMessage] = useState("");
  const run = (action: () => boolean, success: string) => setMessage(action() ? success : "Không thể cập nhật localStorage trên trình duyệt này.");
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-4 sm:p-5 md:p-8">
    <PageHeader title="Dữ liệu mẫu" description="Trang này giúp nạp dữ liệu mẫu để kiểm tra nhanh các quy trình của Soạn Lab." />
    <section className="card max-w-3xl space-y-4 p-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Dữ liệu mẫu chỉ lưu trên trình duyệt hiện tại bằng localStorage.</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-secondary" onClick={() => run(loadSampleQuestionBank, "Đã nạp ngân hàng câu hỏi mẫu.")}><Database size={17} />Nạp ngân hàng câu hỏi mẫu</button>
        <button className="btn-secondary" onClick={() => run(loadSampleTemplates, "Đã nạp mẫu tài liệu cá nhân.")}><Database size={17} />Nạp mẫu tài liệu cá nhân</button>
        <button className="btn-secondary" onClick={() => run(loadSampleSettings, "Đã nạp cài đặt tài liệu mẫu.")}><Database size={17} />Nạp cài đặt tài liệu mẫu</button>
        <button className="btn-primary" onClick={() => run(resetDemoData, "Đã nạp tất cả dữ liệu mẫu.")}><RotateCcw size={17} />Nạp tất cả dữ liệu mẫu</button>
      </div>
      <button className="btn-secondary text-red-600" onClick={() => { if (window.confirm("Xóa toàn bộ dữ liệu Soạn Lab trên trình duyệt này?")) run(clearAllDemoData, "Đã xóa toàn bộ dữ liệu mẫu."); }}><Eraser size={17} />Xóa toàn bộ dữ liệu mẫu</button>
      {message ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
    </section>
  </main></div>;
}
