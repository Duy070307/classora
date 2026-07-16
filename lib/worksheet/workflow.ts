import type { GeneratedDocument, QuestionItem } from "@/lib/types";
import type { SlideBlock } from "@/lib/lesson-slides/types";
import type { Worksheet, WorksheetActivity, WorksheetActivityType, WorksheetLevel, WorksheetSourcePreview, WorksheetValidation } from "@/lib/worksheet/types";

const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const activityTypes: WorksheetActivityType[] = ["multiple_choice", "fill_blank", "matching", "short_answer", "problem_solving", "reflection", "exit_ticket", "classification", "ordering", "table_completion", "discussion", "group_task"];
const levelOrder: WorksheetLevel[] = ["basic", "standard", "advanced"];
const cleanLines = (value: string) => value.split(/\r?\n/).map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim()).filter(Boolean);

export function stableWorksheetHash(value: unknown) {
  const text = JSON.stringify(value); let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16);
}

export function createWorksheetDraft(input: Partial<Worksheet> = {}): Worksheet {
  const now = new Date().toISOString();
  return {
    id: input.id || uid(), title: input.title || "PHIẾU HỌC TẬP", subtitle: input.subtitle, subject: input.subject || "Ngữ văn", grade: input.grade || "6", topic: input.topic || "Văn bản truyện đồng thoại", textbookSeries: input.textbookSeries || "Kết nối tri thức với cuộc sống",
    purpose: input.purpose || "practice", durationMinutes: input.durationMinutes ?? 20, workMode: input.workMode || "individual", differentiation: input.differentiation || "single", differentiationLayout: input.differentiationLayout || "combined", instructions: input.instructions || ["Đọc kĩ yêu cầu và hoàn thành từng hoạt động."], objectives: input.objectives || ["Củng cố kiến thức và vận dụng vào nhiệm vụ học tập."], keyKnowledge: input.keyKnowledge || [], activities: input.activities || [], answerKey: input.answerKey, teacherGuide: input.teacherGuide,
    settings: { includeAnswers: true, includeTeacherGuide: true, includeScoring: false, includeAnswerSpace: true, includeSelfAssessment: false, sourceOnly: true, questionBankMode: "new_only", activityCount: 5, ...input.settings },
    metadata: { sourceType: "manual", createdAt: now, updatedAt: now, version: "1.0", exportStatus: "warning", ...input.metadata },
  };
}

export function normalizeWorksheet(source: Worksheet): Worksheet {
  const draft = createWorksheetDraft(source);
  return { ...draft, ...source, settings: { ...draft.settings, ...source.settings }, metadata: { ...draft.metadata, ...source.metadata }, activities: (source.activities || []).map((activity, index) => ({ ...activity, id: activity.id || uid(), order: index + 1, items: activity.items?.map((item) => ({ ...item, id: item.id || uid(), options: item.options?.map((option, optionIndex) => ({ ...option, id: option.id || uid(), label: option.label || String.fromCharCode(65 + optionIndex) })) })), blocks: activity.blocks?.map((block) => ({ ...block, id: block.id || uid() })) })) };
}

function levelsFor(worksheet: Worksheet) {
  if (worksheet.differentiation === "three_levels") return levelOrder;
  if (worksheet.differentiation === "basic_advanced") return ["basic", "advanced"] as WorksheetLevel[];
  return ["standard"] as WorksheetLevel[];
}

