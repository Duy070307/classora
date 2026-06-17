"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { PageHeader } from "@/components/PageHeader";
import { ToolCategorySection } from "@/components/ToolCategorySection";
import { UsageBadge } from "@/components/UsageBadge";
import { getHistory } from "@/lib/history";
import { allToolLinks, toolCategories } from "@/lib/tool-configs";
import type { GeneratedDocument } from "@/lib/types";

export default function DashboardPage() {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);

  useEffect(() => {
    queueMicrotask(() => setHistory(getHistory().slice(0, 5)));
  }, []);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <PageHeader title="Chào mừng đến với Classora" description="Chọn một công cụ để tạo tài liệu dạy học nhanh, sau đó lưu hoặc xuất Word." />
          <UsageBadge />
        </div>
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="card p-5 md:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">MVP cho giáo viên</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Soạn đề, tạo tài liệu, xuất Word trong vài phút.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Dữ liệu hiện được lưu trên trình duyệt của bạn. Chưa có đăng nhập, thanh toán hay AI thật trong bản MVP này.</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Clock3 size={16} />
              Lịch sử gần đây
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{history.length}</p>
            <Link href="/history" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Xem lịch sử
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
        <div className="space-y-8">
          {toolCategories.map((category) => (
            <ToolCategorySection key={category} title={category} tools={allToolLinks.filter((tool) => tool.category === category)} />
          ))}
        </div>
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Lịch sử gần đây</h2>
          <div className="mt-4 space-y-3">
            {history.length ? history.map((item) => (
              <article key={item.id} className="card p-4">
                <h3 className="font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{item.content}</p>
              </article>
            )) : <div className="empty-state">Chưa có lịch sử. Hãy tạo tài liệu đầu tiên rồi lưu lại.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
