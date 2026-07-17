import { buildStandaloneTikzDocument, requiredTikzLibraries, sanitizeTikzCode } from "@/lib/ai/extract-tikz";
import type { DiagramObject, TikzDiagramDraft } from "@/lib/tikz/types";

function n(value: number) { return Number(value.toFixed(3)); }
function latexLabel(value = "") { return value.replace(/[{}\\]/g, "").slice(0, 80); }
function pointName(id: string) { return `p${id.replace(/[^a-z0-9]/gi, "").slice(-10)}`; }
function position(object: DiagramObject, index: number) { return object.position || { x: (index % 5) * 1.5, y: Math.floor(index / 5) * 1.5 }; }
function style(object: DiagramObject) { return object.style === "dashed" ? "dashed" : object.style === "dotted" ? "dotted" : "solid"; }

export function generateTikzFromDraft(draft: TikzDiagramDraft) {
  const lines = ["\\begin{tikzpicture}[scale=1, line cap=round, line join=round]"];
  const points = draft.objects.filter((object) => object.type === "point");
  const pointById = new Map(points.map((object, index) => [object.id, { object, position: position(object, index), name: pointName(object.id) }]));
  for (const { position: at, name } of pointById.values()) lines.push(`  \\coordinate (${name}) at (${n(at.x)},${n(at.y)});`);

  for (const object of draft.objects) {
    if (["segment", "ray", "line", "vector", "asymptote", "force_arrow"].includes(object.type)) {
      const linked = (object.points || []).map((id) => pointById.get(id)).filter(Boolean);
      const coordinates = linked.length >= 2 ? linked.map((item) => `(${item!.name})`) : (object.coordinates || []).map((item) => `(${n(item.x)},${n(item.y)})`);
      if (coordinates.length < 2) continue;
      const options = [object.type === "vector" || object.type === "force_arrow" || object.type === "ray" ? "->" : "thick", style(object)].filter((item, index, all) => item !== "solid" && all.indexOf(item) === index);
      lines.push(`  \\draw${options.length ? `[${options.join(", ")}]` : ""} ${coordinates.join(" -- ")};`);
      if (object.label) lines.push(`  \\node[above] at ${coordinates.at(-1)} {$${latexLabel(object.label)}$};`);
    }
    if (object.type === "polygon" || object.type === "polyhedron_face") {
      const coordinates = (object.points || []).map((id) => pointById.get(id)).filter(Boolean).map((item) => `(${item!.name})`);
      if (coordinates.length >= 3) lines.push(`  \\draw[${style(object)}] ${coordinates.join(" -- ")} -- cycle;`);
    }
    if (object.type === "circle") {
      const center = object.points?.[0] ? pointById.get(object.points[0])?.name : undefined; const at = object.position;
      const target = center ? `(${center})` : at ? `(${n(at.x)},${n(at.y)})` : "(0,0)";
      lines.push(`  \\draw[${style(object)}] ${target} circle (${n(object.radius || 1)});`);
    }
    if (object.type === "arc" && object.position) lines.push(`  \\draw[${style(object)}] (${n(object.position.x)},${n(object.position.y)}) arc (0:90:${n(object.radius || 0.5)});`);
    if (object.type === "axis" && object.coordinates?.length && object.coordinates.length >= 2) {
      const [from, to] = object.coordinates; lines.push(`  \\draw[->] (${n(from.x)},${n(from.y)}) -- (${n(to.x)},${n(to.y)}) node[${object.label === "y" ? "above" : "right"}] {$${latexLabel(object.label)}$};`);
    }
    if (object.type === "tick") {
      const axis = String(object.metadata?.axis || "x"); const value = object.value || 0;
      if (axis === "y") lines.push(`  \\draw (-0.08,${n(value)}) -- (0.08,${n(value)});`, `  \\node[left] at (0,${n(value)}) {$${latexLabel(object.label || String(value))}$};`);
      else lines.push(`  \\draw (${n(value)},-0.08) -- (${n(value)},0.08);`, `  \\node[below] at (${n(value)},0) {$${latexLabel(object.label || String(value))}$};`);
    }
    if (object.type === "function_curve" && object.coordinates && object.coordinates.length >= 2) {
      lines.push(`  \\draw[thick] plot[smooth] coordinates {${object.coordinates.map((at) => `(${n(at.x)},${n(at.y)})`).join(" ")}};`);
      if (object.label) { const at = object.coordinates[Math.floor(object.coordinates.length * 0.7)]; lines.push(`  \\node[above right] at (${n(at.x)},${n(at.y)}) {$${latexLabel(object.label)}$};`); }
    }
    if (object.type === "plotted_point" && object.position) {
      lines.push(`  \\fill (${n(object.position.x)},${n(object.position.y)}) circle (1.4pt);`);
      if (object.label) lines.push(`  \\node[${object.anchor || "above right"}] at (${n(object.position.x)},${n(object.position.y)}) {$${latexLabel(object.label)}$};`);
    }
    if (object.type === "bar" && object.position) {
      const width = Number(object.metadata?.width || 0.7); const value = object.value || 0;
      lines.push(`  \\filldraw[fill=blue!15] (${n(object.position.x - width / 2)},0) rectangle (${n(object.position.x + width / 2)},${n(value)});`);
      if (object.label) lines.push(`  \\node[below] at (${n(object.position.x)},0) {${latexLabel(object.label)}};`);
    }
    if (object.type === "optics_ray" && object.coordinates && object.coordinates.length >= 2) lines.push(`  \\draw[->, thick] ${object.coordinates.map((at) => `(${n(at.x)},${n(at.y)})`).join(" -- ")};`);
    if (object.type === "circuit_element" && object.position) lines.push(`  \\node[draw, rounded corners] at (${n(object.position.x)},${n(object.position.y)}) {${latexLabel(object.label || "Phần tử")}};`);
  }

  for (const object of points) {
    const item = pointById.get(object.id)!; lines.push(`  \\fill (${item.name}) circle (1.3pt);`);
    if (object.label) lines.push(`  \\node[${object.anchor || "above right"}] at (${item.name}) {$${latexLabel(object.label)}$};`);
  }
  for (const object of draft.objects.filter((item) => item.type === "label" || item.type === "annotation" || item.type === "chart_label")) {
    if (object.position && (object.text || object.label)) lines.push(`  \\node[${object.anchor || "above"}] at (${n(object.position.x)},${n(object.position.y)}) {${latexLabel(object.text || object.label)}};`);
  }
  for (const marker of draft.objects.filter((object) => object.type === "right_angle_marker")) {
    const vertex = marker.points?.[0] ? pointById.get(marker.points[0]) : undefined; if (!vertex) continue;
    lines.push(`  \\draw[thick] (${vertex.name}) ++(0.22,0) -- ++(0,0.22) -- ++(-0.22,0); % right-angle-marker ${latexLabel(vertex.object.label)}`);
  }
  lines.push("\\end{tikzpicture}");
  const snippet = sanitizeTikzCode(lines.join("\n"));
  return { snippet, standalone: buildStandaloneTikzDocument(snippet), libraries: requiredTikzLibraries(snippet), packages: ["tikz"] };
}
