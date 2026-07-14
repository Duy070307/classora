import type { GeneratedDocument } from "@/lib/types";
import { BugReportLink } from "@/components/BugReportLink";
import { getDocumentHeaderLines } from "@/lib/document-header";
import { GenericDocumentContent } from "@/components/document/GenericDocumentContent";
import { looksLikeRawJson } from "@/lib/ai/extract-json";
import { normalizeEducationalContent } from "@/lib/content/generated-content";

const headingPattern = /^(#{1,3}\s+|ĐỀ KIỂM TRA|PHIẾU HỌC TẬP|NHẬN XÉT|MA TRẬN|ĐÁP ÁN|TRỘN MÃ ĐỀ|MÃ ĐỀ|I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|PHẦN|THANG ĐIỂM|MỤC TIÊU|KIẾN THỨC|BÀI TẬP|CHỖ TRỐNG|NGẮN GỌN|TRANG TRỌNG|THÂN THIỆN|LƯU Ý|HƯỚNG DẪN)/i;

export function OutputPreview({ document }: { document: GeneratedDocument }) {
  const structuredContent = document.structuredExam
    ? document.structuredExam.parts.map((part) => `${part.title}. ${part.instruction}\n\n${part.questions.map((question) => {
        const options = question.options ? (["A", "B", "C", "D"] as const).map((key) => `${key}. ${question.options?.[key]}`).join("\n") : "";
        const subItems = question.trueFalseItems?.map((item) => `${item.label}) ${item.text}`).join("\n") ?? "";
        return `Câu ${question.number}. ${question.stem}${options ? `\n${options}` : ""}${subItems ? `\n${subItems}` : ""}`;
      }).join("\n\n")}`).join("\n\n")
    : "";
  const safeContent = normalizeEducationalContent(document.type === "exam" && looksLikeRawJson(document.content) && structuredContent ? structuredContent : document.content);
  const lines = safeContent.split("\n");
  const header = getDocumentHeaderLines();
  const examMeta = document.examMeta;

  return (
    <section className="card min-w-0 overflow-hidden bg-slate-100/80 shadow-xl">
      <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Bản xem trước tài liệu</p>
          <h2 className="mt-1 break-words text-lg font-bold text-ink sm:text-xl">{document.title}</h2>
          <p className="mt-1 text-sm text-muted">Có thể sao chép, xuất Word, Markdown, TXT hoặc in và lưu PDF.</p>
        </div>
        <span className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Cần giáo viên rà soát</span>
      </div>
      <div className="soft-grid-bg max-h-[72vh] overflow-auto bg-slate-100/90 p-2 sm:max-h-[720px] sm:p-8">
        <article className="document-paper px-4 py-6 sm:min-h-[900px] sm:px-12 sm:py-10">
          {document.type === "exam" ? <div className="mb-6 font-serif text-[13px] leading-5 text-slate-950">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><p className="font-bold">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p><p className="font-bold">{(examMeta?.schoolName || "TRƯỜNG THPT ...").toUpperCase()}</p><p className="text-xs italic">(Đề có .... trang)</p></div>
              <div><p className="font-bold">ĐỀ THI THỬ</p><p className="font-bold">KỲ THI TỐT NGHIỆP THPT</p><p className="font-bold">MÔN: {(examMeta?.subject || "...").toUpperCase()} {examMeta?.grade || "..."}</p><p className="text-xs italic">Thời gian: {examMeta?.duration || "... phút"}, không kể thời gian phát đề</p></div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-3 border-b border-slate-900 pb-2"><p>Họ và tên thí sinh: .................................... Số báo danh: ...................</p><p className="shrink-0 border border-slate-900 px-3 py-2 font-bold">Mã đề: {document.generationMeta?.mode === "exam-mixer" ? (examMeta?.examCode || "101") : (examMeta?.examCode || "0101").padStart(4, "0")}</p></div>
          </div> : null}
          {header.length ? <header className="mb-6 border-b border-slate-200 pb-3 text-sm leading-6 text-slate-700">{header.map((line) => <p key={line}>{line}</p>)}</header> : null}
          {document.type !== "exam" ? <GenericDocumentContent content={document.content} /> : lines.map((line, index) => {
            const trimmed = line.trim().replace(/^#{1,3}\s+/, "");
            if (!trimmed) return <div key={index} className="h-3" />;
            if (trimmed.startsWith("|")) {
              if (index > 0 && lines[index - 1].trim().startsWith("|")) return null;
              const tableLines: string[] = [];
              for (let cursor = index; cursor < lines.length; cursor += 1) {
                const current = lines[cursor].trim();
                if (!current.startsWith("|")) break;
                tableLines.push(current);
              }
              const rows = tableLines
                .filter((item) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(item))
                .map((item) => item.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
              return <div key={index} className="my-3 max-w-full overflow-x-auto"><table className="min-w-full border-collapse text-xs"><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex} className="border border-slate-300 bg-slate-50 px-2 py-1 text-left font-bold">{cell}</th> : <td key={cellIndex} className="border border-slate-300 px-2 py-1 align-top">{cell}</td>)}</tr>)}</tbody></table></div>;
            }
            if (headingPattern.test(trimmed)) {
              return <h3 key={index} className="mt-5 border-b border-slate-200 pb-1 text-base font-bold uppercase text-ink first:mt-0">{trimmed}</h3>;
            }
            if (/^[-*•]\s+/.test(trimmed)) {
              return <p key={index} className="pl-5 text-sm leading-7 text-slate-700">• {trimmed.replace(/^[-*•]\s+/, "")}</p>;
            }
            return <p key={index} className="break-words text-sm leading-7 text-slate-800">{trimmed}</p>;
          })}
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-semibold leading-5 text-amber-800">Nội dung là bản nháp hỗ trợ soạn tài liệu. Giáo viên cần kiểm tra và chỉnh sửa trước khi sử dụng.</p><BugReportLink source={document.type} className="shrink-0" /></div>
        </article>
      </div>
    </section>
  );
}
