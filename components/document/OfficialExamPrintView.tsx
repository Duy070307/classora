import type { DocumentSettings } from "@/lib/document-settings";
import { parseExamForPrint, type ExamPrintQuestion } from "@/lib/exam-print-format";
import type { GeneratedDocument } from "@/lib/types";

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

function TextSection({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return <section className="teacher-block">
    <h3>{title}</h3>
    {text.split(/\r?\n/).filter(Boolean).map((line, index) => <p key={index}>{line.replace(/^[-*]\s*/, "– ")}</p>)}
  </section>;
}

function Matrix({ text }: { text: string }) {
  const rows = text.split(/\r?\n/).filter((line) => line.trim().startsWith("|") && !/^\|?\s*:?-{3,}/.test(line.trim())).map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  if (!rows.length) return <TextSection title="III. MA TRẬN ĐỀ" text={text} />;
  return <section className="teacher-block"><h3>III. MA TRẬN ĐỀ</h3><table><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></section>;
}

export function OfficialExamPrintView({ document, settings }: { document: GeneratedDocument; settings: DocumentSettings }) {
  const parsed = parseExamForPrint(document);
  const meta = document.examMeta ?? {};
  const code = (meta.examCode || "0101").padStart(4, "0");
  const year = settings.schoolYear.match(/\d{4}/)?.[0] || new Date().getFullYear();
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
      <TextSection title="I. ĐÁP ÁN" text={parsed.answer} />
      <TextSection title="II. HƯỚNG DẪN CHẤM" text={parsed.scoring} />
      <Matrix text={parsed.matrix} />
      <TextSection title="IV. BẢN ĐẶC TẢ" text={parsed.specification} />
    </section>
  </article>;
}
