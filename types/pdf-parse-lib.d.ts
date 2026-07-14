declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseResult = { text: string; numpages?: number; numrender?: number };
  type PdfParseOptions = { max?: number };
  export default function pdfParse(buffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
}
