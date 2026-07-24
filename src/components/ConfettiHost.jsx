// Developed By: Vishnukarthick K

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { registerCelebrateHandler } from "@/lib/celebrate";

const COLORS = ["#c9971f", "#3f7a4b", "#800020", "#2f7a94", "#c1652f", "#7a4a7a", "#e14747", "#4fae5c"];
const PIECE_COUNT = 46;
const BURST_LIFETIME_MS = 3600;

function makePiece(id) {
  return {
    id,
    leftPct: Math.random() * 100,
    size: 6 + Math.random() * 6,
    isCircle: Math.random() > 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    fallY: 520 + Math.random() * 320,
    driftX: (Math.random() - 0.5) * 220,
    rotate: (Math.random() - 0.5) * 720,
    duration: 2.2 + Math.random() * 1.1,
    delay: Math.random() * 0.35,
  };
}

// A brief confetti burst — mounted once at the app root (App.jsx) alongside Toaster/ConfirmHost.
// Fired via celebrate() from anywhere (in particular handlePaymentReturn() on a payment success),
// same event-bus pattern as toast.js. Pieces animate via transform (y/x/rotate) + opacity only —
// no layout-triggering properties — so a 40+ piece burst stays smooth even on modest devices.
export default function ConfettiHost() {
  const [bursts, setBursts] = useState([]); // [{ burstId, pieces }]
  const counter = useRef(0);

  useEffect(() => {
    registerCelebrateHandler(() => {
      const burstId = ++counter.current;
      const pieces = Array.from({ length: PIECE_COUNT }, (_, i) => makePiece(i));
      setBursts((b) => [...b, { burstId, pieces }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.burstId !== burstId)), BURST_LIFETIME_MS);
    });
  }, []);

  if (bursts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[300] overflow-hidden">
      {bursts.map((burst) => (
        <div key={burst.burstId} className="absolute inset-0">
          {burst.pieces.map((p) => (
            <motion.span
              key={p.id}
              initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: p.fallY, x: p.driftX, opacity: [1, 1, 0], rotate: p.rotate }}
              transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0.6, 0.4, 1] }}
              style={{
                position: "absolute",
                top: 0,
                left: `${p.leftPct}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                borderRadius: p.isCircle ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
