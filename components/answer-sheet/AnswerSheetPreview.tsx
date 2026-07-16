"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { AnswerSheetPageLayout } from "@/lib/answer-sheet/types";

export function AnswerSheetPreview({ page }: { page: AnswerSheetPageLayout }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    let active = true;
    const task = page.qrPayload ? QRCode.toDataURL(page.qrPayload, { margin: 0, width: 220 }) : Promise.resolve("");
    void task.then((value) => { if (active) setQr(value); });
    return () => { active = false; };
  }, [page.qrPayload]);
  return <svg viewBox={`0 0 ${page.width} ${page.height}`} className="h-auto w-full bg-white" role="img" aria-label={`Xem trước trang ${page.pageNumber}`}>
    {page.primitives.map((item, index) => {
      if (item.kind === "text") return <text key={index} x={item.align === "center" && item.width ? item.x + item.width / 2 : item.align === "right" && item.width ? item.x + item.width : item.x} y={item.y + item.size} fontSize={item.size} fontWeight={item.bold ? 700 : 400} textAnchor={item.align === "center" ? "middle" : item.align === "right" ? "end" : "start"} fill="#111827">{item.text}</text>;
      if (item.kind === "line") return <line key={index} x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke="#111827" strokeWidth={item.width || 0.7} strokeDasharray={item.dash ? "4 3" : undefined}/>;
      if (item.kind === "circle") return <circle key={index} cx={item.x} cy={item.y} r={item.radius} fill={item.fill || "white"} stroke="#111827" strokeWidth={item.lineWidth || 0.8}/>;
      return <rect key={index} x={item.x} y={item.y} width={item.width} height={item.height} rx={item.radius || 0} fill={item.fill || "white"} stroke={item.lineWidth === 0 ? item.fill : "#111827"} strokeWidth={item.lineWidth ?? 0.7}/>;
    })}
    {qr ? page.recognitionRegions.filter((region) => region.type === "qr").map((region) => <image key={region.id} href={qr} x={region.boundingBox.x} y={region.boundingBox.y} width={region.boundingBox.width} height={region.boundingBox.height}/>) : null}
  </svg>;
}
