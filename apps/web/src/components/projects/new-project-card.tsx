import { ArrowUpRight, Plus } from "lucide-react";

export function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onClick}
      className="group flex h-full min-h-[21rem] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-card/35 p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-200 group-hover:scale-105">
        <Plus aria-hidden="true" className="size-5" />
      </span>
      <span className="mt-5 text-base font-semibold tracking-tight">
        New project
      </span>
      <span className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
        Start with a name and shape your next idea one step at a time.
      </span>
      <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary">
        Create project
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
      </span>
    </button>
  );
}
