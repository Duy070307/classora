import type { Slide, SlideBlock, SlideDeck, SlideGenerationSettings, SlideSource, SlideType } from "@/lib/lesson-slides/types";
import { makeStableId, normalizeDeck, normalizeSlideCount } from "@/lib/lesson-slides/normalize";

type OutlineTemplate = { type: SlideType; title: string; purpose: string; expected: string };

const titleByPurpose = {
  new_lesson: "Bài giảng",
  review: "Ôn tập",
  practice: "Luyện tập",
  solution: "Chữa bài",
  summary: "Tổng kết",
  group_activity: "Hoạt động nhóm",
} as const;

function baseTemplates(settings: SlideGenerationSettings): OutlineTemplate[] {
  const topic = settings.topic || "Chủ đề bài học";
  const templates: OutlineTemplate[] = [
    { type: "cover", title: topic, purpose: "Giới thiệu bài học", expected: "Tên bài, môn học và khối lớp" },
  ];
  if (settings.options.objectives) templates.push({ type: "objectives", title: "Mục tiêu bài học", purpose: "Định hướng kết quả cần đạt", expected: settings.objectives || "Kiến thức, năng lực và phẩm chất cần đạt" });
  if (settings.options.warmUp) templates.push({ type: "warm_up", title: "Khởi động", purpose: "Kích hoạt kiến thức nền", expected: "Tình huống hoặc câu hỏi ngắn gắn với bài học" });
  const focus = settings.keyKnowledge.split(/\r?\n|[.;](?=\s|$)/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const knowledge = focus.length ? focus : ["Kiến thức trọng tâm 1", "Kiến thức trọng tâm 2"];
  knowledge.forEach((item, index) => {
    templates.push({ type: "content", title: item.length <= 70 ? item : `Kiến thức trọng tâm ${index + 1}`, purpose: "Hình thành kiến thức", expected: item });
    if (settings.options.examples && index < 2) templates.push({ type: "example", title: `Ví dụ minh họa ${index + 1}`, purpose: "Làm rõ kiến thức", expected: `Ví dụ ngắn bám sát ${item}` });
  });
  if (settings.options.interactiveQuestions) templates.push({ type: "question", title: "Câu hỏi tương tác", purpose: "Kiểm tra nhanh mức độ hiểu bài", expected: "Tối đa hai câu hỏi, đáp án để trong ghi chú giáo viên" });
  if (settings.purpose === "group_activity") templates.push({ type: "activity", title: "Nhiệm vụ nhóm", purpose: "Tổ chức hoạt động hợp tác", expected: "Nhiệm vụ, thời gian, sản phẩm và tiêu chí" });
  if (settings.options.practice) templates.push({ type: "practice", title: settings.purpose === "solution" ? "Chữa bài có hướng dẫn" : "Luyện tập", purpose: "Củng cố và vận dụng", expected: "Bài tập ngắn theo mức độ phù hợp" });
  if (settings.options.summary) templates.push({ type: "summary", title: "Tổng kết", purpose: "Khái quát nội dung cốt lõi", expected: "Ba đến năm ý chính cần ghi nhớ" });
  if (settings.options.homework) templates.push({ type: "homework", title: "Nhiệm vụ về nhà", purpose: "Tiếp tục học tập sau giờ học", expected: "Bài tập và chuẩn bị cho bài tiếp theo" });
  templates.push({ type: "end", title: "Kết thúc", purpose: "Khép lại bài học", expected: "Lời nhắc rà soát hoặc câu hỏi cuối giờ" });
  return templates;
}

function fitTemplates(templates: OutlineTemplate[], count: number) {
  const result = [...templates];
  while (result.length < count) {
    const insertBefore = Math.max(1, result.findIndex((item) => ["summary", "homework", "end"].includes(item.type)));
    const number = result.filter((item) => item.type === "content").length + 1;
    result.splice(insertBefore, 0, { type: number % 3 === 0 ? "activity" : "content", title: `Nội dung trọng tâm ${number}`, purpose: "Mở rộng kiến thức", expected: "Một ý chính, ví dụ hoặc hoạt động bám sát nguồn" });
  }
  while (result.length > count) {
    const removable = result.findLastIndex((item, index) => index > 0 && index < result.length - 1 && ["example", "activity", "content"].includes(item.type));
    if (removable < 0) break;
    result.splice(removable, 1);
  }
  return result.slice(0, count);
}

function layoutFor(type: SlideType) {
  if (type === "cover" || type === "end" || type === "section") return "title_only" as const;
  if (type === "formula") return "formula_focus" as const;
  if (type === "question") return "question_focus" as const;
  if (type === "table") return "table_focus" as const;
  if (type === "summary") return "summary_cards" as const;
  return "title_content" as const;
}

export function createSlideOutline(settings: SlideGenerationSettings, source: SlideSource): SlideDeck {
  const slideCount = normalizeSlideCount(settings.slideCount);
  const sourceTitles = source.extracted?.slideTitles?.filter(Boolean).slice(0, slideCount) || [];
  const templates = source.type === "existing_presentation" && sourceTitles.length >= 2
    ? sourceTitles.map((title, index) => ({ type: index === 0 ? "cover" as const : "content" as const, title, purpose: index === 0 ? "Giới thiệu" : "Tái thiết kế nội dung nguồn", expected: "Giữ ý chính từ bản trình chiếu đã tải lên" }))
    : fitTemplates(baseTemplates(settings), slideCount);
  const now = new Date().toISOString();
  return normalizeDeck({
    title: `${titleByPurpose[settings.purpose]}: ${settings.topic || source.title || "Bài học"}`,
    subject: settings.subject,
    grade: settings.grade,
    topic: settings.topic,
    textbookSeries: settings.textbookSeries || undefined,
    purpose: settings.purpose,
    aspectRatio: settings.aspectRatio,
    themeId: settings.themeId,
    slides: templates.map((item, index) => ({ id: makeStableId("slide"), order: index + 1, type: item.type, layout: layoutFor(item.type), title: item.title, purpose: item.purpose, expectedContent: item.expected, estimatedDensity: item.type === "cover" || item.type === "end" ? "low" : "medium", blocks: [], generationStatus: "outline" })),
    assets: [],
    teacherNotesEnabled: settings.options.teacherNotes,
    metadata: { sourceType: source.type, sourceDocumentId: source.sourceDocumentId, sourceTitle: source.title, sourceContentHash: source.contentHash, createdAt: now, updatedAt: now, generationVersion: "lesson-slides-v1", detailLevel: settings.detailLevel, audience: settings.audience },
  });
}

function sourceSentences(source: string) {
  return source.replace(/\r/g, "").split(/\n+|(?<=[.!?])\s+/).map((item) => item.replace(/^[-•\d.)\s]+/, "").trim()).filter((item) => item.length > 12 && item.length < 260);
}

