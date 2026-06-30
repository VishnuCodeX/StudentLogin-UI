import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

// Page-level enter/exit transition.
export const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.2, ease: EASE } },
};

// Staggered container — children using `itemVariants` animate in sequence.
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function Stagger({ children, className }) {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function Item({ children, className }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
