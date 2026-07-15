import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const output = join(process.cwd(), "tests", "fixtures", "document-recognition");
mkdirSync(output, { recursive: true });

const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svgPage = (body, extra = "") => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754" viewBox="0 0 1240 1754"><rect width="1240" height="1754" fill="#ece8df"/><rect x="65" y="45" width="1110" height="1664" rx="8" fill="white" stroke="#b8b8b8" stroke-width="3"/>${extra}<g font-family="Arial, sans-serif" font-size="30" fill="#111827">${body}</g></svg>`);
const line = (x, y, value, attrs = "") => `<text x="${x}" y="${y}" ${attrs}>${escapeXml(value)}</text>`;

const clearSvg = svgPage([
  line(155, 135, "TRƯỜNG THPT SOẠN LAB", 'font-weight="700"'), line(400, 210, "ĐỀ KIỂM TRA TOÁN 12", 'font-size="40" font-weight="700"'),
  line(135, 300, "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn"), line(135, 380, "Câu 1. Hàm số y = x² − 2x + 1 có giá trị nhỏ nhất bằng"),
  line(170, 445, "A. −1"), line(520, 445, "B. 0"), line(170, 505, "C. 1"), line(520, 505, "D. 2"),
  line(135, 610, "Câu 2. Cho tam giác ABC vuông tại A. Khẳng định nào đúng?"), line(170, 675, "A. AB² + AC² = BC²"), line(170, 735, "B. AB + AC = BC"),
].join(""));

const twoColumnSvg = svgPage([
  line(120, 155, "ĐỀ HAI CỘT", 'font-size="40" font-weight="700"'), line(110, 260, "Câu 1. Nội dung cột trái."), line(110, 330, "A. Một"), line(110, 390, "B. Hai"),
  line(650, 260, "Câu 2. Nội dung cột phải."), line(650, 330, "A. Ba"), line(650, 390, "B. Bốn"),
].join(""), '<line x1="620" y1="215" x2="620" y2="1520" stroke="#d1d5db" stroke-width="2"/>');

const formulaSvg = svgPage([
  line(130, 170, "Câu 1. Tính giá trị biểu thức", 'font-weight="700"'), line(260, 330, "A = (√(x² + 1))/(x − 2) + ∫₀¹ t²dt", 'font-size="46"'),
  line(130, 450, "Giữ đúng dấu trừ, số mũ, căn thức và mẫu số."),
].join(""));

const tableSvg = svgPage([
  line(130, 165, "Câu 3. Bảng số liệu khảo sát", 'font-weight="700"'), line(170, 280, "Nhóm"), line(480, 280, "A"), line(700, 280, "B"), line(920, 280, "C"),
  line(170, 380, "Số học sinh"), line(480, 380, "12"), line(700, 380, "15"), line(920, 380, "9"),
].join(""), '<g stroke="#111827" stroke-width="3"><rect x="130" y="220" width="950" height="220" fill="none"/><line x1="130" y1="330" x2="1080" y2="330"/><line x1="410" y1="220" x2="410" y2="440"/><line x1="630" y1="220" x2="630" y2="440"/><line x1="850" y1="220" x2="850" y2="440"/></g>');

const geometrySvg = svgPage([
  line(130, 160, "Câu 4. Cho tam giác ABC có đường cao AH."), line(570, 350, "A", 'font-weight="700"'), line(260, 1060, "B", 'font-weight="700"'), line(910, 1060, "C", 'font-weight="700"'), line(585, 1060, "H", 'font-weight="700"'),
].join(""), '<g stroke="#111827" stroke-width="5" fill="none"><path d="M590 380 L290 1020 L900 1020 Z"/><path d="M590 380 L590 1020" stroke-dasharray="14 10"/><path d="M590 980 h40 v40"/></g>');

async function png(name, source, transform) {
  let pipeline = sharp(source).png();
  if (transform) pipeline = transform(pipeline);
  const buffer = await pipeline.toBuffer(); writeFileSync(join(output, name), buffer); return buffer;
}

function streamObject(dictionary, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data, "latin1");
  return Buffer.concat([Buffer.from(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`, "latin1"), bytes, Buffer.from("\nendstream", "latin1")]);
}

async function makePdf(name, pages) {
  const objects = [null, Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"), null, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")];
  const kids = [];
  for (const page of pages) {
    const pageId = objects.length; objects.push(null); kids.push(`${pageId} 0 R`);
    const contentId = objects.length; objects.push(null);
    if (page.type === "text") {
      const safe = page.text.replace(/[()\\]/g, (value) => `\\${value}`);
      objects[contentId] = streamObject("", `BT /F1 18 Tf 60 770 Td (${safe}) Tj ET`);
      objects[pageId] = Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    } else {
      const jpeg = await sharp(page.image).jpeg({ quality: 82 }).toBuffer(); const metadata = await sharp(jpeg).metadata();
      const imageId = objects.length; objects.push(streamObject(`/Type /XObject /Subtype /Image /Width ${metadata.width} /Height ${metadata.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, jpeg));
      objects[contentId] = streamObject("", "q 535 0 0 757 30 42 cm /Im0 Do Q");
      objects[pageId] = Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    }
  }
  objects[2] = Buffer.from(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>`);
  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")]; const offsets = [0]; let offset = chunks[0].length;
  for (let id = 1; id < objects.length; id += 1) { offsets[id] = offset; const chunk = Buffer.concat([Buffer.from(`${id} 0 obj\n`), objects[id], Buffer.from("\nendobj\n")]); chunks.push(chunk); offset += chunk.length; }
  const xref = offset; let table = `xref\n0 ${objects.length}\n0000000000 65535 f \n`; for (let id = 1; id < objects.length; id += 1) table += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  chunks.push(Buffer.from(`${table}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`, "latin1"));
  writeFileSync(join(output, name), Buffer.concat(chunks));
}

const clear = await png("01-clear-phone-photo.png", clearSvg);
await png("02-rotated-page.png", clearSvg, (pipeline) => pipeline.rotate(90, { background: "#e5e7eb" }));
await png("03-perspective-photo.png", svgPage(`<g transform="translate(100 20) skewX(-7) scale(.88 1)">${line(120, 180, "ĐỀ CHỤP NGHIÊNG", 'font-size="40" font-weight="700"')}${line(120, 290, "Câu 1. Nội dung cần căn chỉnh phối cảnh.")}${line(150, 360, "A. Đúng")}${line(500, 360, "B. Sai")}</g>`));
await png("04-two-column-page.png", twoColumnSvg);
await png("05-formulas-page.png", formulaSvg);
await png("06-data-table-page.png", tableSvg);
await png("07-geometric-figure-page.png", geometrySvg);
await makePdf("08-text-layer.pdf", [{ type: "text", text: "SOAN LAB - TEXT LAYER EXAM - Question 1 - A B C D" }]);
await makePdf("09-image-only-scan.pdf", [{ type: "image", image: clear }]);
await makePdf("10-mixed.pdf", [{ type: "text", text: "SOAN LAB MIXED PDF - TEXT PAGE" }, { type: "image", image: clear }]);
console.log(`Đã tạo 10 fixture nhận dạng tài liệu tại ${output}`);
