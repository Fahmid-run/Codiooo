"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { RoomForm } from "@/components/room/room-form";
import { useRooms } from "../../modules/room/hooks/useRoom";

export default function RoomsPage() {
  const { data: rooms = [], isPending, isError, refetch } = useRooms();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Workspace <span className="text-border">/</span> Rooms
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Rooms</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Collaboration rooms inside your projects.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          New room
        </Button>
      </div>

      <section aria-labelledby="rooms-list-title" className="pt-8">
        <h2 id="rooms-list-title" className="sr-only">
          Your rooms
        </h2>

        {isPending ? (
          <Empty className="min-h-[18rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6">
            <EmptyHeader>
              <EmptyTitle>Loading rooms…</EmptyTitle>
              <EmptyDescription>
                Fetching your collaboration rooms.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : isError ? (
          <Empty className="min-h-[18rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6">
            <EmptyHeader>
              <EmptyTitle>Couldn&apos;t load rooms</EmptyTitle>
              <EmptyDescription>
                Something went wrong while fetching your rooms.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        ) : rooms.length === 0 ? (
          <Empty className="min-h-[18rem] rounded-2xl border border-dashed border-border/70 bg-card/35 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRound aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No rooms yet</EmptyTitle>
              <EmptyDescription>
                Create a room inside one of your projects to start
                collaborating.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" size="sm" onClick={() => setIsCreateOpen(true)}>
                Create room
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`} className="block">
                <Card className="h-full gap-0 rounded-2xl border border-border/70 bg-card/90 py-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35">
                  <CardHeader className="px-4 pb-2 pt-4 sm:px-5">
                    <CardTitle className="min-w-0 truncate text-[0.95rem] font-semibold">
                      {room.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {room.project?.name ?? "Project"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="min-h-[2.5rem] px-4 pb-4 sm:px-5">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Open room
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </span>
                  </CardContent>
                  <CardFooter className="px-4 py-3 text-xs text-muted-foreground sm:px-5">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(new Date(room.updatedAt))}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[28rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>Create a room</DialogTitle>
          </DialogHeader>
          <RoomForm />
        </DialogContent>
      </Dialog>
    </main>
  );
}
