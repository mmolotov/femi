import { lazy, Suspense } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";

import { AppDataProvider, useAppData } from "./data/AppDataProvider";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { SessionProvider, useSession } from "./session/SessionProvider";

const CalendarRoute = lazy(async () => {
  const module = await import("./routes/CalendarRoute");

  return { default: module.CalendarRoute };
});
const HistoryRoute = lazy(async () => {
  const module = await import("./routes/HistoryRoute");

  return { default: module.HistoryRoute };
});
const OnboardingGate = lazy(async () => {
  const module = await import("./components/OnboardingGate");

  return { default: module.OnboardingGate };
});
const SettingsRoute = lazy(async () => {
  const module = await import("./routes/SettingsRoute");

  return { default: module.SettingsRoute };
});
const TodayRoute = lazy(async () => {
  const module = await import("./routes/TodayRoute");

  return { default: module.TodayRoute };
});

type Tab = {
  to: string;
  label: string;
  end?: boolean;
};

function AppShell() {
  const location = useLocation();
  const { messages } = useI18n();
  const { error, me, status } = useAppData();
  const session = useSession();
  const tabs: Tab[] = [
    { to: "/", label: messages.app.tabs.today, end: true },
    { to: "/calendar", label: messages.app.tabs.calendar },
    { to: "/history", label: messages.app.tabs.history },
    { to: "/settings", label: messages.app.tabs.settings }
  ];

  return (
    <div className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">{messages.app.eyebrow}</p>
        <h1>{messages.app.heroTitle}</h1>
        <p className="hero-copy">{messages.app.heroCopy}</p>
      </header>

      {status === "loading" ? (
        <section className="status-banner">{messages.app.loading}</section>
      ) : null}

      {session.status === "preview" ? (
        <section className="status-banner muted-banner">
          <strong>{messages.app.previewTitle}</strong>
          <span>{messages.app.previewBody}</span>
        </section>
      ) : null}

      {status === "error" ? (
        <section className="status-banner error-banner">
          <strong>{messages.app.syncErrorTitle}</strong>
          <span>{error ?? messages.app.syncErrorBody}</span>
        </section>
      ) : null}

      <nav className="tab-bar" aria-label={messages.app.primaryNavLabel}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
            end={tab.end}
            to={{
              pathname: tab.to,
              search: location.search
            }}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main className="content">
        <Suspense fallback={<section className="status-banner">{messages.app.loading}</section>}>
          {status === "ready" && me && !me.settings.onboardingCompleted ? (
            <OnboardingGate />
          ) : (
            <Routes>
              <Route element={<TodayRoute />} path="/" />
              <Route element={<CalendarRoute />} path="/calendar" />
              <Route element={<HistoryRoute />} path="/history" />
              <Route element={<SettingsRoute />} path="/settings" />
            </Routes>
          )}
        </Suspense>
      </main>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <SessionProvider>
        <AppDataProvider>
          <AppShell />
        </AppDataProvider>
      </SessionProvider>
    </I18nProvider>
  );
}
