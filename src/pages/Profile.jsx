// Developed By: Vishnukarthick K

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Pencil,
  Save,
  X,
  CheckCircle2,
  GraduationCap,
  Camera,
  Trash2,
} from "@/lib/icons";
import api, { unwrap } from "@/lib/api";
import { setStudent, getAvatar, setAvatar as persistAvatar } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { SkeletonCard } from "@/components/ui/skeleton";

// Resize an image file to a square ~256px JPEG data URL (keeps localStorage small).
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Shown on-screen only as last-4 (e.g. "XXXX XXXX 1234") — the full number is still sent to the
// edit <Input> below so the student can correct it, just never rendered as plain text.
function maskAadhaar(v) {
  const digits = String(v || "").replace(/\D/g, "");
  if (digits.length < 4) return v || "-";
  return `XXXX XXXX ${digits.slice(-4)}`;
}

const EDITABLE = [
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Mobile", type: "tel" },
  { key: "altPhone", label: "Alternate Mobile", type: "tel" },
  { key: "bloodGroup", label: "Blood Group" },
  { key: "aadhaarNo", label: "Aadhaar No" },
  { key: "abcId", label: "ABC ID" },
];

const READONLY = [
  { key: "rollNo", label: "Roll No" },
  { key: "programme", label: "Programme" },
  { key: "semester", label: "Semester" },
  { key: "section", label: "Section" },
  { key: "academicYear", label: "Academic Year" },
  { key: "gender", label: "Gender" },
  { key: "dateOfBirth", label: "Date of Birth" },
];

// Additional academic-record details the backend already returns on GET /profile but the page
// never surfaced — read-only (official record fields, not student-editable).
const ADDITIONAL = [
  { key: "admissionNo", label: "Admission No" },
  { key: "seatNo", label: "Seat No" },
  { key: "programType", label: "Programme Type" },
  { key: "universityEmail", label: "University Email" },
  { key: "fatherName", label: "Father's Name" },
  { key: "motherName", label: "Mother's Name" },
];

export default function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatarState] = useState(getAvatar());
  const [isPortalUpload, setIsPortalUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // The source of truth for "is there a removable photo" lives on the server (a photo the
  // student uploaded through the portal vs. the fixed admission photo). Fetch it on mount
  // so the Remove button only appears for photos that removal can actually affect.
  useEffect(() => {
    unwrap(api.get("/profile/photo/info", { skipErrorToast: true }))
      .then((info) => {
        if (!info) return;
        setIsPortalUpload(Boolean(info.portalUpload));
        persistAvatar(info.dataUrl || null);
        setAvatarState(info.dataUrl || null);
      })
      .catch(() => {});
  }, []);

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.warning("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.warning("Image is too large (max 5 MB)."); return; }
    setUploading(true);
    try {
      // Persist to the backend (student_upload_photo); the API returns the stored
      // image as a data URL. Also cache it locally so the avatar shows instantly.
      const form = new FormData();
      form.append("file", file);
      const dataUrl = await unwrap(
        api.post("/profile/photo", form, {
          headers: { "Content-Type": "multipart/form-data" },
          skipErrorToast: true,
        })
      );
      const shown = dataUrl || (await resizeImage(file));
      persistAvatar(shown);
      setAvatarState(shown);
      setIsPortalUpload(true);
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not upload that image.");
    } finally {
      setUploading(false);
    }
  }

  // Actually deactivates the uploaded photo server-side (student_upload_photo.is_active = 0) —
  // previously this only cleared the browser's local cache, so the exact photo the student
  // just removed would reappear on the next login/refresh once AppLayout re-fetched it.
  async function removePhoto() {
    setUploading(true);
    try {
      const info = await unwrap(api.delete("/profile/photo", { skipErrorToast: true }));
      setIsPortalUpload(Boolean(info?.portalUpload));
      persistAvatar(info?.dataUrl || null);
      setAvatarState(info?.dataUrl || null);
      toast.info("Profile picture removed.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not remove the photo.");
    } finally {
      setUploading(false);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const s = await unwrap(api.get("/profile", { skipErrorToast: true }));
      setData(s);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit() {
    const init = {};
    EDITABLE.forEach((f) => (init[f.key] = data[f.key] ?? ""));
    setForm(init);
    setEditing(true);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await unwrap(api.put("/profile", form));
      setData(updated);
      setStudent(updated);
      setEditing(false);
      setSaved(true);
      toast.success("Profile updated successfully.");
    } catch {
      // error snackbar shown globally
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">{error}</p>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const fullName =
    [data.firstName, data.lastName].filter(Boolean).join(" ") || "Student";
  const initials = fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Profile</h1>

      <AnimatePresence>
        {saved && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
          >
            <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
          <div className="group relative shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={fullName}
                className="h-24 w-24 rounded-2xl object-cover shadow-pop ring-2 ring-primary/20"
              />
            ) : (
              <div className="bg-joy grid h-24 w-24 place-items-center rounded-2xl text-3xl font-bold text-white shadow-pop">
                {initials}
              </div>
            )}
            {/* camera button */}
            <motion.button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute -bottom-1.5 -right-1.5 grid h-9 w-9 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90 disabled:opacity-70"
              aria-label="Change profile picture"
              title="Change profile picture"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </motion.button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="font-display text-xl font-bold">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{data.registerNo}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <GraduationCap className="h-4 w-4" />
              {data.programme} · Sem {data.semester} · {data.section}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" /> {avatar ? "Change photo" : "Add photo"}
              </Button>
              {avatar && isPortalUpload && (
                <Button variant="ghost" size="sm" onClick={removePhoto} disabled={uploading} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {READONLY.map((f) => (
            <div key={f.key}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</p>
              <p className="font-medium">{data[f.key] || "-"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Additional details (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {ADDITIONAL.map((f) => (
            <div key={f.key}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</p>
              <p className="font-medium">{data[f.key] || "-"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact info (editable) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Contact & Personal Details</CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && editing && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {EDITABLE.map((f) => (
              <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                <Label className="mb-1.5 block">{f.label}</Label>
                {editing ? (
                  <Input
                    type={f.type || "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium">{f.key === "aadhaarNo" ? maskAadhaar(data[f.key]) : (data[f.key] || "-")}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
