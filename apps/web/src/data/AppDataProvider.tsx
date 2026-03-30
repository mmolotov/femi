import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type {
  CycleSummary,
  MeResponse,
  OnboardingSetupRequest,
  UpdateUserSettingsRequest
} from "@femi/shared";

import { createDemoApiClient, isDemoAppMode } from "../demo/mockApp";
import { useI18n } from "../i18n/I18nProvider";
import { createApiClient, type ApiClient } from "../lib/api";
import { useSession } from "../session/SessionProvider";

type AppDataStatus = "error" | "loading" | "preview" | "ready";

type AppDataContextValue = {
  api: ApiClient | null;
  completeOnboarding(input: OnboardingSetupRequest): Promise<void>;
  error: string | null;
  me: MeResponse | null;
  refresh(): Promise<void>;
  status: AppDataStatus;
  summary: CycleSummary | null;
  updateSettings(input: UpdateUserSettingsRequest): Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const { messages } = useI18n();
  const session = useSession();
  const demoMode = session.status === "preview" || isDemoAppMode();
  const api = useMemo(
    () =>
      demoMode
        ? createDemoApiClient()
        : session.initDataRaw
          ? createApiClient(session.initDataRaw)
          : null,
    [demoMode, session.initDataRaw]
  );
  const [state, setState] = useState<{
    error: string | null;
    me: MeResponse | null;
    status: AppDataStatus;
    summary: CycleSummary | null;
  }>({
    error: null,
    me: null,
    status: session.status === "preview" ? "preview" : "loading",
    summary: null
  });

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (demoMode && api) {
        const [meResponse, summaryResponse] = await Promise.all([
          api.getMe(),
          api.getCycleSummary()
        ]);

        if (!active) {
          return;
        }

        setState({
          error: null,
          me: meResponse,
          status: "ready",
          summary: summaryResponse.summary
        });

        return;
      }

      if (session.status === "preview" || api === null) {
        if (active) {
          setState({
            error: null,
            me: null,
            status: "preview",
            summary: null
          });
        }

        return;
      }

      if (session.status === "error") {
        if (active) {
          setState({
            error: session.error ?? messages.app.telegramAuthFailed,
            me: null,
            status: "error",
            summary: null
          });
        }

        return;
      }

      if (session.status !== "authenticated") {
        if (active) {
          setState((current) => ({
            ...current,
            error: session.error,
            status: "loading"
          }));
        }

        return;
      }

      if (active) {
        setState((current) => ({
          ...current,
          error: null,
          status: "loading"
        }));
      }

      try {
        const [meResponse, summaryResponse] = await Promise.all([
          api.getMe(),
          api.getCycleSummary()
        ]);

        if (!active) {
          return;
        }

        setState({
          error: null,
          me: meResponse,
          status: "ready",
          summary: summaryResponse.summary
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          error: error instanceof Error ? error.message : messages.app.dataLoadError,
          me: null,
          status: "error",
          summary: null
        });
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [
    api,
    demoMode,
    messages.app.dataLoadError,
    messages.app.telegramAuthFailed,
    session.error,
    session.status
  ]);

  const value: AppDataContextValue = {
    api,
    async completeOnboarding(input) {
      if (!api) {
        throw new Error("API client is not available.");
      }

      const previousState = state;

      setState((current) => ({
        ...current,
        error: null,
        status: "loading"
      }));

      try {
        await api.completeOnboarding(input);
        const [meResponse, summaryResponse] = await Promise.all([
          api.getMe(),
          api.getCycleSummary()
        ]);

        setState({
          error: null,
          me: meResponse,
          status: "ready",
          summary: summaryResponse.summary
        });
      } catch (error) {
        setState({
          ...previousState,
          error: error instanceof Error ? error.message : messages.onboarding.saveError,
          status: previousState.status === "preview" ? "preview" : "ready"
        });
        throw error;
      }
    },
    error: state.error,
    me: state.me,
    async refresh() {
      if (!api) {
        return;
      }

      const [meResponse, summaryResponse] = await Promise.all([api.getMe(), api.getCycleSummary()]);

      setState({
        error: null,
        me: meResponse,
        status: "ready",
        summary: summaryResponse.summary
      });
    },
    status: state.status,
    summary: state.summary,
    async updateSettings(input) {
      if (!api) {
        throw new Error("API client is not available.");
      }

      const previousState = state;

      setState((current) => ({
        ...current,
        error: null,
        status: "loading"
      }));

      try {
        await api.updateSettings(input);
        const [meResponse, summaryResponse] = await Promise.all([
          api.getMe(),
          api.getCycleSummary()
        ]);

        setState({
          error: null,
          me: meResponse,
          status: "ready",
          summary: summaryResponse.summary
        });
      } catch (error) {
        setState({
          ...previousState,
          error: error instanceof Error ? error.message : messages.settings.saveError,
          status: previousState.status === "preview" ? "preview" : "ready"
        });
        throw error;
      }
    }
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);

  if (!value) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return value;
}
