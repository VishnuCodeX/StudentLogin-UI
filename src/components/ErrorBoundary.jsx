// Developed By: Vishnukarthick K

import { Component } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "@/lib/icons";

// Class component — error boundaries have no hooks equivalent in React 18. Mounted inside
// AppLayout's route-keyed motion.div (see AppLayout.jsx), so a fresh instance (hasError: false)
// is created on every navigation — a crash on one page never sticks around on the next.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className={this.props.fallbackClassName}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <motion.span
                className="grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertTriangle className="h-8 w-8" />
              </motion.span>
              <p className="font-display text-lg font-semibold">Oops! Something went wrong</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Don't worry, your information is safe. Just click reload and try again.
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4" /> Reload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { window.location.href = `${import.meta.env.BASE_URL}dashboard`; }}
                >
                  <Home className="h-4 w-4" /> Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
}
