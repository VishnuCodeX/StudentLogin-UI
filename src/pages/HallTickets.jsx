// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Ticket, Download } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HallTickets() {
  const [exams, setExams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/hallticket/download"))
      .then(setExams)
      .catch((e) => setError(e?.response?.data?.message || "Could not load hall tickets."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Ticket}>Hall Tickets</PageTitle>
          <p className="text-sm text-muted-foreground">Download hall tickets for your exams.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : (exams || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/20">
            <Ticket className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No hall tickets available</p>
          <p className="max-w-sm text-sm text-muted-foreground">Hall tickets appear here once your exam registration is processed.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((e) => (
            <Card key={e.examId}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-2xl">🎫</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.examCode}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.className} · Sem {e.semester} · {e.month} {e.year}
                  </p>
                </div>
                <Button variant="gradient" size="sm"><Download className="h-4 w-4" /> Download</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
