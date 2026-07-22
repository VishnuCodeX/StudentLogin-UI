// Developed By: Vishnukarthick K

import { motion } from "framer-motion";

const FONT = "'Marcellus', 'Playfair Display', Georgia, serif";

// Mark: two interlocking rings — "nexus" = connection. A real over-under weave
// (right ring drawn over the left, then the left's bottom arc redrawn over the right)
// makes them read as genuinely linked. Colour-adaptive so it works on the light
// beige and on the dark maroon footer bar; turns slowly like a living emblem.
function NexusMark({ size = 40, light = false }) {
  const ringA = light ? "#fbeac6" : "#800020"; // left
  const ringB = light ? "#f0cf7e" : "#c2923a"; // right (gold)
  const sw = 4.6;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      initial={{ opacity: 0, scale: 0.55, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 16 }}
      whileHover={{ scale: 1.09 }}
      className="shrink-0"
      style={{ filter: light ? "none" : "drop-shadow(0 3px 8px rgba(128,0,32,0.28))" }}
    >
      <motion.g
        style={{ transformOrigin: "24px 24px", transformBox: "view-box" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="18.5" cy="24" r="12.5" fill="none" stroke={ringA} strokeWidth={sw} />
        <circle cx="29.5" cy="24" r="12.5" fill="none" stroke={ringB} strokeWidth={sw} />
        {/* weave: left ring crosses OVER the right at the bottom intersection */}
        <path d="M26.9 33.3 A12.5 12.5 0 0 1 20.7 36.3" fill="none" stroke={ringA} strokeWidth={sw} strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}

/**
 * Carmel Nexus brand lockup — interlocking-rings mark + Space Grotesk wordmark.
 * `light` → cream text for dark bars; `textSize` overrides the wordmark height.
 */
export default function CarmelNexusBrand({ size = 40, textSize, light = false }) {
  const carmel = light ? "rgba(255,255,255,0.95)" : "#800020";
  const nexus = light ? "#f0cf7e" : "#a4782e";
  return (
    <span className="inline-flex items-center gap-2.5">
      <NexusMark size={size} light={light} />
      <motion.span
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: FONT,
          fontSize: (textSize ?? size * 0.5) * 1.15,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: carmel }}>Carmel</span>
        <span style={{ color: nexus }}>&nbsp;Nexus</span>
      </motion.span>
    </span>
  );
}
