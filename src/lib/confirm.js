// Developed By: Vishnukarthick K

// Promise-based confirm dialog. Any code can `await confirm({...})` and get true/false.
// The <ConfirmHost /> component registers the handler.
let handler = null;

export function registerConfirmHandler(fn) {
  handler = fn;
}

export function confirm(opts = {}) {
  return new Promise((resolve) => {
    if (!handler) {
      // Fallback if the host isn't mounted yet.
      resolve(window.confirm(opts.message || "Are you sure?"));
      return;
    }
    handler({ ...opts, resolve });
  });
}
