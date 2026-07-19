import JSZip from "jszip";
import type { StructuredExam } from "@/lib/exam-types";

export type ExamDocxValidation = { valid: boolean; errors: string[]; questionCount: number; hasOmml: boolean; hasTeacherSection: boolean };

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&apos;/g, "'");
}

function visibleText(xml: string) {
  return decodeXml(xml.replace(/<w:tab\/?\s*>/g, "\t").replace(/<w:br\/?\s*>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, ""));
}

function isWellFormedXml(xml: string) {
  const stack: string[] = [];
  const tags = xml.match(/<[^>]+>/g) || [];
  for (const tag of tags) {
    if (/^<\?|^<!|\/>$/.test(tag)) continue;
    const closing = tag.match(/^<\/([\w:.-]+)>$/)?.[1];
    if (closing) { if (stack.pop() !== closing) return false; continue; }
    const opening = tag.match(/^<([\w:.-]+)(?:\s|>)/)?.[1];
    if (opening) stack.push(opening);
  }
  return stack.length === 0;
}

function sourceHasMath(exam: StructuredExam) {
  return exam.parts.flatMap((part) => part.questions).some((question) => {
    const value = [question.stem, question.answer, question.explanation, ...Object.values(question.options || {})].join(" ");
    return /\$[^$]+\$|\\\([^)]*\\\)|\\\[[\s\S]*?\\\]|(?:[a-z]\s*[=<>]|\^\s*\{?\d)/i.test(value);
  });
}

export async function validateExamDocxBlob(blob: Blob, exam: StructuredExam, options: { includeTeacher?: boolean } = {}): Promise<ExamDocxValidation> {
  const errors: string[] = [];
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(await blob.arrayBuffer()); }
  catch { return { valid: false, errors: ["invalid_zip"], questionCount: 0, hasOmml: false, hasTeacherSection: false }; }
  const required = ["[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/styles.xml"];
  required.forEach((path) => { if (!zip.file(path)) errors.push(`missing:${path}`); });
  const xml = await zip.file("word/document.xml")?.async("string") || "";
  if (!xml || !isWellFormedXml(xml)) errors.push("malformed_document_xml");
  const text = visibleText(xml);
  const teacherMarker = text.indexOf("PHẦN DÀNH CHO GIÁO VIÊN");
  const studentText = teacherMarker >= 0 ? text.slice(0, teacherMarker) : text;
  const expectedQuestions = exam.parts.reduce((sum, part) => sum + part.questions.length, 0);
  const questionCount = [...studentText.matchAll(/(?:^|\n)\s*Câu\s+\d+\./giu)].length;
  if (questionCount !== expectedQuestions) errors.push(`question_count:${questionCount}/${expectedQuestions}`);
  const includeTeacher = options.includeTeacher !== false;
  const hasTeacherSection = teacherMarker >= 0;
  if (includeTeacher && !hasTeacherSection) errors.push("missing_teacher_section");
  if (!includeTeacher && /PHẦN DÀNH CHO GIÁO VIÊN|ĐÁP ÁN VÀ THANG ĐIỂM|GHI CHÚ GIÁO VIÊN/u.test(studentText)) errors.push("student_answer_leakage");
  const hasOmml = /<m:oMath(?:Para)?\b/.test(xml);
  if (sourceHasMath(exam) && !hasOmml) errors.push("missing_omml");
  if (/\$\$?|\\\(|\\\)|\\\[|\\\]/.test(text)) errors.push("raw_math_delimiter");
  if (/phương án nhiễu|lorem ipsum|\[chèn[^\]]*\]/iu.test(text)) errors.push("placeholder_content");
  const relationIds = [...xml.matchAll(/r:(?:id|embed|link)="([^"]+)"/g)].map((match) => match[1]);
  if (relationIds.length) {
    const relations = await zip.file("word/_rels/document.xml.rels")?.async("string") || "";
    if (!relations || !isWellFormedXml(relations)) errors.push("invalid_document_relationships");
    else relationIds.filter((id) => !relations.includes(`Id="${id}"`)).forEach((id) => errors.push(`missing_relationship:${id}`));
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], questionCount, hasOmml, hasTeacherSection };
}
