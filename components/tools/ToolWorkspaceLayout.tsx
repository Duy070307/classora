export function ToolWorkspaceLayout({ form, output, wideForm = false }: { form: React.ReactNode; output: React.ReactNode; wideForm?: boolean }) {
  return (
    <div className={`grid min-w-0 gap-5 lg:gap-6 xl:items-start ${wideForm ? "xl:grid-cols-[520px_minmax(0,1fr)]" : "xl:grid-cols-[450px_minmax(0,1fr)]"}`}>
      <div className="min-w-0 xl:sticky xl:top-6">{form}</div>
      <div className="min-w-0">{output}</div>
    </div>
  );
}
