"use client";

import { useEffect, useState } from "react";
import { getTemplates, type TemplateItem } from "@/lib/templates";

export function TemplateSelect({
  type,
  value,
  onChange
}: {
  type: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  useEffect(() => {
    queueMicrotask(() => setTemplates(getTemplates().filter((item) => item.type === type)));
  }, [type]);

  return (
    <div>
      <label className="label">Mẫu tài liệu</label>
      <select className="form-field mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Không dùng mẫu</option>
        {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      {!templates.length ? <p className="mt-1 text-xs text-muted">Chưa có mẫu phù hợp trong mục Mẫu cá nhân.</p> : null}
    </div>
  );
}
