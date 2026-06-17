"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function ParentMessageGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/parent-message-generator")!} />;
}
