import { apiFetch, handleError } from "../util/api";

export async function getSuggestedUserHandles(SearchTerm: string): Promise<string[]> {
  const response = await apiFetch({
    path: `/api/users/suggestions?handle=${SearchTerm}`,
    method: "GET",
  });
  await handleError(response);
  const data = await response.json();
  return data.suggestions;
}