// Developed By: Vishnukarthick K

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import {
  Loader2, AlertTriangle, RefreshCw, Award, FileText, UploadCloud, Trash2, MapPin, Truck,
  Buildings, CreditCard, CheckCircle2, Clock, ShieldCheck, Printer, Send, ArrowLeft, ArrowRight,
  X, Receipt, Info,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { confirm } from "@/lib/confirm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/skeleton";

const POSTING_FEE = 500;
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function Certificates() {
  const [tab, setTab] = useState("apply");
  const [types, setTypes] = useState(null);
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      unwrap(api.get("/certificates/available", { skipErrorToast: true })),
      unwrap(api.get("/certificates/my-requests", { skipErrorToast: true })),
    ])
      .then(([t, r]) => { setTypes(t); setRequests(r); })
      .catch((e) => setError(e?.response?.data?.message || "Could not load certificates."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { if (handlePaymentReturn() === "success") setTab("requests"); }, []);

  function reloadRequests() {
    unwrap(api.get("/certificates/my-requests", { skipErrorToast: true })).then(setRequests).catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Award}>Apply for Certificates</PageTitle>
          <p className="text-sm text-muted-foreground">Request official certificates (TC, PDC, Bonafide …), pay online, and track their status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="flex gap-2">
        {[["apply", "Apply", Award], ["requests", "My Requests", Receipt]].map(([id, label, Icon]) => (
          <motion.button key={id} onClick={() => setTab(id)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? "bg-joy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            <Icon className="h-4 w-4" /> {label}
            {id === "requests" && requests?.length ? (
              <span className="ml-0.5 rounded-full bg-white/25 px-1.5 text-xs">{requests.length}</span>
            ) : null}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <SkeletonGrid items={6} />
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : tab === "apply" ? (
        <motion.div key="apply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <ApplyFlow types={types || []} onDone={() => { reloadRequests(); setTab("requests"); }} />
        </motion.div>
      ) : (
        <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <RequestsList requests={requests || []} onChanged={reloadRequests} />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Apply stepper ───────────────────────── */

const STEPS = ["Certificate", "Details", "Delivery", "Checkout"];

function ApplyFlow({ types, onDone }) {
  const [step, setStep] = useState(0);
  const [cert, setCert] = useState(null);
  const [files, setFiles] = useState([]);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState("");            // COLLEGE | POST
  const [addr, setAddr] = useState({ receiverName: "", receiverMobile: "", addressLine: "", city: "", pincode: "" });
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  function pickCert(c) {
    if (c.marksCard) { toast.info("This certificate isn't available online yet — please contact the office."); return; }
    setCert(c); setFiles([]); setReason(""); setMode(""); setStep(1);
  }

  function addFiles(list) {
    const incoming = Array.from(list || []);
    setFiles((prev) => [...prev, ...incoming].slice(0, 10));
    if (fileRef.current) fileRef.current.value = "";
  }

  const certFee = cert?.fees || 0;
  const postFee = mode === "POST" ? POSTING_FEE : 0;
  const total = certFee + postFee;

  function detailsValid() {
    if (cert?.docRequired && files.length === 0) return false;
    if (cert?.reasonRequired && !reason.trim()) return false;
    return true;
  }
  function deliveryValid() {
    if (mode === "COLLEGE") return true;
    if (mode === "POST") return addr.receiverName.trim() && addr.receiverMobile.trim().replace(/\D/g, "").length >= 10 && addr.addressLine.trim();
    return false;
  }

  async function submit() {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("certificateId", cert.id);
      fd.append("deliveryMode", mode);
      if (cert.reasonRequired) fd.append("reason", reason.trim());
      if (mode === "POST") {
        fd.append("receiverName", addr.receiverName.trim());
        fd.append("receiverMobile", addr.receiverMobile.trim());
        fd.append("addressLine", addr.addressLine.trim());
        fd.append("city", addr.city.trim());
        fd.append("pincode", addr.pincode.trim());
      }
      files.forEach((f) => fd.append("files", f));
      const res = await unwrap(api.post("/certificates/apply", fd, { headers: { "Content-Type": "multipart/form-data" } }));
      // Start the Kotak payment for the just-created request; if the gateway isn't configured,
      // goToGateway shows a notice and we drop the student on My Requests.
      const pay = await unwrap(api.post(`/certificates/${res.requestId}/pay`, {}, { skipErrorToast: true })).catch(() => null);
      const ok = await confirm({
        title: "Confirm payment",
        message: `Proceed to pay ${money(total)} for ${cert.name}?`,
        confirmText: "Proceed",
        cancelText: "Cancel",
      });
      if (!ok || !goToGateway(pay)) onDone();
    } catch {
      /* global error toast */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <StepBar step={step} />

      {/* Step 1 — select certificate */}
      {step === 0 && (
        types.length === 0 ? (
          <Empty icon={Award} title="No certificates available" text="There are no certificates open for application right now." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((c) => (
              <motion.button key={c.id} onClick={() => pickCert(c)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="group flex flex-col rounded-3xl border border-border bg-card p-5 text-left shadow-soft transition-[color,background-color,border-color,box-shadow,filter] hover:border-primary/40 hover:shadow-card">
                <span className="bg-joy grid h-11 w-11 place-items-center rounded-2xl text-white"><FileText className="h-5 w-5" /></span>
                <p className="mt-3 font-display text-base font-bold leading-tight">{c.name}</p>
                {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg font-bold">{money(c.fees)}</span>
                  <span className="flex flex-wrap gap-1">
                    {c.docRequired && <Tag>Docs required</Tag>}
                    {c.reasonRequired && <Tag>Reason</Tag>}
                    {c.marksCard && <Tag tone="muted">Office only</Tag>}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )
      )}

      {/* Step 2 — details (docs + reason) */}
      {step === 1 && cert && (
        <Card><CardContent className="space-y-4 p-5">
          <SelectedHeader cert={cert} />
          {cert.reasonRequired && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Reason <span className="text-destructive">*</span></label>
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need this certificate?"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          )}
          {cert.docRequired ? (
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Supporting documents <span className="text-destructive">*</span>
                <span className="ml-1 font-normal text-muted-foreground">(PDF or image, up to 10)</span></label>
              <motion.button type="button" onClick={() => fileRef.current?.click()}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <UploadCloud className="h-7 w-7" />
                <span className="text-sm font-medium">Click to upload files</span>
              </motion.button>
              <input ref={fileRef} type="file" multiple accept=".pdf,image/*" hidden onChange={(e) => addFiles(e.target.files)} />
              {files.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{f.name}</span></span>
                      <motion.button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></motion.button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground"><Info className="h-4 w-4" /> No supporting documents needed for this certificate.</p>
          )}
          <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!detailsValid()} />
        </CardContent></Card>
      )}

      {/* Step 3 — delivery */}
      {step === 2 && cert && (
        <Card><CardContent className="space-y-4 p-5">
          <SelectedHeader cert={cert} />
          <p className="text-sm font-semibold">How would you like to receive it?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard icon={Buildings} title="Collect at college" sub="Pick up from the office" note="No extra charge"
              active={mode === "COLLEGE"} onClick={() => setMode("COLLEGE")} />
            <ModeCard icon={Truck} title="Post / Courier" sub="Delivered to your address" note={`+ ${money(POSTING_FEE)} posting`}
              active={mode === "POST"} onClick={() => setMode("POST")} />
          </div>

          {mode === "POST" && (
            <div className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2">
              <Field label="Receiver name" req value={addr.receiverName} onChange={(v) => setAddr({ ...addr, receiverName: v })} />
              <Field label="Mobile number" req value={addr.receiverMobile} onChange={(v) => setAddr({ ...addr, receiverMobile: v })} placeholder="10-digit mobile" />
              <div className="sm:col-span-2"><Field label="Address" req value={addr.addressLine} onChange={(v) => setAddr({ ...addr, addressLine: v })} placeholder="House / street / area" /></div>
              <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
              <Field label="PIN code" value={addr.pincode} onChange={(v) => setAddr({ ...addr, pincode: v })} />
            </div>
          )}
          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!deliveryValid()} />
        </CardContent></Card>
      )}

      {/* Step 4 — checkout */}
      {step === 3 && cert && (
        <Card><CardContent className="space-y-4 p-5">
          <SelectedHeader cert={cert} />
          <div className="space-y-2 rounded-2xl border border-border p-4 text-sm">
            <Row label={`${cert.name} fee`} value={money(certFee)} />
            <Row label="Delivery" value={mode === "POST" ? "Post / Courier" : "Collect at college"} />
            {postFee > 0 && <Row label="Posting fee" value={money(postFee)} />}
            <div className="my-1 border-t border-border" />
            <Row label={<span className="font-bold">Total payable</span>} value={<span className="font-display text-lg font-bold">{money(total)}</span>} />
          </div>
          {mode === "POST" && (
            <p className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {addr.receiverName} · {addr.receiverMobile}<br />{addr.addressLine}{addr.city ? `, ${addr.city}` : ""}{addr.pincode ? ` - ${addr.pincode}` : ""}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={submit} disabled={submitting} className="bg-joy text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay {money(total)}
            </Button>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

/* ───────────────────────── My Requests tracker ───────────────────────── */

function RequestsList({ requests, onChanged }) {
  if (requests.length === 0) {
    return <Empty icon={Receipt} title="No requests yet" text="Certificates you apply for will appear here with their status." />;
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => <RequestCard key={r.id} r={r} onChanged={onChanged} />)}
    </div>
  );
}

function RequestCard({ r, onChanged }) {
  const [busy, setBusy] = useState(false);
  const post = r.deliveryMode === "POST";

  async function payNow() {
    setBusy(true);
    try {
      const res = await unwrap(api.post(`/certificates/${r.id}/pay`, {}, { skipErrorToast: true }));
      const ok = await confirm({
        title: "Confirm payment",
        message: `Proceed to pay ${money(r.totalAmount)} for ${r.certificateName}?`,
        confirmText: "Proceed",
        cancelText: "Cancel",
      });
      if (!ok || !goToGateway(res)) onChanged();
    } catch {
      /* global toast */
    } finally { setBusy(false); }
  }

  // Final stage differs by delivery + rejection.
  const finalStep = post
    ? { label: r.trackingNumber ? "Posted" : "Ready to post", icon: Truck, done: !!r.postedDate || r.issued }
    : { label: "Ready to collect", icon: Buildings, done: r.signed || r.issued };
  const steps = [
    { label: "Verified", icon: ShieldCheck, done: r.verified },
    { label: "Printed", icon: Printer, done: r.printed },
    { label: "Signed", icon: CheckCircle2, done: r.signed },
    finalStep,
  ];

  return (
    <Card><CardContent className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold">{r.certificateName}</p>
          <p className="text-xs text-muted-foreground">
            Applied {r.appliedDate || "—"} · {post ? "By post" : "Collect at college"}
            {r.totalAmount != null ? ` · ${money(r.totalAmount)}` : ""}
          </p>
        </div>
        <StatusBadge r={r} />
      </div>

      {r.rejected ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Rejected{r.rejectReason ? `: ${r.rejectReason}` : "."}
        </p>
      ) : !r.paid ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-500/10 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400"><Clock className="h-4 w-4" /> Payment pending</span>
          <Button size="sm" onClick={payNow} disabled={busy} className="bg-joy text-white">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Complete payment
          </Button>
        </div>
      ) : (
        <>
          <Stepper steps={steps} />
          <p className="mt-3 text-sm text-muted-foreground">
            {r.issued
              ? (post ? "Your certificate has been dispatched." : "Issued — please collect from the office.")
              : finalStep.done
                ? (post
                    ? (r.trackingNumber ? <>Posted · Tracking: <span className="font-semibold text-foreground">{r.trackingNumber}</span></> : "Signed — will be posted shortly.")
                    : "Ready — you can collect it from the office on the next working day.")
                : "Your request is being processed by the office."}
          </p>
        </>
      )}
    </CardContent></Card>
  );
}

/* ───────────────────────── small pieces ───────────────────────── */

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
            i < step ? "bg-joy text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </span>
          <span className={`hidden text-xs font-semibold sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
          {i < STEPS.length - 1 && (
            <span className="relative h-0.5 flex-1 overflow-hidden rounded bg-border">
              <span
                className="absolute inset-y-0 left-0 rounded bg-joy transition-[width] duration-500 ease-out"
                style={{ width: i < step ? "100%" : "0%" }}
              />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Stepper({ steps }) {
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${s.done ? "bg-joy text-white" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className={`text-[11px] font-semibold ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${steps[i + 1].done || s.done ? "bg-joy" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ r }) {
  let label = "In process", cls = "bg-muted text-muted-foreground";
  if (r.rejected) { label = "Rejected"; cls = "bg-destructive/15 text-destructive"; }
  else if (!r.paid) { label = "Payment pending"; cls = "bg-amber-500/15 text-amber-600 dark:text-amber-400"; }
  else if (r.issued) { label = r.deliveryMode === "POST" ? "Posted" : "Issued"; cls = "bg-success/15 text-success"; }
  else if (r.signed) { label = "Ready"; cls = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"; }
  else if (r.printed) { label = "Printed"; cls = "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"; }
  else if (r.verified) { label = "Verified"; cls = "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"; }
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

function SelectedHeader({ cert }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3">
      <span className="bg-joy grid h-10 w-10 place-items-center rounded-2xl text-white"><FileText className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="truncate font-display text-base font-bold">{cert.name}</p>
        <p className="text-xs text-muted-foreground">Fee {money(cert.fees)}</p>
      </div>
    </div>
  );
}

function ModeCard({ icon: Icon, title, sub, note, active, onClick }) {
  return (
    <motion.button type="button" onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-joy text-white" : "bg-muted text-muted-foreground"}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-1 font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{note}</span>
    </motion.button>
  );
}

function NavButtons({ onBack, onNext, nextDisabled }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
      <Button onClick={onNext} disabled={nextDisabled} className="bg-joy text-white">Continue <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}

function Field({ label, value, onChange, req, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label} {req && <span className="text-destructive">*</span>}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function Tag({ children, tone }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone === "muted" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{children}</span>;
}

function Empty({ icon: Icon, title, text }) {
  return (
    <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20"><Icon className="h-7 w-7" /></span>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </CardContent></Card>
  );
}
