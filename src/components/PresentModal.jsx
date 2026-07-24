// Developed By: Vishnukarthick K

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, X, User } from "@/lib/icons";
import api, { unwrap } from "@/lib/api";

/* Per-subject present sessions popup (shared by the Attendance and
   Previous-Class-Attendance screens). `subject` carries { subjectId,
   subjectName, subjectCode }. Portals to #modal-root so `position: fixed`
   isn't trapped by the page's framer-motion transform. Mirrors AbsenceModal
   minus the Leave Type column, since a present session has no leave type. */
export default function PresentModal({ subject, onClose }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    unwrap(api.get(`/attendance/present-periods/${subject.subjectId}`, { skipErrorToast: true }))
      .then(setRows).catch(() => setRows([]));
  }, [subject]);

  const modal = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="present-modal-title"
        className="relative max-h-[82vh] w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-pop"
        initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-emerald-600 p-5 text-white">
          <div>
            <h3 id="present-modal-title" className="font-display text-lg font-bold">Present Details</h3>
            <p className="text-sm text-white/80">{subject.subjectName} · {subject.subjectCode}</p>
          </div>
          <motion.button onClick={onClose} aria-label="Close" whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="grid h-8 w-8 place-items-center rounded-lg text-white/80 hover:bg-white/15"><X className="h-4 w-4" /></motion.button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto p-0">
          {rows === null ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No present sessions found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="sticky top-0 border-b border-border bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Period</th>
                <th className="px-5 py-2.5 font-semibold">Teacher</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={i} className="border-b border-border last:border-0"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <td className="px-5 py-2.5 tabular-nums">{r.date}</td>
                    <td className="px-3 py-2.5">{r.period || "—"}</td>
                    <td className="px-5 py-2.5">
                      {r.teacher ? (
                        <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{r.teacher}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
  return createPortal(modal, document.getElementById("modal-root") || document.body);
}
