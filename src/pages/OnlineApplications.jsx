// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Link } from "react-router-dom";
import { Loader2, AlertTriangle, RefreshCw, ChevronRight, Repeat, Home, FileText, GraduationCap, Sparkles, Wallet, Receipt } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ICONS = {
  supplementary: Repeat,
  "hostel-leave": Home,
  cee: FileText,
  idc: GraduationCap,
  "misc-payments": Wallet,
  "extra-course": Sparkles,
  "attendance-shortage-fine": AlertTriangle,
  "cee-receipts": Receipt,
};

export default function OnlineApplications() {
  const [apps, setApps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/apply"))
      .then(setApps)
      .catch((e) => setError(e?.response?.data?.message || "Could not load applications."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={FileText}>Online Applications</PageTitle>
          <p className="text-sm text-muted-foreground">Apply online for exams, courses and campus services.</p>
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(apps || []).map((a) => {
            const Icon = ICONS[a.key] || FileText;
            return (
              <Link
                key={a.key}
                to={a.route}
                className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
