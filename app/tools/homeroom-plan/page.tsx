"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function HomeroomPlanPage() {
  return <ToolFormLayout config={getToolConfig("/tools/homeroom-plan")!} />;
}
