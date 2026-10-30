import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold", {
  variants: {
    variant: {
      neutral: "bg-surface text-ink-soft",
      info: "bg-brand-tint text-brand-dark",
      success: "bg-ok-tint text-ok-dark",
      warning: "bg-warn-tint text-warn-dark",
      danger: "bg-danger-tint text-danger-dark",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
