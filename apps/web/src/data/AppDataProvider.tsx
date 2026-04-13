import {
  addDaysToIsoDate,
  buildPeriodForecast,
  calculateCurrentCycleDay,
  differenceInDays,
  getIsoDateInTimeZone,
  resolveCyclePhase,
  type CycleSummary,
  type MeResponse,
  type OnboardingSetupRequest,
  type UpdateUserSettingsRequest
} from "@femi/shared";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { createDemoApiClient } from "../demo/mockApp";
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

function buildOnboardingSummaryFallback(input: OnboardingSetupRequest): CycleSummary {
  const effectiveTimezone = input.timezone ?? "UTC";
  const today = getIsoDateInTimeZone(new Date(), effectiveTimezone);
  const forecast = buildPeriodForecast({
    averageCycleLengthDays: input.cycleLengthDays,
    averagePeriodLengthDays: input.periodLengthDays,
    fromDate: today,
    latestCycleStart: input.latestPeriodStart
  });
  const currentCycleDay = calculateCurrentCycleDay(input.latestPeriodStart, today);
  const currentPeriodEnd = addDaysToIsoDate(input.latestPeriodStart, input.periodLengthDays - 1);

  return {
    activePeriod:
      differenceInDays(input.latestPeriodStart, today) >= 0 &&
      differenceInDays(today, currentPeriodEnd) >= 0,
    averageCycleLengthDays: input.cycleLengthDays,
    averagePeriodLengthDays: input.periodLengthDays,
    currentCycleDay,
    currentPhase: resolveCyclePhase(currentCycleDay, input.cycleLengthDays, input.periodLengthDays),
    forecast,
    latestPeriodStart: input.latestPeriodStart,
    onboardingCompleted: true,
    predictedNextPeriodStart: forecast[0]?.periodStart ?? null,
    today
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { messages } = useI18n();
  const session = useSession();
  const bootstrapCopyRef = useRef({
    dataLoadError: messages.app.dataLoadError,
    telegramAuthFailed: messages.app.telegramAuthFailed
  });
  const demoMode = session.status === "preview";
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

  bootstrapCopyRef.current = {
    dataLoadError: messages.app.dataLoadError,
    telegramAuthFailed: messages.app.telegramAuthFailed
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (demoMode && api) {
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
            error: error instanceof Error ? error.message : bootstrapCopyRef.current.dataLoadError,
            me: null,
            status: "error",
            summary: null
          });
        }

        return;
      }

      if (session.status === "error") {
        if (active) {
          setState({
            error: session.error ?? bootstrapCopyRef.current.telegramAuthFailed,
            me: null,
            status: "error",
            summary: null
          });
        }

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
          error: error instanceof Error ? error.message : bootstrapCopyRef.current.dataLoadError,
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
  }, [api, demoMode, session.error, session.status]);

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
        const onboardingResponse = await api.completeOnboarding(input);
        const fallbackMe =
          previousState.me === null
            ? null
            : {
                ...previousState.me,
                settings: onboardingResponse.settings
              };

        try {
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
        } catch {
          setState({
            error: null,
            me: fallbackMe,
            status: "ready",
            summary: buildOnboardingSummaryFallback(input)
          });
        }
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
