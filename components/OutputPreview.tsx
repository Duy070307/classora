import type { GeneratedDocument } from "@/lib/types";

const headingPattern = /^(ĐỀ KIỂM TRA|PHIẾU HỌC TẬP|NHẬN XÉT HỌC SINH|I\.|II\.|III\.|IV\.|V\.|VI\.|PHẦN|ĐÁP ÁN|THANG ĐIỂM|MA TRẬN|MỤC TIÊU|KIẾN THỨC|BÀI TẬP|CHỖ TRỐNG|NGẮN GỌN|TRANG TRỌNG|THÂN THIỆN|LƯU Ý)/i;

export function OutputPreview({ document }: { document: GeneratedDocument }) {
  const lines = document.content.split("\n");

  return (
    <section className="card overflow-hidden bg-slate-100">
      <div className="flex flex-col gap-3 border-b border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">{document.title}</h2>
          <p className="mt-1 text-sm text-muted">Bản nháp có thể kiểm tra, sao chép hoặc xuất Word để chỉnh sửa.</p>
        </div>
        <span className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Cần giáo viên rà soát</span>
      </div>
      <div className="max-h-[680px] overflow-auto p-4 sm:p-6">
        <article className="mx-auto max-w-3xl rounded-md bg-white px-5 py-7 shadow-sm ring-1 ring-slate-200 sm:px-9">
          {lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={index} className="h-3" />;
            if (headingPattern.test(trimmed)) {
              return <h3 key={index} className="mt-4 border-b border-slate-200 pb-1 text-base font-bold uppercase text-ink first:mt-0">{trimmed}</h3>;
            }
            if (trimmed.startsWith("-")) {
              return <p key={index} className="pl-4 text-sm leading-7 text-slate-700">{trimmed}</p>;
            }
            return <p key={index} className="text-sm leading-7 text-slate-800">{trimmed}</p>;
          })}
        </article>
      </div>
    </section>
  );
}
