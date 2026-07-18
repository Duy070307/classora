"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type BrandLogoProps = {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  inverse?: boolean;
  showSubtitle?: boolean;
  href?: string;
  className?: string;
};

const sizeStyles = {
  sm: {
    box: "h-9 w-9 rounded-lg",
    mark: "h-6 w-6",
    fallback: "text-base",
    word: "text-[15px]",
    subtitle: "text-[11px]",
    gap: "gap-2.5",
  },
  md: {
    box: "h-10 w-10 rounded-lg",
    mark: "h-7 w-7",
    fallback: "text-lg",
    word: "text-[17px]",
    subtitle: "text-[12px]",
    gap: "gap-3",
  },
  lg: {
    box: "h-11 w-11 rounded-lg",
    mark: "h-8 w-8",
    fallback: "text-xl",
    word: "text-[19px]",
    subtitle: "text-[12px]",
    gap: "gap-3",
  },
};

export function BrandLogo({
  variant = "full",
  size,
  compact = false,
  inverse = false,
  showSubtitle = false,
  href,
  className = "",
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSize = size || (compact ? "sm" : "md");
  const styles = sizeStyles[resolvedSize];
  const textColor = inverse ? "text-white" : "text-slate-950";
  const subtitleColor = inverse ? "text-white/70" : "text-slate-500";

  const mark = (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-blue-100 bg-blue-50/90 ring-1 ring-white/80 ${styles.box}`}
    >
      {!failed ? (
        <Image
          src="/brand/soan-lab-mark.png"
          alt=""
          width={120}
          height={180}
          priority
          onError={() => setFailed(true)}
          className={`object-contain ${styles.mark}`}
        />
      ) : (
        <span className={`font-extrabold tracking-tight text-blue-700 ${styles.fallback}`}>S</span>
      )}
      <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/80" />
    </span>
  );

  const content = variant === "mark" ? (
    mark
  ) : (
    <span className={`inline-flex min-w-0 items-center ${styles.gap}`}>
      {mark}
      <span className="min-w-0 translate-y-px">
        <span className={`block truncate font-extrabold uppercase leading-none tracking-[0.035em] ${styles.word} ${textColor}`}>
          SOẠN LAB
        </span>
        {showSubtitle ? (
          <span className={`mt-1 block truncate font-medium leading-none ${styles.subtitle} ${subtitleColor}`}>
            Dành cho giáo viên
          </span>
        ) : null}
      </span>
    </span>
  );

  const classes = `inline-flex min-w-0 items-center rounded-lg transition ${href ? "hover:bg-slate-50" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="Soạn Lab">
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}
