// Developed By: Vishnukarthick K

import {
  Home,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  Receipt,
  FileText,
  LayoutGrid,
  Ticket,
  Trophy,
  Briefcase,
  Upload,
  CreditCard,
} from "@/lib/icons";

// Matches the live student-portal sidebar (Home, Vaccine Details, Attendance,
// LMS, Time Table, Fee Payment, Online Applications, Exam Results, HallTickets,
// ISRC, Placement, Uploads, Re-Issue ID card). Single-item groups are direct links.
export const NAV_SECTIONS = [
  {
    label: "Home",
    icon: Home,
    items: [{ to: "/dashboard", label: "Home" }],
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    items: [
      { to: "/attendanceDetails", label: "Attendance" },
      { to: "/attendance/absence", label: "Absence Details" },
      { to: "/attendance/previous", label: "Previous Class Attendance" },
      { to: "/attendance/cocurricular-leave", label: "Co-Curricular Leave" },
    ],
  },
  {
    label: "LMS",
    icon: BookOpen,
    alwaysExpand: true,
    items: [
      { to: "/lms/courses", label: "My Courses" },
    ],
  },
  {
    label: "OBE",
    icon: ClipboardCheck,
    items: [
      { to: "/obe/quizzes", label: "Quiz" },
      { to: "/obe/surveys", label: "Survey" },
      { to: "/obe/results", label: "Result" },
    ],
  },
  {
    label: "Time Table",
    icon: CalendarDays,
    alwaysExpand: true,
    items: [
      { to: "/timetable/class", label: "View My Time Table" },
    ],
  },
  {
    label: "Fee Payment",
    icon: Receipt,
    items: [
      { to: "/fees/online", label: "Current Year" },
      { to: "/receipts", label: "Fee Receipt (All Year)" },
    ],
  },
  {
    label: "Online Applications",
    icon: FileText,
    items: [
      { to: "/apply/supplementary", label: "Supplementary Application" },
      { to: "/apply/certificates", label: "Apply for Certificates" },
      { to: "/apply/cee", label: "CEE/SEC Application" },
      { to: "/apply/cee-receipts", label: "CEE Receipts" },
      // { to: "/apply/attendance-shortage-fine", label: "Attendance Shortage Fine" },
      { to: "/apply/idc", label: "Inter/Multi-disciplinary Course" },
      { to: "/apply/misc-payments", label: "Miscellaneous Payments" },
    ],
  },
  {
    label: "Exam Results",
    icon: LayoutGrid,
    items: [
      { to: "/downloads/sem-result", label: "Semester Result" },
      { to: "/downloads/marks-card", label: "Marks Card" },
      { to: "/downloads/cia-overall", label: "CIA Overall" },
    ],
  },
  {
    label: "HallTickets",
    icon: Ticket,
    items: [
      { to: "/hallticket/download", label: "Download Hall Ticket" },
      { to: "/hallticket/supplementary", label: "Supplementary Hall Ticket" },
    ],
  },
  {
    label: "ISRC",
    icon: Trophy,
    items: [
      { to: "/isrc/registration", label: "ISRC Registration" },
      { to: "/isrc/status", label: "ISRC Status" },
    ],
  },
  {
    label: "Placement",
    icon: Briefcase,
    items: [
      { to: "/placement/registration", label: "Registration" },
      { to: "/placement/international", label: "International/Internship" },
      { to: "/placement/eduvistas", label: "Eduvista's" },
    ],
  },
  {
    label: "Uploads",
    icon: Upload,
    items: [{ to: "/uploads", label: "Uploads" }],
  },
  {
    label: "Re-Issue ID card",
    icon: CreditCard,
    items: [
      { to: "/idcard/apply", label: "ID card Application" },
    ],
  },
];