export function createWorksheetOutline(worksheet: Worksheet): WorksheetActivity[] {
  const count = Math.min(12, Math.max(2, Number(worksheet.settings.activityCount || 5)));
  const levels = levelsFor(worksheet);
  const objective = worksheet.objectives?.[0] || `Củng cố ${worksheet.topic || "chủ đề"}`;
  return Array.from({ length: count }, (_, index) => {
    const level = levels[index % levels.length]; const type = activityTypes[index % activityTypes.length];
    return { id: uid(), order: index + 1, title: `Hoạt động ${index + 1}: ${titleForType(type)}`, type, level, purpose: worksheet.purpose, prompt: "Nội dung sẽ được tạo sau khi giáo viên xác nhận cấu trúc.", instructions: instructionForType(type), expectedOutput: expectedOutputForType(type), estimatedMinutes: Math.max(2, Math.round(Number(worksheet.durationMinutes || 20) / count)), answerSpace: worksheet.settings.includeAnswerSpace ? (type === "problem_solving" ? "calculation" : type === "table_completion" ? "table" : "three_lines") : "none", score: worksheet.settings.includeScoring ? Number((Number(worksheet.settings.totalScore || 10) / count).toFixed(2)) : undefined, learningOutcome: objective, generationStatus: "outline" };
  });
}

export function titleForType(type: WorksheetActivityType) { return ({ multiple_choice:"Chọn đáp án",true_false:"Đúng hay sai",short_answer:"Trả lời ngắn",fill_blank:"Hoàn thành nội dung",matching:"Nối thông tin",classification:"Phân loại",ordering:"Sắp xếp",table_completion:"Hoàn thành bảng",diagram_labeling:"Gắn nhãn hình",worked_example:"Ví dụ có hướng dẫn",problem_solving:"Giải quyết vấn đề",discussion:"Trao đổi có sản phẩm",group_task:"Nhiệm vụ nhóm",experiment:"Thực hành",reflection:"Tự đánh giá",exit_ticket:"Phiếu ra khỏi lớp" } as Record<WorksheetActivityType,string>)[type]; }
function instructionForType(type: WorksheetActivityType) { if(type === "matching") return "Nối mỗi mục ở cột trái với một mục phù hợp ở cột phải."; if(type === "group_task") return "Phân công vai trò, hoàn thành sản phẩm và cử đại diện trình bày."; if(type === "ordering") return "Sắp xếp các bước theo trình tự hợp lí."; return "Hoàn thành nhiệm vụ theo yêu cầu."; }
function expectedOutputForType(type: WorksheetActivityType) { if(type === "group_task" || type === "discussion") return "Một sản phẩm nhóm cụ thể và phần trình bày ngắn."; if(type === "table_completion") return "Bảng đã điền đủ dữ liệu."; return "Câu trả lời có căn cứ, bám sát mục tiêu hoạt động."; }

