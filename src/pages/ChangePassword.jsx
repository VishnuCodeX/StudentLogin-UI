// Developed By: Vishnukarthick K

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, ShieldCheck } from "@/lib/icons";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PasswordField({ id, label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="pr-11"
          required
        />
        <motion.button
          type="button"
          onClick={() => setShow((s) => !s)}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </motion.button>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (next.length < 6) {
      toast.warning("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      toast.warning("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword: current, newPassword: next });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password changed successfully.");
    } catch {
      // error snackbar shown globally by the API interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">Change Password</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <KeyRound className="h-5 w-5" />
            </span>
            <CardTitle>Update your password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {done && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mb-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
              >
                <CheckCircle2 className="h-4 w-4" /> Password changed successfully.
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-5">
            <PasswordField id="current" label="Current Password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <PasswordField id="next" label="New Password" value={next} onChange={(e) => setNext(e.target.value)} />
            <PasswordField id="confirm" label="Confirm New Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

            <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Use at least 6 characters. Avoid reusing your registration number or date of birth.
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Updating…" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
