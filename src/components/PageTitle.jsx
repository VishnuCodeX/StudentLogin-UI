// Developed By: Vishnukarthick K

import { cn } from "@/lib/utils";

// Page heading with a stylish Phosphor icon chip (replaces the old emoji titles).
export default function PageTitle({ icon: Icon, children, className }) {
  return (
    <h1 className={cn("flex items-center gap-2.5 font-display text-2xl font-bold", className)}>
      {Icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span>{children}</span>
    </h1>
  );
}
