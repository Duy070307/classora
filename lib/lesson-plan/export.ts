"use client";
import { buildGenericDocxBlob } from "@/lib/export-docx";
import { printGeneratedDocument } from "@/lib/print-document";
import type { LessonPlan } from "@/lib/lesson-plan/types";
import { lessonPlanToDocument, type LessonExportFormat } from "@/lib/lesson-plan/workflow";
const accents=(value:string)=>value.replace(/đ/g,"d").replace(/Đ/g,"D").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"_").replace(/^_|_$/g,"");
const names:Record<LessonExportFormat,string>={short:"Rut_gon",full:"Day_du",teacher_student_table:"Bang_GV_HS",timeline:"Tien_trinh",appendices:"Kem_phu_luc"};
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function downloadLessonPlanDocx(plan:LessonPlan,format:LessonExportFormat="full"){download(await buildGenericDocxBlob(lessonPlanToDocument(plan,format)),`Giao_an_${accents(plan.subject||"")}_${accents(plan.grade||"")}_${accents(plan.topic||plan.title)}_${names[format]}.docx`.replace(/_+/g,"_"));}
export function printLessonPlanPdf(plan:LessonPlan,format:LessonExportFormat="full"){if(format==="teacher_student_table"&&!window.confirm("Bảng giáo viên/học sinh có nhiều cột và có thể hẹp khi in PDF. Nên ưu tiên Word nếu cần tiếp tục chỉnh sửa. Tiếp tục mở bản in?"))return;printGeneratedDocument(lessonPlanToDocument(plan,format));}
