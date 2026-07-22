// Developed By: Vishnukarthick K

const TOKEN_KEY = "mcc_student_token";
const STUDENT_KEY = "mcc_student";
const AVATAR_KEY = "mcc_avatar";

// Profile picture is stored locally (data URL) and broadcast so the topbar /
// sidebar avatars update live when it changes.
export function getAvatar() {
  return localStorage.getItem(AVATAR_KEY) || null;
}

export function setAvatar(dataUrl) {
  if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl);
  else localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new Event("mcc-avatar"));
}

export function saveSession(token, student) {
  localStorage.setItem(TOKEN_KEY, token);
  if (student) localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStudent() {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_KEY));
  } catch {
    return null;
  }
}

export function setStudent(student) {
  if (student) localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STUDENT_KEY);
  localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new Event("mcc-avatar"));
}
