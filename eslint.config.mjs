import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  { ignores: ["public/pdf.worker.min.mjs", ".agents/**", ".codex/**"] },
];

export default eslintConfig;
