import { NavLink, Route, Routes } from "react-router-dom";

import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { CalendarRoute } from "./routes/CalendarRoute";
import { HistoryRoute } from "./routes/HistoryRoute";
import { SettingsRoute } from "./routes/SettingsRoute";
import { TodayRoute } from "./routes/TodayRoute";

type Tab = {
  to: string;
  label: string;
  end?: boolean;
};

function AppShell() {
  const { messages } = useI18n();
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

      <nav className="tab-bar" aria-label="Primary">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
            end={tab.end}
            to={tab.to}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main className="content">
        <Routes>
          <Route element={<TodayRoute />} path="/" />
          <Route element={<CalendarRoute />} path="/calendar" />
          <Route element={<HistoryRoute />} path="/history" />
          <Route element={<SettingsRoute />} path="/settings" />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
