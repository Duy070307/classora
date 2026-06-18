"use client";

import { useEffect, useState } from "react";
import { getBuiltInTemplatesForType } from "@/lib/built-in-templates";
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
  const builtIns = getBuiltInTemplatesForType(type);

  useEffect(() => {
    queueMicrotask(() => setTemplates(getTemplates().filter((item) => item.type === type)));
  }, [type]);

  return (
    <div>
      <label className="label">Mẫu tài liệu</label>
      <select className="form-field mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Tự động</option>
        {builtIns.length ? <optgroup label="Mẫu có sẵn">
          {builtIns.map((item) => <option key={item.id} value={`builtin:${item.id}`}>{item.name}</option>)}
        </optgroup> : null}
        {templates.length ? <optgroup label="Mẫu cá nhân">
          {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </optgroup> : null}
      </select>
      <p className="mt-1 text-xs text-muted">
        {templates.length || builtIns.length ? "Chọn “Tự động” để giữ output mặc định, hoặc chọn mẫu để bọc nội dung bằng placeholder." : "Chưa có mẫu phù hợp trong mục Mẫu cá nhân."}
      </p>
    </div>
  );
}
