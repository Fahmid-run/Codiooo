"use client";

import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProjectSchema } from "../../../modules/project/project.schema";
import { useCreateProject } from "../../../modules/project/hooks/useProject";
import { toast } from "../ui/toast";
import { getApiErrorMessage } from "@/lib/get-api-errormsg";
import { authClient } from "@/lib/auth-client";

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project) => void;
}) {
  const { mutate, isPending } = useCreateProject();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      // onBlur: createProjectSchema,
      // onChange: createProjectSchema,
      onSubmit: createProjectSchema,
    },
    onSubmitInvalid: ({ value, formApi }) => {
      toast.add({
        title: getApiErrorMessage(formApi.state.errors),
        type: "error",
      });
    },
    onSubmit: async ({ value }) => {
      const { data } = await authClient.getSession();
      const sessionId = data?.session?.id;
      mutate(
        {
          payload: value,
          projectOwnerId: sessionId,
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
      console.log(value);
      form.reset();
      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent id="create-project-dialog" className="sm:max-w-[30rem]">
        <DialogHeader className="border-b border-border/70 px-6 pb-5 pt-6">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Start something new
          </div>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription className="max-w-[34ch]">
            Give this workspace a name and a short description.
          </DialogDescription>
        </DialogHeader>

        <form
          className="px-6 pb-6 pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="gap-5">
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.errors.length > 0;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Project name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="off"
                      maxLength={48}
                      placeholder="e.g. Studio North"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>
                      Choose a recognizable name. 2–48 characters.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="description">
              {(field) => {
                const isInvalid = field.state.meta.errors.length > 0;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      className="min-h-32 resize-none"
                      maxLength={280}
                      placeholder="A brief overview of the idea or product."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription className="flex items-center justify-between gap-3">
                      <span>Optional · Up to 280 characters.</span>
                      <span className="shrink-0 tabular-nums">
                        {field.state.value.length}/280
                      </span>
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Plus data-icon="inline-start" />
              Create project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
