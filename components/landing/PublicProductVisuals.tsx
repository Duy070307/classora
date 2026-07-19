import { CheckCircle2, ClipboardCheck, FileCheck2, FileText, Search, ShieldCheck } from "lucide-react";
import { ProductScreenshotFrame } from "@/components/landing/ProductScreenshotFrame";

export type AssessmentVisualId = "generate" | "blueprint" | "audit" | "solutions" | "mix" | "answer-sheet" | "grading";
export type TeachingVisualId = "lesson-plan" | "worksheet" | "slides" | "review-pack" | "rubric";

export function HeroProductVisual() {
  return (
    <div className="relative min-w-0 pb-0 xl:pb-10" data-testid="hero-product-visual">
      <ExamGeneratorFrame />
      <ProductScreenshotFrame
        title="Kiểm tra trước khi xuất"
        caption="Rà soát cấu trúc và tách rõ nội dung học sinh, giáo viên."
        variant="compact"
        className="absolute bottom-24 -left-8 hidden w-72 xl:block"
      >
        <div className="bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Kiểm tra đề</p>
          <div className="mt-3 space-y-2">
            {["Đủ số câu theo từng phần", "Đáp án được tách riêng", "Ma trận khớp cấu trúc"].map((item) => (
              <p key={item} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="shrink-0 text-green-600" size={15} aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </ProductScreenshotFrame>
    </div>
  );
}

function ExamGeneratorFrame() {
  return (
    <ProductScreenshotFrame
      title="Tạo đề kiểm tra"
      caption="Thiết lập cấu trúc đề và số câu theo từng phần."
      variant="browser"
    >
      <div className="grid min-h-[410px] sm:grid-cols-[168px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-800 bg-slate-950 p-4 text-slate-300 sm:block" aria-label="Điều hướng minh họa">
          <p className="text-xs font-bold tracking-wide text-white">SOẠN LAB</p>
          <div className="mt-6 space-y-1 text-xs">
            {["Trang tổng quan", "Tạo đề kiểm tra", "Ma trận & đặc tả", "Ngân hàng câu hỏi", "Lịch sử"].map((item, index) => (
              <div key={item} className={`flex min-h-9 items-center border-l-2 px-3 ${index === 1 ? "border-blue-400 bg-white/10 text-white" : "border-transparent"}`}>{item}</div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 bg-slate-100 p-3 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-semibold text-amber-700">ĐÁNH GIÁ & KIỂM TRA</p><h2 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">Tạo đề kiểm tra</h2></div>
            <span className="text-xs font-medium text-slate-500">Đã lưu bản nháp</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
            <div className="border border-slate-200 bg-white p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Thiết lập đề</p>
              {["Môn học: Toán", "Lớp: 12", "Thời gian: 90 phút", "Cấu trúc: 3 phần"].map((row) => <p key={row} className="mt-3 border-b border-slate-100 pb-2">{row}</p>)}
              <div className="mt-4 h-9 rounded-md bg-blue-600 text-center font-semibold leading-9 text-white">Tạo đề kiểm tra</div>
            </div>
            <ExamPaper />
          </div>
        </div>
      </div>
    </ProductScreenshotFrame>
  );
}

function ExamPaper() {
  return (
    <div className="min-h-[286px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-2 gap-4 text-center text-[9px] font-medium text-slate-700"><span>SỞ GIÁO DỤC VÀ ĐÀO TẠO</span><span>ĐỀ KIỂM TRA HỌC KỲ</span></div>
      <div className="mx-auto mt-4 h-px w-24 bg-slate-700" />
      <h3 className="mt-4 text-center text-sm font-bold text-slate-950">MÔN: TOÁN 12</h3>
      <p className="mt-2 text-center text-[10px] text-slate-500">Thời gian làm bài: 90 phút</p>
      <div className="mt-5 space-y-3 text-[10px] leading-4 text-slate-700">
        <p><strong>PHẦN I.</strong> Câu trắc nghiệm nhiều phương án lựa chọn.</p>
        <p><strong>Câu 1.</strong> Cho hàm số có bảng biến thiên như hình dưới. Mệnh đề nào đúng?</p>
        <div className="grid grid-cols-2 gap-2"><span>A. Hàm số đồng biến</span><span>B. Hàm số nghịch biến</span><span>C. Có hai cực trị</span><span>D. Không có cực trị</span></div>
        <p><strong>PHẦN II.</strong> Câu trắc nghiệm đúng sai.</p>
      </div>
    </div>
  );
}

const assessmentVisualCopy: Record<AssessmentVisualId, { title: string; caption: string }> = {
  generate: { title: "Tạo đề kiểm tra", caption: "Thiết lập cấu trúc đề và số câu theo từng phần." },
  blueprint: { title: "Ma trận & đặc tả", caption: "Đối chiếu nội dung, mức độ nhận thức và phân bổ điểm." },
  audit: { title: "Kiểm tra chất lượng đề", caption: "Rà soát lỗi cấu trúc và nội dung trước khi xuất." },
  solutions: { title: "Lời giải & đáp án", caption: "Tách đáp án và hướng dẫn chấm khỏi bản dành cho học sinh." },
  mix: { title: "Trộn mã đề", caption: "Tạo nhiều mã đề nhưng giữ nguyên nội dung và đáp án tương ứng." },
  "answer-sheet": { title: "Phiếu trả lời", caption: "Chuẩn bị phiếu trả lời theo đúng cấu trúc và mã đề." },
  grading: { title: "Chấm bài", caption: "Rà soát kết quả nhận dạng trước khi xác nhận điểm." },
};

export function AssessmentStepVisual({ id }: { id: AssessmentVisualId }) {
  const copy = assessmentVisualCopy[id];
  return (
    <ProductScreenshotFrame title={copy.title} caption={copy.caption} variant="workspace">
      <div className="min-h-[360px] bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <FileCheck2 className="text-amber-700" size={19} aria-hidden="true" />
            <strong className="text-sm text-slate-950">{copy.title}</strong>
            <span className="ml-auto text-xs text-slate-500">Bản nháp đang rà soát</span>
          </div>
          <AssessmentVisualBody id={id} />
        </div>
      </div>
    </ProductScreenshotFrame>
  );
}

function AssessmentVisualBody({ id }: { id: AssessmentVisualId }) {
  if (id === "generate") return <div className="grid gap-4 p-4 md:grid-cols-[210px_minmax(0,1fr)]"><SetupList /><ExamPaper /></div>;
  if (id === "blueprint") return <MatrixPreview />;
  if (id === "audit") return <ReviewPreview />;
  if (id === "solutions") return <SolutionPreview />;
  if (id === "mix") return <MixPreview />;
  if (id === "answer-sheet") return <AnswerSheetPreview />;
  return <GradingPreview />;
}

function SetupList() {
  return <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-950">Cấu trúc đề</p>{["PHẦN I · 12 câu", "PHẦN II · 4 câu", "PHẦN III · 6 câu", "Tổng điểm · 10"].map((item) => <p key={item} className="mt-3 border-b border-slate-200 pb-2">{item}</p>)}</div>;
}

function MatrixPreview() {
  return <div className="overflow-x-auto p-4"><table className="w-full min-w-[560px] border-collapse text-left text-xs"><thead><tr className="bg-amber-50 text-amber-900">{["Nội dung", "Nhận biết", "Thông hiểu", "Vận dụng", "Điểm"].map((item) => <th key={item} className="border border-amber-200 p-3">{item}</th>)}</tr></thead><tbody>{[["Hàm số", "3", "2", "1", "3,0"], ["Nguyên hàm", "2", "2", "1", "2,5"], ["Hình học", "2", "1", "2", "4,5"]].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="border border-slate-200 p-3 text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function ReviewPreview() {
  return <div className="grid gap-5 p-5 md:grid-cols-[1fr_240px]"><div className="space-y-4">{["Cấu trúc 3 phần đúng thiết lập", "Số câu và tổng điểm đã khớp", "Đáp án không xuất hiện trong bản học sinh"].map((item) => <p key={item} className="flex gap-3 border-b border-slate-100 pb-3 text-sm text-slate-700"><CheckCircle2 className="shrink-0 text-green-600" size={18} />{item}</p>)}</div><aside className="border-l-2 border-amber-500 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Cần rà soát</strong><p className="mt-2">Kiểm tra lại cách diễn đạt của 2 câu trước khi xuất.</p></aside></div>;
}

function SolutionPreview() {
  return <div className="p-5"><div className="grid grid-cols-[70px_90px_minmax(0,1fr)] bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"><span>Câu</span><span>Đáp án</span><span>Hướng dẫn</span></div>{[["01", "C", "Đối chiếu dấu của đạo hàm trên từng khoảng."], ["02", "A", "Thay điều kiện vào biểu thức đã cho."], ["03", "D", "Xét vị trí tương đối của hai đường thẳng."]].map((row) => <div key={row[0]} className="grid grid-cols-[70px_90px_minmax(0,1fr)] border-b border-slate-200 px-3 py-3 text-sm text-slate-700">{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div>;
}

function MixPreview() {
  return <div className="p-5"><p className="text-sm font-semibold text-slate-950">Mã đề đã chuẩn bị</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{["101", "102", "103"].map((code) => <div key={code} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">MÃ ĐỀ</p><p className="mt-2 text-2xl font-bold text-blue-700">{code}</p><p className="mt-3 text-xs text-slate-600">22 câu · đáp án đã ánh xạ</p></div>)}</div></div>;
}

function AnswerSheetPreview() {
  return <div className="p-5"><div className="mx-auto max-w-2xl border border-slate-300 p-5"><div className="flex items-center justify-between border-b border-slate-200 pb-3"><strong className="text-sm">PHIẾU TRẢ LỜI TRẮC NGHIỆM</strong><span className="text-xs">Mã đề: 101</span></div><div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">{Array.from({ length: 12 }, (_, index) => <p key={index} className="flex items-center gap-2"><span className="w-5">{index + 1}</span>{["A", "B", "C", "D"].map((option) => <span key={option} className="flex size-5 items-center justify-center rounded-full border border-slate-400 text-[9px]">{option}</span>)}</p>)}</div></div></div>;
}

function GradingPreview() {
  return <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]"><div>{["Câu 01 · C", "Câu 02 · A", "Câu 03 · D", "Câu 04 · B"].map((item, index) => <p key={item} className="flex items-center justify-between border-b border-slate-200 py-3 text-sm text-slate-700"><span>{item}</span><span className={index === 2 ? "text-amber-700" : "text-green-700"}>{index === 2 ? "Cần xác nhận" : "Đã khớp"}</span></p>)}</div><aside className="bg-slate-950 p-5 text-white"><p className="text-xs text-slate-300">Điểm tạm tính</p><p className="mt-2 text-4xl font-bold">8,25</p><p className="mt-4 text-xs leading-5 text-slate-300">Giáo viên xác nhận trước khi lưu kết quả.</p></aside></div>;
}

const teachingCopy: Record<TeachingVisualId, { title: string; caption: string }> = {
  "lesson-plan": { title: "Giáo án", caption: "Tổ chức mục tiêu, hoạt động và minh chứng trong cùng một kế hoạch." },
  worksheet: { title: "Phiếu học tập", caption: "Tạo nhiệm vụ theo mức độ và giữ đáp án ở bản dành cho giáo viên." },
  slides: { title: "Slide bài giảng", caption: "Chuyển dàn ý đã rà soát thành các slide có thể tiếp tục chỉnh sửa." },
  "review-pack": { title: "Đề cương ôn tập", caption: "Kết nối kiến thức trọng tâm, ví dụ và bài luyện tập theo chủ đề." },
  rubric: { title: "Rubric", caption: "Xây dựng tiêu chí, mức độ và hướng dẫn chấm trong một bảng rõ ràng." },
};

export function TeachingDocumentVisual({ id }: { id: TeachingVisualId }) {
  const copy = teachingCopy[id];
  return (
    <ProductScreenshotFrame title={copy.title} caption={copy.caption} variant="workspace">
      <div className="min-h-[360px] bg-violet-50/40 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3"><FileText className="text-violet-700" size={18} /><strong className="text-sm text-slate-950">{copy.title}</strong><span className="ml-auto text-xs text-slate-500">Bản nháp</span></div>
          <TeachingVisualBody id={id} />
        </div>
      </div>
    </ProductScreenshotFrame>
  );
}

function TeachingVisualBody({ id }: { id: TeachingVisualId }) {
  if (id === "slides") return <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 p-4"><div className="space-y-2">{[1, 2, 3, 4].map((item) => <div key={item} className={`aspect-video border p-2 text-[9px] ${item === 2 ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}>Slide {item}</div>)}</div><div className="aspect-video border border-slate-200 bg-slate-50 p-6"><p className="text-xs font-semibold text-violet-700">BÀI GIẢNG</p><h3 className="mt-4 text-xl font-bold text-slate-950">Khảo sát hàm số</h3><div className="mt-6 h-2 w-3/4 bg-slate-200" /><div className="mt-3 h-2 w-1/2 bg-slate-200" /></div></div>;
  if (id === "rubric") return <div className="overflow-x-auto p-4"><table className="w-full min-w-[540px] border-collapse text-xs"><thead><tr className="bg-violet-50 text-violet-900">{["Tiêu chí", "Tốt", "Đạt", "Cần cải thiện", "Điểm"].map((cell) => <th key={cell} className="border border-violet-200 p-3 text-left">{cell}</th>)}</tr></thead><tbody>{["Kiến thức", "Lập luận", "Trình bày"].map((row) => <tr key={row}><td className="border border-slate-200 p-3 font-semibold">{row}</td><td className="border border-slate-200 p-3">Đầy đủ</td><td className="border border-slate-200 p-3">Cơ bản</td><td className="border border-slate-200 p-3">Cần bổ sung</td><td className="border border-slate-200 p-3">/10</td></tr>)}</tbody></table></div>;
  const headings = id === "lesson-plan" ? ["I. Mục tiêu", "II. Thiết bị và học liệu", "III. Tiến trình dạy học", "IV. Đánh giá"] : id === "worksheet" ? ["Mục tiêu", "Nhắc lại kiến thức", "Bài tập cơ bản", "Bài tập vận dụng"] : ["Kiến thức trọng tâm", "Ví dụ minh họa", "Bài luyện tập", "Hướng dẫn tự học"];
  return <div className="grid gap-4 p-5 sm:grid-cols-[160px_minmax(0,1fr)]"><aside className="bg-slate-50 p-4 text-xs text-slate-600"><p className="font-semibold text-slate-950">Cấu trúc tài liệu</p>{headings.map((item, index) => <p key={item} className={`mt-3 ${index === 2 ? "font-semibold text-violet-700" : ""}`}>{item}</p>)}</aside><div className="space-y-4">{headings.map((item, index) => <div key={item} className="border-b border-slate-200 pb-4"><h3 className="text-sm font-semibold text-slate-950">{item}</h3><div className="mt-2 h-2 w-full bg-slate-100" /><div className={`mt-2 h-2 bg-slate-100 ${index % 2 ? "w-3/4" : "w-5/6"}`} /></div>)}</div></div>;
}

export function QuestionBankProductVisual() {
  return (
    <ProductScreenshotFrame title="Ngân hàng câu hỏi" caption="Dùng lại câu hỏi trong đề, phiếu học tập và giáo án." variant="workspace">
      <div className="grid min-h-[330px] sm:grid-cols-[170px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:block"><p className="font-semibold text-slate-900">Bộ câu hỏi</p>{["Tất cả câu hỏi", "Toán 12", "Ôn tập học kỳ"].map((item, index) => <p key={item} className={`mt-3 ${index === 1 ? "font-semibold text-blue-700" : ""}`}>{item}</p>)}</aside>
        <div className="min-w-0 p-4"><div className="flex h-10 items-center gap-2 border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400"><Search size={16} />Tìm nội dung, đáp án, chủ đề…</div><div className="mt-3 border-t border-slate-200">{["Khảo sát sự biến thiên của hàm số", "Giá trị lớn nhất và nhỏ nhất", "Tiệm cận của đồ thị hàm số"].map((item, index) => <div key={item} className="flex gap-3 border-b border-slate-200 py-4"><span className="text-xs font-semibold text-blue-700">0{index + 1}</span><div><p className="text-sm font-semibold text-slate-900">{item}</p><p className="mt-1 text-xs text-slate-500">Toán · Lớp 12 · Có đáp án và lời giải</p></div></div>)}</div></div>
      </div>
    </ProductScreenshotFrame>
  );
}

export function AuthProductPreview() {
  return (
    <ProductScreenshotFrame title="Quy trình tài liệu" caption="Tạo, rà soát và xuất trong một luồng làm việc rõ ràng." variant="compact">
      <div className="bg-white p-4 text-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3"><ClipboardCheck className="text-blue-700" size={18} /><strong className="text-sm">Đề kiểm tra · Toán 12</strong></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
          <div className="border border-blue-200 bg-blue-50 p-3 text-blue-800">Tạo bản nháp</div>
          <div className="border border-amber-200 bg-amber-50 p-3 text-amber-800">Rà soát</div>
          <div className="border border-green-200 bg-green-50 p-3 text-green-800">Xuất file</div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-600"><ShieldCheck className="text-blue-700" size={15} />Giáo viên xác nhận trước khi sử dụng chính thức.</p>
      </div>
    </ProductScreenshotFrame>
  );
}
