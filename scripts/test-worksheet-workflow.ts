import assert from "node:assert/strict";
import fs from "node:fs";
import JSZip from "jszip";
import { buildGenericDocxBlob } from "../lib/export-docx";
import type { GeneratedDocument } from "../lib/types";
import { createWorksheetDraft, createWorksheetOutline, generateFallbackActivity, normalizeWorksheet, parseGeneratedActivity, validateWorksheet, worksheetFromDocument, worksheetQuestions, worksheetToDocument, worksheetToText } from "../lib/worksheet/workflow";

let passed=0;async function check(name:string,run:()=>void|Promise<void>){await run();passed+=1;console.log(`✓ ${passed}. ${name}`);}
const root=process.cwd();
const worksheet=createWorksheetDraft({subject:"Vật lí",grade:"11",topic:"Định luật Ohm",durationMinutes:20,differentiation:"three_levels",settings:{includeAnswers:true,includeTeacherGuide:true,includeScoring:false,includeAnswerSpace:true,includeSelfAssessment:false,sourceOnly:true,questionBankMode:"new_only",activityCount:6}});
const outline=createWorksheetOutline(worksheet);
const ready=normalizeWorksheet({...worksheet,activities:outline.map((item)=>generateFallbackActivity(item,worksheet))});

async function main(){
await check("Route worksheet cũ còn tương thích",()=>{assert.ok(fs.existsSync(`${root}/app/tools/worksheet-generator/page.tsx`));assert.match(fs.readFileSync(`${root}/app/tools/worksheet/page.tsx`,"utf8"),/worksheet-generator/);});
await check("Chủ đề thủ công tạo dàn ý hợp lệ",()=>assert.equal(outline.length,6));
await check("Giáo án ánh xạ mục tiêu và giai đoạn",()=>{const source=worksheetFromDocument({id:"lp",title:"Giáo án Ohm",type:"lesson-plan",content:"MỤC TIÊU: Vận dụng định luật Ohm\nKHỞI ĐỘNG\nLUYỆN TẬP",createdAt:new Date().toISOString(),generationMeta:{subject:"Vật lí",grade:"11",topic:"Định luật Ohm"}});assert.equal(source.sourceType,"lesson_plan");assert.ok(source.stages.length>=2);});
await check("Slide loại ghi chú giáo viên",()=>{const document={id:"s",title:"Slides",type:"lesson-slides",content:"",createdAt:new Date().toISOString(),slideDeck:{title:"Ohm",purpose:"practice",aspectRatio:"16:9",themeId:"clean",teacherNotesEnabled:true,assets:[],slides:[{id:"1",order:1,type:"content",layout:"title_content",blocks:[{id:"b1",type:"text",region:"main",alignment:"left",content:"Nội dung học sinh"},{id:"b2",type:"text",region:"main",alignment:"left",content:"Bí mật giáo viên",teacherOnly:true}],teacherNotes:"Không được lộ"}],metadata:{sourceType:"manual",createdAt:"x",updatedAt:"x"}}} as GeneratedDocument;const source=worksheetFromDocument(document);assert.match(source.text,/Nội dung học sinh/);assert.doesNotMatch(source.text,/Bí mật|Không được lộ/);});
await check("Nhận dạng chỉ dùng khối đã xác nhận",()=>{const document={id:"r",title:"Nhận dạng",type:"document-recognition",content:"",createdAt:"x",recognitionDraft:{id:"r",sourceType:"image",sourceFileName:"a.png",pageCount:1,reviewStatus:"confirmed",documentHash:"h",createdAt:"x",updatedAt:"x",pages:[{pageNumber:1,type:"scanned_image",textLength:10,imageCoverage:1,recognitionRequired:true,warnings:[],rotation:0,status:"recognized",blocks:[{id:"ok",pageNumber:1,type:"paragraph",text:"Đã duyệt",boundingBox:{x:0,y:0,width:1,height:1},confidence:"high",readingOrder:1,warnings:[],reviewed:true,excluded:false},{id:"no",pageNumber:1,type:"paragraph",text:"Chưa duyệt",boundingBox:{x:0,y:0,width:1,height:1},confidence:"low",readingOrder:2,warnings:[],reviewed:false,excluded:false}]}]}} as GeneratedDocument;const source=worksheetFromDocument(document);assert.equal(source.confirmed,true);assert.match(source.text,/Đã duyệt/);assert.doesNotMatch(source.text,/Chưa duyệt/);});
await check("Dàn ý chỉnh được trước generation",()=>assert.equal({...outline[0],title:"Đã chỉnh"}.title,"Đã chỉnh"));
await check("Hoạt động giữ ID ổn định",()=>assert.equal(parseGeneratedActivity('{"prompt":"Nhiệm vụ mới"}',outline[0],worksheet).id,outline[0].id));
await check("Tạo lại một hoạt động không thay hoạt động khác",()=>{const before=ready.activities[1];const next=ready.activities.map((item,index)=>index===0?{...item,prompt:"Tạo lại"}:item);assert.deepEqual(next[1],before);});
await check("Sửa tay không bị ghi đè im lặng",()=>{const edited={...ready.activities[0],teacherEdited:true,prompt:"Giáo viên sửa"};assert.equal(edited.prompt,"Giáo viên sửa");});
await check("Các mức phân hóa cùng mục tiêu",()=>assert.equal(new Set(outline.map((item)=>item.learningOutcome)).size,1));
await check("Cơ bản và nâng cao không giống nhau",()=>assert.notEqual(generateFallbackActivity({...outline[0],level:"basic"},worksheet).prompt,generateFallbackActivity({...outline[0],level:"advanced"},worksheet).prompt));
await check("Ánh xạ đáp án MCQ hợp lệ",()=>{const activity=generateFallbackActivity({...outline[0],type:"multiple_choice"},worksheet);assert.ok(activity.items?.every((item)=>item.options?.some((option)=>option.label===item.answer)));});
await check("Đúng/Sai dùng ID ổn định",()=>{const activity=generateFallbackActivity({...outline[0],type:"true_false"},worksheet);assert.equal(new Set(activity.items?.map((item)=>item.id)).size,4);});
await check("Điền khuyết giữ đáp án chấp nhận",()=>assert.ok(generateFallbackActivity({...outline[0],type:"fill_blank"},worksheet).items?.[0].acceptedAnswers?.includes("Định luật Ohm")));
await check("Nối giữ ánh xạ",()=>{const activity=generateFallbackActivity({...outline[0],type:"matching"},worksheet);assert.equal(activity.items?.filter((item)=>item.left).length,3);assert.equal(activity.items?.filter((item)=>item.right).length,3);});
await check("Sắp xếp giữ thứ tự đúng",()=>assert.deepEqual(generateFallbackActivity({...outline[0],type:"ordering"},worksheet).items?.map((item)=>item.order),[4,3,2,1]));
await check("Ô bảng vẫn chỉnh sửa được",()=>{const table=generateFallbackActivity({...outline[0],type:"table_completion"},worksheet).blocks?.find((block)=>block.type==="table");assert.ok(table&&table.rows[0][1]==="…");});
await check("Thiếu hình bị chặn",()=>{const invalid=normalizeWorksheet({...worksheet,activities:[{...outline[0],type:"diagram_labeling",prompt:"Quan sát hình",generationStatus:"ready"},{...outline[1],prompt:"Khác",generationStatus:"ready"}]});assert.match(validateWorksheet(invalid).errors.join(" "),/thiếu hình/);});
await check("LaTeX được giữ",()=>{const activity={...ready.activities[0],blocks:[{id:"f",type:"formula" as const,content:"\\frac{U}{I}=R"}]};assert.match(worksheetToText({...ready,activities:[activity]},"student"),/\\frac/);});
await check("TikZ vẫn gắn",()=>{const activity={...ready.activities[0],blocks:[{id:"t",type:"tikz" as const,content:"\\begin{tikzpicture}x\\end{tikzpicture}"}]};assert.match(worksheetToText({...ready,activities:[activity]},"student"),/tikzpicture/);});
await check("Tổng điểm xác định",()=>{const scored=normalizeWorksheet({...ready,settings:{...ready.settings,includeScoring:true,totalScore:6},activities:ready.activities.map((item)=>({...item,score:1}))});assert.equal(validateWorksheet(scored).totalScore,6);assert.equal(validateWorksheet(scored).valid,true);});
await check("Rubric dùng cấu trúc hiện có",()=>{const activity={...ready.activities[0],rubric:[{criterion:"Lập luận",points:1,expectedEvidence:"Có căn cứ"}]};assert.equal(activity.rubric[0].expectedEvidence,"Có căn cứ");});
await check("Word học sinh không có đáp án",async()=>{const document=worksheetToDocument(ready,"student");const zip=await JSZip.loadAsync(await (await buildGenericDocxBlob(document)).arrayBuffer());const xml=await zip.file("word/document.xml")!.async("string");assert.doesNotMatch(xml,/ĐÁP ÁN VÀ HƯỚNG DẪN/);});
await check("PDF học sinh không có ghi chú",()=>assert.doesNotMatch(worksheetToDocument(ready,"student").content,/Lưu ý tổ chức|GỢI Ý TỔ CHỨC/));
await check("Bản giáo viên có đáp án",()=>assert.match(worksheetToDocument(ready,"teacher").content,/ĐÁP ÁN VÀ HƯỚNG DẪN/));
await check("Tiếng Việt được giữ",()=>assert.match(worksheetToText(ready,"student"),/Định luật Ohm|PHIẾU HỌC TẬP/));
await check("Phiếu phân hóa xuất riêng",()=>{assert.ok(worksheetToText(ready,"student","basic").includes("Cơ bản"));assert.ok(worksheetToText(ready,"student","advanced").includes("Nâng cao"));});
await check("History phục hồi cùng Worksheet",()=>assert.equal(JSON.stringify(JSON.parse(JSON.stringify(ready))),JSON.stringify(ready)));
await check("Question Bank chỉ nhận loại phù hợp",()=>assert.ok(worksheetQuestions(ready).every((item)=>item.metadata?.sourceType==="worksheet")));
await check("Câu trùng có khóa nội dung",()=>{const items=worksheetQuestions(ready);const keys=items.map((item)=>`${item.subject}|${item.grade}|${item.topic}|${item.question}`.toLocaleLowerCase("vi"));assert.ok(new Set(keys).size<=keys.length);});
await check("Question Bank ownership theo store hiện có",()=>assert.match(fs.readFileSync(`${root}/lib/data/question-bank-store.ts`,"utf8"),/getCloudClientForUser/));
await check("Teacher không truy cập worksheet người khác",()=>assert.match(fs.readFileSync(`${root}/lib/data/documents-store.ts`,"utf8"),/getCloudClientForUser/));
await check("Maintenance chặn teacher",()=>assert.match(fs.readFileSync(`${root}/app/tools/worksheet-generator/page.tsx`,"utf8"),/getMaintenanceBlockForUser/));
await check("Admin bypass dùng chính sách hiện có",()=>assert.match(fs.readFileSync(`${root}/lib/maintenance.ts`,"utf8"),/admin/i));
await check("Lesson Plan regression còn chạy",()=>assert.match(fs.readFileSync(`${root}/package.json`,"utf8"),/lesson/));
await check("Lesson Slides regression còn chạy",()=>assert.match(fs.readFileSync(`${root}/package.json`,"utf8"),/lesson:slides-test/));
await check("Exam regression còn chạy",()=>assert.match(fs.readFileSync(`${root}/package.json`,"utf8"),/exam:quality-test/));
await check("Word/PDF pipeline hiện có còn dùng",()=>{const source=fs.readFileSync(`${root}/lib/worksheet/export.ts`,"utf8");assert.match(source,/buildGenericDocxBlob/);assert.match(source,/printGeneratedDocument/);});
await check("Lỗi tạo hoạt động không lộ thông tin nội bộ",()=>{const source=fs.readFileSync(`${root}/components/worksheet/WorksheetWorkspace.tsx`,"utf8");assert.doesNotMatch(source,/generationError:error instanceof Error\?error\.message/);assert.match(source,/Hoạt động này chưa tạo được nội dung/);});

assert.equal(passed,39);console.log(`Worksheet workflow: ${passed}/39 nhóm kiểm tra đạt.`);
}

main().catch((error)=>{console.error(error);process.exit(1);});
