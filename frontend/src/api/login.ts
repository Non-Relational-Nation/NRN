import { API_URL, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URL } from "../config";

export function initiateGoogleLogin() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URL,
    access_type: "offline",
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    prompt: "consent",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    return fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(5000),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Login failedll");
        return response.json();
      })
      .then((data) => {
        sessionStorage.setItem("JWT_TOKEN", data.id_token);
        sessionStorage.setItem("MY_USER_ID", "1");
      });
  } else {
    throw new Error("Login failedl");
  }
}
