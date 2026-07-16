import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Box,
  ClipboardList,
  FileText,
  ImageIcon,
  MessageSquareText,
  PenTool,
  Presentation,
  Ruler,
  Send,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

const groups = [
  {
    title: "Soạn & kiểm tra",
    description: "Tạo đề, rubric và các tài liệu đánh giá.",
    items: [
      {
        title: "Soạn đề kiểm tra",
        description: "Tạo đề, đáp án, thang điểm và ma trận theo môn, lớp, chủ đề.",
        examples: ["Toán 12 THPTQG", "Lịch sử 12", "Kiểm tra 45 phút"],
        href: "/tools/exam-generator",
        icon: ClipboardList,
        tone: "from-blue-500 to-cyan-500",
      },
      {
        title: "Tạo rubric",
        description: "Tạo bảng tiêu chí đánh giá có mức độ, mô tả và điểm số.",
        examples: ["Thuyết trình", "Bài viết", "Dự án nhóm"],
        href: "/tools/rubric-generator",
        icon: PenTool,
        tone: "from-purple-500 to-fuchsia-500",
      },
    ],
  },
  {
    title: "Tài liệu dạy học",
    description: "Chuẩn bị giáo án, phiếu học tập và tài liệu lớp học.",
    items: [
      {
        title: "Tạo phiếu học tập",
        description: "Chuẩn bị phiếu ngắn gọn, rõ mục tiêu và dễ in.",
        examples: ["Toán 8", "Hoạt động nhóm", "Ôn tập chương"],
        href: "/tools/worksheet-generator",
        icon: BookOpenCheck,
        tone: "from-emerald-500 to-teal-500",
      },
      {
        title: "Soạn giáo án",
        description: "Lên kế hoạch bài dạy với mục tiêu, tiến trình và đánh giá.",
        examples: ["Ngữ văn 9", "Bài 45 phút", "Hoạt động khởi động"],
        href: "/tools/lesson-plan-generator",
        icon: FileText,
        tone: "from-indigo-500 to-violet-500",
      },
      {
        title: "Tạo slide bài giảng",
        description: "Rà soát dàn ý, chỉnh sửa từng slide và xuất PowerPoint.",
        examples: ["Giảng bài mới", "Ôn tập", "Chữa bài"],
        href: "/tools/lesson-slides",
        icon: Presentation,
        tone: "from-blue-500 to-indigo-500",
      },
    ],
  },
  {
    title: "Giao tiếp & nhận xét",
    description: "Viết nhận xét học sinh và tin nhắn phụ huynh lịch sự.",
    items: [
      {
        title: "Viết nhận xét học sinh",
        description: "Tạo nhận xét tự nhiên, tích cực, có điểm mạnh và hướng cải thiện.",
        examples: ["Cuối kỳ", "Tiến bộ", "Cần hỗ trợ thêm"],
        href: "/tools/student-comments",
        icon: MessageSquareText,
        tone: "from-amber-500 to-orange-500",
      },
      {
        title: "Soạn tin nhắn phụ huynh",
        description: "Viết tin nhắn ngắn gọn, lịch sự và rõ ý để gửi phụ huynh.",
        examples: ["Nhắc học bài", "Mời họp", "Báo tiến bộ"],
        href: "/tools/parent-message-generator",
        icon: Send,
        tone: "from-pink-500 to-rose-500",
      },
    ],
  },
  {
    title: "Toán & LaTeX",
    description: "Xử lý công thức, ảnh toán học và hình học cần vẽ lại.",
    items: [
      {
        title: "Ảnh công thức → LaTeX",
        description: "Nhận diện công thức từ ảnh đã cắt gọn để sao chép vào tài liệu.",
        examples: ["Phân số", "Căn thức", "Ma trận"],
        href: "/tools/image-to-latex?mode=formula",
        icon: ImageIcon,
        tone: "from-sky-500 to-blue-600",
      },
      {
        title: "Hình học → TikZ",
        description: "Tạo bản nháp TikZ từ hình học rõ nét để chỉnh sửa trong LaTeX.",
        examples: ["Tam giác", "Đường tròn", "Hình tọa độ"],
        href: "/tools/image-to-latex?mode=geometry",
        icon: Ruler,
        tone: "from-cyan-500 to-indigo-500",
      },
    ],
  },
  {
    title: "Trực quan hóa bài học",
    description: "Tạo mô phỏng 3D đơn giản để minh họa khái niệm hoặc chuyển động.",
    items: [
      {
        title: "Tạo mô phỏng 3D",
        description: "Tạo cảnh 3D đơn giản từ mô tả để minh họa bài học.",
        examples: ["Hệ Mặt Trời", "Con lắc", "Phân tử H2O"],
        href: "/tools/3d-animation",
        icon: Box,
        tone: "from-blue-500 to-cyan-500",
      },
    ],
  },
];

const suggestions = [
  ["Tạo đề kiểm tra", "/tools/exam-generator"],
  ["Tạo phiếu học tập", "/tools/worksheet-generator"],
  ["Tạo slide bài giảng", "/tools/lesson-slides"],
  ["Viết nhận xét học sinh", "/tools/student-comments"],
  ["Chuyển ảnh công thức sang LaTeX", "/tools/image-to-latex?mode=formula"],
  ["Tạo mô phỏng 3D", "/tools/3d-animation"],
] as const;

export default function CreatePage() {
  return (
    <AppShell title="Tạo mới">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute bottom-6 right-8 hidden rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-800 lg:block">
          Bản nháp → rà soát → xuất file
        </div>
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700">
            <Sparkles size={14} />
            Trung tâm tạo tài liệu
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Bạn muốn tạo gì?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Chọn một công việc, Soạn Lab sẽ mở đúng công cụ và gợi ý thông tin cần nhập.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-slate-900">Gợi ý bắt đầu:</span>
          {suggestions.map(([label, href]) => (
            <Link key={label} href={href} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-600 hover:text-white">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-2xl font-black text-slate-900">{group.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {group.items.map((task) => {
                const Icon = task.icon;
                const isImageToLatexTask = task.href.startsWith("/tools/image-to-latex");
                return (
                  <Link
                    key={task.title}
                    href={task.href}
                    className="group flex min-h-[250px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Icon size={23} />
                      </span>
                      {isImageToLatexTask ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Beta</span>
                      ) : null}
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-900">{task.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{task.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {task.examples.map((example) => (
                        <span key={example} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700">
                          {example}
                        </span>
                      ))}
                    </div>
                    <span className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-blue-700">
                      Bắt đầu
                      <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
