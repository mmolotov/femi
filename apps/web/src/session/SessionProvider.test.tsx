// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { initializeTelegramRuntimeMock } = vi.hoisted(() => ({
  initializeTelegramRuntimeMock: vi.fn()
}));

vi.mock("../lib/telegram", () => ({
  initializeTelegramRuntime: initializeTelegramRuntimeMock
}));

import { I18nProvider, useI18n } from "../i18n/I18nProvider";
import { SessionProvider, useSession } from "./SessionProvider";

function SessionProbe() {
  const session = useSession();
  const { setLanguage } = useI18n();

  return (
    <>
      <span>{session.status}</span>
      {session.error ? <span>{session.error}</span> : null}
      <button
        onClick={() => {
          setLanguage("ru");
        }}
        type="button"
      >
        Switch language
      </button>
    </>
  );
}

describe("SessionProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializeTelegramRuntimeMock.mockResolvedValue({
      cleanup: vi.fn(),
      environment: "telegram",
      initDataRaw: "init-data"
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          user: {
            firstName: "Ada",
            id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
            languageCode: "en",
            lastName: null,
            telegramUserId: "10001",
            username: "ada"
          }
        }),
        ok: true
      })
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("does not reauthenticate when the language changes", async () => {
    render(
      <I18nProvider>
        <SessionProvider>
          <SessionProbe />
        </SessionProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("authenticated")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /switch language/i }));

    await waitFor(() => {
      expect(screen.getByText("authenticated")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("fails closed when Telegram runtime is detected without init data", async () => {
    initializeTelegramRuntimeMock.mockResolvedValue({
      cleanup: vi.fn(),
      environment: "telegram"
    });

    render(
      <I18nProvider>
        <SessionProvider>
          <SessionProbe />
        </SessionProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses the backend auth error message when Telegram auth returns structured JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: "Invalid Telegram init data." })
      })
    );

    render(
      <I18nProvider>
        <SessionProvider>
          <SessionProbe />
        </SessionProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInTheDocument();
      expect(screen.getByText("Invalid Telegram init data.")).toBeInTheDocument();
    });
  });
});
