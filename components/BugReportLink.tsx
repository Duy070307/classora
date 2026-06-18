import Link from "next/link";
import { MessageCircleWarning } from "lucide-react";

export function BugReportLink({ source, className = "" }: { source?: string; className?: string }) {
  const href = source ? `/feedback?source=${encodeURIComponent(source)}` : "/feedback";
  return <Link href={href} className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline ${className}`}><MessageCircleWarning size={15} />Báo lỗi/Góp ý</Link>;
}
