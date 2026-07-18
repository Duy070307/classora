export function ToolWorkspaceLayout({ form, output, wideForm = false }: { form: React.ReactNode; output: React.ReactNode; wideForm?: boolean }) {
  return (
    <div className={`grid min-w-0 gap-4 lg:gap-5 xl:items-start ${wideForm ? "xl:grid-cols-[minmax(0,500px)_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]"}`}>
      <div className="min-w-0 xl:sticky xl:top-20">{form}</div>
      <div className="min-w-0">{output}</div>
    </div>
  );
}