export function generateFallbackActivity(outline: WorksheetActivity, worksheet: Worksheet): WorksheetActivity {
  const topic = worksheet.topic || "chủ đề"; const objective = outline.learningOutcome || worksheet.objectives?.[0] || topic;
  const scaffold = outline.level === "basic" ? "Dựa vào kiến thức trọng tâm và gợi ý đã cho" : outline.level === "advanced" ? "Kết hợp các khái niệm và giải thích lập luận" : "Vận dụng kiến thức đã học";
  const base: WorksheetActivity = { ...outline, prompt: `${scaffold}, thực hiện ${titleForType(outline.type).toLocaleLowerCase("vi")} về “${topic}” để đạt mục tiêu: ${objective}.`, generationStatus: "ready", hint: outline.level === "basic" ? `Gạch chân từ khóa liên quan đến ${topic}.` : undefined, answer: `Câu trả lời cần đúng kiến thức về ${topic} và có căn cứ phù hợp.`, explanation: `Giáo viên đối chiếu với kiến thức trọng tâm đã xác nhận về ${topic}.`, commonMistake: "Trả lời chung chung hoặc không nêu căn cứ.", teacherNote: `Tổ chức theo hình thức ${worksheet.workMode}; dự kiến ${outline.estimatedMinutes || 3} phút.` };
  if (outline.type === "multiple_choice") base.items = [1,2,3].map((number) => ({ id:uid(), prompt:`Câu ${number}. Nhận định nào phù hợp nhất với ${topic}?`, options:["A","B","C","D"].map((label,index)=>({id:uid(),label,text:index===0?`Nội dung đúng trọng tâm ${topic}`:`Phương án nhiễu ${index} cần giáo viên rà soát`})), answer:"A", explanation:`Phương án A bám sát nội dung ${topic}.` }));
  if (outline.type === "true_false") base.items = [1,2,3,4].map((number)=>({id:uid(),prompt:`Nhận định ${number} về ${topic}`,answer:number % 3 === 0 ? "Sai" : "Đúng",isCorrect:number % 3 !== 0,explanation:"Giáo viên rà soát theo kiến thức trọng tâm."}));
  if (outline.type === "fill_blank") base.items = [{id:uid(),prompt:`Điền từ phù hợp: Nội dung trọng tâm của ______ là kiến thức thuộc ${topic}.`,answer:topic,acceptedAnswers:[topic]}];
  if (outline.type === "matching") base.items = [1,2,3].flatMap((number)=>[{id:`L${number}-${uid()}`,prompt:`Khái niệm ${number}`,left:`Khái niệm ${number}`,answer:`Mô tả ${number}`},{id:`R${number}-${uid()}`,prompt:`Mô tả ${number}`,right:`Mô tả ${number}`,order:number}]);
  if (outline.type === "ordering") base.items = [1,2,3,4].map((number)=>({id:uid(),prompt:`Bước ${number} khi xử lí nhiệm vụ ${topic}`,order:number,answer:String(number)})).reverse();
  if (outline.type === "table_completion") base.blocks = [{id:uid(),type:"table",headers:["Nội dung","Dữ kiện","Kết luận"],rows:[[topic,"…","…"],["Ví dụ","…","…"]],expectedCells:{"0:1":"Giáo viên bổ sung","0:2":"Giáo viên bổ sung"}}];
  if (outline.type === "discussion" || outline.type === "group_task") { base.prompt = `Trong ${outline.estimatedMinutes || 5} phút, lập bảng gồm 3 ý chính về ${topic}, mỗi ý kèm một minh chứng; phân công người ghi chép và người trình bày.`; base.expectedOutput = "Bảng 3 ý chính có minh chứng và phần trình bày tối đa 2 phút."; }
  if (outline.type === "reflection" || outline.type === "exit_ticket") base.items = [{id:uid(),prompt:"Một điều em đã hiểu",answer:"Câu trả lời cá nhân phù hợp"},{id:uid(),prompt:"Một câu hỏi em còn băn khoăn",answer:"Câu trả lời cá nhân"},{id:uid(),prompt:"Tự đánh giá mức tự tin từ 1 đến 5",answer:"1–5"}];
  return base;
}

export function parseGeneratedActivity(content: string, outline: WorksheetActivity, worksheet: Worksheet): WorksheetActivity {
  try {
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""); const raw = JSON.parse(cleaned) as Partial<WorksheetActivity>;
    if (!raw.prompt?.trim()) throw new Error("missing_prompt");
    return normalizeWorksheet({ ...worksheet, activities: [{ ...outline, ...raw, id:outline.id, order:outline.order, type:outline.type, level:outline.level, generationStatus:"ready" }] }).activities[0];
  } catch { return generateFallbackActivity(outline, worksheet); }
}

export function validateWorksheet(worksheet: Worksheet): WorksheetValidation {
  const errors:string[]=[]; const warnings:string[]=[]; const activities=worksheet.activities || [];
  if (activities.length < 2 || activities.length > 12) errors.push("Số lượng hoạt động phải từ 2 đến 12.");
  const ids=new Set<string>(); const prompts=new Set<string>(); let totalScore=0;
  activities.forEach((activity,index)=>{ if(ids.has(activity.id)) errors.push(`Hoạt động ${index+1} bị trùng ID.`); ids.add(activity.id); const prompt=activity.prompt.trim().toLocaleLowerCase("vi"); if(prompts.has(prompt) && activity.generationStatus !== "outline") errors.push(`Hoạt động ${index+1} bị trùng yêu cầu.`); prompts.add(prompt); if(!activity.prompt.trim()) errors.push(`Hoạt động ${index+1} chưa có nội dung.`); if(activity.type === "diagram_labeling" && !activity.blocks?.some((block)=>block.type === "image" || block.type === "tikz")) errors.push(`Hoạt động ${index+1} thiếu hình hoặc TikZ hợp lệ.`); if(activity.type === "multiple_choice") activity.items?.forEach((item)=>{const labels=item.options?.map((option)=>option.label)||[];if(labels.length<2||!labels.includes(String(item.answer||"").toUpperCase()))errors.push(`Hoạt động ${index+1} có ánh xạ đáp án trắc nghiệm không hợp lệ.`);}); totalScore += Number(activity.score||0); });
  if(worksheet.settings.includeScoring && Math.abs(totalScore-Number(worksheet.settings.totalScore||0))>0.01) errors.push("Tổng điểm các hoạt động chưa khớp.");
  if(activities.some((activity)=>activity.generationStatus === "failed")) warnings.push("Một số hoạt động chưa tạo được nội dung. Thầy cô có thể thử lại riêng.");
  return {valid:!errors.length,errors,warnings,totalScore:Number(totalScore.toFixed(2)),activityCount:activities.length};
}

