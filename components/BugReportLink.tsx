import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function BugReportLink({ className = "" }: { source?: string; className?: string }) {
  return <Link href="/system-status" className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline ${className}`}><AlertCircle size={15} />Trạng thái hệ thống</Link>;
}
