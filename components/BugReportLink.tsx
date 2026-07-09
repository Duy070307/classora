import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function BugReportLink({ className = "" }: { source?: string; className?: string }) {
  return (
    <Link
      href="/getting-started"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline ${className}`}
    >
      <AlertCircle size={15} />
      Lưu ý sử dụng
    </Link>
  );
}
