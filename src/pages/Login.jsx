import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, GraduationCap, ShieldCheck, CalendarCheck, ArrowRight } from "@/lib/icons";
import Logo from "@/components/Logo";
import CarmelNexusBrand from "@/components/CarmelNexusBrand";
import api from "@/lib/api";
import { saveSession } from "@/lib/auth";

const REMEMBER_KEY = "mcc_remember";

// ── Warm beige palette ──────────────────────────────────────────────
const ESPRESSO = "#4a3a2a";
const BRONZE = "#8a6d4a";
const BTN_GRAD = "linear-gradient(95deg, #5c4632 0%, #8a6d4a 60%, #a4855c 100%)";
const PANEL_GRAD = "linear-gradient(155deg, #efe5d0 0%, #e4d4b6 52%, #d6c098 100%)";
const PAGE_GRAD = "radial-gradient(125% 125% at 50% 0%, #faf5ea 0%, #f4ecdb 50%, #ece0cb 100%)";

const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_SANS = "'Inter', 'Segoe UI', system-ui, sans-serif";

const FEATURES = [
  { icon: CalendarCheck, title: "Attendance & Results", text: "Track classes, CIA marks and semester results." },
  { icon: GraduationCap, title: "Academics & LMS", text: "Time tables, study materials and assignments." },
  { icon: ShieldCheck, title: "Fees & Applications", text: "Pay fees and apply — securely, anytime." },
];

// soft floating decorative blob
function Blob({ className, color, delay = 0, dur = 12 }) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-2xl ${className}`}
      style={{ background: color }}
      animate={{ scale: [1, 1.18, 1], x: [0, 14, 0], y: [0, -16, 0], opacity: [0.55, 0.85, 0.55] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  // Pre-fill saved credentials when "Keep me signed in" was used.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null");
      if (saved?.username) {
        setUsername(saved.username);
        setPassword(saved.password || "");
        setRemember(true);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password }, { skipErrorToast: true });
      const { token, student } = res.data.data;
      saveSession(token, student);
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.05fr_1fr]"
      style={{ fontFamily: FONT_SANS, background: PAGE_GRAD, color: ESPRESSO }}
    >
      {/* page-wide ambient blobs */}
      <Blob className="-left-24 -top-24 h-96 w-96" color="radial-gradient(circle, rgba(212,191,152,0.55), transparent 70%)" />
      <Blob className="-bottom-32 right-[42%] h-[30rem] w-[30rem]" color="radial-gradient(circle, rgba(229,214,184,0.5), transparent 70%)" delay={2} dur={15} />

      {/* ── Brand panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col" style={{ backgroundImage: PANEL_GRAD }}>
        <Blob className="-right-20 top-10 h-80 w-80" color="radial-gradient(circle, rgba(255,250,238,0.7), transparent 70%)" delay={1} />
        <Blob className="-left-16 bottom-0 h-72 w-72" color="radial-gradient(circle, rgba(164,133,92,0.35), transparent 70%)" delay={3} dur={14} />
        {/* fine grain / dotted texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(rgba(90,70,50,0.10) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* slow diagonal light sheen sweeping across the panel */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,251,240,0.35), transparent)" }}
          initial={{ x: "-120%" }}
          animate={{ x: ["-120%", "260%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex h-full flex-col p-12 xl:p-16"
        >
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo className="h-24" />
          </motion.div>

          <div className="my-auto max-w-md">
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-5 h-px w-16 origin-left"
              style={{ background: BRONZE }}
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="text-xs font-semibold uppercase tracking-[0.32em]"
              style={{ color: BRONZE }}
            >
              Mount Carmel University · Bengaluru
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-5xl font-bold leading-[1.05] xl:text-6xl"
              style={{ fontFamily: FONT_SERIF, color: ESPRESSO }}
            >
              Student
              <br />
              Portal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-5 max-w-sm text-[15px] leading-relaxed"
              style={{ color: "#6b5840" }}
            >
              Your campus life — attendance, results, fees and more — gathered in one calm, beautiful place.
            </motion.p>

            <div className="mt-10 space-y-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.46 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[#fdf8ee] ring-1 ring-[#fffdf7]/50"
                    style={{ background: "linear-gradient(135deg, #8a6d4a, #6b4f3a)" }}
                  >
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: ESPRESSO }}>{f.title}</p>
                    <p className="text-sm" style={{ color: "#7a6750" }}>{f.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <CarmelNexusBrand size={38} />
              <span className="rounded-md bg-black/[0.06] px-2 py-0.5 text-[11px] font-semibold" style={{ color: "#8a7458" }}>v 1.0.1</span>
            </div>
            <p className="mt-2.5 text-sm" style={{ color: "#8a7458" }}>
              © {new Date().getFullYear()} Mount Carmel University, Bengaluru. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Form panel ── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md"
        >
          {/* mobile logo + brand intro */}
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Logo className="h-24" />
            <h1 className="mt-4 text-3xl font-bold" style={{ fontFamily: FONT_SERIF, color: ESPRESSO }}>
              Student Portal
            </h1>
            <span className="mt-1.5 h-px w-12" style={{ background: BRONZE }} />
            <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: "#7a6750" }}>
              Your campus life — attendance, results, fees, time table and applications — all in one calm, simple place.
            </p>
          </div>

          <div
            className="rounded-[28px] border border-[#e6dac2] bg-[#fffdf7]/85 p-8 backdrop-blur-sm sm:p-10"
            style={{ boxShadow: "0 30px 80px -28px rgba(90,68,46,0.4)" }}
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold" style={{ color: ESPRESSO, fontFamily: FONT_SERIF }}>
                Dear Carmelites!
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: "#8a7458" }}>
                Sign in with your registration number and password.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-xl border border-[#d9b3a0] bg-[#f7e9e2] px-4 py-3 text-sm font-medium text-[#8a3b22]"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-semibold" style={{ color: "#5c4a36" }}>
                  Registration No. / Username
                </label>
                <input
                  id="username"
                  placeholder="e.g. M25MC67"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#e0d3ba] bg-[#fdfaf2] px-4 py-3 text-[15px] outline-none transition focus:border-[#8a6d4a] focus:ring-4 focus:ring-[#8a6d4a]/15"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold" style={{ color: "#5c4a36" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e0d3ba] bg-[#fdfaf2] px-4 py-3 pr-12 text-[15px] outline-none transition focus:border-[#8a6d4a] focus:ring-4 focus:ring-[#8a6d4a]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#a08861] hover:bg-[#f0e7d3] hover:text-[#5c4a36]"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2 text-sm" style={{ color: "#6b5840" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cdbb9b]"
                  style={{ accentColor: BRONZE }}
                />
                Keep me signed in
              </label>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.985 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-[#fdf8ee] transition disabled:opacity-70"
                style={{ backgroundImage: BTN_GRAD, boxShadow: "0 14px 30px -10px rgba(90,68,46,0.55)" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </form>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5">
              <CarmelNexusBrand size={34} />
              <span className="rounded-md bg-black/[0.06] px-2 py-0.5 text-[11px] font-semibold" style={{ color: "#8a7458" }}>v 1.0.1</span>
            </div>
            <p className="text-xs font-semibold tracking-wide" style={{ color: "#8a7458" }}>
              Powered By <span className="font-extrabold" style={{ color: ESPRESSO }}>MCC(IT)</span>
            </p>
          </div>
          <p className="mt-2 text-center text-xs lg:hidden" style={{ color: "#a08861" }}>
            © {new Date().getFullYear()} Mount Carmel University, Bengaluru.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
