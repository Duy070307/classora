"use client";

import JSZip from "jszip";
import { buildGenericDocxBlob } from "@/lib/export-docx";
import { printGeneratedDocument } from "@/lib/print-document";
import type { Worksheet, WorksheetLevel } from "@/lib/worksheet/types";
import { worksheetToDocument } from "@/lib/worksheet/workflow";

const accents = (value:string) => value.replace(/đ/g,"d").replace(/Đ/g,"D").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"_").replace(/^_|_$/g,"");
const levelName:Record<WorksheetLevel,string>={basic:"Co_ban",standard:"Tieu_chuan",advanced:"Nang_cao"};
function fileBase(worksheet:Worksheet){return `Phieu_hoc_tap_${accents(worksheet.subject||"")}_${accents(worksheet.grade||"")}_${accents(worksheet.topic||worksheet.title)}`.replace(/_+/g,"_");}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export async function downloadWorksheetDocx(worksheet:Worksheet,audience:"student"|"teacher",level?:WorksheetLevel){const blob=await buildGenericDocxBlob(worksheetToDocument(worksheet,audience,level));download(blob,`${fileBase(worksheet)}_${level?`${levelName[level]}_`:""}${audience==="student"?"Hoc_sinh":"Giao_vien"}.docx`);}
export function printWorksheetPdf(worksheet:Worksheet,audience:"student"|"teacher",level?:WorksheetLevel){printGeneratedDocument(worksheetToDocument(worksheet,audience,level));}
export async function downloadDifferentiatedWorksheetZip(worksheet:Worksheet){const zip=new JSZip();const levels:WorksheetLevel[]=worksheet.differentiation==="three_levels"?["basic","standard","advanced"]:worksheet.differentiation==="basic_advanced"?["basic","advanced"]:["standard"];for(const level of levels){for(const audience of ["student","teacher"] as const){const blob=await buildGenericDocxBlob(worksheetToDocument(worksheet,audience,level));zip.file(`${fileBase(worksheet)}_${levelName[level]}_${audience==="student"?"Hoc_sinh":"Giao_vien"}.docx`,blob);}}download(await zip.generateAsync({type:"blob"}),`${fileBase(worksheet)}_Phan_hoa.zip`);}
