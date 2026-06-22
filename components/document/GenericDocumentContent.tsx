import { parseDocumentContent } from "@/lib/documents/document-content";

export function GenericDocumentContent({ content }: { content: string }) {
  const blocks = parseDocumentContent(content);
  return <div className="space-y-2 leading-7">
    {blocks.map((block, index) => {
      if (block.type === "heading") return <h2 key={index} className="mt-6 border-b border-slate-300 pb-1 text-base font-bold uppercase first:mt-0">{block.text}</h2>;
      if (block.type === "bullet") return <p key={index} className="pl-5 text-sm">• {block.text}</p>;
      if (block.type === "table") return <div key={index} className="my-4 overflow-x-auto"><table className="w-full border-collapse text-xs"><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex} className="border border-slate-400 bg-slate-100 px-2 py-1.5 text-left font-bold">{cell}</th> : <td key={cellIndex} className="border border-slate-400 px-2 py-1.5 align-top">{cell}</td>)}</tr>)}</tbody></table></div>;
      return <p key={index} className="break-words text-sm">{block.text}</p>;
    })}
  </div>;
}
