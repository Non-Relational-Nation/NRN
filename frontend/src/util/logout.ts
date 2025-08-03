export function logout() {
  sessionStorage.clear();
  window.location.href = "/login";
}