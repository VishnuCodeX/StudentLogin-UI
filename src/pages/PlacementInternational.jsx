// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Globe, CheckCircle2, CreditCard, Download, ExternalLink, Save } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring";

// Prices shown here are for display only — the backend always recomputes the fee server-side
// from regType (never trusts a client-supplied amount).
const PACKAGES = [
  { id: "INTERNSHIP_ONLY", title: "Internship Only", price: 295, note: "₹250 + 18% GST" },
  { id: "INTERNSHIP_PLUS_TRAINING", title: "Placement Training + Internship", price: 1180, note: "₹1000 + 18% GST · Only for 2nd year students" },
];

function RO({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="mb-3 font-display text-sm font-bold text-primary">{children}</h3>;
}

function Aggregate({ label, schemeOptions, scheme, value, onScheme, onValue }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={scheme || ""} onChange={(e) => onScheme(e.target.value)}>
          <option value="">Select Scheme</option>
          {schemeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className={inputCls} value={value || ""} onChange={(e) => onValue(e.target.value)} placeholder="Aggregate" />
      </div>
    </div>
  );
}

export default function PlacementInternational() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [regType, setRegType] = useState(null);
  const [form, setForm] = useState({});

  const f = (k) => form[k] ?? "";
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/placement-int/registration", { skipErrorToast: true }))
      .then((d) => {
        setData(d);
        setRegType(d.regType || null);
        setForm({
          alternativeMobile: d.alternativeMobile ?? "",
          alternativeEmail: d.alternativeEmail ?? "",
          class10Scheme: d.class10Scheme ?? "", class10Marks: d.class10Marks ?? "",
          class12Scheme: d.class12Scheme ?? "", class12Marks: d.class12Marks ?? "",
          degreeScheme: d.degreeScheme ?? "", degreeAggregate: d.degreeAggregate ?? "",
          pgScheme: d.pgScheme ?? "", pgAggregate: d.pgAggregate ?? "",
        });
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not load registration."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { handlePaymentReturn(); }, []);

  async function saveAndContinue(e) {
    e.preventDefault();
    if (!f("alternativeMobile") || !f("alternativeEmail")) {
      toast.warning("Communication mobile and email are required.");
      return;
    }
    if (!regType) {
      toast.warning("Please choose a package.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, regType };
      const updated = await unwrap(api.post("/placement-int/registration", payload, { skipErrorToast: true }));
      setData(updated);
      toast.success("Registration saved.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function pay() {
    setPaying(true);
    try {
      const res = await unwrap(api.post("/placement-int/registration/pay", {}, { skipErrorToast: true }));
      goToGateway(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start payment. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }
  if (error) {
    return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
      <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
    </CardContent></Card>;
  }

  const d = data || {};

  if (!d.eligible) {
    return (
      <div className="space-y-6">
        <PageTitle icon={Globe}>International / Internship Registration</PageTitle>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-600"><AlertTriangle className="h-7 w-7" /></span>
          <p className="font-display text-lg font-semibold">{d.ineligibleReason || "Registration is closed for your batch."}</p>
        </CardContent></Card>
      </div>
    );
  }

  if (d.paid) {
    return (
      <div className="space-y-6 print:space-y-3">
        <PageTitle icon={Globe}>International / Internship Registration</PageTitle>
        <Card><CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success"><CheckCircle2 className="h-8 w-8" /></span>
          <p className="font-display text-xl font-bold">Registered successfully</p>
          <p className="text-sm text-muted-foreground">Your Unique ID</p>
          <p className="font-display text-2xl font-extrabold text-primary">{d.uniqueId}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}><Download className="h-4 w-4" /> Print Receipt</Button>
            <a href="/Student_Placement_Cell_SOP.pdf" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              <Download className="h-4 w-4" /> Placement Handbook
            </a>
            <a href="https://mccblr.edu.in/mccplacementcell/student_login.php" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7a1f1f] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              <ExternalLink className="h-4 w-4" /> Placement Profile Portal
            </a>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle icon={Globe}>International / Internship Registration</PageTitle>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${d.registered ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
          {d.registered ? "Registered" : "Not registered"}
        </span>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <SectionTitle>Choose Package</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {PACKAGES.map((p) => (
              <button key={p.id} type="button" onClick={() => setRegType(p.id)}
                className={`rounded-2xl border-2 p-4 text-left transition ${regType === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <p className="font-display text-base font-bold">{p.title}</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-primary">₹{p.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div>
            <SectionTitle>Student Details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RO label="Name" value={d.studentName} />
              <RO label="Register No" value={d.registerNo} />
              <RO label="Course" value={d.course} />
              <RO label="Date of Birth" value={d.dateOfBirth} />
              <RO label="Second Language" value={d.secondLanguage} />
            </div>
          </div>
          <div>
            <SectionTitle>Address</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RO label="Address Line 1" value={d.addressLine1} />
              <RO label="Address Line 2" value={d.addressLine2} />
              <RO label="City" value={d.city} />
              <RO label="State" value={d.state} />
              <RO label="Zip Code" value={d.zipCode} />
              <RO label="Country" value={d.country} />
            </div>
          </div>
          <div>
            <SectionTitle>Contact Details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RO label="Student Email" value={d.studentEmail} />
              <RO label="Student Mobile" value={d.studentMobile} />
              <RO label="Parent Mobile" value={d.parentMobile} />
              <RO label="Parent Email" value={d.parentEmail} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <SectionTitle>Extra Details</SectionTitle>
          <form onSubmit={saveAndContinue} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-semibold">Communication Mobile No</p>
                <input className={inputCls} value={f("alternativeMobile")} maxLength={10}
                  onChange={(e) => set("alternativeMobile", e.target.value)} placeholder="10-digit mobile" />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold">Communication Email</p>
                <input className={inputCls} type="email" value={f("alternativeEmail")}
                  onChange={(e) => set("alternativeEmail", e.target.value)} placeholder="name@example.com" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Aggregate label="Class 10 Aggregate" schemeOptions={d.schemeOptions || []}
                scheme={f("class10Scheme")} value={f("class10Marks")}
                onScheme={(v) => set("class10Scheme", v)} onValue={(v) => set("class10Marks", v)} />
              <Aggregate label="Class 12 Aggregate" schemeOptions={d.schemeOptions || []}
                scheme={f("class12Scheme")} value={f("class12Marks")}
                onScheme={(v) => set("class12Scheme", v)} onValue={(v) => set("class12Marks", v)} />
              <Aggregate label="Degree Aggregate" schemeOptions={d.schemeOptions || []}
                scheme={f("degreeScheme")} value={f("degreeAggregate")}
                onScheme={(v) => set("degreeScheme", v)} onValue={(v) => set("degreeAggregate", v)} />
              {d.pg && (
                <Aggregate label="PG Aggregate" schemeOptions={d.schemeOptions || []}
                  scheme={f("pgScheme")} value={f("pgAggregate")}
                  onScheme={(v) => set("pgScheme", v)} onValue={(v) => set("pgAggregate", v)} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" variant="gradient" disabled={saving} className="min-w-44">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Details
              </Button>
              {d.registered && d.regType && (
                <Button type="button" variant="outline" onClick={pay} disabled={paying}>
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Pay ₹{d.regAmount}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
