"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function SlideOutlineGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/slide-outline-generator")!} />;
}
