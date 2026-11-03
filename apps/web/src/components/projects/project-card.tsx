import {
  Code2,
  LayoutGrid,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProjectIcon, ProjectAccent, Project } from "@/lib/project";

const projectIcons: Record<ProjectIcon, LucideIcon> = {
  layers: Layers,
  layout: LayoutGrid,
  sparkles: Sparkles,
};

const accentStyles: Record<
  ProjectAccent,
  { gradient: string; icon: string; dot: string }
> = {
  amber: {
    gradient: "from-chart-1/20 via-chart-1/5 to-background/10",
    icon: "text-chart-1",
    dot: "bg-chart-1",
  },
  violet: {
    gradient: "from-chart-2/20 via-chart-2/5 to-background/10",
    icon: "text-chart-2",
    dot: "bg-chart-2",
  },
  blue: {
    gradient: "from-chart-3/20 via-chart-3/5 to-background/10",
    icon: "text-chart-3",
    dot: "bg-chart-3",
  },
};

export function ProjectCard({ project }: { project: Project }) {
  const ProjectMark = projectIcons[project.icon];
  const accent = accentStyles[project.accent];

  return (
    <article className="h-full">
      <Card className="h-full gap-0 rounded-2xl border border-border/70 bg-card/90 py-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 ">
        <div
          aria-hidden="true"
          className={cn(
            "relative h-36 overflow-hidden border-b border-border/60 bg-gradient-to-br",
            accent?.gradient,
          )}
        >
          <div className="absolute -right-7 -top-10 size-36 rounded-full border border-foreground/10" />
          <div className="absolute -bottom-24 right-12 size-44 rounded-full border border-foreground/10" />
          <div className="absolute left-4 top-4 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground/25" />
            <span className="size-1.5 rounded-full bg-foreground/15" />
            <span className="size-1.5 rounded-full bg-foreground/10" />
          </div>
          <div className="relative flex h-full items-end justify-between gap-4 px-4 pb-4 pt-10">
            <span className="flex size-11 items-center justify-center rounded-xl border border-foreground/10 bg-background/45 shadow-lg backdrop-blur-sm">
              <ProjectMark
                aria-hidden="true"
                className={cn("size-5", accent?.icon)}
                strokeWidth={1.8}
              />
            </span>
            <div className="w-24 rounded-xl border border-foreground/10 bg-background/45 p-2.5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="h-1.5 w-10 rounded-full bg-foreground/25" />
                <span className={cn("size-2 rounded-full", accent?.dot)} />
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="h-3 w-2.5 rounded-sm bg-primary/35" />
                <span className="h-5 w-2.5 rounded-sm bg-primary/55" />
                <span className="h-4 w-2.5 rounded-sm bg-foreground/15" />
                <span className="h-7 w-2.5 rounded-sm bg-primary/80" />
                <span className="ml-auto h-1 w-6 rounded-full bg-foreground/10" />
              </div>
            </div>
          </div>
        </div>

        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0 px-4 pb-2 pt-4 sm:px-5">
          <CardTitle
            role="heading"
            aria-level={3}
            className="min-w-0 truncate text-[0.95rem] font-semibold"
          >
            {project.name}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="max-w-[8rem] border-border/80 bg-background/30 text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground"
            >
              {project.category}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="min-h-[4.5rem] flex-1 px-4 pb-4 sm:px-5">
          <CardDescription className="line-clamp-2 leading-relaxed">
            {project.description || "No description added yet."}
          </CardDescription>
        </CardContent>

        <CardFooter className="justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:px-5">
          <span className="flex items-center gap-2">
            <span className={cn("size-1.5 rounded-full", accent?.dot)} />
            In progress
          </span>
          <span className="truncate text-right">{project.updatedAt}</span>
        </CardFooter>
      </Card>
    </article>
  );
}