export function deriveAnswerKey(worksheet: Worksheet) { return { entries: worksheet.activities.map((activity)=>({activityId:activity.id,answer:activity.answer || activity.items?.map((item,index)=>`${index+1}. ${item.answer || "Giáo viên rà soát"}`).join("; ") || "Giáo viên rà soát",explanation:activity.explanation,acceptedAlternatives:activity.acceptedAlternatives,commonMistake:activity.commonMistake})) }; }

export function worksheetFromDocument(document: GeneratedDocument): WorksheetSourcePreview {
  if(document.worksheet) return {title:document.title,sourceType:"previous_worksheet",sourceDocumentId:document.id,subject:document.worksheet.subject,grade:document.worksheet.grade,topic:document.worksheet.topic,objectives:document.worksheet.objectives||[],stages:document.worksheet.activities.map((item)=>item.title||`Hoạt động ${item.order}`),keyKnowledge:document.worksheet.keyKnowledge||[],text:worksheetToText(document.worksheet,"teacher"),confirmed:true,warnings:[]};
  if(document.type === "worksheet") return {title:document.title,sourceType:"previous_worksheet",sourceDocumentId:document.id,subject:document.generationMeta?.subject,grade:document.generationMeta?.grade,topic:document.generationMeta?.topic,objectives:cleanLines(document.content).filter((line)=>/mục tiêu/i.test(line)).slice(0,6),stages:cleanLines(document.content).filter((line)=>/bài tập|hoạt động/i.test(line)).slice(0,12),keyKnowledge:cleanLines(document.content).slice(0,20),text:document.content,confirmed:true,warnings:["Bản ghi cũ đã được mở ở chế độ nguồn; giáo viên cần xác nhận dàn ý trước khi chuyển sang cấu trúc mới."]};
  if(document.slideDeck){ const visible=document.slideDeck.slides.filter((slide)=>!slide.hidden); const blocks=visible.flatMap((slide)=>slide.blocks.filter((block)=>!block.teacherOnly).map(blockText)).filter(Boolean); return {title:document.title,sourceType:"slides",sourceDocumentId:document.id,subject:document.slideDeck.subject,grade:document.slideDeck.grade,topic:document.slideDeck.topic,objectives:visible.filter((slide)=>slide.type==="objectives").flatMap((slide)=>slide.blocks.filter((block)=>!block.teacherOnly).map(blockText)),stages:visible.map((slide)=>slide.title||"Trang trình chiếu"),keyKnowledge:blocks.slice(0,20),text:blocks.join("\n"),confirmed:true,warnings:[]}; }
  if(document.recognitionDraft){ const confirmed=document.recognitionDraft.reviewStatus === "confirmed"; const blocks=document.recognitionDraft.pages.flatMap((page)=>page.blocks).filter((block)=>block.reviewed&&!block.excluded).map((block)=>block.text).filter(Boolean); return {title:document.title,sourceType:"document",sourceDocumentId:document.id,objectives:[],stages:[],keyKnowledge:blocks.slice(0,20),text:blocks.join("\n"),confirmed,warnings:confirmed?[]:["Tài liệu nhận dạng chưa được giáo viên xác nhận."]}; }
  if(document.examSolutionSet){ const questions=document.examSolutionSet.questions.filter((question)=>question.teacherConfirmed||question.answerStatus==="matches"); return {title:document.title,sourceType:"solution",sourceDocumentId:document.id,subject:document.generationMeta?.subject,grade:document.generationMeta?.grade,topic:document.generationMeta?.topic,objectives:["Phân tích lời giải và lỗi sai thường gặp."],stages:["Chữa bài"],keyKnowledge:questions.map((question)=>question.conciseAnswer),text:questions.map((question)=>`${question.questionNumber}. ${question.conciseAnswer}\n${question.detailedSolution||""}`).join("\n"),confirmed:true,warnings:questions.length?[]:["Chưa có lời giải đã xác nhận."]}; }
  const type=document.type === "lesson-plan" ? "lesson_plan" : document.type === "exam" ? "exam" : document.type === "document-recognition" ? "document" : "document"; const lines=cleanLines(document.content);
  return {title:document.title,sourceType:type,sourceDocumentId:document.id,subject:document.generationMeta?.subject||document.examMeta?.subject,grade:document.generationMeta?.grade||document.examMeta?.grade,topic:document.generationMeta?.topic||document.examMeta?.topic,objectives:lines.filter((line)=>/mục tiêu|yêu cầu cần đạt/i.test(line)).slice(0,6),stages:lines.filter((line)=>/khởi động|hình thành|luyện tập|vận dụng|củng cố|bài tập/i.test(line)).slice(0,8),keyKnowledge:lines.slice(0,20),text:document.content,confirmed:true,warnings:[]};
}

