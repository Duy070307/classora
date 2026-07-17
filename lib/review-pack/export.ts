"use client";
import JSZip from "jszip";
import { buildGenericDocxBlob } from "@/lib/export-docx";
import { printGeneratedDocument } from "@/lib/print-document";
import type { ReviewPack } from "@/lib/review-pack/types";
import { reviewPackToDocument } from "@/lib/review-pack/workflow";

type Audience = "student" | "teacher" | "formula" | "practice" | "solutions";
const safeName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
function filename(pack: ReviewPack, audience: Audience) { return `De_cuong_on_tap_${safeName(pack.subject || "Mon")}${safeName(pack.grade || "")}_${safeName(pack.topic || "Chu_de")}_${{ student: "Hoc_sinh", teacher: "Giao_vien", formula: "Cong_thuc", practice: "Luyen_tap", solutions: "Dap_an_loi_giai" }[audience]}`; }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
export async function buildReviewPackDocx(pack: ReviewPack, audience: Audience) { return buildGenericDocxBlob(reviewPackToDocument(pack, audience)); }
export async function downloadReviewPackDocx(pack: ReviewPack, audience: Audience) { download(await buildReviewPackDocx(pack, audience), `${filename(pack, audience)}.docx`); }
export function printReviewPackPdf(pack: ReviewPack, audience: Audience) { printGeneratedDocument(reviewPackToDocument(pack, audience)); }
export async function buildReviewPackZip(pack: ReviewPack) { const zip = new JSZip(); for (const audience of ["student", "teacher", "formula", "practice", "solutions"] as Audience[]) { const blob = await buildReviewPackDocx(pack, audience); zip.file(`${filename(pack, audience)}.docx`, new Uint8Array(await blob.arrayBuffer())); } zip.file("README.txt", "Gói đề cương do SOẠN LAB tạo. Giáo viên cần rà soát trước khi sử dụng chính thức."); return zip.generateAsync({ type: "blob" }); }
export async function downloadReviewPackZip(pack: ReviewPack) { download(await buildReviewPackZip(pack), `${filename(pack, "teacher")}_Day_du.zip`); }
