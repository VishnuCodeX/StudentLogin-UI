// Developed By: Vishnukarthick K

import { Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

// Suspense fallback for lazy-loaded route chunks — shown only for the brief moment a page's
// JS is being fetched (imperceptible once the chunk is cached by the browser). `fullScreen` is
// for the top-level boundary (e.g. Login, first paint before AppLayout mounts); the default
// (content-area) size is for in-app navigations where the sidebar/topbar are already on screen.
export default function PageLoader({ fullScreen = false }) {
  return (
    <div className={cn("flex w-full items-center justify-center", fullScreen ? "min-h-screen" : "min-h-[40vh]")}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
