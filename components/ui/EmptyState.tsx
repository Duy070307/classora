import { FileText } from "lucide-react";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";

export function EmptyState({
  title = "Kết quả sẽ hiển thị ở đây",
  description = "Sau khi tạo bản nháp, bạn có thể sao chép, lưu lịch sử hoặc xuất Word.",
  icon: Icon = FileText
}: {
  title?: string;
  description?: string;
  icon?: typeof FileText;
}) {
  void Icon;
  return <SoanLabEmptyState title={title} description={description} />;
}
