// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Loader2, AlertTriangle, CheckCircle2, XCircle, Trophy, ArrowLeft, Send, Repeat, ClipboardCheck,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

// Full-screen practice-quiz taker (portal, so it overlays the app). Fetch → answer → submit →
// score + review; free retake. Ungraded — no marks impact.
export default function SelfAssessmentRunner({ item, onExit }) {
  const [phase, setPhase] = useState("loading"); // loading | taking | result | error
  const [paper, setPaper] = useState(null);
  const [ans, setAns] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function loadPaper() {
    setPhase("loading"); setAns({}); setResult(null); setError("");
    unwrap(api.get(`/lms/self-assessment/${item.id}/paper`, { skipErrorToast: true }))
      .then((p) => { setPaper(p); setPhase("taking"); })
      .catch((e) => { setError(e?.response?.data?.message || "Could not open this quiz."); setPhase("error"); });
  }
  useEffect(loadPaper, [item.id]);

  const questions = paper?.questions || [];
  const answered = questions.filter((q) => isAnswered(q, ans[q.id])).length;
  const setQ = (qid, patch) => setAns((p) => ({ ...p, [qid]: { ...p[qid], ...patch } }));

  async function submit() {
    const miss = questions.filter((q) => !isAnswered(q, ans[q.id]));
    if (miss.length && !window.confirm(`${miss.length} question(s) unanswered — they'll be marked wrong. Submit anyway?`)) return;
    setSubmitting(true);
    try {
      const answers = questions.map((q) => buildAnswer(q, ans[q.id]));
      const res = await unwrap(api.post(`/lms/self-assessment/${item.id}/submit`, { answers }, { skipErrorToast: true }));
      setResult(res); setPhase("result");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not submit. Please try again.");
    } finally { setSubmitting(false); }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      <div className="flex items-center justify-between gap-3 bg-joy px-5 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={onExit} title="Back" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/90 hover:bg-white/15"><ArrowLeft className="h-5 w-5" /></button>
          <ClipboardCheck className="h-5 w-5 shrink-0" />
          <p className="truncate font-display text-base font-bold">{paper?.title || item.title}</p>
        </div>
        {phase === "taking" && <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{answered}/{questions.length}</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {phase === "loading" && <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" /><p className="max-w-md font-medium">{error}</p>
              <Button variant="outline" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back</Button>
            </div>
          )}

          {phase === "taking" && (
            <>
              {paper?.description && <p className="mb-4 text-sm text-muted-foreground">{paper.description}</p>}
              <p className="mb-5 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Practice quiz — this won't affect your marks. You'll see your score right away and can retake it.
              </p>
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                    <p className="font-semibold"><span className="mr-1.5 text-primary">{i + 1}.</span>{q.questionText}
                      {q.maxMarks != null && <span className="ml-2 text-xs font-normal text-muted-foreground">({q.maxMarks} mark{q.maxMarks === 1 ? "" : "s"})</span>}</p>
                    <div className="mt-3">{renderQuestion(q, ans[q.id], setQ)}</div>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-border bg-background/90 py-4 backdrop-blur">
                <span className="text-sm text-muted-foreground">{answered} of {questions.length} answered</span>
                <Button className="bg-joy text-white" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                </Button>
              </div>
            </>
          )}

          {phase === "result" && result && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-success/15 text-success"><Trophy className="h-9 w-9" /></span>
                <p className="font-display text-2xl font-bold">{result.score}<span className="text-lg text-muted-foreground">/{result.maxScore}</span>
                  <span className="ml-2 rounded-full bg-primary/10 px-3 py-1 text-base font-bold text-primary">{result.percentage}%</span></p>
                <p className="text-sm text-muted-foreground">{result.correct} of {result.total} correct.</p>
                <div className="mt-1 flex gap-2">
                  <Button variant="outline" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back</Button>
                  <Button className="bg-joy text-white" onClick={loadPaper}><Repeat className="h-4 w-4" /> Retake</Button>
                </div>
              </div>

              <div className="space-y-3">
                {(result.review || []).map((r, i) => (
                  <div key={r.questionId} className={`rounded-3xl border-2 bg-card p-5 ${r.correct ? "border-success/40" : "border-destructive/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold"><span className="mr-1.5 text-primary">{i + 1}.</span>{r.questionText}</p>
                      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${r.correct ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {r.correct ? <><CheckCircle2 className="h-3.5 w-3.5" /> +{r.marksAwarded}</> : <><XCircle className="h-3.5 w-3.5" /> 0</>}
                      </span>
                    </div>
                    {result.showAnswers && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Your answer:</span> <span className={r.correct ? "font-medium text-success" : "font-medium text-destructive"}>{r.yourAnswer || "—"}</span></p>
                        {!r.correct && <p><span className="text-muted-foreground">Correct answer:</span> <span className="font-medium text-success">{r.correctAnswer}</span></p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!result.showAnswers && (
                <p className="text-center text-xs text-muted-foreground">Correct answers are hidden for this quiz — only right/wrong is shown.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
}

/* ── render + answer helpers ── */
function renderQuestion(q, a, setQ) {
  a = a || {};
  const fmt = q.quizFormat;
  if (fmt === "MCQ_SINGLE" || fmt === "MCQ_MULTI") {
    const multi = fmt === "MCQ_MULTI";
    const sel = a.selectedOptionIds || [];
    const toggle = (id) => multi
      ? setQ(q.id, { selectedOptionIds: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] })
      : setQ(q.id, { selectedOptionIds: [id] });
    return (
      <div className="space-y-2">
        {(q.options || []).map((o) => {
          const on = sel.includes(o.id);
          return (
            <button key={o.id} type="button" onClick={() => toggle(o.id)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left text-sm font-medium transition ${on ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30" : "border-border hover:bg-muted"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center ${multi ? "rounded" : "rounded-full"} border-2 ${on ? "border-primary bg-primary text-white" : "border-muted-foreground/40"}`}>
                {on && <CheckCircle2 className="h-3.5 w-3.5" />}
              </span>
              {o.optionText}
            </button>
          );
        })}
      </div>
    );
  }
  if (fmt === "TRUE_FALSE") {
    return (
      <div className="flex gap-2">
        {["TRUE", "FALSE"].map((v) => (
          <button key={v} type="button" onClick={() => setQ(q.id, { answerText: v })}
            className={`rounded-xl border px-5 py-2 text-sm font-semibold transition ${a.answerText === v ? "border-transparent bg-joy text-white shadow-pop" : "border-border hover:bg-muted"}`}>
            {v === "TRUE" ? "True" : "False"}
          </button>
        ))}
      </div>
    );
  }
  return (
    <input value={a.answerText || ""} onChange={(e) => setQ(q.id, { answerText: e.target.value })}
      placeholder="Type your answer…"
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
  );
}

function isAnswered(q, a) {
  a = a || {};
  if (q.quizFormat === "MCQ_SINGLE" || q.quizFormat === "MCQ_MULTI") return (a.selectedOptionIds || []).length > 0;
  if (q.quizFormat === "TRUE_FALSE") return !!a.answerText;
  return !!(a.answerText && a.answerText.trim());
}
function buildAnswer(q, a) {
  a = a || {};
  return { questionId: q.id, selectedOptionIds: a.selectedOptionIds || [], answerText: a.answerText || "" };
}
