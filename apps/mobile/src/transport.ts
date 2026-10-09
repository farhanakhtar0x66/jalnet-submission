import { apiErrorSchema } from "@jalnet/contracts";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export class NetworkError extends Error {}
export async function jsonRequest(
  base: string,
  path: string,
  token: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
) {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
  } catch {
    throw new NetworkError(
      "Network unavailable. Saved private drafts remain on this device; retry when connected.",
    );
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(data);
    throw new HttpError(
      response.status,
      parsed.success
        ? parsed.data.error.message
        : response.status === 401
          ? "Session expired or sign-in required. Sign in again."
          : "Request failed; retry later",
    );
  }
  if (data === null)
    throw new Error("Server response could not be validated; retry later");
  return data;
}
