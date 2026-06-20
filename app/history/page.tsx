import { HistoryList } from "@/components/HistoryList";
import { PageHeader } from "@/components/PageHeader";
import { BugReportLink } from "@/components/BugReportLink";
import { AppShell } from "@/components/AppShell";

export default function HistoryPage() {
  return (
    <AppShell title="Lịch sử">
        <PageHeader title="Lịch sử tài liệu" description="Các tài liệu đã lưu trên trình duyệt hiện tại." />
        <BugReportLink source="history" className="mb-4" />
        <HistoryList />
    </AppShell>
  );
}
