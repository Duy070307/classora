"use client";

import { useState } from "react";
import type { ToolPreset } from "@/lib/presets";
import type { GenericToolInput } from "@/lib/types";

export function PresetSelect({ presets, onApply }: { presets: ToolPreset[]; onApply: (data: GenericToolInput) => void }) {
  const [selected, setSelected] = useState("");
  if (!presets.length) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/45 p-3">
      <label className="label">Mẫu thiết lập nhanh</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition ${selected === preset.name ? "bg-blue-600 text-white" : "bg-white text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50"}`}
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
