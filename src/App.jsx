import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Toaster from "@/components/Toaster";
import ConfirmHost from "@/components/ConfirmHost";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Attendance from "@/pages/Attendance";
import Fees from "@/pages/Fees";
import Lms from "@/pages/Lms";
import Courses from "@/pages/Courses";
import TimeTable from "@/pages/TimeTable";
import ExamTimeTable from "@/pages/ExamTimeTable";
import HallTickets from "@/pages/HallTickets";
import OnlineApplications from "@/pages/OnlineApplications";
import MiscPayments from "@/pages/MiscPayments";
import Cee from "@/pages/Cee";
import Supplementary from "@/pages/Supplementary";
import HostelLeave from "@/pages/HostelLeave";
import Idc from "@/pages/Idc";
import ExamResults from "@/pages/ExamResults";
import CiaResults from "@/pages/CiaResults";
import AbsenceDetails from "@/pages/AbsenceDetails";
import CocurricularLeave from "@/pages/CocurricularLeave";
import PreviousAttendance from "@/pages/PreviousAttendance";
import Uploads from "@/pages/Uploads";
import Placement from "@/pages/Placement";
import Eduvistas from "@/pages/Eduvistas";
import ReIssueIdCard from "@/pages/ReIssueIdCard";
import Isrc from "@/pages/Isrc";
import Profile from "@/pages/Profile";
import Placeholder from "@/pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <ConfirmHost />
      {/* Portal target for modals — sits at the app root so `position: fixed`
          isn't trapped by the page's framer-motion transform. */}
      <div id="modal-root" />
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
          <Route path="/lms/materials" element={<Lms />} />
          <Route path="/lms/assignments" element={<Lms kind="assignments" />} />

          {/* Time Table */}
          <Route path="/timetable/class" element={<TimeTable />} />
          <Route path="/timetable/exam" element={<ExamTimeTable />} />

          {/* Fee Payment */}
          <Route path="/fees/online" element={<Fees />} />
          <Route path="/challan/print" element={<Fees />} />
          <Route path="/receipts" element={<Fees />} />

          {/* Online Applications */}
          <Route path="/apply" element={<OnlineApplications />} />
          <Route path="/apply/supplementary" element={<Supplementary />} />
          <Route path="/apply/hostel-leave" element={<HostelLeave />} />
          <Route path="/apply/cee" element={<Cee />} />
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
    </BrowserRouter>
  );
}
