// Engagement event emitter for the ERP "Learning Analytics" dashboard (Integration
// Guide §5). The portal EMITS; nothing is rendered back. Faithfully firing these is
// what makes the teacher's analytics non-empty.
//
// Design: events are buffered and flushed in a batch (debounced + on tab-hide /
// unload via navigator.sendBeacon) so we never fire one request per click. Firing is
// strictly best-effort — a failed POST must never block the student's real action.
import { LMS_BASE, logActivityBatch } from "@/lib/lmsApi";
import { getStudent } from "@/lib/auth";

const BATCH_URL = `${LMS_BASE}/lms/Activity/v1/logBatch`;
let queue = [];
let flushTimer = null;

// who + which subject context the events belong to (set once you enter a subject)
let ctx = { subjectId: null, batchYear: null };

export function setActivityContext({ subjectId, batchYear }) {
  if (subjectId != null) ctx.subjectId = subjectId;
  if (batchYear != null) ctx.batchYear = batchYear;
}

function identity() {
  const s = getStudent() || {};
  return {
    studentId: s.id ?? s.studentId,
    studentName: [s.firstName, s.lastName].filter(Boolean).join(" ") || undefined,
    studentRegNo: s.registerNo || undefined,
  };
}

// queue one event; required context (subjectId/batchYear/studentId) is filled in here
function enqueue(ev) {
  const id = identity();
  if (id.studentId == null || ctx.subjectId == null) return; // not enough context yet
  queue.push({
    subjectId: ctx.subjectId,
    batchYear: ctx.batchYear,
    ...id,
    eventDate: new Date().toISOString().slice(0, 19),
    ...ev,
  });
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 4000); // debounce; also flushed on hide/unload
}

export function flush() {
  clearTimeout(flushTimer);
  flushTimer = null;
  if (!queue.length) return;
  const events = queue;
  queue = [];
  logActivityBatch(events).catch(() => {}); // best-effort
}

// fire-and-forget flush that survives page unload
function beaconFlush() {
  clearTimeout(flushTimer);
  flushTimer = null;
  if (!queue.length) return;
  const events = queue;
  queue = [];
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(BATCH_URL, new Blob([JSON.stringify(events)], { type: "application/json" }));
    } else {
      logActivityBatch(events).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") beaconFlush(); });
  window.addEventListener("beforeunload", beaconFlush);
}

/* ── public emitters ────────────────────────────────────────────────────── */

// VIEW: student opened a material / syllabus / assignment / announcement / forum / quiz
export const trackView = (resourceType, resourceId, resourceName) =>
  enqueue({ eventType: "VIEW", resourceType, resourceId, resourceName });

// DOWNLOAD: student saved a file (usually a MATERIAL)
export const trackDownload = (resourceType, resourceId, resourceName) =>
  enqueue({ eventType: "DOWNLOAD", resourceType: resourceType || "MATERIAL", resourceId, resourceName });

// TIME: dwell on a screen. Call startScreen(label) on enter; the returned stop()
// (call on unmount / route-change) sends one TIME event with the accumulated seconds.
export function startScreen(label) {
  const t0 = Date.now();
  let stopped = false;
  return function stop() {
    if (stopped) return;
    stopped = true;
    const seconds = Math.round((Date.now() - t0) / 1000);
    if (seconds > 0) enqueue({ eventType: "TIME", resourceType: "SCREEN", resourceName: label, durationSeconds: seconds });
  };
}
