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

export async function handleError(
  response: Response,
  errorMessage?: string
): Promise<void> {
  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    
    let data: any = {};
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (error) {
    }
    
    throw new Error(
      errorMessage
        ? errorMessage
        : data?.error
        ? `${response.status}: ${data?.error}`
        : `Request failed with status ${response.status}`
    );
  }
}
