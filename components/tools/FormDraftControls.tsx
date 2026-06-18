"use client";

export function FormDraftControls({ updatedAt, onRestore, onClear }: { updatedAt: string | null; onRestore: () => void; onClear: () => void }) {
  return <div className="rounded-md border border-blue-100 bg-blue-50/70 p-3">
    <p className="text-xs text-blue-800">{updatedAt ? `Đã lưu nháp lúc ${new Date(updatedAt).toLocaleTimeString("vi-VN")}` : "Classora sẽ tự lưu nháp khi bạn nhập."}</p>
    {updatedAt ? <div className="mt-2 flex flex-wrap gap-2"><button type="button" className="text-xs font-semibold text-brand" onClick={onRestore}>Khôi phục nháp</button><button type="button" className="text-xs font-semibold text-red-600" onClick={onClear}>Xóa nháp</button></div> : null}
  </div>;
}
