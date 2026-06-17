"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function RubricGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/rubric-generator")!} />;
}
