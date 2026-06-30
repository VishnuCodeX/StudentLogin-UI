import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, FileText, Download, BookOpen, ExternalLink } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function sizeLabel(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_EMOJI = { pdf: "📄", ppt: "📊", pptx: "📊", doc: "📝", docx: "📝", xls: "📈", xlsx: "📈", zip: "🗂️" };

export default function Lms({ kind = "materials" }) {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState(null);

  const isAssign = kind === "assignments";
  const endpoint = isAssign ? "/lms/assignments" : "/lms/materials";

  async function downloadFile(f) {
    // Link-type entries carry an external URL instead of an uploaded file.
    if (f.isLink && f.link) {
      window.open(f.link, "_blank", "noopener,noreferrer");
      return;
    }
    setBusyId(f.id);
    try {
      const url = isAssign ? `/lms/assignment-download/${f.id}` : `/lms/download/${f.id}`;
      const res = await api.get(url, { responseType: "blob", skipErrorToast: true });
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = f.filename || f.title || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (e) {
      toast.error(e?.response?.status === 404 ? "File is no longer available." : "Download failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get(endpoint))
      .then(setFiles)
      .catch((e) => setError(e?.response?.data?.message || "Could not load."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [kind]);

  // group by subject
  const groups = {};
  (files || []).forEach((f) => {
    const key = f.subjectName || "General";
    (groups[key] = groups[key] || []).push(f);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={BookOpen}>{isAssign ?"Assignments" :"Course Materials"}</PageTitle>
          <p className="text-sm text-muted-foreground">
            {isAssign ? "Assignments shared by your faculty — mind the due dates." : "Lecture notes and resources shared by your faculty."}
          </p>
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
      ) : (files || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <BookOpen className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No materials yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Your faculty haven’t uploaded course materials for this semester yet. Check back soon!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([subject, items]) => (
            <Card key={subject}>
              <CardContent className="p-5">
                <p className="mb-3 font-display text-base font-bold text-primary">{subject}</p>
                <div className="space-y-2">
                  {items.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted">
                      <span className="text-2xl">{TYPE_EMOJI[(f.fileType || "").toLowerCase()] || "📎"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{f.title || f.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.fileType?.toUpperCase()} {sizeLabel(f.fileSize) && `· ${sizeLabel(f.fileSize)}`}
                          {f.dueDate && <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">· Due {f.dueDate}</span>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={f.isLink ? "Open link" : "Download"}
                        onClick={() => downloadFile(f)}
                        disabled={busyId === f.id}
                        className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                      >
                        {busyId === f.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : f.isLink ? (
                          <ExternalLink className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
