// Fires when the API layer sees a 401/403 (expired/invalid JWT). Any code — in
// particular the axios interceptor in api.js, which runs outside the React tree —
// can call notifySessionExpired() to pop the <SessionExpiredModal/> mounted at the
// app root. Mirrors the confirm.js register/notify pattern used for ConfirmHost.
let handler = null;

export function registerSessionExpiredHandler(fn) {
  handler = fn;
}

export function notifySessionExpired() {
  if (handler) handler();
}
