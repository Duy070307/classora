"use client";

import type { PrivateTikzAssetRef } from "@/lib/tikz/types";

export async function fileToPrivateDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => reject(new Error("file_read_failed")); reader.readAsDataURL(file);
  });
}

export async function uploadPrivateTikzAsset(file: Blob, kind: PrivateTikzAssetRef["kind"], assetId?: string): Promise<PrivateTikzAssetRef | null> {
  const form = new FormData(); form.set("file", file, kind === "source" ? "source.bin" : `diagram.${kind}`); form.set("kind", kind); if (assetId) form.set("assetId", assetId);
  const response = await fetch("/api/tikz/assets", { method: "POST", body: form });
  if (!response.ok) return null;
  const result = await response.json() as { ok?: boolean; asset?: PrivateTikzAssetRef };
  return result.ok && result.asset ? result.asset : null;
}

export function privateTikzAssetUrl(assetId: string, kind: PrivateTikzAssetRef["kind"] = "source") {
  return `/api/tikz/assets?id=${encodeURIComponent(assetId)}&kind=${kind}`;
}

export async function deletePrivateTikzAsset(assetId: string) {
  const query = new URLSearchParams({ id: assetId });
  const response = await fetch(`/api/tikz/assets?${query}`, { method: "DELETE" });
  return response.ok;
}
