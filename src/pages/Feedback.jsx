// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  MessageSquareHeart,
  CheckCircle2,
  Send,
  Star,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Feedback() {
  const [forms, setForms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setForms(await unwrap(api.get("/feedback/forms")));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load feedback forms.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading feedback forms…
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selected) {
    return <EvaluationForm formId={selected} onBack={() => setSelected(null)} />;
  }

  const list = forms || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Faculty Evaluation & Feedback</h1>
          <p className="text-sm text-muted-foreground">Rate your courses and faculty for this semester.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {list.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No open feedback forms right now.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelected(f.id)}
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <MessageSquareHeart className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{f.subjectName}</p>
              <p className="text-sm text-muted-foreground">{f.facultyName}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Sem {f.semester} · Open till {f.dueDate}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EvaluationForm({ formId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const detail = await unwrap(api.get(`/feedback/forms/${formId}`));
      setData(detail);
      setDone(detail.alreadySubmitted);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load the form.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [formId]);

  const allQuestions = (data?.groups || []).flatMap((g) => g.questions);
  const answeredCount = Object.keys(answers).length;
  const total = allQuestions.length;
  const complete = total > 0 && answeredCount === total;

  async function submit() {
    if (!complete) {
      setError("Please rate all questions before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    const values = Object.values(answers);
    const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    try {
      await api.post("/feedback/submit", {
        formId,
        rating: Math.round(avg),
        answersJson: JSON.stringify(answers),
        comments,
      });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading form…
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scale = data?.scale || [];

  if (done) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to forms
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="font-display text-lg font-semibold">Thank you for your feedback!</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your evaluation for {data.form.subjectName} ({data.form.facultyName}) has been recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to forms
        </Button>
        <span className="text-sm text-muted-foreground">
          {answeredCount}/{total} answered
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.form.subjectName}</CardTitle>
          <p className="text-sm text-muted-foreground">{data.form.facultyName} · Semester {data.form.semester}</p>
        </CardHeader>
        <CardContent className="space-y-7">
          {data.groups.map((group) => (
            <div key={group.groupName}>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                <Star className="h-4 w-4" /> {group.groupName}
              </p>
              <div className="space-y-4">
                {group.questions.map((q) => (
                  <div key={q.id} className="rounded-xl border border-border p-4">
                    <p className="mb-3 text-sm font-medium">{q.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {scale.map((opt) => {
                        const active = answers[q.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="mb-2 block text-sm font-semibold">Additional comments (optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Share any suggestions for the faculty…"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button variant="gradient" className="w-full" onClick={submit} disabled={submitting || !complete}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting…" : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
