"use client";

import { Download, FileUp, Save } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { createDocument } from "@/lib/history";
import { addQuestions, createQuestion, questionsToDocument } from "@/lib/question-bank";
import type { QuestionDifficulty, QuestionItem, QuestionType } from "@/lib/types";
import { sampleImportQuestionsText } from "@/lib/sample-data";

type Draft = Omit<QuestionItem, "id" | "createdAt"> & { selected: boolean };

function parseText(text: string, subject: string, grade: string, topic: string): Draft[] {
  const blocks = text.trim().split(/\n\s*\n|(?=Câu\s+\d+[.:])/i).map((block) => block.trim()).filter(Boolean);
  return blocks.map<Draft>((block) => {
    const answerMatch = block.match(/Đáp án\s*:\s*(.+)$/im);
    const body = block.replace(/Đáp án\s*:\s*.+$/im, "").trim();
    return { subject, grade, topic, question: body, type: /^[\s\S]*\nA[.)]/im.test(body) ? "Trắc nghiệm" : "Tự luận", difficulty: "Nhận biết", answer: answerMatch?.[1]?.trim() || "", explanation: "", selected: true };
  }).filter((item) => item.question);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(value.trim()); value = ""; } else value += char;
  }
  values.push(value.trim());
  return values;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
}

function parseCsv(text: string): Draft[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const aliases: Record<string, string[]> = {
    subject: ["monhoc", "subject"], grade: ["lop", "grade"], topic: ["chude", "topic"],
    type: ["loaicauhoi", "type"], difficulty: ["mucdo", "difficulty"],
    question: ["noidungcauhoi", "question"], answer: ["dapan", "answer"], explanation: ["loigiai", "explanation"]
  };
  const get = (row: string[], key: string) => {
    const index = headers.findIndex((header) => aliases[key].includes(header));
    return index >= 0 ? row[index] || "" : "";
  };
  return lines.slice(1).map(parseCsvLine).map((row) => ({
    subject: get(row, "subject"), grade: get(row, "grade"), topic: get(row, "topic"),
    type: (get(row, "type") || "Trắc nghiệm") as QuestionType,
    difficulty: (get(row, "difficulty") || "Nhận biết") as QuestionDifficulty,
    question: get(row, "question"), answer: get(row, "answer"), explanation: get(row, "explanation"), selected: true
  })).filter((item) => item.question);
}

