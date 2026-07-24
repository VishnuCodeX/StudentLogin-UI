// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, GraduationCap, CheckCircle2 } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export default function Eduvistas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [choice, setChoice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/placement/eduvistas", { skipErrorToast: true }))
      .then((d) => { setData(d); setChoice(d?.interest || ""); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load Eduvista's registration."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function submit() {
    if (!choice) { toast.warning("Please select Yes or No."); return; }
    setSubmitting(true);
    try {
      const d = await unwrap(api.post("/placement/eduvistas", { interest: choice }));
      setData(d);
      toast.success("Registered successfully for Eduvista's!");
    } catch {
      // error snackbar shown globally
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={GraduationCap}>Eduvista's Registration</PageTitle>
          <p className="text-sm text-muted-foreground">Opt in to the Eduvista's training & placement programme.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <SkeletonCard lines={5} />
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : data?.registered ? (
        <motion.div key="registered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">Registered for Eduvista's 🎉</p>
          <p className="text-sm text-muted-foreground">
            Your response: <b className="text-foreground">{(data.interest || "").toUpperCase()}</b>
          </p>
          <Button variant="outline" size="sm" onClick={() => setData({ ...data, registered: false })}>
            Update my response
          </Button>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Student" value={data?.studentName} />
              <Field label="Register No" value={data?.registerNo} />
              <Field label="Course" value={data?.courseName} />
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 font-medium">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                Are you willing to apply for Eduvista's?
              </p>
              <div className="flex gap-3">
                {["yes", "no"].map((opt) => {
                  const isYes = opt === "yes";
                  const selected = choice === opt;
                  return (
                    <motion.button
                      key={opt}
                      type="button"
                      onClick={() => setChoice(opt)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`flex-1 rounded-2xl border px-4 py-3 text-center font-semibold capitalize transition-colors ${
                        selected
                          ? isYes
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                          : isYes
                            ? "border-border hover:border-emerald-300"
                            : "border-border hover:border-rose-300"
                      }`}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button onClick={submit} disabled={submitting} className="bg-joy text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Submit
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
