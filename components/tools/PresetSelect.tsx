"use client";

import { useState } from "react";
import type { ToolPreset } from "@/lib/presets";
import type { GenericToolInput } from "@/lib/types";

export function PresetSelect({ presets, onApply }: { presets: ToolPreset[]; onApply: (data: GenericToolInput) => void }) {
  const [selected, setSelected] = useState("");
  if (!presets.length) return null;

  return (
    <div className="border-y border-slate-200 py-3">
      <label className="label">Mẫu thiết lập nhanh</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`min-h-9 rounded-md border px-3 text-xs font-semibold transition ${selected === preset.name ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50"}`}
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
