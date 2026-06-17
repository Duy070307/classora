"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function ActivityGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/activity-generator")!} />;
}
