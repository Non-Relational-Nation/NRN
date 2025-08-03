export const GOOGLE_CLIENT_ID =
  "580658106738-v39pbtsogta6rk3icthq2k97m30j935b.apps.googleusercontent.com";

// Dynamic redirect URL based on environment
const LOCAL_REDIRECT_URL = "http://localhost:5173/login/callback";
const HOSTED_REDIRECT_URL = `${window.location.protocol}//${window.location.host}/login/callback`;

export const GOOGLE_REDIRECT_URL = window.location.hostname === "localhost" 
  ? LOCAL_REDIRECT_URL 
  : HOSTED_REDIRECT_URL;

const LOCAL_API_URL = "http://localhost:3001";
// Use environment variable set during build process
const HOSTED_API_URL = (import.meta as any).env?.VITE_API_URL || "https://d1ljjnuczrdc3q.cloudfront.net";

export const API_URL = window.location.hostname === "localhost" ? LOCAL_API_URL : HOSTED_API_URL;