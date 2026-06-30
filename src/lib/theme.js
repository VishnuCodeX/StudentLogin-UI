// The app uses a single light beige theme. Dark mode has been removed — these
// helpers simply ensure the `dark` class is never applied.
export function getTheme() {
  return "light";
}

export function applyTheme() {
  document.documentElement.classList.remove("dark");
}

export function initTheme() {
  applyTheme();
}
