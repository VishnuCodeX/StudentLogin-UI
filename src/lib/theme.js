// Developed By: Vishnukarthick K

// Colour theme selection — switched via <html data-theme="…">, see index.css for the
// preset palette definitions. Dark mode was removed earlier (kept as a guard below);
// this is a separate concept: a few preset palettes, plus a "Custom" picker that
// generates a full palette on the fly from a single chosen hue (applied as inline
// CSS variables, since there's no way to pre-author a static block for every hue).
const STORAGE_KEY = "mcc_color_theme";
const CUSTOM_HUE_KEY = "mcc_custom_hue";

export const THEMES = [
  { id: "carmel", name: "Carmel", swatch: "#8a6d4a" }, // default — the app's original look
  { id: "ocean", name: "Ocean", swatch: "#2f7a94" },
  { id: "forest", name: "Forest", swatch: "#4a7a4e" },
  { id: "orchid", name: "Orchid", swatch: "#7a4a7a" },
  { id: "sunset", name: "Sunset", swatch: "#c1652f" },
];
const THEME_IDS = THEMES.map((t) => t.id);
const DEFAULT_THEME = "carmel";

// A curated set of good-looking hues for the "Custom" picker — spaced around the
// wheel and picked to stay vivid without going neon or muddy. Rendered as swatches;
// picking one derives a full light palette from its hue (see applyCustomTheme).
export const CUSTOM_COLORS = [
  { name: "Ruby", hue: 350 },
  { name: "Coral", hue: 14 },
  { name: "Amber", hue: 38 },
  { name: "Gold", hue: 46 },
  { name: "Lime", hue: 84 },
  { name: "Emerald", hue: 152 },
  { name: "Teal", hue: 174 },
  { name: "Cyan", hue: 192 },
  { name: "Sky", hue: 206 },
  { name: "Blue", hue: 221 },
  { name: "Indigo", hue: 243 },
  { name: "Violet", hue: 262 },
  { name: "Purple", hue: 280 },
  { name: "Fuchsia", hue: 300 },
  { name: "Pink", hue: 328 },
  { name: "Rose", hue: 344 },
];

// Every variable a preset/custom theme can set — used to clean up inline overrides
// left behind by a previous Custom pick when switching to a preset (inline styles
// beat stylesheet rules regardless of specificity, so stale ones would stick otherwise).
const THEME_VARS = [
  "--background", "--foreground", "--card", "--card-foreground",
  "--popover", "--popover-foreground", "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--border", "--input", "--ring", "--grad-joy",
];

function clearInlineThemeVars() {
  const root = document.documentElement.style;
  THEME_VARS.forEach((v) => root.removeProperty(v));
}

export function getColorTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "custom") return "custom";
  return THEME_IDS.includes(saved) ? saved : DEFAULT_THEME;
}

// The last custom hue picked (0-360), or null if the student has never used Custom.
export function getCustomHue() {
  const hue = Number(localStorage.getItem(CUSTOM_HUE_KEY));
  return Number.isFinite(hue) && hue >= 0 && hue <= 360 ? hue : null;
}

export function applyColorTheme(id) {
  const theme = THEME_IDS.includes(id) ? id : DEFAULT_THEME;
  clearInlineThemeVars();
  if (theme === DEFAULT_THEME) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent("mcc-color-theme", { detail: theme }));
}

// Derives a full light palette from one hue and applies it inline — same
// background/foreground/primary/etc. band structure as the presets in index.css,
// just parameterized by hue instead of baked into a stylesheet rule.
export function applyCustomTheme(hue) {
  const h = Math.max(0, Math.min(360, Math.round(hue)));
  const root = document.documentElement;
  const set = (name, value) => root.style.setProperty(name, value);

  root.setAttribute("data-theme", "custom");
  set("--background", `${h} 38% 96%`);
  set("--foreground", `${h} 30% 20%`);
  set("--card", `${h} 45% 98%`);
  set("--card-foreground", `${h} 30% 20%`);
  set("--popover", `${h} 45% 98%`);
  set("--popover-foreground", `${h} 30% 20%`);
  set("--primary", `${h} 45% 38%`);
  set("--primary-foreground", `${h} 45% 97%`);
  set("--secondary", `${h} 35% 88%`);
  set("--secondary-foreground", `${h} 28% 28%`);
  set("--muted", `${h} 30% 91%`);
  set("--muted-foreground", `${h} 16% 42%`);
  set("--accent", `${h} 32% 87%`);
  set("--accent-foreground", `${h} 26% 30%`);
  set("--border", `${h} 28% 84%`);
  set("--input", `${h} 26% 81%`);
  set("--ring", `${h} 45% 38%`);
  set("--grad-joy", `linear-gradient(95deg, hsl(${h} 45% 22%) 0%, hsl(${h} 45% 38%) 60%, hsl(${h} 42% 58%) 100%)`);

  localStorage.setItem(STORAGE_KEY, "custom");
  localStorage.setItem(CUSTOM_HUE_KEY, String(h));
  window.dispatchEvent(new CustomEvent("mcc-color-theme", { detail: "custom" }));
}

export function initTheme() {
  document.documentElement.classList.remove("dark");
  if (getColorTheme() === "custom") {
    const hue = getCustomHue();
    if (hue != null) {
      applyCustomTheme(hue);
      return;
    }
  }
  applyColorTheme(getColorTheme());
}
