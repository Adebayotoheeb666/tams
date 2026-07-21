"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function LoadingSubmitButton({ children, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? "Working..." : children}
    </Button>
  );
}
