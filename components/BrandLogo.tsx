"use client";

import Image from "next/image";
import { FlaskConical } from "lucide-react";
import { useState } from "react";

export function BrandLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = compact ? 36 : 46;
  return <span className="inline-flex min-w-0 items-center gap-3">
    {!failed ? <Image src="/brand/soan-lab-logo.png" alt="" width={size} height={size} className="rounded-xl object-contain" onError={() => setFailed(true)} priority /> : <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200 ${compact ? "h-9 w-9" : "h-11 w-11"}`}><FlaskConical size={compact ? 19 : 23} /></span>}
    <span className={`truncate font-extrabold tracking-tight ${compact ? "text-xl" : "text-2xl"} ${inverse ? "text-white" : "text-ink"}`}>Soạn Lab</span>
  </span>;
}
