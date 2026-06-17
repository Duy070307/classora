"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function MatrixGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/matrix-generator")!} />;
}
