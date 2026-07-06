import { AppShell } from "@/components/AppShell";
import { HistoryList } from "@/components/HistoryList";
import { PageHeader } from "@/components/PageHeader";

export default function HistoryPage() {
  return (
    <AppShell title="Lịch sử">
      <PageHeader
        title="Lịch sử tài liệu"
        description="Tìm, mở lại, phân loại và xuất lại các bản nháp đã lưu trong Soạn Lab."
        eyebrow="Kho tài liệu của thầy/cô"
      />
      <HistoryList />
    </AppShell>
  );
}
