import { Info } from "lucide-react";
import Link from "next/link";

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-md border border-amber-200 bg-amber-50 text-amber-800 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}`}>
      <div className="flex gap-2">
        <Info size={compact ? 14 : 16} className="mt-0.5 shrink-0" />
        <p>Classora hiện là bản MVP/demo và chưa sử dụng AI thật. Nội dung được tạo bằng AI mô phỏng để kiểm thử quy trình. <Link href="/feedback" className="font-bold underline">Góp ý</Link></p>
      </div>
    </div>
  );
}
