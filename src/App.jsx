// Developed By: Vishnukarthick K

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Toaster from "@/components/Toaster";
import ConfirmHost from "@/components/ConfirmHost";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import ConfettiHost from "@/components/ConfettiHost";
import PageLoader from "@/components/PageLoader";

// Every page is its own chunk, fetched on first visit instead of all ~35 screens shipping
// in one bundle up front — see PageLoader for the Suspense fallback shown while a chunk loads.
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Attendance = lazy(() => import("@/pages/Attendance"));
const Fees = lazy(() => import("@/pages/Fees"));
const Courses = lazy(() => import("@/pages/Courses"));
const ObeList = lazy(() => import("@/pages/obe/ObeList"));
const ObeResults = lazy(() => import("@/pages/obe/ObeResults"));
const TimeTable = lazy(() => import("@/pages/TimeTable"));
const ExamTimeTable = lazy(() => import("@/pages/ExamTimeTable"));
const HallTickets = lazy(() => import("@/pages/HallTickets"));
const OnlineApplications = lazy(() => import("@/pages/OnlineApplications"));
const MiscPayments = lazy(() => import("@/pages/MiscPayments"));
const Cee = lazy(() => import("@/pages/Cee"));
const CeeReceipts = lazy(() => import("@/pages/CeeReceipts"));
const AttendanceShortageFine = lazy(() => import("@/pages/AttendanceShortageFine"));
const Certificates = lazy(() => import("@/pages/Certificates"));
const Supplementary = lazy(() => import("@/pages/Supplementary"));
const HostelLeave = lazy(() => import("@/pages/HostelLeave"));
const Idc = lazy(() => import("@/pages/Idc"));
const ExamResults = lazy(() => import("@/pages/ExamResults"));
const CiaResults = lazy(() => import("@/pages/CiaResults"));
const AbsenceDetails = lazy(() => import("@/pages/AbsenceDetails"));
const CocurricularLeave = lazy(() => import("@/pages/CocurricularLeave"));
const PreviousAttendance = lazy(() => import("@/pages/PreviousAttendance"));
const Uploads = lazy(() => import("@/pages/Uploads"));
const Placement = lazy(() => import("@/pages/Placement"));
const PlacementInternational = lazy(() => import("@/pages/PlacementInternational"));
const Eduvistas = lazy(() => import("@/pages/Eduvistas"));
const ReIssueIdCard = lazy(() => import("@/pages/ReIssueIdCard"));
const Isrc = lazy(() => import("@/pages/Isrc"));
const Profile = lazy(() => import("@/pages/Profile"));

export default function App() {
  return (
    <BrowserRouter basename="/CarmelNexus" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster />
      <ConfirmHost />
      <SessionExpiredModal />
      <ConfettiHost />
      {/* Portal target for modals — sits at the app root so `position: fixed`
          isn't trapped by the page's framer-motion transform. */}
      <div id="modal-root" />
      <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Attendance */}
          <Route path="/attendanceDetails" element={<Attendance />} />
          <Route path="/attendance/absence" element={<AbsenceDetails />} />
          <Route path="/attendance/cocurricular-leave" element={<CocurricularLeave />} />
          <Route path="/attendance/previous" element={<PreviousAttendance />} />

          {/* LMS */}
          <Route path="/lms/courses" element={<Courses />} />

          <Route path="/obe/quizzes" element={<ObeList kind="quiz" />} />
          <Route path="/obe/surveys" element={<ObeList kind="survey" />} />
          <Route path="/obe/results" element={<ObeResults />} />

          {/* Time Table */}
          <Route path="/timetable/class" element={<TimeTable />} />
          <Route path="/timetable/exam" element={<ExamTimeTable />} />

          {/* Fee Payment */}
          <Route path="/fees/online" element={<Fees mode="current" />} />
          <Route path="/challan/print" element={<Fees />} />
          <Route path="/receipts" element={<Fees />} />

          {/* Online Applications */}
          <Route path="/apply" element={<OnlineApplications />} />
          <Route path="/apply/supplementary" element={<Supplementary />} />
          <Route path="/apply/hostel-leave" element={<HostelLeave />} />
          <Route path="/apply/cee" element={<Cee />} />
          <Route path="/apply/cee-receipts" element={<CeeReceipts />} />
          {/* <Route path="/apply/attendance-shortage-fine" element={<AttendanceShortageFine />} /> */}
          <Route path="/apply/certificates" element={<Certificates />} />
          <Route path="/apply/idc" element={<Idc />} />
          <Route path="/apply/misc-payments" element={<MiscPayments />} />
          <Route path="/apply/extra-course" element={<OnlineApplications />} />

          {/* Exam Results */}
          <Route path="/downloads/sem-result" element={<ExamResults />} />
          <Route path="/downloads/marks-card" element={<ExamResults />} />
          <Route path="/downloads/cia-overall" element={<CiaResults />} />

          {/* HallTickets */}
          <Route path="/hallticket/download" element={<HallTickets />} />
          <Route path="/hallticket/supplementary" element={<HallTickets />} />

          {/* ISRC */}
          <Route path="/isrc/registration" element={<Isrc />} />
          <Route path="/isrc/status" element={<Isrc />} />

          {/* Placement */}
          <Route path="/placement/registration" element={<Placement />} />
          <Route path="/placement/international" element={<PlacementInternational />} />
          <Route path="/placement/eduvistas" element={<Eduvistas />} />
          <Route path="/placement/drives" element={<Placement />} />

          {/* Uploads */}
          <Route path="/uploads" element={<Uploads />} />

          {/* Re-Issue ID card */}
          <Route path="/idcard/apply" element={<ReIssueIdCard />} />
          <Route path="/idcard/status" element={<ReIssueIdCard />} />

          {/* Account (via avatar / topbar) */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
