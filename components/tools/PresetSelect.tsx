"use client";

import { useState } from "react";
import type { ToolPreset } from "@/lib/presets";
import type { GenericToolInput } from "@/lib/types";

export function PresetSelect({ presets, onApply }: { presets: ToolPreset[]; onApply: (data: GenericToolInput) => void }) {
  const [selected, setSelected] = useState("");
  if (!presets.length) return null;

  return (
    <div>
      <label className="label">Dùng mẫu nhanh</label>
      <div className="mt-1 flex gap-2">
        <select className="form-field" value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">Chọn mẫu...</option>
          {presets.map((preset) => (
            <option key={preset.name}>{preset.name}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary shrink-0"
          disabled={!selected}
          onClick={() => {
            const preset = presets.find((item) => item.name === selected);
            if (preset) onApply(preset.data as GenericToolInput);
          }}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}
