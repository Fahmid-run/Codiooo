"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";

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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/get-api-errormsg";
import { useProjects } from "../../../modules/project/hooks/useProject";
import { useCreateRoom } from "../../../modules/room/hooks/useRoom";
import { createRoomSchema } from "../../../modules/room/room.schema";

export function RoomForm() {
  const router = useRouter();
  const { data: projects = [], isPending: isLoadingProjects } = useProjects();
  const { mutate, isPending } = useCreateRoom();

  const form = useForm({
    defaultValues: {
      name: "",
      projectId: "",
    },
    validators: {
      onSubmit: createRoomSchema,
    },
    onSubmit: async ({ value }) => {
      mutate(value, {
        onSuccess: (room) => {
          router.push(`/rooms/${room.id}`);
        },
        onError: (error) => {
          toast.add({
            title: getApiErrorMessage(error),
            type: "error",
          });
        },
      });
    },
  });

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Create a room</CardTitle>
        <CardDescription>
          Start a collaboration room inside one of your projects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="room-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Room name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="e.g. Design review"
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="projectId"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Project</FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) =>
                        field.handleChange(value ?? "")
                      }
                      disabled={isLoadingProjects || projects.length === 0}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue
                          placeholder={
                            isLoadingProjects
                              ? "Loading projects…"
                              : "Select a project"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="submit" form="room-form" disabled={isPending}>
            {isPending ? "Creating…" : "Create room"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
