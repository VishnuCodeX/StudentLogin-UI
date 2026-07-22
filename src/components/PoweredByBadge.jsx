// Developed By: Vishnukarthick K

// "POWERED BY [MCC(IT)]" badge — a gray uppercase label next to a solid maroon pill.
export default function PoweredByBadge({ className = "" }) {
  return (
    <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground ${className}`}>
      Powered by
      <span className="rounded-full bg-joy px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-white shadow-sm">
        MCC(IT)
      </span>
    </p>
  );
}
