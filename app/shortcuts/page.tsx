import { Keyboard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

const shortcuts = [["Ctrl/Cmd + K", "Mở tìm nhanh"], ["Esc", "Đóng hộp thoại tìm nhanh"], ["Enter", "Mở kết quả đang chọn"], ["↑ / ↓", "Di chuyển giữa các kết quả tìm nhanh"]];

export default function ShortcutsPage() {
  return <div className="min-h-screen md:flex"><Sidebar /><main className="flex-1 p-5 md:p-8"><PageHeader title="Phím tắt" description="Một vài phím tắt đơn giản để di chuyển trong Soạn Lab nhanh hơn." /><section className="card max-w-2xl overflow-hidden"><div className="flex items-center gap-2 border-b border-line p-5"><Keyboard className="text-brand" size={20} /><h2 className="font-bold text-ink">Phím tắt hiện có</h2></div><dl>{shortcuts.map(([keys, action]) => <div key={keys} className="grid grid-cols-[150px_1fr] gap-4 border-b border-line px-5 py-4 last:border-0"><dt><kbd className="rounded border border-line bg-slate-50 px-2 py-1 text-sm font-semibold text-ink">{keys}</kbd></dt><dd className="text-sm text-muted">{action}</dd></div>)}</dl></section></main></div>;
}
