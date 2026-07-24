// Developed By: Vishnukarthick K

import { motion } from "framer-motion";

// A branded "fetching data" banner for screens whose initial load can take a while (large
// datasets) — pairs with a content-shaped Skeleton below it so the wait feels both reassuring
// (clear text + motion) and structured (a preview of the real layout), rather than a screen that
// just looks empty until the response arrives.
export default function FetchingIndicator({ icon: Icon, label = "Fetching your records" }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/15"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {Icon ? (
          <motion.span
            className="relative grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span
            className="relative h-3 w-3 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <div>
        <p className="flex items-baseline font-display text-sm font-bold text-foreground">
          {label}
          <span className="ml-0.5 inline-flex w-5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              >
                .
              </motion.span>
            ))}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">This may take a moment if there's a lot of data.</p>
      </div>
    </div>
  );
}
