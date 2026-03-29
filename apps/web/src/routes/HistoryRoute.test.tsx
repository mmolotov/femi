// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useAppDataMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { HistoryRoute } from "./HistoryRoute";

describe("HistoryRoute", () => {
  it("renders recent history entries", async () => {
    const getHistory = vi.fn().mockResolvedValue({
      days: [
        {
          checkin: {
            date: "2026-03-03",
            discharge: "creamy",
            energy: 3,
            mood: 4,
            note: "Mild cramps",
            painLevel: 2,
            sleepQuality: 5,
            symptomKeys: ["cramps"]
          },
          date: "2026-03-03",
          period: {
            cycleEnded: false,
            cycleStarted: true,
            date: "2026-03-03",
            flowIntensity: "medium",
            note: null
          },
          symptomKeys: ["cramps"]
        }
      ]
    });

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledWith(30);
    });

    expect(await screen.findByText(/^Check-in$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Period$/i)).toBeInTheDocument();
    expect(screen.getByText(/mood 4/i)).toBeInTheDocument();
    expect(screen.getByText(/^Cramps$/i)).toBeInTheDocument();
  });
});
