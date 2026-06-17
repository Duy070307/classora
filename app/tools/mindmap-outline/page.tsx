"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function MindmapOutlinePage() {
  return <ToolFormLayout config={getToolConfig("/tools/mindmap-outline")!} />;
}
