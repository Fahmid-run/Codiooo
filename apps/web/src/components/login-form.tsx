"use client";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { loginSchema } from "@/schema/authSchema";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const handleGithub = async () => {
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/editor",
      errorCallbackURL: "/error",
      newUserCallbackURL: "/editor",
    });

    if (error) {
      toast.error(error.message ?? "GitHub sign-in failed.");
    }
  };
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      const { email, password } = value;

      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/editor",
      });

      if (error) {
        toast.error(error.message ?? "Invalid email or password.");
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <>
                      <Field>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <Input
                          value={field.state.value}
                          id={field.name}
                          name={field.name}
                          placeholder="Enter Your Email"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </>
                  );
                }}
              />
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <>
                      <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                          value={field.state.value}
                          id={field.name}
                          name={field.name}
                          placeholder="Enter Your Password"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </>
                  );
                }}
              />
              <Field>
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button" onClick={handleGithub}>
                  Login with Github
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a href="/auth/sign-up">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
