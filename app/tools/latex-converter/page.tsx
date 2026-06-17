"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function LatexConverterPage() {
  return <ToolFormLayout config={getToolConfig("/tools/latex-converter")!} />;
}
