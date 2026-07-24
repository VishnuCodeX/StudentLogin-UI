// Developed By: Vishnukarthick K

// Split out of Login.jsx so the MUI date-picker + dayjs stack (~110 kB gzipped) is only
// fetched when a student actually clicks "Forgot password?", instead of on every sign-in.
import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, ArrowRight } from "@/lib/icons";
import api from "@/lib/api";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { ESPRESSO, BRONZE, BTN_GRAD, FONT_SANS, FONT_SERIF } from "./loginTheme";

// Beige MUI theme so the DatePicker matches the login palette.
const muiBeige = createTheme({
  palette: { primary: { main: BRONZE }, text: { primary: ESPRESSO, secondary: "#8a7458" } },
  typography: { fontFamily: FONT_SANS },
  shape: { borderRadius: 12 },
});

// ── Forgot password: register number + date of birth → email username & password ──
export default function ForgotPasswordDialog({ onClose }) {
  const [registerNo, setRegisterNo] = useState("");
  const [dob, setDob] = useState(null); // dayjs | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!registerNo.trim() || !dob || !dob.isValid()) {
      setError("Please enter your register number and date of birth.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        "/auth/forgot-password",
        { registerNo: registerNo.trim(), dob: dob.format("YYYY-MM-DD") },
        { skipErrorToast: true }
      );
      setDone(res.data?.message || "Your login details have been sent to your registered email.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to process the request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-[#e0d3ba] bg-[#fdfaf2] px-4 py-3 text-[15px] outline-none transition focus:border-[#8a6d4a] focus:ring-4 focus:ring-[#8a6d4a]/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 py-8" style={{ fontFamily: FONT_SANS }}>
      <div className="absolute inset-0 bg-[#3a2c1e]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-[24px] border border-[#e6dac2] bg-[#fffdf7] p-7 sm:p-8"
        style={{ boxShadow: "0 30px 80px -28px rgba(90,68,46,0.5)", color: ESPRESSO }}
      >
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-[#a08861] hover:bg-[#f0e7d3] hover:text-[#5c4a36]"
          aria-label="Close"
        >
          ✕
        </motion.button>

        <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <span
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-[#fdf8ee]"
              style={{ background: "linear-gradient(135deg, #8a6d4a, #6b4f3a)" }}
            >
              <ShieldCheck className="h-7 w-7" />
            </span>
            <h3 id="forgot-password-title" className="text-xl font-bold" style={{ fontFamily: FONT_SERIF }}>Check your email</h3>
            <p className="mt-2 text-sm" style={{ color: "#6b5840" }}>{done}</p>
            <motion.button
              type="button"
              onClick={onClose}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="mt-6 w-full rounded-xl py-3 text-[15px] font-semibold text-[#fdf8ee]"
              style={{ backgroundImage: BTN_GRAD }}
            >
              Back to sign in
            </motion.button>
          </motion.div>
        ) : (
          <Fragment key="form">
            <h3 id="forgot-password-title" className="text-2xl font-bold" style={{ fontFamily: FONT_SERIF }}>Forgot password?</h3>
            <p className="mt-1.5 text-sm" style={{ color: "#8a7458" }}>
              Enter your register number and date of birth. We'll email your username and password to your registered email address.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-[#d9b3a0] bg-[#f7e9e2] px-4 py-3 text-sm font-medium text-[#8a3b22]">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="fp-reg" className="text-sm font-semibold" style={{ color: "#5c4a36" }}>Register Number</label>
                <input id="fp-reg" value={registerNo} onChange={(e) => setRegisterNo(e.target.value)}
                  placeholder="e.g. M25MC67" autoComplete="off" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="fp-dob" className="text-sm font-semibold" style={{ color: "#5c4a36" }}>Date of Birth</label>
                <ThemeProvider theme={muiBeige}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={dob}
                      onChange={(v) => setDob(v)}
                      format="DD/MM/YYYY"
                      maxDate={dayjs()}
                      slotProps={{
                        textField: {
                          id: "fp-dob",
                          fullWidth: true,
                          placeholder: "DD/MM/YYYY",
                          sx: {
                            "& .MuiOutlinedInput-root": { backgroundColor: "#fdfaf2", borderRadius: "12px", fontSize: "15px" },
                            "& .MuiOutlinedInput-input": { padding: "12px 16px" },
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0d3ba" },
                            "&:hover .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline": { borderColor: "#8a6d4a" },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </ThemeProvider>
              </div>
              <motion.button type="submit" disabled={loading}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-[#fdf8ee] transition-colors disabled:opacity-70"
                style={{ backgroundImage: BTN_GRAD, boxShadow: "0 14px 30px -10px rgba(90,68,46,0.55)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Sending…" : "Send my details"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </form>
          </Fragment>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
