import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut, User, Loader2, Megaphone, CheckCircle2 } from "@/lib/icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { getStudent, clearSession, getAvatar } from "@/lib/auth";
import { confirm } from "@/lib/confirm";
import api, { unwrap } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const student = getStudent();
  const fullName =
    [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
  const initials = fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const [avatar, setAvatarState] = useState(getAvatar());
  useEffect(() => {
    const h = () => setAvatarState(getAvatar());
    window.addEventListener("mcc-avatar", h);
    return () => window.removeEventListener("mcc-avatar", h);
  }, []);

  // Notifications (class notices) — same source the dashboard uses.
  const [notifs, setNotifs] = useState(null); // null = not yet loaded
  const [loadingN, setLoadingN] = useState(true);
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    unwrap(api.get("/dashboard", { skipErrorToast: true }))
      .then((d) => setNotifs(d?.notifications || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoadingN(false));
  }, []);
  const count = notifs?.length || 0;

  async function logout() {
    const ok = await confirm({
      title: "Log out?",
      message: "Are you sure you want to logout?",
      confirmText: "Yes, Logout",
      cancelText: "No, Stay here",
      danger: true,
    });
    if (!ok) return;
    clearSession();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenu}
        className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search services, results, fees…"
          className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-card">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-sm font-bold">Notifications</p>
              {count > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{count} new</span>
              )}
            </div>
            <div className="max-h-[22rem] overflow-y-auto p-2">
              {loadingN ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : count === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-[#4f8a5b]" />
                  <p className="text-sm text-muted-foreground">You're all caught up.</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const body = (
                    <>
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Megaphone className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm leading-snug">{n.description}</span>
                    </>
                  );
                  return n.linkResource && n.link ? (
                    <a
                      key={n.id} href={n.link} target="_blank" rel="noreferrer"
                      className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-muted"
                    >{body}</a>
                  ) : (
                    <div key={n.id} className="flex items-start gap-3 rounded-2xl p-3">{body}</div>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1 pr-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
              {avatar && <AvatarImage src={avatar} alt={fullName} />}
              <AvatarFallback className="bg-joy text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-semibold">{fullName}</p>
              <p className="text-xs text-muted-foreground">{student?.registerNo}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:bg-destructive/10"
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
