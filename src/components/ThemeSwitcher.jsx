import { useState } from "react";
import { Palette, Check, ChevronDown } from "@/lib/icons";
import {
  THEMES,
  CUSTOM_COLORS,
  getColorTheme,
  getCustomHue,
  applyColorTheme,
  applyCustomTheme,
} from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Header control for picking a colour theme. Defaults to whatever's already applied
// (getColorTheme() falls back to "carmel", the app's original look, when nothing's
// been chosen yet) — so existing students see no change until they open this menu.
// "Custom" expands into a grid of curated colours; picking one derives a full palette
// from that hue (applyCustomTheme) instead of switching to a pre-baked palette.
export default function ThemeSwitcher() {
  const [active, setActive] = useState(getColorTheme());
  const [customHue, setCustomHue] = useState(getCustomHue());
  const [showCustom, setShowCustom] = useState(false);

  function pickPreset(id) {
    applyColorTheme(id);
    setActive(id);
  }

  function pickCustom(hue) {
    applyCustomTheme(hue);
    setActive("custom");
    setCustomHue(hue);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change colour theme"
        className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Palette className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Colour Theme</DropdownMenuLabel>
        <div className="grid gap-1 p-1 pt-0.5">
          {THEMES.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => pickPreset(t.id)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted ${
                  isActive ? "bg-muted font-semibold" : ""
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ background: t.swatch }}
                />
                <span className="flex-1 text-left">{t.name}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustom((s) => !s)}
            aria-expanded={showCustom}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted ${
              active === "custom" ? "bg-muted font-semibold" : ""
            }`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
              style={{
                background:
                  active === "custom" && customHue != null
                    ? `hsl(${customHue} 60% 48%)`
                    : "conic-gradient(from 0deg, #e14747, #e0a63f, #d8d84a, #4fae5c, #3fa0c9, #5a6fe0, #a24fd6, #e14747)",
              }}
            />
            <span className="flex-1 text-left">Custom</span>
            {active === "custom" && <Check className="h-4 w-4 text-primary" />}
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showCustom ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showCustom && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2.5 pb-1.5 pt-1 text-[11px] text-muted-foreground">Pick a colour you like</p>
            <div className="grid grid-cols-4 gap-2 p-2 pt-0">
              {CUSTOM_COLORS.map((c) => {
                const isActive = active === "custom" && customHue === c.hue;
                return (
                  <button
                    key={c.name}
                    onClick={() => pickCustom(c.hue)}
                    title={c.name}
                    aria-label={c.name}
                    className={`grid h-8 w-8 place-items-center rounded-full ring-1 ring-black/10 transition hover:scale-110 ${
                      isActive ? "ring-2 ring-offset-2 ring-offset-popover" : ""
                    }`}
                    style={{
                      background: `hsl(${c.hue} 60% 48%)`,
                      ...(isActive ? { "--tw-ring-color": `hsl(${c.hue} 60% 40%)` } : {}),
                    }}
                  >
                    {isActive && <Check className="h-4 w-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
