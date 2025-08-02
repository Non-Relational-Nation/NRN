import { API_URL } from "../config";

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