function blockText(block: SlideBlock) { if(block.type === "bullets") return block.content.join("; "); if(block.type === "table") return [block.headers.join(" | "),...block.rows.map((row)=>row.join(" | "))].join("\n"); if(block.type === "process") return block.steps.join(" → "); return block.content; }

export function worksheetToText(worksheet: Worksheet, audience:"student"|"teacher"="student", onlyLevel?:WorksheetLevel) {
  const activities=worksheet.activities.filter((activity)=>!onlyLevel||activity.level===onlyLevel); const levelLabel={basic:"Cơ bản",standard:"Tiêu chuẩn",advanced:"Nâng cao"};
  const rows=[worksheet.title,worksheet.subtitle||"",`Môn: ${worksheet.subject||""} | Lớp: ${worksheet.grade||""}`,`Chủ đề: ${worksheet.topic||""} | Thời lượng: ${worksheet.durationMinutes||0} phút`,`Họ và tên: ....................................................  Lớp: ...............`,``,...(worksheet.instructions||[]).map((line)=>`• ${line}`)];
  activities.forEach((activity,index)=>{ rows.push(`\nHOẠT ĐỘNG ${index+1}. ${activity.title||titleForType(activity.type)} · ${levelLabel[activity.level]}`,activity.instructions||"",activity.prompt); activity.items?.forEach((item,itemIndex)=>{rows.push(`${itemIndex+1}. ${item.prompt}`);item.options?.forEach((option)=>rows.push(`${option.label}. ${option.text}`));}); activity.blocks?.filter((block)=>audience==="teacher"||!block.teacherOnly).forEach((block)=>{if(block.type==="table")rows.push(`| ${block.headers.join(" | ")} |`,`| ${block.headers.map(()=>"---").join(" | ")} |`,...block.rows.map((row)=>`| ${row.join(" | ")} |`));else if(block.type==="image")rows.push(`[Hình: ${block.alt}]`);else rows.push(block.content);}); if(worksheet.settings.includeAnswerSpace&&audience==="student") rows.push(...answerSpaceLines(activity.answerSpace)); if(worksheet.settings.includeScoring&&activity.score!==undefined)rows.push(`Điểm: ....... / ${activity.score}`); });
  if(worksheet.settings.includeSelfAssessment&&audience==="student")rows.push("\nTỰ ĐÁNH GIÁ","□ Em đã hoàn thành  □ Em cần hỗ trợ thêm","Điều em còn băn khoăn: ........................................................");
  if(audience==="teacher"){ rows.push("\nĐÁP ÁN VÀ HƯỚNG DẪN GIÁO VIÊN"); worksheet.activities.filter((activity)=>!onlyLevel||activity.level===onlyLevel).forEach((activity,index)=>rows.push(`Hoạt động ${index+1}: ${activity.answer||activity.items?.map((item,itemIndex)=>`${itemIndex+1}. ${item.answer||"Cần rà soát"}`).join("; ")||"Cần giáo viên rà soát"}`,activity.explanation?`Giải thích: ${activity.explanation}`:"",activity.hint?`Gợi ý: ${activity.hint}`:"",activity.commonMistake?`Lỗi thường gặp: ${activity.commonMistake}`:"",activity.teacherNote?`Lưu ý tổ chức: ${activity.teacherNote}`:"")); if(worksheet.teacherGuide)rows.push("\nGỢI Ý TỔ CHỨC",worksheet.teacherGuide.introduction||"",worksheet.teacherGuide.organization||"",...(worksheet.teacherGuide.prompts||[]).map((prompt)=>`• ${prompt}`)); }
  rows.push("\nNội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức."); return rows.filter((line)=>line!==undefined).join("\n");
}
function answerSpaceLines(space?:WorksheetActivity["answerSpace"]){const count=space==="one_line"?1:space==="three_lines"?3:space==="half_page"?8:space==="full_page"?16:space==="calculation"?8:space==="drawing"?10:space==="table"?4:0;return Array.from({length:count},()=>"................................................................................................");}

