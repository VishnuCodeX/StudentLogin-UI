// Developed By: Vishnukarthick K

import { useEffect, useRef, useState } from "react";
import PageTitle from "@/components/PageTitle";
import {
  Loader2, AlertTriangle, RefreshCw, Upload, FileText, CheckCircle2, Clock, XCircle, UploadCloud,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function sizeLabel(b) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function StatusBadge({ status }) {
  const map = {
    VERIFIED: ["bg-success/15 text-success", CheckCircle2],
    REJECTED: ["bg-destructive/15 text-destructive", XCircle],
    PENDING: ["bg-amber-500/15 text-amber-600 dark:text-amber-400", Clock],
  };
  const [cls, Icon] = map[status] || map.PENDING;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}><Icon className="h-3 w-3" /> {status}</span>;
}

export default function Uploads() {
  const [docs, setDocs] = useState(null);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docTypeId, setDocTypeId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      unwrap(api.get("/documents", { skipErrorToast: true })),
      unwrap(api.get("/documents/types", { skipErrorToast: true })),
    ])
      .then(([d, t]) => { setDocs(d); setTypes(t); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load documents."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    if (!docTypeId) { toast.warning("Please select a document type."); return; }
    if (!file) { toast.warning("Please choose a file."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("docTypeId", docTypeId);
      fd.append("file", file);
      await api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Uploaded — pending verification.");
      setFile(null); setDocTypeId("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch {
      // error snackbar shown globally
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={UploadCloud}>Document Uploads</PageTitle>
          <p className="text-sm text-muted-foreground">Upload your documents and track their verification status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {/* Upload form */}
      <Card>
        <CardHeader><CardTitle>Upload a document</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Document Type</label>
                <select
                  value={docTypeId}
                  onChange={(e) => setDocTypeId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select type…</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">File</label>
                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted">
                  <UploadCloud className="h-4 w-4 shrink-0" />
                  <span className="truncate">{file ? file.name : "Choose a file…"}</span>
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <Button type="submit" variant="gradient" disabled={uploading} className="sm:h-11">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Uploaded list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>My Documents</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(docs || []).length === 0 && <p className="py-4 text-sm text-muted-foreground">No documents uploaded yet.</p>}
            {(docs || []).map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.docType || d.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.fileName} {sizeLabel(d.fileSize) && `· ${sizeLabel(d.fileSize)}`} {d.uploadedDate && `· ${d.uploadedDate}`}
                  </p>
                  {d.status === "REJECTED" && d.rejectReason && <p className="text-xs text-destructive">Reason: {d.rejectReason}</p>}
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
