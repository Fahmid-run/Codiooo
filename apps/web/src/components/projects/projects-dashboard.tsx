"use client";

import { useMemo, useState } from "react";
import { Search, UserRound, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { WorkspaceNavigation } from "@/components/projects/workspace-navigation";
import { useProjects } from "../../../modules/project/hooks/useProject";
import type { WorkspaceSection } from "@/lib/project";
import { NewProjectCard } from "./new-project-card";

export function ProjectsDashboard() {
  const { data: projects = [], isPending, isError, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>("projects");

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      `${project.name} ${project.description ?? ""} ${project.projectOwner?.name ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [projects, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkspaceNavigation
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      {activeSection === "projects" ? (
        <main
          id="projects"
          className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 overflow-hidden"
          >
            <div className="absolute -top-48 left-1/2 h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,oklch(0.42_0.08_294_/_0.22),transparent_68%)] blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
            <section
              aria-labelledby="projects-page-title"
              className="flex flex-col gap-7 border-b border-border/70 pb-8 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Workspace <span className="text-border">/</span> Projects
                </div>
                <h1
                  id="projects-page-title"
                  className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                  Projects
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  A focused home for your ideas, experiments, and everything
                  taking shape.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-end">
                <div className="hidden items-center gap-3 border-l border-border/70 pl-4 sm:flex">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {projects.length.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[0.65rem] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
                    active
                    <br />
                    projects
                  </span>
                </div>

                <div className="relative w-full sm:w-72">
                  <label className="sr-only" htmlFor="project-search">
                    Search projects
                  </label>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="project-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search projects..."
                    className="h-11 rounded-xl border-border/80 bg-card/80 pl-10 pr-4 shadow-sm placeholder:text-muted-foreground/75"
                  />
                </div>
              </div>
            </section>

            <section aria-labelledby="project-list-title" className="pt-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2
                    id="project-list-title"
                    className="text-sm font-semibold tracking-wide"
                  >
                    Your workspace
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchQuery.trim()
                      ? "Matching projects in this workspace"
                      : "Pick up where you left off, or start something new."}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="h-7 rounded-full border-border/80 px-2.5 text-xs font-normal text-muted-foreground"
                >
                  {filteredProjects.length} shown
                </Badge>
              </div>

              {isPending ? (
                <Empty className="min-h-[21rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6">
                  <EmptyHeader>
                    <EmptyTitle>Loading projects…</EmptyTitle>
                    <EmptyDescription>
                      Fetching your workspace projects.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : isError ? (
                <Empty className="min-h-[21rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6">
                  <EmptyHeader>
                    <EmptyTitle>Couldn&apos;t load projects</EmptyTitle>
                    <EmptyDescription>
                      Something went wrong while fetching your projects.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                    >
                      Try again
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <NewProjectCard onClick={() => setIsCreateDialogOpen(true)} />
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  {filteredProjects.length === 0 && searchQuery.trim() && (
                    <Empty className="min-h-[21rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Search aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>No projects found</EmptyTitle>
                        <EmptyDescription>
                          Try a different name or clear your search to see all
                          projects.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                        >
                          Clear search
                        </Button>
                      </EmptyContent>
                    </Empty>
                  )}
                  {filteredProjects.length === 0 && !searchQuery.trim() && (
                    <Empty className="min-h-[21rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                      <EmptyHeader>
                        <EmptyTitle>No projects yet</EmptyTitle>
                        <EmptyDescription>
                          Create your first project to get started.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          Create project
                        </Button>
                      </EmptyContent>
                    </Empty>
                  )}
                </div>
              )}
            </section>
          </div>

          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        </main>
      ) : (
        <WorkspaceEmptyState
          section={activeSection}
          onReturn={() => setActiveSection("projects")}
        />
      )}
    </div>
  );
}

function WorkspaceEmptyState({
  section,
  onReturn,
}: {
  section: Exclude<WorkspaceSection, "projects">;
  onReturn: () => void;
}) {
  const isRooms = section === "rooms";
  const SectionIcon = isRooms ? UsersRound : UserRound;
  const sectionLabel = isRooms ? "Rooms" : "Profile";
  const title = isRooms
    ? "Rooms are on the way"
    : "Your profile is taking shape";
  const description = isRooms
    ? "Shared spaces for your collaborators and conversations will live here."
    : "Account details and workspace preferences will live here.";

  return (
    <main
      id={section}
      className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 overflow-hidden"
      >
        <div className="absolute -top-48 left-1/2 h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,oklch(0.42_0.08_294_/_0.22),transparent_68%)] blur-3xl" />
      </div>
      <section
        className="relative z-10 w-full max-w-xl"
        aria-labelledby="section-title"
      >
        <div className="mb-6 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Workspace <span className="text-border">/</span> {sectionLabel}
        </div>
        <h1
          id="section-title"
          className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {sectionLabel}
        </h1>
        <Empty className="min-h-72 rounded-2xl border border-dashed border-border/70 bg-card/45 p-8">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-12 rounded-2xl bg-primary/10 text-primary"
            >
              <SectionIcon aria-hidden="true" className="size-5" />
            </EmptyMedia>
            <EmptyTitle className="text-lg">{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" variant="outline" onClick={onReturn}>
              Back to projects
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    </main>
  );
}
