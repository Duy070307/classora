import type { GeneratedDocument } from "@/lib/types";
import { BugReportLink } from "@/components/BugReportLink";

const headingPattern = /^(#{1,3}\s+|ĐỀ KIỂM TRA|PHIẾU HỌC TẬP|NHẬN XÉT|MA TRẬN|ĐÁP ÁN|TRỘN MÃ ĐỀ|MÃ ĐỀ|I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|PHẦN|THANG ĐIỂM|MỤC TIÊU|KIẾN THỨC|BÀI TẬP|CHỖ TRỐNG|NGẮN GỌN|TRANG TRỌNG|THÂN THIỆN|LƯU Ý|HƯỚNG DẪN)/i;

export function OutputPreview({ document }: { document: GeneratedDocument }) {
  const lines = document.content.split("\n");

  return (
    <section className="card min-w-0 overflow-hidden bg-slate-100">
      <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Bản xem trước tài liệu</p>
          <h2 className="mt-1 break-words text-lg font-bold text-ink sm:text-xl">{document.title}</h2>
          <p className="mt-1 text-sm text-muted">Có thể sao chép, xuất Word, Markdown, TXT hoặc in và lưu PDF.</p>
        </div>
        <span className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Cần giáo viên rà soát</span>
      </div>
      <div className="max-h-[72vh] overflow-auto bg-slate-200/60 p-2 sm:max-h-[720px] sm:p-8">
        <article className="mx-auto min-w-0 max-w-3xl rounded-sm bg-white px-4 py-6 shadow-md ring-1 ring-slate-200 sm:min-h-[900px] sm:px-12 sm:py-10">
          {lines.map((line, index) => {
            const trimmed = line.trim().replace(/^#{1,3}\s+/, "");
            if (!trimmed) return <div key={index} className="h-3" />;
            if (trimmed.startsWith("|")) {
              return <pre key={index} className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-slate-50 px-3 py-2 font-mono text-xs leading-6 text-slate-700">{trimmed}</pre>;
            }
            if (headingPattern.test(trimmed)) {
              return <h3 key={index} className="mt-5 border-b border-slate-200 pb-1 text-base font-bold uppercase text-ink first:mt-0">{trimmed}</h3>;
            }
            if (/^[-*•]\s+/.test(trimmed)) {
              return <p key={index} className="pl-5 text-sm leading-7 text-slate-700">• {trimmed.replace(/^[-*•]\s+/, "")}</p>;
            }
            return <p key={index} className="break-words text-sm leading-7 text-slate-800">{trimmed}</p>;
          })}
          <div className="mt-8 flex flex-col gap-2 border-t border-amber-200 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-medium leading-5 text-amber-700">Nội dung hiện được tạo bằng AI mô phỏng trong bản demo. Giáo viên cần kiểm tra lại trước khi sử dụng.</p><BugReportLink source={document.type} className="shrink-0" /></div>
        </article>
      </div>
    </section>
  );
}
