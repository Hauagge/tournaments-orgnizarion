type ManagementPlaceholderProps = {
  title: string;
  description: string;
};

export function ManagementPlaceholder({
  title,
  description,
}: ManagementPlaceholderProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
    </section>
  );
}
