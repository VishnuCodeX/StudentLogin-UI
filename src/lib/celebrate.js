// Developed By: Vishnukarthick K

// Tiny event-bus for a one-off celebration burst (confetti), triggerable from anywhere — in
// particular handlePaymentReturn() after a confirmed payment success. <ConfettiHost /> registers
// the handler and renders the actual animation; mirrors the toast.js / confirm.js pattern so it
// works the same way whether called from a component or plain utility code.
let handler = null;

export function registerCelebrateHandler(fn) {
  handler = fn;
}

export function celebrate() {
  handler && handler();
}
