"use client";

import { ClipboardCopy, MessageCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { Navbar } from "@/components/Navbar";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Giáo viên");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  async function handleCopy(event: FormEvent) {
    event.preventDefault();
    const feedback = `GÓP Ý CHO CLASSORA

Tên người góp ý: ${name || "Chưa nhập"}
Vai trò: ${role}

Nội dung góp ý:
${content || "Chưa nhập"}

Gợi ý kiểm tra:
1. Giao diện có dễ dùng không?
2. Công cụ nào hữu ích nhất?
3. Output Word có dùng được không?
4. Giáo viên còn cần công cụ nào?
5. Có lỗi nào khi dùng không?`;

    await navigator.clipboard.writeText(feedback);
    setMessage("Đã sao chép góp ý. Bạn có thể gửi thủ công cho founder Classora qua Zalo/Facebook/email.");
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Beta feedback</p>
          <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">Góp ý cho Classora</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Classora hiện là bản demo sớm dùng AI mô phỏng. Góp ý của thầy cô và người dùng thử sẽ giúp đội ngũ ưu tiên đúng những phần cần cải thiện trước bản beta.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="card p-5">
            <h2 className="text-lg font-bold text-ink">Nên góp ý về điều gì?</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <li>1. Giao diện có dễ dùng không?</li>
              <li>2. Công cụ nào hữu ích nhất?</li>
              <li>3. Output Word có dùng được không?</li>
              <li>4. Giáo viên còn cần công cụ nào?</li>
              <li>5. Có lỗi nào khi dùng không?</li>
            </ol>
            <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              <div className="flex gap-2">
                <MessageCircle size={16} className="mt-0.5 shrink-0" />
                <p>Sau khi sao chép, bạn có thể gửi nội dung này thủ công cho founder Classora qua Zalo/Facebook/email.</p>
              </div>
            </div>
          </aside>

          <form onSubmit={handleCopy} className="card space-y-5 p-5">
            <div>
              <label className="label">Tên người góp ý</label>
              <input className="form-field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Cô Lan" />
            </div>
            <div>
              <label className="label">Vai trò</label>
              <select className="form-field mt-1" value={role} onChange={(event) => setRole(event.target.value)}>
                <option>Giáo viên</option>
                <option>Gia sư</option>
                <option>Học sinh</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label className="label">Nội dung góp ý</label>
              <textarea
                className="form-field mt-1 min-h-44"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Bạn thấy phần nào dễ dùng, phần nào cần sửa, hoặc công cụ nào giáo viên cần thêm?"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <ClipboardCopy size={16} />
              Sao chép góp ý
            </button>
            {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
