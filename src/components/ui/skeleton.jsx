// Developed By: Vishnukarthick K

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// The base shimmering block every other skeleton below composes from.
function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />;
}

// A table-shaped placeholder — mirrors the `<Card><CardContent className="overflow-x-auto p-0">
// <table>` convention used by most list/report screens in this app.
function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-3 py-3"><Skeleton className="h-3 w-20" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-border last:border-0">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-3 py-3"><Skeleton className="h-4 w-full max-w-[140px]" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// A vertical stack of clickable-row placeholders — mirrors the receipts/notification "row list"
// pattern (e.g. CeeReceipts, Supplementary receipts list).
function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// A single card-shaped placeholder — for form/detail screens whose loading state is one central
// Card rather than a table or a list (e.g. Profile, ReIssueIdCard).
function SkeletonCard({ lines = 4, className }) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-6">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === 0 ? "w-1/2" : i % 2 === 0 ? "w-full" : "w-2/3")} />
        ))}
      </CardContent>
    </Card>
  );
}

// A grid of card-shaped tiles — for course/catalog-style grids (e.g. Cee, Courses).
function SkeletonGrid({ items = 6, className }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-9 w-full rounded-2xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonTable, SkeletonList, SkeletonCard, SkeletonGrid };
