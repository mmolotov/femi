import { NavLink, Route, Routes } from "react-router-dom";

import { CalendarRoute } from "./routes/CalendarRoute";
import { HistoryRoute } from "./routes/HistoryRoute";
import { SettingsRoute } from "./routes/SettingsRoute";
import { TodayRoute } from "./routes/TodayRoute";

type Tab = {
  to: string;
  label: string;
  end?: boolean;
};

const tabs: Tab[] = [
  { to: "/", label: "Today", end: true },
  { to: "/calendar", label: "Calendar" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" }
];

export function App() {
  return (
    <div className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">femi foundation</p>
        <h1>Simple cycle tracking, built for calm daily use.</h1>
        <p className="hero-copy">
          Milestone 0 ships the Mini App shell, authentication path, navigation, settings baseline,
          and backend connectivity.
        </p>
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
