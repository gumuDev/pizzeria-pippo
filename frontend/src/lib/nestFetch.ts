import { getToken } from "./auth";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

// Shared by every service that calls the NestJS backend — adds the auth
// header centrally instead of each service re-declaring its own copy.
export async function nestFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  return fetch(`${NEST_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}