export function worksheetToDocument(worksheet:Worksheet,audience:"student"|"teacher"="teacher",onlyLevel?:WorksheetLevel):GeneratedDocument { const normalized=normalizeWorksheet({...worksheet,answerKey:deriveAnswerKey(worksheet),metadata:{...worksheet.metadata,updatedAt:new Date().toISOString(),exportStatus:validateWorksheet(worksheet).valid?"ready":"warning"}}); return {id:normalized.id||uid(),title:`${normalized.title} · ${audience==="student"?"Học sinh":"Giáo viên"}`,type:"worksheet",createdAt:normalized.metadata.createdAt,folder:"Phiếu học tập",content:worksheetToText(normalized,audience,onlyLevel),worksheet:normalized,generationMeta:{subject:normalized.subject,grade:normalized.grade,topic:normalized.topic,source:normalized.metadata.sourceType,exportStatus:normalized.metadata.exportStatus}}; }

export function worksheetQuestions(worksheet:Worksheet):QuestionItem[]{return worksheet.activities.flatMap((activity)=>{if(!["multiple_choice","true_false","short_answer","fill_blank","problem_solving"].includes(activity.type))return[];const difficulty=activity.level==="basic"?"Nhận biết":activity.level==="advanced"?"Vận dụng cao":"Vận dụng";const type=activity.type==="multiple_choice"?"Trắc nghiệm":activity.type==="true_false"?"Đúng/Sai":activity.type==="fill_blank"?"Điền khuyết":activity.type==="short_answer"?"Trả lời ngắn":"Tự luận";return (activity.items?.length?activity.items:[{id:activity.id,prompt:activity.prompt,answer:activity.answer,explanation:activity.explanation}]).map((item)=>({id:item.id,subject:worksheet.subject||"",grade:worksheet.grade||"",topic:worksheet.topic||"",question:item.prompt,type,difficulty,answer:item.answer||activity.answer||"",explanation:item.explanation||activity.explanation||"",createdAt:new Date().toISOString(),bankScope:"user",options:item.options?Object.fromEntries(item.options.map((option)=>[option.label,option.text])):undefined,metadata:{sourceType:"worksheet",worksheetId:worksheet.id,needsReview:true}} as QuestionItem));});}
