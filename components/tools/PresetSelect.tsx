"use client";

import { useState } from "react";
import type { ToolPreset } from "@/lib/presets";
import type { GenericToolInput } from "@/lib/types";

export function PresetSelect({ presets, onApply }: { presets: ToolPreset[]; onApply: (data: GenericToolInput) => void }) {
  const [selected, setSelected] = useState("");
  if (!presets.length) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/45 p-3">
      <label className="label">Mẫu thiết lập nhanh</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`min-h-9 rounded-full px-3 text-xs font-bold transition ${selected === preset.name ? "bg-indigo-600 text-white shadow-md" : "bg-white text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-50"}`}
            onClick={() => {
              setSelected(preset.name);
              onApply(preset.data as GenericToolInput);
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
