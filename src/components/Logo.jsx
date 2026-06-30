import logoBrown from "@/assets/images/mcc-title-brown.png";
import { cn } from "@/lib/utils";

/**
 * Official Mount Carmel College wordmark (src/assets/images/mcc-title-brown.png).
 * tone="light" inverts it to white for dark / maroon surfaces.
 */
export default function Logo({ tone = "color", className }) {
  return (
    <img
      src={logoBrown}
      alt="Mount Carmel College, Bengaluru"
      className={cn(
        "w-auto object-contain",
        tone === "light" ? "brightness-0 invert" : "dark:brightness-0 dark:invert",
        className
      )}
    />
  );
}
