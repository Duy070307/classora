import { readFile } from "node:fs/promises";
import { createTikzDiagramDraft } from "@/lib/tikz/model";
import { preprocessDiagramImage, type PreprocessSettings } from "@/lib/tikz/preprocess";
import { renderTikzDraftToSvg } from "@/lib/tikz/render-svg";
import { generateTikzFromDraft } from "@/lib/tikz/generator";
import { validateTikzDraft } from "@/lib/tikz/validation";
import type { DiagramClass, DiagramObjectType, DiagramRelationshipType } from "@/lib/tikz/types";

export type TikzQaFixture = {
  id: string;
  sourceKind: "synthetic" | "scanned" | "photographed";
  category: "solid_geometry" | "function_graph" | "line_angle_diagram" | "plane_geometry" | "degraded_photo";
  sourceImage: string;
  expectedClassification: DiagramClass;
  rawStructure: Record<string, unknown>;
  requiredObjects: DiagramObjectType[];
  requiredRelationships: DiagramRelationshipType[];
  forbiddenDuplicateLabels?: string[];
  expectedWarnings?: string[];
  preprocessing?: PreprocessSettings;
};

export async function runTikzQaFixture(fixture: TikzQaFixture) {
  const source = await readFile(fixture.sourceImage);
  const processed = await preprocessDiagramImage(source, fixture.preprocessing);
  const initial = createTikzDiagramDraft({
    sourceHash: processed.sourceHash,
    sourceName: fixture.id,
    width: processed.originalWidth,
    height: processed.originalHeight,
    processedWidth: processed.processedWidth,
    processedHeight: processed.processedHeight,
    rawStructure: fixture.rawStructure,
    tikzCode: "\\begin{tikzpicture}\n\\end{tikzpicture}",
    warnings: processed.warnings,
  });
  const generated = generateTikzFromDraft(initial);
  const draft = {
    ...initial,
    tikz: {
      ...initial.tikz,
      snippet: generated.snippet,
      generatedSnippet: generated.snippet,
      standalone: generated.standalone,
      libraries: generated.libraries,
      packages: generated.packages,
    },
  };
  const validation = validateTikzDraft(draft);
  const rendered = renderTikzDraftToSvg(draft);
  const labels = draft.objects.map((item) => item.label).filter(Boolean) as string[];
  const duplicateLabels = [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))];
  return {
    fixtureId: fixture.id,
    sourceKind: fixture.sourceKind,
    sourceHash: processed.sourceHash,
    settingsHash: processed.settingsHash,
    classification: draft.classification.type,
    objectTypes: [...new Set(draft.objects.map((item) => item.type))],
    relationshipTypes: [...new Set(draft.relationships.map((item) => item.type))],
    duplicateLabels,
    tikz: generated.snippet,
    svg: rendered.svg,
    svgValid: rendered.valid,
    validation,
    warnings: [...processed.warnings, ...validation.warnings],
  };
}
