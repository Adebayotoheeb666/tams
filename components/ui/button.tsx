"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px] px-4 py-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    const { pending } = useFormStatus();
    const isSubmitting = !asChild && (type === "submit" || type === undefined) && pending;
    const isLoading = loading || isSubmitting;
    const buttonClassName = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(buttonClassName, (children.props as any)?.className),
        ref,
        disabled: isLoading || disabled || (children.props as any)?.disabled,
        "aria-busy": isLoading || undefined,
        ...props,
        children: (
          <>
            {isLoading ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : null}
            {children.props?.children ?? children}
          </>
        ),
      });
    }

    return (
      <button
        className={buttonClassName}
        ref={ref}
        type={type}
        disabled={isLoading || disabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
