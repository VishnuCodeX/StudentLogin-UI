import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import {
  Loader2, AlertTriangle, RefreshCw, ClipboardCheck, ListChecks, MessageSquareHeart,
  CheckCircle2, Clock, Trophy, ArrowRight,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AssessmentRunner from "@/pages/obe/AssessmentRunner";

const STATUS = {
  NOT_STARTED: { label: "Not started", cls: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In progress", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  COMPLETED: { label: "Completed", cls: "bg-success/15 text-success" },
};

export default function ObeList({ kind }) {
  const isQuiz = kind === "quiz";
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get(isQuiz ? "/obe/quizzes" : "/obe/surveys", { skipErrorToast: true }))
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.message || "Could not load your assessments."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [kind]);

  if (active) {
    return <AssessmentRunner kind={kind} item={active} onExit={() => { setActive(null); load(); }} />;
  }

  const Icon = isQuiz ? ListChecks : MessageSquareHeart;
  const title = isQuiz ? "OBE Quizzes" : "OBE Surveys";
  const sub = isQuiz
    ? "Attempt the quizzes your faculty have published. Once you start, finish it in one go — you can't retake."
    : "Share your feedback. Once you start a survey, please complete it — you can only submit once.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={ClipboardCheck}>{title}</PageTitle>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
      ) : (items || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20"><Icon className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">Nothing here yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">No {isQuiz ? "quizzes" : "surveys"} have been published for your subjects yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => {
            const s = STATUS[a.status] || STATUS.NOT_STARTED;
            const done = a.status === "COMPLETED";
            return (
              <Card key={a.id}><CardContent className="flex h-full flex-col p-5">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="bg-joy grid h-11 w-11 place-items-center rounded-2xl text-white"><Icon className="h-5 w-5" /></span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                </div>
                <p className="mt-2 font-display text-base font-bold leading-tight">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.subjectName}{a.batchYear ? ` · ${a.batchYear}` : ""}{a.surveyType ? ` · ${a.surveyType}` : ""}</p>

                <div className="mt-4">
                  {done ? (
                    isQuiz ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-success">
                          <Trophy className="h-4 w-4" /> {a.score}/{a.maxScore} · {a.percentage}%
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/obe/results")}>Result <ArrowRight className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" /> Submitted</span>
                    )
                  ) : (
                    <Button className="bg-joy text-white" onClick={() => setActive(a)}>
                      {a.status === "IN_PROGRESS" ? <><Clock className="h-4 w-4" /> Resume</> : <>Start {isQuiz ? "Quiz" : "Survey"} <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  )}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
