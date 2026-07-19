type VertexId = "S" | "A" | "B" | "C" | "D";
type EdgeStyle = "solid" | "dashed";

type PyramidVertex = {
  id: VertexId;
  svg: { x: number; y: number; labelX: number; labelY: number; anchor: "start" | "middle" | "end" };
  tikz: [number, number];
  nodePosition: "above" | "below left" | "below" | "right" | "left";
};

export const LANDING_PYRAMID_VERTICES: readonly PyramidVertex[] = [
  { id: "S", svg: { x: 115, y: 20, labelX: 115, labelY: 14, anchor: "middle" }, tikz: [2, 3], nodePosition: "above" },
  { id: "A", svg: { x: 35, y: 142, labelX: 27, labelY: 158, anchor: "end" }, tikz: [0, 0], nodePosition: "below left" },
  { id: "B", svg: { x: 150, y: 142, labelX: 150, labelY: 160, anchor: "middle" }, tikz: [3, 0], nodePosition: "below" },
  { id: "C", svg: { x: 205, y: 102, labelX: 214, labelY: 106, anchor: "start" }, tikz: [4, 1], nodePosition: "right" },
  { id: "D", svg: { x: 80, y: 102, labelX: 70, labelY: 100, anchor: "end" }, tikz: [1, 1], nodePosition: "left" },
] as const;

export const LANDING_PYRAMID_EDGES = [
  { id: "AB", from: "A", to: "B", style: "solid" },
  { id: "BC", from: "B", to: "C", style: "solid" },
  { id: "DC", from: "D", to: "C", style: "dashed" },
  { id: "AD", from: "A", to: "D", style: "dashed" },
  { id: "SA", from: "S", to: "A", style: "solid" },
  { id: "SB", from: "S", to: "B", style: "solid" },
  { id: "SC", from: "S", to: "C", style: "solid" },
  { id: "SD", from: "S", to: "D", style: "dashed" },
] as const satisfies readonly { id: string; from: VertexId; to: VertexId; style: EdgeStyle }[];

const vertexById = new Map(LANDING_PYRAMID_VERTICES.map((vertex) => [vertex.id, vertex]));

function tikzDrawCommand(from: VertexId, to: VertexId, style: EdgeStyle) {
  return `  \\draw${style === "dashed" ? "[dashed]" : ""} (${from})--(${to});`;
}

export const LANDING_PYRAMID_TIKZ = [
  "\\begin{tikzpicture}[scale=1]",
  ...LANDING_PYRAMID_VERTICES.map(({ id, tikz: [x, y] }) => `  \\coordinate (${id}) at (${x},${y});`),
  "",
  ...LANDING_PYRAMID_EDGES.map(({ from, to, style }) => tikzDrawCommand(from, to, style)),
  "",
  ...LANDING_PYRAMID_VERTICES.map(({ id, nodePosition }) => `  \\node[${nodePosition}] at (${id}) {${id}};`),
  "\\end{tikzpicture}",
].join("\n");

export function LandingPyramidFigure() {
  return (
    <svg viewBox="0 0 240 180" className="h-48 w-64 max-w-full" role="img" aria-label="Hình chóp S.ABCD với AD, DC và SD là các cạnh khuất nét đứt">
      <g fill="none" stroke="#1e293b" strokeWidth="2.25" strokeLinecap="round">
        {LANDING_PYRAMID_EDGES.map((edge) => {
          const from = vertexById.get(edge.from)!;
          const to = vertexById.get(edge.to)!;
          return (
            <line
              key={edge.id}
              data-edge={edge.id}
              data-style={edge.style}
              x1={from.svg.x}
              y1={from.svg.y}
              x2={to.svg.x}
              y2={to.svg.y}
              strokeDasharray={edge.style === "dashed" ? "8 6" : undefined}
            />
          );
        })}
      </g>
      {LANDING_PYRAMID_VERTICES.map((vertex) => (
        <text
          key={vertex.id}
          x={vertex.svg.labelX}
          y={vertex.svg.labelY}
          textAnchor={vertex.svg.anchor}
          fill="#0f172a"
          fontSize="13"
          fontWeight="600"
        >
          {vertex.id}
        </text>
      ))}
    </svg>
  );
}

export function LandingTikzShowcase() {
  return (
    <div className="mt-10 grid overflow-hidden border border-slate-700 bg-slate-900 lg:grid-cols-3">
      <div className="border-b border-slate-700 p-5 lg:border-b-0 lg:border-r">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">1 · Ảnh nguồn</p>
        <div className="mt-4 flex min-h-64 items-center justify-center bg-slate-100"><LandingPyramidFigure /></div>
      </div>
      <div className="border-b border-slate-700 p-5 lg:border-b-0 lg:border-r">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">2 · Bản xem trước</p>
        <div className="mt-4 flex min-h-64 items-center justify-center bg-white"><LandingPyramidFigure /></div>
      </div>
      <div className="min-w-0 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">3 · Mã TikZ</p>
        <pre className="mt-4 min-h-64 overflow-x-auto bg-slate-950 p-4 text-xs leading-6 text-slate-300"><code>{LANDING_PYRAMID_TIKZ}</code></pre>
      </div>
    </div>
  );
}