export function localBlocksForSlide(slide: Slide, settings: SlideGenerationSettings, sourceText: string): { blocks: SlideBlock[]; teacherNotes?: string } {
  const sentences = sourceSentences(sourceText);
  const start = Math.max(0, (slide.order - 2) * 3);
  const picks = sentences.slice(start, start + 5);
  if (slide.type === "cover" || slide.type === "end") return { blocks: slide.subtitle ? [{ id: makeStableId("block"), type: "text", content: slide.subtitle, region: "main", alignment: "center" }] : [], teacherNotes: slide.type === "cover" ? "Giới thiệu ngắn mục tiêu và kết nối với kiến thức đã học." : "Mời học sinh nêu một điều đã học được." };
  if (slide.type === "objectives") return { blocks: [{ id: makeStableId("block"), type: "bullets", content: (settings.objectives || "Nêu được kiến thức trọng tâm\nVận dụng kiến thức vào tình huống phù hợp\nTự đánh giá kết quả học tập").split(/\n|;/).map((item) => item.trim()).filter(Boolean).slice(0, 6), region: "main", alignment: "left" }], teacherNotes: "Nêu rõ tiêu chí thành công để học sinh theo dõi tiến trình." };
  if (slide.type === "question") return { blocks: [{ id: makeStableId("block"), type: "question", content: `Theo em, ý nghĩa quan trọng nhất của ${settings.topic || "nội dung này"} là gì?`, questionType: "quick_check", answer: picks[0] || settings.keyKnowledge || "Câu trả lời cần bám sát kiến thức vừa học.", explanation: "Khuyến khích học sinh giải thích bằng từ ngữ của mình.", answerMode: "teacher_notes", region: "main", alignment: "left" }], teacherNotes: `Đáp án gợi ý: ${picks[0] || settings.keyKnowledge || "Rà soát theo nội dung bài học."}` };
  if (slide.type === "figure") return { blocks: [{ id: makeStableId("block"), type: "tikz", content: "Hình TikZ", tikz: "\\begin{tikzpicture}\n% Dán hoặc chỉnh mã TikZ tại đây\n\\end{tikzpicture}", region: "main", alignment: "center" }], teacherNotes: "Kết xuất TikZ thành SVG/PNG và kiểm tra nhãn trước khi xuất PowerPoint." };
  if (slide.type === "formula" || /toán|vật lí|vật lý/i.test(settings.subject) && /công thức|định luật|phương trình/i.test(`${slide.title} ${slide.expectedContent}`)) return { blocks: [{ id: makeStableId("block"), type: "formula", content: "Công thức trọng tâm", latex: settings.additionalNotes.match(/\$([^$]+)\$/)?.[1] || "F = ma", region: "main", alignment: "center" }, { id: makeStableId("block"), type: "text", content: picks[0] || "Xác định rõ đại lượng, đơn vị và điều kiện áp dụng.", region: "footer", alignment: "left" }], teacherNotes: "Kiểm tra ký hiệu và đơn vị trước khi trình chiếu." };
  if (slide.type === "practice") return { blocks: [{ id: makeStableId("block"), type: "bullets", content: picks.slice(0, 3).length ? picks.slice(0, 3) : ["Nhắc lại kiến thức cần dùng", "Thực hiện nhiệm vụ theo từng bước", "Đối chiếu và giải thích kết quả"], region: "main", alignment: "left" }], teacherNotes: "Quan sát cách học sinh lựa chọn phương pháp; chưa công bố đáp án ngay." };
  const bullets = picks.length ? picks : [slide.expectedContent || `Trình bày nội dung chính của ${slide.title || settings.topic}`, "Kết nối với ví dụ gần gũi", "Kiểm tra lại bằng một câu hỏi ngắn"];
  return { blocks: [{ id: makeStableId("block"), type: "bullets", content: bullets.slice(0, 6), region: "main", alignment: "left" }], teacherNotes: settings.options.teacherNotes ? `Nhấn mạnh: ${slide.expectedContent || slide.title || "ý chính của slide"}.` : undefined };
}

export function replaceSlide(deck: SlideDeck, slideId: string, replacement: Slide) {
  return normalizeDeck({ ...deck, slides: deck.slides.map((slide) => slide.id === slideId ? { ...replacement, id: slide.id, order: slide.order } : slide) });
}

export function duplicateOutlineSlide(deck: SlideDeck, slideId: string) {
  const index = deck.slides.findIndex((slide) => slide.id === slideId);
  if (index < 0) return deck;
  const source = deck.slides[index];
  const copy = { ...structuredClone(source), id: makeStableId("slide"), title: `${source.title || "Slide"} (bản sao)`, blocks: source.blocks.map((block) => ({ ...block, id: makeStableId("block") })) };
  const slides = [...deck.slides];
  slides.splice(index + 1, 0, copy);
  return normalizeDeck({ ...deck, slides });
}
