import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Loader2, AlertTriangle, CheckCircle2, Trophy, ArrowLeft, Send, ClipboardCheck,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { confirm } from "@/lib/confirm";
import { Button } from "@/components/ui/button";

// Full-screen committed assessment taker. Once started, there's no "back to list" until submit,
// and a beforeunload guard warns on navigation away — the "must complete once started" rule.
export default function AssessmentRunner({ kind, item, onExit }) {
  const isQuiz = kind === "quiz";
  const navigate = useNavigate();
  const [phase, setPhase] = useState("loading"); // loading | taking | done | error
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState("");
  const [ans, setAns] = useState({});            // { [qid]: {selectedOptionIds, answerText, selectedOptionId} }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // start / resume
  useEffect(() => {
    let alive = true;
    unwrap(api.post(`/obe/${kind}/${item.id}/start`, {}, { skipErrorToast: true }))
      .then((p) => { if (alive) { setPaper(p); setPhase("taking"); } })
      .catch((e) => { if (alive) { setError(e?.response?.data?.message || "Could not open this assessment."); setPhase("error"); } });
    return () => { alive = false; };
  }, [kind, item.id]);

  // warn on leave while taking
  useEffect(() => {
    if (phase !== "taking") return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [phase]);

  const questions = paper?.questions || [];
  const answeredCount = useMemo(() => questions.filter((q) => isAnswered(q, ans[q.id])).length, [questions, ans]);

  function setQ(qid, patch) { setAns((p) => ({ ...p, [qid]: { ...p[qid], ...patch } })); }

  async function goBack() {
    if (phase === "taking" && questions.length > 0) {
      const ok = await confirm({
        title: "Leave without submitting?",
        message: `Your answers so far won't be saved. This ${isQuiz ? "quiz" : "survey"} stays in progress, and you can resume it later.`,
        confirmText: "Leave",
        cancelText: "Stay",
        danger: true,
      });
      if (!ok) return;
    }
    onExit();
  }

  async function submit() {
    // client-side required check (server re-validates)
    const missing = questions.filter((q) => isRequired(q) && !isAnswered(q, ans[q.id]));
    if (missing.length) { toast.warning(`Please answer all ${isQuiz ? "" : "rating "}questions (${missing.length} left).`); return; }
    setSubmitting(true);
    try {
      const answers = questions.map((q) => buildAnswer(q, ans[q.id]));
      const res = await unwrap(api.post(`/obe/${kind}/${item.id}/submit`, { answers }, { skipErrorToast: true }));
      setResult(res); setPhase("done");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not submit. Please try again.");
    } finally { setSubmitting(false); }
  }

  // Portal to the top level so `fixed` covers the true viewport (escapes the layout's
  // framer-motion transform, which would otherwise clip this full-screen overlay).
  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      {/* header */}
      <div className="flex items-center justify-between gap-3 bg-joy px-5 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={goBack} title="Back"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/90 hover:bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ClipboardCheck className="h-5 w-5 shrink-0" />
          <p className="truncate font-display text-base font-bold">{paper?.title || item.title}</p>
        </div>
        {phase === "taking" && (
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            {answeredCount}/{questions.length} answered
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {phase === "loading" && (
            <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing…</div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="max-w-md font-medium">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back</Button>
                {isQuiz && <Button className="bg-joy text-white" onClick={() => navigate("/obe/results")}>View Result</Button>}
              </div>
            </div>
          )}

          {phase === "taking" && questions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="max-w-md font-medium">This {isQuiz ? "quiz" : "survey"} has no questions yet. Please check back later.</p>
              <Button variant="outline" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back</Button>
            </div>
          )}

          {phase === "taking" && questions.length > 0 && (
            <>
              <div className="mb-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Once you submit you <b>can't retake</b> this {isQuiz ? "quiz" : "survey"}. Answer all questions, then submit.
              </div>
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                    <p className="font-semibold">
                      <span className="mr-1.5 text-primary">{i + 1}.</span>{q.questionText}
                      {isQuiz && q.maxMarks != null && <span className="ml-2 text-xs font-normal text-muted-foreground">({q.maxMarks} mark{q.maxMarks === 1 ? "" : "s"})</span>}
                    </p>
                    <div className="mt-3">{renderQuestion(q, ans[q.id], setQ, isQuiz)}</div>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-border bg-background/90 py-4 backdrop-blur">
                <span className="text-sm text-muted-foreground">{answeredCount} of {questions.length} answered</span>
                <Button className="bg-joy text-white" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                </Button>
              </div>
            </>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-success/15 text-success"><CheckCircle2 className="h-9 w-9" /></span>
              {isQuiz ? (
                <>
                  <h2 className="font-display text-2xl font-bold">Quiz submitted</h2>
                  <div className="flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-display font-bold">{result?.score}/{result?.maxScore}</span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{result?.percentage}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{result?.correct} of {result?.total} correct.</p>
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold">Thanks for your feedback!</h2>
                  <p className="text-sm text-muted-foreground">Your survey response has been recorded.</p>
                </>
              )}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back to list</Button>
                {isQuiz && <Button className="bg-joy text-white" onClick={() => navigate("/obe/results")}>View all results</Button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
}

/* ── per-question rendering ── */
function renderQuestion(q, a, setQ, isQuiz) {
  a = a || {};
  if (isQuiz) {
    const fmt = q.quizFormat;
    if (fmt === "MCQ_SINGLE" || fmt === "MCQ_MULTI") {
      const multi = fmt === "MCQ_MULTI";
      const sel = a.selectedOptionIds || [];
      const toggle = (id) => {
        if (multi) setQ(q.id, { selectedOptionIds: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] });
        else setQ(q.id, { selectedOptionIds: [id] });
      };
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
              className={`rounded-xl border px-5 py-2 text-sm font-semibold transition ${a.answerText === v ? "border-transparent bg-joy text-white shadow-pop font-semibold" : "border-border hover:bg-muted"}`}>
              {v === "TRUE" ? "True" : "False"}
            </button>
          ))}
        </div>
      );
    }
    // ONE_WORD
    return (
      <input value={a.answerText || ""} onChange={(e) => setQ(q.id, { answerText: e.target.value })}
        placeholder="Type your answer…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    );
  }
  // survey
  if (q.qType === "SCALE") {
    return (
      <div className="flex flex-wrap gap-2">
        {(q.options || []).map((o) => {
          const on = a.selectedOptionId === o.id;
          return (
            <button key={o.id} type="button" onClick={() => setQ(q.id, { selectedOptionId: o.id })}
              className={`rounded-xl border px-3 py-2 text-sm transition ${on ? "border-transparent bg-joy text-white shadow-pop font-semibold" : "border-border hover:bg-muted"}`}>
              {o.optionText}
            </button>
          );
        })}
      </div>
    );
  }
  // TEXT
  return (
    <textarea rows={3} value={a.answerText || ""} onChange={(e) => setQ(q.id, { answerText: e.target.value })}
      placeholder="Your response (optional)…"
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
  );
}

function isRequired(q) {
  // quiz: all required; survey: SCALE required, TEXT optional
  return q.quizFormat !== undefined ? true : q.qType === "SCALE";
}
function isAnswered(q, a) {
  a = a || {};
  if (q.quizFormat === "MCQ_SINGLE" || q.quizFormat === "MCQ_MULTI") return (a.selectedOptionIds || []).length > 0;
  if (q.quizFormat === "TRUE_FALSE") return !!a.answerText;
  if (q.quizFormat === "ONE_WORD") return !!(a.answerText && a.answerText.trim());
  if (q.qType === "SCALE") return a.selectedOptionId != null;
  return !!(a.answerText && a.answerText.trim()); // TEXT
}
function buildAnswer(q, a) {
  a = a || {};
  if (q.quizFormat !== undefined) {
    return { questionId: q.id, selectedOptionIds: a.selectedOptionIds || [], answerText: a.answerText || "" };
  }
  return { questionId: q.id, selectedOptionId: a.selectedOptionId ?? null, answerText: a.answerText || "" };
}
