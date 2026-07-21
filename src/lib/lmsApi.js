// LMS API client — talks to the Carmel Connect ERP LMS endpoints documented in the
// "Student Portal — LMS Integration Guide" (v1.0). Kept separate from the portal's
// own api.js so the host + token are independently configurable: point it at the ERP
// host with VITE_LMS_API_BASE_URL once the faculty team confirms it. If that's blank
// it falls back to the portal's own API base, and it reuses the portal JWT unless a
// dedicated ERP token (VITE_LMS_API_TOKEN) is provided.
import axios from "axios";

const LMS_BASE =
  import.meta.env.VITE_LMS_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL ||
  `http://${window.location.hostname}:5454/api`;

const STATIC_TOKEN = import.meta.env.VITE_LMS_API_TOKEN?.trim() || "";

export const lms = axios.create({ baseURL: LMS_BASE });

lms.interceptors.request.use((config) => {
  const token = STATIC_TOKEN || localStorage.getItem("mcc_student_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// unwrap our ApiResponse shape if present, else return the raw body
function body(res) {
  const d = res?.data;
  return d && typeof d === "object" && "success" in d && "data" in d ? d.data : d;
}

/* ── Subjects (interim: our backend until ERP mySubjects ships) ──────────── */
export const getMySubjects = () =>
  lms.get("/lms/subjects").then(body); // { semester, academicYear, subjects:[{subjectId,subjectCode,subjectName}] }

/* ── Study materials (§3.2) ─────────────────────────────────────────────── */
export const getMaterials = ({ subjectId, semester, academicYear }) =>
  lms.post("/lms/StudyMaterialsUpload/v1/fetchSelectedSubjectDetaisls", {
    subjectId, semester, academicYear,
  }).then(body);

/* ── Assignments (§3.3) ─────────────────────────────────────────────────── */
export const getAssignments = ({ subjectId, semester, academicYear }) =>
  lms.post("/lms/LmsAssignmentsUpload/v1/fetchSelectedSubjectDetaisls", {
    subjectId, semester, academicYear,
  }).then(body);

/* ── Assignment submission (§4) ─────────────────────────────────────────── */
export function submitAssignment({ assignmentId, studentId, studentName, studentRegNo, submissionText, file }) {
  const fd = new FormData();
  fd.append("assignmentId", assignmentId);
  fd.append("studentId", studentId);
  if (studentName) fd.append("studentName", studentName);
  if (studentRegNo) fd.append("studentRegNo", studentRegNo);
  if (submissionText) fd.append("submissionText", submissionText);
  if (file) fd.append("file", file);
  return lms.post("/lms/student/v1/submitAssignment", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(body);
}

export const getMySubmissions = ({ studentId, subjectId }) =>
  lms.get("/lms/student/v1/mySubmissions", { params: { studentId, subjectId } }).then(body);

/* ── Announcements (§3.5) ───────────────────────────────────────────────── */
export const getAnnouncements = ({ subjectId, year }) =>
  lms.get("/lms/Announcement/v1/student", { params: { subjectId, year } }).then(body);

/* ── Forum (§3.6) ───────────────────────────────────────────────────────── */
export const getForumThreads = ({ subjectId, year }) =>
  lms.get("/lms/Forum/v1/threads", { params: { subjectId, year } }).then(body);
export const getForumThread = (threadId) =>
  lms.get(`/lms/Forum/v1/thread/${threadId}`).then(body);
export const askForumThread = (payload) => // { subjectId, batchYear, title, body, authorId, authorName, authorRole:"STUDENT" }
  lms.post("/lms/Forum/v1/thread", payload).then(body);
export const replyForumPost = (payload) => // { threadId, body, authorId, authorName, authorRole:"STUDENT" }
  lms.post("/lms/Forum/v1/post", payload).then(body);

/* ── Course workspace (§3.7) ────────────────────────────────────────────── */
export const getCourseWorkspace = ({ subjectId, year }) =>
  lms.get("/lms/CourseWorkspace/v1/student", { params: { subjectId, year } }).then(body);

/* ── Marks (§3.4) ───────────────────────────────────────────────────────── */
export const getInternalMarks = ({ studentId, semester }) =>
  lms.get("/studentInfo/studentDetails/v1/internalMarksDetail", { params: { studentId, semester } }).then(body);
export const getExamMarks = ({ studentId, semester }) =>
  lms.get("/studentInfo/studentDetails/v1/examMarksDetail", { params: { studentId, semester } }).then(body);

/* ── Engagement events (§5) — raw POSTs; the emitter in lmsActivity.js wraps these ── */
export const logActivity = (event) => lms.post("/lms/Activity/v1/log", event);
export const logActivityBatch = (events) => lms.post("/lms/Activity/v1/logBatch", events);

export { LMS_BASE };
