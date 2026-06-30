import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageTitle from "@/components/PageTitle";
import {
  Loader2, AlertTriangle, RefreshCw, ArrowLeft, BookOpen, FileText, Megaphone,
  MessageCircle, Download, ExternalLink, CheckCircle2, Clock, GraduationCap, Pin, Plus, X, CalendarDays,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls = "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-pop">
        <div className="flex items-center justify-between gap-3 bg-joy px-5 py-4 text-white">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-white/85 hover:bg-white/15"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
}

const TYPE_EMOJI = { pdf: "📄", ppt: "📊", pptx: "📊", doc: "📝", docx: "📝", xls: "📈", xlsx: "📈", zip: "🗂️" };
const fmtSize = (b) => (!b ? "" : b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);

const TABS = [
  ["materials", "Materials", BookOpen],
  ["assignments", "Assignments", FileText],
  ["syllabus", "Syllabus", GraduationCap],
  ["lessonplan", "Teaching Plan", CalendarDays],
  ["announcements", "Announcements", Megaphone],
  ["discussion", "Discussion", MessageCircle],
];

export default function Courses() {
  const [info, setInfo] = useState(null);          // /lms/subjects
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);       // selected subject
  const [tab, setTab] = useState("materials");
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      unwrap(api.get("/lms/subjects", { skipErrorToast: true })),
      unwrap(api.get("/lms/materials", { skipErrorToast: true })).catch(() => []),
      unwrap(api.get("/lms/assignments", { skipErrorToast: true })).catch(() => []),
      unwrap(api.get("/lms/announcements", { skipErrorToast: true })).catch(() => []),
      unwrap(api.get("/lms/my-submissions", { skipErrorToast: true })).catch(() => []),
    ])
      .then(([subj, mat, asg, ann, sub]) => {
        setInfo(subj); setMaterials(mat || []); setAssignments(asg || []);
        setAnnouncements(ann || []); setSubmissions(sub || []);
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not load your courses."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function reloadSubmissions() {
    unwrap(api.get("/lms/my-submissions", { skipErrorToast: true })).then(setSubmissions).catch(() => {});
  }

  const subjects = info?.subjects || [];
  const [semFilter, setSemFilter] = useState(null); // a semester number, or "ALL"
  useEffect(() => { if (semFilter == null && info?.semester != null) setSemFilter(info.semester); }, [info, semFilter]);

  // semesters present across the student's subjects (authoritative — each subject
  // carries its own curriculum semester from the backend).
  const semInfo = useMemo(() => {
    const all = new Set();
    subjects.forEach((s) => { if (s.semester != null) all.add(s.semester); });
    if (info?.semester != null) all.add(info.semester);
    return { sems: [...all].sort((a, b) => a - b) };
  }, [subjects, info]);

  const shownSubjects = useMemo(() => {
    if (semFilter == null || semFilter === "ALL") return subjects;
    return subjects.filter((s) =>
      s.semester != null ? s.semester === semFilter : semFilter === info?.semester // untagged → current sem
    );
  }, [subjects, semFilter, info]);

  const countFor = useMemo(() => (s) => ({
    materials: materials.filter((m) => m.subjectCode === s.subjectCode).length,
    assignments: assignments.filter((a) => a.subjectCode === s.subjectCode).length,
    announcements: announcements.filter((a) => a.subjectId === s.subjectId).length,
  }), [materials, assignments, announcements]);
  const chip = (on) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${on ? "bg-joy text-white shadow-card" : "bg-muted text-muted-foreground hover:bg-muted/70"}`;

  async function downloadFile(kind, f) {
    if (f.isLink && f.link) { window.open(f.link, "_blank", "noopener,noreferrer"); return; }
    setBusyId(kind + f.id);
    try {
      const url = kind === "assignment" ? `/lms/assignment-download/${f.id}` : `/lms/download/${f.id}`;
      const res = await api.get(url, { responseType: "blob", skipErrorToast: true });
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href; a.download = f.filename || f.title || "download";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (e) {
      toast.error(e?.response?.status === 404 ? "File is no longer available." : "Download failed.");
    } finally { setBusyId(null); }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading courses…</div>;
  if (error) return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button></CardContent></Card>;

  // ── subject detail ──
  if (active) {
    return (
      <CourseDetail
        subject={active}
        onBack={() => setActive(null)}
        tab={tab} setTab={setTab}
        materials={materials.filter((m) => m.subjectCode === active.subjectCode)}
        assignments={assignments.filter((a) => a.subjectCode === active.subjectCode)}
        announcements={announcements.filter((a) => a.subjectId === active.subjectId)}
        submissions={submissions}
        busyId={busyId} downloadFile={downloadFile}
        reloadSubmissions={reloadSubmissions}
      />
    );
  }

  // ── My Courses grid ──
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={GraduationCap}>My Courses</PageTitle>
          <p className="text-sm text-muted-foreground">Materials, assignments, grades and announcements — by subject{info?.semester ? ` · Sem ${info.semester}` : ""}.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {/* semester filter */}
      {semInfo.sems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semester</span>
          {semInfo.sems.map((n) => (
            <button key={n} onClick={() => setSemFilter(n)} className={chip(semFilter === n)}>Sem {n}</button>
          ))}
          <button onClick={() => setSemFilter("ALL")} className={chip(semFilter === "ALL")}>All</button>
        </div>
      )}

      {subjects.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No subjects found.</CardContent></Card>
      ) : shownSubjects.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No courses in this semester.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shownSubjects.map((s) => {
            const c = countFor(s);
            return (
              <button key={s.subjectId} onClick={() => { setActive(s); setTab("materials"); }}
                className="group flex flex-col rounded-3xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card">
                <span className="bg-joy grid h-11 w-11 place-items-center rounded-2xl text-white"><BookOpen className="h-5 w-5" /></span>
                <p className="mt-3 font-display text-base font-bold leading-tight">{s.subjectName}</p>
                <p className="text-xs font-semibold text-primary">{s.subjectCode}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {c.materials}</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {c.assignments}</span>
                  <span className="flex items-center gap-1"><Megaphone className="h-3 w-3" /> {c.announcements}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseDetail({ subject, onBack, tab, setTab, materials, assignments, announcements, submissions, busyId, downloadFile, reloadSubmissions }) {
  const [threads, setThreads] = useState(null);
  const [openThread, setOpenThread] = useState(null);
  const [submitFor, setSubmitFor] = useState(null); // assignment being submitted
  const [askOpen, setAskOpen] = useState(false);
  const [syllabus, setSyllabus] = useState(null);
  const [lessonPlan, setLessonPlan] = useState(null);

  function loadThreads() {
    setThreads(null);
    unwrap(api.get(`/lms/forum/threads`, { params: { subjectId: subject.subjectId }, skipErrorToast: true }))
      .then(setThreads).catch(() => setThreads([]));
  }
  // reset lazy-loaded tab data when the subject changes
  useEffect(() => { setSyllabus(null); setLessonPlan(null); }, [subject.subjectId]);
  useEffect(() => {
    if (tab === "discussion") { setOpenThread(null); loadThreads(); }
    if (tab === "syllabus" && syllabus === null) {
      unwrap(api.get("/lms/syllabus", { params: { subjectId: subject.subjectId }, skipErrorToast: true }))
        .then(setSyllabus).catch(() => setSyllabus({ units: [] }));
    }
    if (tab === "lessonplan" && lessonPlan === null) {
      unwrap(api.get("/lms/lesson-plan", { params: { subjectId: subject.subjectId }, skipErrorToast: true }))
        .then(setLessonPlan).catch(() => setLessonPlan({ plan: null, sessions: [] }));
    }
  }, [tab, subject.subjectId]);

  const subBy = useMemo(() => {
    const m = {};
    submissions.forEach((s) => { if (s.subjectAssignmentId != null) m[s.subjectAssignmentId] = s; });
    return m;
  }, [submissions]);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> My Courses
      </button>
      <div className="flex items-center gap-3">
        <span className="bg-joy grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"><BookOpen className="h-6 w-6" /></span>
        <div>
          <h1 className="font-display text-xl font-bold leading-tight">{subject.subjectName}</h1>
          <p className="text-sm font-semibold text-primary">{subject.subjectCode}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "materials" && (
        <FileList items={materials} kind="material" busyId={busyId} downloadFile={downloadFile}
          empty="No study materials posted yet." />
      )}

      {tab === "assignments" && (
        assignments.length === 0 ? <Empty text="No assignments posted yet." /> : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const s = subBy[a.subjectAssignmentId];
              return (
                <Card key={a.id}><CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{TYPE_EMOJI[(a.fileType || "").toLowerCase()] || "📎"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.fileType?.toUpperCase()}{a.dueDate ? ` · Due ${a.dueDate}` : ""}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <SubmissionBadge s={s} />
                        {s?.status !== "GRADED" && (
                          <button onClick={() => setSubmitFor(a)}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground">
                            {s ? "Re-submit" : "Submit work"}
                          </button>
                        )}
                      </div>
                      {s?.feedback && <p className="mt-1.5 rounded-lg bg-muted/50 p-2 text-xs"><b>Feedback:</b> {s.feedback}</p>}
                    </div>
                    <Button variant="ghost" size="icon" title={a.isLink ? "Open" : "Download"} disabled={busyId === "assignment" + a.id}
                      onClick={() => downloadFile("assignment", a)}
                      className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
                      {busyId === "assignment" + a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : a.isLink ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        )
      )}

      {tab === "syllabus" && (
        syllabus === null ? (
          <div className="flex h-28 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
        ) : (syllabus.units || []).length === 0 ? (
          <Empty text="Syllabus not published yet." />
        ) : (
          <div className="space-y-3">
            {syllabus.units.map((u, i) => (
              <Card key={i}><CardContent className="p-4">
                <p className="font-display text-base font-bold text-primary">{i + 1}. {u.name}</p>
                {u.note && <p className="mt-0.5 text-xs text-muted-foreground">{u.note}</p>}
                {(u.topics || []).length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {u.topics.map((t, j) => (
                      <div key={j} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-semibold">{t.name}</p>
                        {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                        {(t.subTopics || []).length > 0 && (
                          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-foreground/70">
                            {t.subTopics.map((st, k) => <li key={k}>{st}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
            ))}
          </div>
        )
      )}

      {tab === "lessonplan" && (
        lessonPlan === null ? (
          <div className="flex h-28 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
        ) : !lessonPlan.plan && (lessonPlan.sessions || []).length === 0 ? (
          <Empty text="Teaching plan not published yet." />
        ) : (
          <div className="space-y-3">
            {lessonPlan.plan && (
              <Card><CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1.5 p-4 text-sm">
                {lessonPlan.plan.periodsPerWeek != null && <span><b className="text-primary">{lessonPlan.plan.periodsPerWeek}</b> periods / week</span>}
                {lessonPlan.plan.totalHours != null && <span><b className="text-primary">{lessonPlan.plan.totalHours}</b> total hours</span>}
                {lessonPlan.plan.startDate && <span className="text-muted-foreground">Starts {lessonPlan.plan.startDate}</span>}
                {lessonPlan.plan.status && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{lessonPlan.plan.status}</span>}
              </CardContent></Card>
            )}
            {(lessonPlan.sessions || []).length > 0 && (
              <Card><CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Unit / Topic</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Hrs</th>
                    <th className="px-3 py-2.5 font-semibold">Planned</th>
                    <th className="px-3 py-2.5 font-semibold">Method</th>
                  </tr></thead>
                  <tbody>
                    {lessonPlan.sessions.map((s, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2.5 tabular-nums">{s.sessionNo}</td>
                        <td className="px-3 py-2.5"><p className="font-medium">{s.topicName}</p>{s.unitName && <p className="text-xs text-muted-foreground">{s.unitName}</p>}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{s.plannedHours}</td>
                        <td className="px-3 py-2.5 tabular-nums">{s.plannedDate}</td>
                        <td className="px-3 py-2.5">{s.teachingMethod || "—"}{s.remarks ? <span className="block text-xs text-muted-foreground">{s.remarks}</span> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent></Card>
            )}
          </div>
        )
      )}

      {tab === "announcements" && (
        announcements.length === 0 ? <Empty text="No announcements yet." /> : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id}><CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Megaphone className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-600" />}
                      <p className="font-semibold leading-tight">{a.title}</p>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{a.body}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{a.postedBy}{a.postedDate ? ` · ${a.postedDate}` : ""}</p>
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )
      )}

      {tab === "discussion" && (
        openThread ? (
          <ThreadView threadId={openThread} onBack={() => setOpenThread(null)} />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="gradient" onClick={() => setAskOpen(true)}><Plus className="h-4 w-4" /> Ask a question</Button>
            </div>
            {threads === null ? (
              <div className="flex h-28 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
            ) : threads.length === 0 ? (
              <Empty text="No discussion threads yet. Be the first to ask." />
            ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <button key={t.id} onClick={() => setOpenThread(t.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {t.pinned && <Pin className="h-3.5 w-3.5 text-amber-600" />}
                    <p className="truncate font-semibold">{t.title}</p>
                    {t.resolved && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.authorName} · {t.replyCount || 0} repl{(t.replyCount || 0) === 1 ? "y" : "ies"} · {t.lastActivityDate}</p>
                </div>
              </button>
            ))}
          </div>
            )}
          </div>
        )
      )}

      {submitFor && (
        <SubmitModal assignment={submitFor} onClose={() => setSubmitFor(null)}
          onDone={() => { setSubmitFor(null); reloadSubmissions(); }} />
      )}
      {askOpen && (
        <AskModal subjectId={subject.subjectId} onClose={() => setAskOpen(false)}
          onDone={() => { setAskOpen(false); loadThreads(); }} />
      )}
    </div>
  );
}

function SubmitModal({ assignment, onClose, onDone }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!file && !text.trim()) { toast.warning("Add a file or some text."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("subjectAssignmentId", assignment.subjectAssignmentId);
      if (text.trim()) fd.append("submissionText", text.trim());
      if (file) fd.append("file", file);
      await unwrap(api.post("/lms/submit", fd, { headers: { "Content-Type": "multipart/form-data" }, skipErrorToast: true }));
      toast.success("Submitted.");
      onDone();
    } catch (e) { toast.error(e?.response?.data?.message || "Could not submit."); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Submit work" onClose={onClose}>
      <p className="mb-3 text-sm font-semibold">{assignment.title}</p>
      <textarea rows={4} className={inputCls} placeholder="Write your answer (optional if you attach a file)…"
        value={text} onChange={(e) => setText(e.target.value)} />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-semibold file:text-primary" />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit</Button>
      </div>
    </Modal>
  );
}

function AskModal({ subjectId, onClose, onDone }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask() {
    if (!title.trim() || !body.trim()) { toast.warning("Add a title and your question."); return; }
    setBusy(true);
    try {
      await unwrap(api.post("/lms/forum/thread", { subjectId, title: title.trim(), body: body.trim() }, { skipErrorToast: true }));
      toast.success("Question posted.");
      onDone();
    } catch (e) { toast.error(e?.response?.data?.message || "Could not post."); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Ask a question" onClose={onClose}>
      <input className={inputCls} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea rows={4} className={`${inputCls} mt-3`} placeholder="Your question…" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" onClick={ask} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Post</Button>
      </div>
    </Modal>
  );
}

function FileList({ items, kind, busyId, downloadFile, empty }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <div className="space-y-2">
      {items.map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted">
          <span className="text-2xl">{TYPE_EMOJI[(f.fileType || "").toLowerCase()] || (f.isLink ? "🔗" : "📎")}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{f.title || f.filename}</p>
            <p className="text-xs text-muted-foreground">{f.fileType?.toUpperCase()}{fmtSize(f.fileSize) ? ` · ${fmtSize(f.fileSize)}` : ""}{f.startDate ? ` · ${f.startDate}` : ""}</p>
          </div>
          <Button variant="ghost" size="icon" title={f.isLink ? "Open link" : "Download"} disabled={busyId === kind + f.id}
            onClick={() => downloadFile(kind, f)}
            className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
            {busyId === kind + f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : f.isLink ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </Button>
        </div>
      ))}
    </div>
  );
}

function ThreadView({ threadId, onBack }) {
  const [data, setData] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  function loadThread() {
    unwrap(api.get(`/lms/forum/thread/${threadId}`, { skipErrorToast: true })).then(setData).catch(() => setData({ thread: null, posts: [] }));
  }
  useEffect(loadThread, [threadId]);
  async function sendReply() {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await unwrap(api.post("/lms/forum/post", { threadId, body: reply.trim() }, { skipErrorToast: true }));
      setReply(""); loadThread();
    } catch (e) { toast.error(e?.response?.data?.message || "Could not reply."); }
    finally { setBusy(false); }
  }
  if (!data) return <div className="flex h-28 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  const t = data.thread;
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Threads</button>
      {t && (
        <Card><CardContent className="p-4">
          <p className="font-display text-base font-bold">{t.title}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{t.body}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{t.authorName} ({t.authorRole}) · {t.createdDate}</p>
        </CardContent></Card>
      )}
      <div className="space-y-2">
        {(data.posts || []).map((p) => (
          <div key={p.id} className={`rounded-2xl border p-3 ${p.isAnswer ? "border-success/40 bg-success/5" : "border-border bg-card"}`}>
            <p className="whitespace-pre-line text-sm">{p.body}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {p.isAnswer && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}{p.authorName} ({p.authorRole}) · {p.createdDate}
            </p>
          </div>
        ))}
        {(data.posts || []).length === 0 && <Empty text="No replies yet." />}
      </div>
      <div className="flex items-end gap-2">
        <textarea rows={2} className={inputCls} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <Button variant="gradient" onClick={sendReply} disabled={busy || !reply.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Reply
        </Button>
      </div>
    </div>
  );
}

function SubmissionBadge({ s }) {
  if (!s) return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground"><Clock className="h-3 w-3" /> Not submitted</span>;
  if (s.status === "GRADED") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"><GraduationCap className="h-3 w-3" /> Graded {s.marks}{s.maxMarks ? ` / ${s.maxMarks}` : ""}</span>;
  if (s.status === "LATE") return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Submitted (Late)</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700"><CheckCircle2 className="h-3 w-3" /> Submitted</span>;
}

function Empty({ text }) {
  return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{text}</CardContent></Card>;
}
