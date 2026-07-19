import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LANDING_PYRAMID_EDGES,
  LANDING_PYRAMID_TIKZ,
  LandingPyramidFigure,
  LandingTikzShowcase,
} from "../components/landing/LandingTikzShowcase";

const edgeById = new Map(LANDING_PYRAMID_EDGES.map((edge) => [edge.id, edge]));

assert.equal(edgeById.get("AD")?.style, "dashed", "AD phải là cạnh nét đứt");
assert.equal(edgeById.get("DC")?.style, "dashed", "DC phải là cạnh nét đứt");
assert.equal(edgeById.get("AB")?.style, "solid", "AB phải giữ nét liền");
assert.equal(edgeById.get("BC")?.style, "solid", "BC phải giữ nét liền");
assert.equal(edgeById.get("SD")?.style, "dashed", "SD phải nhất quán là cạnh khuất nét đứt");

const normalizedPairs = LANDING_PYRAMID_EDGES.map(({ from, to }) => [from, to].sort().join(""));
assert.equal(new Set(normalizedPairs).size, LANDING_PYRAMID_EDGES.length, "Không được vẽ trùng bất kỳ cạnh nào");

for (const { id, from, to, style } of LANDING_PYRAMID_EDGES) {
  const option = style === "dashed" ? "\\[dashed\\]" : "";
  assert.match(
    LANDING_PYRAMID_TIKZ,
    new RegExp(`\\\\draw${option} \\(${from}\\)--\\(${to}\\);`),
    `Mã TikZ của ${id} phải khớp kiểu nét trong cấu hình SVG`,
  );
}

const figureMarkup = renderToStaticMarkup(createElement(LandingPyramidFigure));
for (const { id, style } of LANDING_PYRAMID_EDGES) {
  assert.equal((figureMarkup.match(new RegExp(`data-edge="${id}"`, "g")) ?? []).length, 1, `${id} chỉ được render một lần trong mỗi SVG`);
  assert.match(figureMarkup, new RegExp(`data-edge="${id}" data-style="${style}"`));
}
assert.equal((figureMarkup.match(/<line /g) ?? []).length, LANDING_PYRAMID_EDGES.length);
assert.doesNotMatch(figureMarkup, /<path /, "Không dùng path khép kín có thể vẽ đè cạnh khuất");

const showcaseMarkup = renderToStaticMarkup(createElement(LandingTikzShowcase));
assert.equal((showcaseMarkup.match(/<svg /g) ?? []).length, 2, "Ảnh nguồn và preview phải cùng dùng component SVG chuẩn");
for (const { id } of LANDING_PYRAMID_EDGES) {
  assert.equal((showcaseMarkup.match(new RegExp(`data-edge="${id}"`, "g")) ?? []).length, 2, `${id} xuất hiện đúng một lần ở mỗi panel SVG`);
}
assert.ok(showcaseMarkup.includes(LANDING_PYRAMID_TIKZ), "Panel mã phải hiển thị đúng mã được sinh từ cùng cấu hình cạnh");

console.log("Landing TikZ showcase: AD/DC/SD nét đứt, AB/BC nét liền, SVG và mã TikZ đồng bộ, không có cạnh trùng.");
