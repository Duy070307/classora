"use client";

import Image from "next/image";
import Link from "next/link";

export const BRAND_SUBTITLE = "Bộ công cụ hỗ trợ giáo viên";
export const BRAND_ACCESSIBLE_NAME = `SOẠN LAB – ${BRAND_SUBTITLE}`;

export type BrandLockupVariant = "default" | "compact" | "inverse" | "iconOnly";

type BrandLockupProps = {
  variant?: BrandLockupVariant;
  href?: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

export function BrandLockup({
  variant = "default",
  href,
  className = "",
  priority = false,
  onClick,
}: BrandLockupProps) {
  const iconOnly = variant === "iconOnly";
  const inverse = variant === "inverse";
  const compact = variant === "compact";
  const iconSize = iconOnly ? "size-8" : compact ? "size-[34px]" : "size-[38px]";

  const icon = (
    <Image
      src="/brand/soan-lab-mark.png"
      alt=""
      width={128}
      height={128}
      priority={priority}
      className={`${iconSize} shrink-0 object-contain`}
      aria-hidden="true"
    />
  );

  const content = iconOnly ? icon : (
    <span className="inline-flex h-11 min-w-0 items-center gap-2.5 whitespace-nowrap">
      {icon}
      <span className="min-w-0 leading-none">
        <span className={`block whitespace-nowrap text-[16px] font-bold leading-5 tracking-normal ${inverse ? "text-white" : "text-slate-900"}`}>
          SOẠN LAB
        </span>
        <span className={`mt-0.5 block whitespace-nowrap text-xs font-medium leading-4 ${compact ? "max-[339px]:hidden" : ""} ${inverse ? "text-blue-100" : "text-slate-500"}`}>
          {BRAND_SUBTITLE}
        </span>
      </span>
    </span>
  );

  const classes = `inline-flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${inverse ? "hover:opacity-90 focus-visible:ring-offset-[#1E3A5F]" : "hover:opacity-90"} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={BRAND_ACCESSIBLE_NAME} onClick={onClick} title={iconOnly ? BRAND_ACCESSIBLE_NAME : undefined}>
        {content}
      </Link>
    );
  }

  if (iconOnly) {
    return <span className={classes} role="img" aria-label={BRAND_ACCESSIBLE_NAME} title={BRAND_ACCESSIBLE_NAME}>{content}</span>;
  }

  return <span className={classes}>{content}</span>;
}
