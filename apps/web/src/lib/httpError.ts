type ErrorPayload = {
  error?: unknown;
  message?: unknown;
};

function isErrorPayload(value: unknown): value is ErrorPayload {
  return Boolean(value) && typeof value === "object";
}

export async function readErrorMessage(
  response: Pick<Response, "status" | "text">,
  fallback: string
): Promise<string> {
  const rawText = await response.text();
  const trimmedText = rawText.trim();

  if (trimmedText.length === 0) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmedText) as unknown;

    if (isErrorPayload(parsed)) {
      if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
        return parsed.error;
      }

      if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
        return parsed.message;
      }
    }
  } catch {
    // Fall through to the raw response text when the body is not JSON.
  }

  return trimmedText;
}
