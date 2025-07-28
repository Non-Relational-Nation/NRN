import { API_URL } from "../config";

type Props = {
  method: string;
  path: string;
  body?: string;
};

export const apiFetch = async ({
  path,
  method,
  body,
}: Props): Promise<Response> => {
  const res = await fetch(API_URL + path, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("JWT_TOKEN")}`,
    },
    body: body,
  });
  return res;
};
