// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTitle from "@/components/PageTitle";
import { Loader2, AlertTriangle, RefreshCw, Wallet, CheckCircle2, CalendarClock } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { toast } from "@/lib/toast";
import { confirm } from "@/lib/confirm";
import { goToGateway, handlePaymentReturn } from "@/lib/payments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/skeleton";

export default function MiscPayments() {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  function load() {
    setLoading(true);
    setError("");
    unwrap(api.get("/misc-payments", { skipErrorToast: true }))
      .then(setLinks)
      .catch((e) => setError(e?.response?.data?.message || "Could not load payments."))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { handlePaymentReturn(); }, []);

  async function pay(id) {
    setBusy(id);
    try {
      const res = await unwrap(api.post(`/misc-payments/${id}/pay`));
      const item = (links || []).find((l) => l.id === id);
      const ok = await confirm({
        title: "Confirm payment",
        message: `Proceed to pay ₹${item?.amount} for ${item?.name}?`,
        confirmText: "Proceed",
        cancelText: "Cancel",
      });
      if (!ok) return;
      // Kotak/CCAvenue → auto-submits to the gateway; if not configured, shows a notice.
      if (!goToGateway(res)) load();
    } catch {
      // error snackbar shown globally
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle icon={Wallet}>Miscellaneous Payments</PageTitle>
          <p className="text-sm text-muted-foreground">Pay college fees assigned to you for the current window.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <SkeletonGrid items={4} className="sm:grid-cols-2 lg:grid-cols-2" />
        </motion.div>
      ) : error ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" /><p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </CardContent></Card>
        </motion.div>
      ) : (links || []).length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
            <Wallet className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold">No payments due</p>
          <p className="max-w-sm text-sm text-muted-foreground">You have no miscellaneous fee payments assigned right now.</p>
        </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-display text-base font-bold">{l.name}</p>
                  {l.paid && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                    </span>
                  )}
                </div>
                {l.description && <p className="mb-3 text-sm text-muted-foreground">{l.description}</p>}
                <div className="mt-auto flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold">₹{l.amount}</p>
                    {l.lastDate && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" /> Last date: {l.lastDate}
                      </p>
                    )}
                  </div>
                  {!l.paid && (
                    <Button onClick={() => pay(l.id)} disabled={busy === l.id} className="bg-joy text-white">
                      {busy === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                      Pay
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
