// Developed By: Vishnukarthick K

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion } from "framer-motion";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Press/hover motion now lives in framer-motion (spring-based, see TAP_TRANSITION below) instead
// of the flat active:scale-95/hover:-translate-y-0.5 utility classes this used to carry — kept as
// plain CSS here would fight the inline transform framer-motion applies on the same element. The
// transition-property list below deliberately excludes transform for the same reason, but keeps
// color/background/border/shadow/filter so hover:shadow-glow, hover:brightness-105 etc. still fade
// in smoothly instead of snapping.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold ring-offset-background transition-[color,background-color,border-color,box-shadow,filter] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-glow",
        gradient:
          "bg-joy text-white shadow-pop hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:brightness-105",
        outline:
          "border-2 border-input bg-background hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-3.5",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Variants styled to feel flat/inline (a subtle icon button, an underlined text link) skip the
// hover "lift" — a link floating upward on hover reads as broken, not premium.
const LIFT_VARIANTS = new Set(["default", "gradient", "destructive", "outline", "secondary"]);
const TAP_TRANSITION = { type: "spring", stiffness: 500, damping: 30 };

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled} {...props} />
      );
    }
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        whileHover={disabled || !LIFT_VARIANTS.has(variant ?? "default") ? undefined : { y: -2 }}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        transition={TAP_TRANSITION}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
