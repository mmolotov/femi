import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

import { initializeTelegramRuntime, type TelegramEnvironment } from "../lib/telegram";

type SessionUser = {
  firstName: string | null;
  id: string;
  languageCode: string | null;
  lastName: string | null;
  telegramUserId: string;
  username: string | null;
};

type SessionStatus = "authenticating" | "authenticated" | "error" | "preview";

type SessionContextValue = {
  environment: TelegramEnvironment;
  error: string | null;
  status: SessionStatus;
  user: SessionUser | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.telegramUserId === "string" &&
    (typeof candidate.username === "string" || candidate.username === null) &&
    (typeof candidate.firstName === "string" || candidate.firstName === null) &&
    (typeof candidate.lastName === "string" || candidate.lastName === null) &&
    (typeof candidate.languageCode === "string" || candidate.languageCode === null)
  );
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionContextValue>({
    environment: "browser",
    error: null,
    status: "authenticating",
    user: null
  });

  useEffect(() => {
    let active = true;
    let cleanup = () => {};

    const bootstrap = async () => {
      const runtime = await initializeTelegramRuntime();
      cleanup = runtime.cleanup;

      if (!active) {
        cleanup();
        return;
      }

      if (!runtime.initDataRaw) {
        setState({
          environment: runtime.environment,
          error: null,
          status: "preview",
          user: null
        });
        return;
      }

      try {
        const response = await fetch("/api/auth/telegram", {
          body: JSON.stringify({
            initDataRaw: runtime.initDataRaw
          }),
          headers: {
            "content-type": "application/json"
          },
          method: "POST"
        });

        if (!response.ok) {
          throw new Error(`Telegram auth failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as {
          user?: unknown;
        };

        if (!isSessionUser(payload.user)) {
          throw new Error("Telegram auth response has an invalid shape.");
        }

        if (!active) {
          return;
        }

        setState({
          environment: runtime.environment,
          error: null,
          status: "authenticated",
          user: payload.user
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          environment: runtime.environment,
          error: error instanceof Error ? error.message : "Telegram auth failed.",
          status: "error",
          user: null
        });
      }
    };

    void bootstrap();

    return () => {
      active = false;
      cleanup();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within SessionProvider.");
  }

  return value;
}
