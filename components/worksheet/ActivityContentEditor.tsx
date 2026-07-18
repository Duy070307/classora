"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
import type {
  WorksheetActivity,
  WorksheetBlock,
  WorksheetItem,
} from "@/lib/worksheet/types";

export function ActivityContentEditor({
  activity,
  updateActivity,
  embedded = false,
}: {
  activity: WorksheetActivity;
  updateActivity: (id: string, patch: Partial<WorksheetActivity>) => void;
  embedded?: boolean;
}) {
  const items = activity.items || [];
  const blocks = activity.blocks || [];
  const showsOptions = ["multiple_choice", "true_false"].includes(
    activity.type,
  );
  const showsPairs = activity.type === "matching";
  function setItems(next: WorksheetItem[]) {
    updateActivity(activity.id, { items: next });
  }
  function setBlocks(next: WorksheetBlock[]) {
    updateActivity(activity.id, { blocks: next });
  }
  function patchItem(index: number, patch: Partial<WorksheetItem>) {
    setItems(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }
  function addBlock(type: "formula" | "tikz" | "table") {
    const id = crypto.randomUUID();
    if (type === "table")
      setBlocks([
        ...blocks,
        {
          id,
          type,
          headers: ["Cột 1", "Cột 2"],
          rows: [["", ""]],
          expectedCells: {},
        },
      ]);
    else
      setBlocks([
        ...blocks,
        {
          id,
          type,
          content:
            type === "formula"
              ? "\\frac{U}{I}=R"
              : "\\begin{tikzpicture}\n\\draw (0,0)--(2,0);\n\\end{tikzpicture}",
        },
      ]);
  }
  async function addImage(file?: File) {
    if (
      !file ||
      !/^image\/(png|jpeg|webp)$/.test(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setBlocks([
      ...blocks,
      {
        id: crypto.randomUUID(),
        type: "image",
        assetId: crypto.randomUUID(),
        alt: file.name,
        dataUrl,
      },
    ]);
  }
  return (
    <section
      className={
        embedded
          ? "min-w-0"
          : "rounded-[24px] border border-slate-200 bg-white p-5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black">Câu hỏi, lựa chọn và khối nội dung</h2>
          <p className="text-sm text-slate-500">
            Chỉnh từng mục; công thức, bảng, hình và TikZ được lưu trong cùng
            hoạt động.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-content-block-actions>
          <button
            className="btn-primary"
            onClick={() =>
              setItems([
                ...items,
                { id: crypto.randomUUID(), prompt: "Câu hỏi mới", answer: "" },
              ])
            }
          >
            <Plus size={15} />
            Thêm câu
          </button>
          <ActionMenu
            label="Thêm khối nội dung"
            items={[
              { label: "Công thức", onSelect: () => addBlock("formula") },
              { label: "Bảng", onSelect: () => addBlock("table") },
              { label: "TikZ", onSelect: () => addBlock("tikz") },
            ]}
          />
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} />
            Thêm ảnh
            <input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => void addImage(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.map((item, index) => (
          <article key={item.id} className="rounded-2xl border p-3">
            <label className="label">Nội dung {index + 1}</label>
            <textarea
              className="form-field mt-1 min-h-20"
              value={item.prompt}
              onChange={(event) =>
                patchItem(index, { prompt: event.target.value })
              }
            />
            {showsOptions ? (
              <>
                <label className="label mt-2 block">
                  {activity.type === "true_false"
                    ? "Các mệnh đề, mỗi dòng một mệnh đề"
                    : "Các lựa chọn, mỗi dòng một phương án"}
                </label>
                <textarea
                  className="form-field mt-1 min-h-20"
                  value={(item.options || [])
                    .map((option) => `${option.label}. ${option.text}`)
                    .join("\n")}
                  onChange={(event) =>
                    patchItem(index, {
                      options: event.target.value
                        .split(/\r?\n/)
                        .filter(Boolean)
                        .map((line, optionIndex) => ({
                          id:
                            item.options?.[optionIndex]?.id ||
                            crypto.randomUUID(),
                          label: String.fromCharCode(65 + optionIndex),
                          text: line.replace(/^[A-Z][.)]\s*/, ""),
                        })),
                    })
                  }
                />
              </>
            ) : null}
            {showsPairs ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label>
                  <span className="label">Vế trái</span>
                  <input
                    className="form-field"
                    value={item.left || ""}
                    onChange={(event) =>
                      patchItem(index, { left: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span className="label">Vế phải</span>
                  <input
                    className="form-field"
                    value={item.right || ""}
                    onChange={(event) =>
                      patchItem(index, { right: event.target.value })
                    }
                  />
                </label>
              </div>
            ) : null}
            <label className="label mt-2 block">Đáp án</label>
            <input
              className="form-field mt-1"
              value={item.answer || ""}
              onChange={(event) =>
                patchItem(index, { answer: event.target.value })
              }
            />
            <label className="label mt-2 block">Giải thích</label>
            <textarea
              className="form-field mt-1 min-h-16"
              value={item.explanation || ""}
              onChange={(event) =>
                patchItem(index, { explanation: event.target.value })
              }
            />
            <button
              aria-label="Xóa câu"
              className="mt-2 text-red-600"
              onClick={() =>
                setItems(items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {blocks.map((block, index) => (
          <article key={block.id} className="rounded-2xl border p-3">
            <div className="flex justify-between">
              <strong>
                {block.type === "formula"
                  ? "Công thức"
                  : block.type === "tikz"
                    ? "TikZ"
                    : block.type === "table"
                      ? "Bảng"
                      : block.type === "image"
                        ? "Hình ảnh"
                        : "Văn bản"}
              </strong>
              <button
                aria-label="Xóa khối"
                className="text-red-600"
                onClick={() =>
                  setBlocks(
                    blocks.filter((_, blockIndex) => blockIndex !== index),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            {block.type === "formula" ||
            block.type === "tikz" ||
            block.type === "text" ? (
              <textarea
                className="form-field mt-2 min-h-24 font-mono"
                value={block.content}
                onChange={(event) =>
                  setBlocks(
                    blocks.map((item, blockIndex) =>
                      blockIndex === index
                        ? { ...block, content: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            ) : block.type === "table" ? (
              <textarea
                className="form-field mt-2 min-h-24"
                value={[block.headers, ...block.rows]
                  .map((row) => row.join("\t"))
                  .join("\n")}
                onChange={(event) => {
                  const rows = event.target.value
                    .split(/\r?\n/)
                    .map((row) => row.split("\t"));
                  setBlocks(
                    blocks.map((item, blockIndex) =>
                      blockIndex === index
                        ? {
                            ...block,
                            headers: rows[0] || [],
                            rows: rows.slice(1),
                          }
                        : item,
                    ),
                  );
                }}
              />
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                  {block.alt}
                </span>
                <input
                  className="form-field"
                  value={block.alt}
                  onChange={(event) =>
                    setBlocks(
                      blocks.map((item, blockIndex) =>
                        blockIndex === index
                          ? { ...block, alt: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function DifferentiationComparison({
  worksheet,
}: {
  worksheet: import("@/lib/worksheet/types").Worksheet;
}) {
  const [activeLevel, setActiveLevel] = useState<
    "basic" | "standard" | "advanced"
  >("standard");
  const objective =
    worksheet.objectives?.[0] || worksheet.topic || "Mục tiêu chung";
  const titles = (level: "basic" | "standard" | "advanced") =>
    worksheet.activities
      .filter((item) => item.level === level)
      .map((item) => item.title)
      .filter(Boolean)
      .join("; ") || "Chưa có";
  const levelLabels = {
    basic: "Cơ bản",
    standard: "Tiêu chuẩn",
    advanced: "Nâng cao",
  } as const;
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5">
      <h2 className="font-black">Đối chiếu phân hóa</h2>
      <p className="mt-1 text-sm text-slate-500">
        Chọn một mức để tập trung rà soát, tránh hiển thị ba phiên bản cùng lúc.
      </p>
      <div
        className="ui-segmented-control mt-3 grid grid-cols-3"
        role="tablist"
        aria-label="Mức phân hóa"
      >
        {(Object.keys(levelLabels) as Array<keyof typeof levelLabels>).map(
          (level) => (
            <button
              key={level}
              type="button"
              role="tab"
              aria-selected={activeLevel === level}
              className={
                activeLevel === level
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600"
              }
              onClick={() => setActiveLevel(level)}
            >
              {levelLabels[level]}
            </button>
          ),
        )}
      </div>
      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Mục tiêu chung
        </p>
        <p className="mt-1 font-bold text-slate-800">{objective}</p>
        <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
          Hoạt động mức {levelLabels[activeLevel].toLocaleLowerCase("vi")}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {titles(activeLevel)}
        </p>
      </div>
    </section>
  );
}