export default function ImportQuestionsPage() {
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState("8");
  const [topic, setTopic] = useState("Phương trình");
  const [text, setText] = useState(sampleImportQuestionsText);
  const [rows, setRows] = useState<Draft[]>([]);
  const [message, setMessage] = useState("");

  function parseInput() {
    const parsed = parseText(text, subject, grade, topic);
    setRows(parsed.length ? parsed : [{ subject, grade, topic, question: text, type: "Tự luận", difficulty: "Nhận biết", answer: "", explanation: "", selected: true }]);
    setMessage(parsed.length ? `Đã nhận diện ${parsed.length} câu hỏi.` : "Chưa nhận diện rõ cấu trúc. Bạn vẫn có thể chỉnh sửa hàng bên dưới.");
  }

  async function uploadCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = parseCsv(await file.text());
    setRows(parsed);
    setMessage(parsed.length ? `Đã nhập ${parsed.length} câu từ CSV.` : "Không đọc được câu hỏi. Hãy kiểm tra tên cột hoặc chỉnh sửa thủ công.");
  }

  function downloadSample() {
    const csv = "\uFEFFMôn học,Lớp,Chủ đề,Loại câu hỏi,Mức độ,Nội dung câu hỏi,Đáp án,Lời giải\nToán,8,Phương trình,Trắc nghiệm,Nhận biết,Phương trình nào là phương trình bậc nhất?,A,Lời giải mẫu";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "mau-cau-hoi-classora.csv";
    link.click();
  }

  function update(index: number, key: keyof Draft, value: string | boolean) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  const selected = rows.filter((row) => row.selected);
  const exportItems: QuestionItem[] = selected.map((row, index) => ({ ...row, id: `preview-${index}`, createdAt: new Date().toISOString() }));
  const exportDocument = createDocument(`Câu hỏi đã nhập - ${selected.length} câu`, "question-bank", questionsToDocument(exportItems));

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Nhập câu hỏi từ văn bản" description="Dán câu hỏi hoặc nhập file CSV để lưu vào ngân hàng câu hỏi cục bộ." />
        <section className="card space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div><label className="label">Môn học</label><input className="form-field mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div><label className="label">Lớp</label><input className="form-field mt-1" value={grade} onChange={(e) => setGrade(e.target.value)} /></div>
            <div><label className="label">Chủ đề</label><input className="form-field mt-1" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
          </div>
          <div><label className="label">Nội dung câu hỏi</label><textarea className="form-field mt-1 min-h-56 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={() => { setSubject("Toán"); setGrade("8"); setTopic("Phương trình"); setText(sampleImportQuestionsText); setRows([]); setMessage("Đã điền dữ liệu mẫu."); }}>Dùng dữ liệu mẫu</button>
            <button className="btn-primary" type="button" onClick={parseInput}>Phân tích văn bản</button>
            <label className="btn-secondary cursor-pointer"><FileUp size={16} />Nhập CSV<input className="hidden" type="file" accept=".csv,text/csv" onChange={uploadCsv} /></label>
            <button className="btn-secondary" type="button" onClick={downloadSample}><Download size={16} />Tải file mẫu CSV</button>
          </div>
          {message ? <p className="text-sm font-medium text-brand">{message}</p> : null}
        </section>

        {rows.length ? (
          <section className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" type="button" disabled={!selected.length} onClick={() => { addQuestions(selected.map((row) => createQuestion({ subject: row.subject, grade: row.grade, topic: row.topic, question: row.question, type: row.type, difficulty: row.difficulty, answer: row.answer, explanation: row.explanation }))); setMessage(`Đã lưu ${selected.length} câu vào ngân hàng.`); }}><Save size={16} />Lưu câu đã chọn</button>
              <DocumentExportMenu document={exportDocument} />
            </div>
            <div className="overflow-x-auto rounded-md border border-line bg-white">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="p-3">Chọn</th><th className="p-3">Môn/Lớp/Chủ đề</th><th className="p-3">Câu hỏi</th><th className="p-3">Loại/Mức độ</th><th className="p-3">Đáp án</th><th className="p-3">Lời giải</th></tr></thead>
                <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-line align-top">
                  <td className="p-3"><input type="checkbox" checked={row.selected} onChange={(e) => update(index, "selected", e.target.checked)} /></td>
                  <td className="w-48 p-3 space-y-2"><input className="form-field" value={row.subject} onChange={(e) => update(index, "subject", e.target.value)} /><input className="form-field" value={row.grade} onChange={(e) => update(index, "grade", e.target.value)} /><input className="form-field" value={row.topic} onChange={(e) => update(index, "topic", e.target.value)} /></td>
                  <td className="w-96 p-3"><textarea className="form-field min-h-32" value={row.question} onChange={(e) => update(index, "question", e.target.value)} /></td>
                  <td className="w-44 space-y-2 p-3"><select className="form-field" value={row.type} onChange={(e) => update(index, "type", e.target.value)}>{["Trắc nghiệm", "Tự luận", "Điền khuyết", "Đúng/Sai"].map((value) => <option key={value}>{value}</option>)}</select><select className="form-field" value={row.difficulty} onChange={(e) => update(index, "difficulty", e.target.value)}>{["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((value) => <option key={value}>{value}</option>)}</select></td>
                  <td className="w-52 p-3"><textarea className="form-field min-h-24" value={row.answer} onChange={(e) => update(index, "answer", e.target.value)} /></td>
                  <td className="w-52 p-3"><textarea className="form-field min-h-24" value={row.explanation} onChange={(e) => update(index, "explanation", e.target.value)} /></td>
                </tr>)}</tbody>
              </table>
            </div>
          </section>
        ) : <div className="empty-state mt-6">Kết quả phân tích sẽ xuất hiện tại đây để bạn kiểm tra và chỉnh sửa.</div>}
      </main>
    </div>
  );
}
