import { HistoryList } from "@/components/HistoryList";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";

export default function HistoryPage() {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Lịch sử tài liệu" description="Các tài liệu đã lưu trên trình duyệt hiện tại." />
        <HistoryList />
      </main>
    </div>
  );
}
