// Developed By: Vishnukarthick K

// Tiny event-bus toast API. Works from both React components and non-React code
// (e.g. the axios interceptor). The <Toaster /> component registers the handler.
let handler = null;

export function registerToastHandler(fn) {
  handler = fn;
}

function emit(message, type, opts) {
  if (handler && message != null && String(message).trim() !== "") {
    handler({ message: String(message), type, ...(opts || {}) });
  }
}

export const toast = {
  success: (m, o) => emit(m, "success", o),
  error: (m, o) => emit(m, "error", o),
  warning: (m, o) => emit(m, "warning", o),
  info: (m, o) => emit(m, "info", o),
  show: (m, t = "info", o) => emit(m, t, o),
};
