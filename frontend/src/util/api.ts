import { API_URL } from "../config";
import { logout } from "./logout";

type Props = {
  method: string;
  path: string;
  body?: string | FormData;
};

export const apiFetch = async ({
  path,
  method,
  body,
}: Props): Promise<Response> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${sessionStorage.getItem("JWT_TOKEN")}`,
  };
  // Only set Content-Type if not FormData
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(API_URL + path, {
    method: method,
    headers,
    body: body,
  });
  return res;
};

export async function handleError(response: Response): Promise<void> {
  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data?.error
        ? `${response.status}: ${data?.error}`
        : `Request failed with status ${response.status}`
    );
  }
}
