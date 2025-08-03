const LOCAL_FE_URL = "http://localhost:5173";
const HOSTED_FE_URL = "https://dmu78d3smdb0c.cloudfront.net";

const FE_URL =
  window.location.hostname === "localhost" ? LOCAL_FE_URL : HOSTED_FE_URL;

const LOCAL_API_URL = "http://localhost:3001";
const HOSTED_API_URL = "https://dmu78d3smdb0c.cloudfront.net";

export const API_URL =
  window.location.hostname === "localhost" ? LOCAL_API_URL : HOSTED_API_URL;

export const GOOGLE_CLIENT_ID =
  "580658106738-v39pbtsogta6rk3icthq2k97m30j935b.apps.googleusercontent.com";
export const GOOGLE_REDIRECT_URL = `${FE_URL}/login/callback`;
