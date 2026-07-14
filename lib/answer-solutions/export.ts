"use client";

import JSZip from "jszip";
import { buildGenericDocxBlob } from "@/lib/export-docx";
import { solutionSetToDocument, variantSolutionDocuments } from "@/lib/answer-solutions/document";
import type { ExamSolutionSet } from "@/lib/answer-solutions/types";
import type { GeneratedDocument } from "@/lib/types";

function safeName(value: string) {
  return value.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "SoanLab";
}

export async function buildSolutionZip(source: GeneratedDocument, set: ExamSolutionSet) {
  const zip = new JSZip();
  for (const mode of ["quick", "detailed", "scoring"] as const) {
    const document = solutionSetToDocument(source, set, mode);
    zip.file(`${safeName(document.title)}.docx`, await (await buildGenericDocxBlob(document)).arrayBuffer());
  }
  if (source.examVariantSet) {
    for (const document of variantSolutionDocuments(source, set, source.examVariantSet, "detailed")) {
      zip.file(`${safeName(document.title)}.docx`, await (await buildGenericDocxBlob(document)).arrayBuffer());
    }
  }
  zip.file("LUU_Y.txt", "Các file trong gói này chỉ dành cho giáo viên. Không phát hành kèm đề học sinh. Giáo viên cần rà soát trước khi sử dụng.");
  return zip.generateAsync({ type: "blob" });
}

export async function exportSolutionZip(source: GeneratedDocument, set: ExamSolutionSet) {
  const blob = await buildSolutionZip(source, set);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeName(`Goi_dap_an_${source.title}`)}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

