import type { DocumentSettings } from "@/lib/document-settings";
import { parseExamForPrint, type ExamPrintQuestion } from "@/lib/exam-print-format";
import type { GeneratedDocument } from "@/lib/types";
import { splitMarkdownTables, type ParsedMarkdownTable } from "@/lib/markdown-table";

function Question({ item }: { item: ExamPrintQuestion }) {
  const compact = item.options.length === 4 && item.options.every((option) => option.text.length <= 55);
  return <section className="exam-question">
    <p><strong>Câu {item.number}. </strong>{item.stem}</p>
    {item.extra.map((line, index) => /\[(Hình vẽ|Hình minh họa|Hình ảnh)\]/i.test(line)
      ? <div key={index} className="exam-figure-placeholder">[Hình vẽ minh họa]</div>
      : <p key={index}>{line}</p>)}
    {item.options.length ? <div className={compact ? "exam-options exam-options-compact" : "exam-options"}>
      {item.options.map((option) => <p key={option.label}><strong>{option.label}.</strong> {option.text}</p>)}
    </div> : null}
    {item.subItems.length ? <div className="exam-subitems">
      {item.subItems.map((subItem) => <p key={subItem.label}><strong>{subItem.label})</strong> {subItem.text}</p>)}
    </div> : null}
  </section>;
}

function PrintTable({ table }: { table: ParsedMarkdownTable }) {
  return <table className="exam-print-table"><thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>;
}

function TextSection({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return <section className="teacher-block">
    {title ? <h3>{title}</h3> : null}
    {splitMarkdownTables(text).map((block, index) => block.type === "table"
      ? <PrintTable key={index} table={block.table} />
      : block.text.split(/\r?\n/).filter(Boolean).map((line, lineIndex) => <p key={`${index}-${lineIndex}`}>{line.replace(/^[-*]\s*/, "– ")}</p>))}
  </section>;
}

function Matrix({ text }: { text: string }) {
  return <TextSection title="III. MA TRẬN ĐỀ" text={text} />;
}

export function OfficialExamPrintView({ document, settings }: { document: GeneratedDocument; settings: DocumentSettings }) {
  const parsed = parseExamForPrint(document);
  const meta = document.examMeta ?? {};
  const code = (meta.examCode || "0101").padStart(4, "0");
  const year = settings.schoolYear.match(/\d{4}/)?.[0] || new Date().getFullYear();
  const structuredMultipleChoice = document.structuredExam?.parts.find((part) => part.type === "multiple_choice")?.questions ?? [];
  const structuredTrueFalse = document.structuredExam?.parts.find((part) => part.type === "true_false")?.questions ?? [];
  const structuredShortAnswer = document.structuredExam?.parts.find((part) => part.type === "short_answer")?.questions ?? [];
  const hasStructuredAnswers = structuredMultipleChoice.length + structuredTrueFalse.length + structuredShortAnswer.length > 0;
  return <article className="official-exam-print">
    <section className="exam-student-pages">
      <header className="exam-print-header">
        <div>
          <p><strong>{(settings.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase()}</strong></p>
          <p><strong>{(meta.schoolName || settings.schoolName || "TRƯỜNG THPT ...").toUpperCase()}</strong></p>
          <p className="italic">(Đề có ... trang)</p>
        </div>
        <div>
          <p><strong>ĐỀ THI THỬ</strong></p>
          <p><strong>KỲ THI TỐT NGHIỆP THPT NĂM {year}</strong></p>
          <p><strong>MÔN: {(meta.subject || "...").toUpperCase()} {meta.grade || "..."}</strong></p>
          <p className="italic">Thời gian làm bài: {meta.duration || "... phút"}, không kể thời gian phát đề.</p>
        </div>
      </header>
      <div className="exam-candidate-row">
        <p>Họ và tên thí sinh: ................................................... &nbsp; Số báo danh: ...................</p>
        <p className="exam-code">Mã đề: {code}</p>
      </div>
      <div className="exam-separator" />
      {parsed.part1.length ? <><h2>PHẦN I. Thí sinh trả lời từ câu 1 đến câu {parsed.part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</h2>{parsed.part1.map((item) => <Question key={`i-${item.number}`} item={item} />)}</> : null}
      {parsed.part2.length ? <><h2>PHẦN II. Thí sinh trả lời từ câu 1 đến câu {parsed.part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</h2>{parsed.part2.map((item) => <Question key={`ii-${item.number}`} item={item} />)}</> : null}
      {parsed.part3.length ? <><h2>PHẦN III. Thí sinh trả lời từ câu 1 đến câu {parsed.part3.length}.</h2>{parsed.part3.map((item) => <Question key={`iii-${item.number}`} item={item} />)}</> : null}
      <p className="exam-end">------ HẾT ------</p>
      <div className="exam-print-footer"><span>Mã đề {code}</span><span>Trang ...</span></div>
    </section>
    <section className="exam-teacher-pages">
      <h2>PHẦN DÀNH CHO GIÁO VIÊN</h2>
      <h2>ĐÁP ÁN VÀ THANG ĐIỂM</h2>
      <h3>I. ĐÁP ÁN</h3>
      {structuredMultipleChoice.length ? <section className="teacher-block"><h3>PHẦN I</h3><PrintTable table={{
        headers: ["Câu", "Đáp án"],
        rows: structuredMultipleChoice.map((question) => [String(question.number), question.answer])
      }} /></section> : null}
      {structuredTrueFalse.length ? <section className="teacher-block"><h3>PHẦN II</h3><PrintTable table={{
        headers: ["Câu", "a", "b", "c", "d"],
        rows: structuredTrueFalse.map((question) => [String(question.number), ...(question.trueFalseItems ?? []).map((item) => item.answer ? "Đúng" : "Sai")])
      }} /></section> : null}
      {structuredShortAnswer.length ? <section className="teacher-block"><h3>PHẦN III</h3><PrintTable table={{
        headers: ["Câu", "Đáp án ngắn", "Gợi ý chấm"],
        rows: structuredShortAnswer.map((question) => [String(question.number), question.answer, question.explanation])
      }} /></section> : null}
      {!hasStructuredAnswers ? <TextSection title="" text={parsed.answer} /> : null}
      <TextSection title="II. HƯỚNG DẪN CHẤM" text={parsed.scoring} />
      <Matrix text={parsed.matrix} />
      <TextSection title="IV. BẢN ĐẶC TẢ" text={parsed.specification} />
      {document.structuredExam?.teacherOnly.notes ? <TextSection title="GHI CHÚ GIÁO VIÊN" text={document.structuredExam.teacherOnly.notes} /> : null}
    </section>
  </article>;
}
