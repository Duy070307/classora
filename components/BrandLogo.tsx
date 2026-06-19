"use client";

import Image from "next/image";
import { useState } from "react";

export function BrandLogo({ variant, compact = false, inverse = false }: { variant?: "full" | "mark"; compact?: boolean; inverse?: boolean }) {
  const [failed, setFailed] = useState(false);
  const resolvedVariant = variant ?? (compact ? "mark" : "full");

  if (resolvedVariant === "full" && !failed) {
    return <span className={`relative block shrink-0 overflow-hidden ${compact ? "h-10 w-[142px] sm:w-[154px]" : "h-14 w-[190px] sm:w-[220px]"}`}>
      <Image src="/brand/soan-lab-logo-full.png" alt="Soạn Lab" width={500} height={500} priority onError={() => setFailed(true)} className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2 object-contain" />
    </span>;
  }

  return <span className="inline-flex min-w-0 items-center gap-2.5">
    {!failed ? <Image src="/brand/soan-lab-mark.png" alt="" width={120} height={180} priority onError={() => setFailed(true)} className={`shrink-0 object-contain ${compact ? "h-9 w-7" : "h-11 w-8"}`} /> : <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 font-black text-white shadow-md ${compact ? "h-9 w-9 text-base" : "h-11 w-11 text-lg"}`}>S</span>}
    <span className={`truncate font-extrabold tracking-tight ${compact ? "text-lg" : "text-xl"} ${inverse ? "text-white" : "text-ink"}`}>Soạn Lab</span>
  </span>;
}
