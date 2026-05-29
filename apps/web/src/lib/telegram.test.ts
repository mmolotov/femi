// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function withAvailability<T extends (...args: never[]) => unknown>(
  implementation: T,
  available: boolean
) {
  return Object.assign(vi.fn(implementation), {
    isAvailable: vi.fn(() => available)
  });
}

const sdkMocks = vi.hoisted(() => {
  const init = vi.fn(() => vi.fn());
  const bindMiniAppCssVars = withAvailability(() => vi.fn(), false);
  const bindThemeParamsCssVars = withAvailability(() => vi.fn(), false);
  const bindViewportCssVars = withAvailability(() => vi.fn(), true);
  const expandViewport = withAvailability(() => undefined, true);
  const miniAppReady = withAvailability(() => undefined, true);
  const mountMiniAppSync = withAvailability(() => undefined, false);
  const mountThemeParamsSync = withAvailability(() => undefined, false);
  const mountViewport = withAvailability(() => Promise.resolve(), true);

  const isMiniAppCssVarsBound = vi.fn(() => false);
  const isMiniAppMounted = vi.fn(() => false);
  const isThemeParamsCssVarsBound = vi.fn(() => false);
  const isThemeParamsMounted = vi.fn(() => false);
  const isViewportCssVarsBound = vi.fn(() => false);
  const isViewportMounted = vi.fn(() => false);
  const retrieveRawInitData = vi.fn(() => "init-data");

  return {
    bindMiniAppCssVars,
    bindThemeParamsCssVars,
    bindViewportCssVars,
    expandViewport,
    init,
    isMiniAppCssVarsBound,
    isMiniAppMounted,
    isThemeParamsCssVarsBound,
    isThemeParamsMounted,
    isViewportCssVarsBound,
    isViewportMounted,
    miniAppReady,
    mountMiniAppSync,
    mountThemeParamsSync,
    mountViewport,
    retrieveRawInitData
  };
});

vi.mock("@telegram-apps/sdk-react", () => sdkMocks);

import { closeTelegramApp, initializeTelegramRuntime } from "./telegram";

type TelegramWindowLike = Window & {
  Telegram?: { WebApp?: { initData?: string; close?: () => void } };
};

function setTelegramWebApp(webApp: { initData?: string; close?: () => void }): void {
  (window as TelegramWindowLike).Telegram = { WebApp: webApp };
}

describe("initializeTelegramRuntime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/?tgWebAppPlatform=ios");
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, "", "/");
  });

  it("resolves with init data even if viewport mounting stalls", async () => {
    sdkMocks.mountViewport.mockImplementation(() => new Promise(() => {}));

    const runtimePromise = initializeTelegramRuntime();

    await vi.advanceTimersByTimeAsync(1500);

    await expect(runtimePromise).resolves.toMatchObject({
      environment: "telegram",
      initDataRaw: "init-data"
    });

    expect(sdkMocks.expandViewport).not.toHaveBeenCalled();
    expect(sdkMocks.miniAppReady).toHaveBeenCalled();
  });

  it("treats a plain browser with only the bridge script as browser mode", async () => {
    window.history.replaceState({}, "", "/?app_demo=1");
    (
      window as Window & {
        Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { user?: unknown } } };
      }
    ).Telegram = {
      WebApp: {
        initData: "",
        initDataUnsafe: {}
      }
    };

    await expect(initializeTelegramRuntime()).resolves.toMatchObject({
      environment: "browser"
    });

    expect(sdkMocks.init).not.toHaveBeenCalled();
  });
});

describe("closeTelegramApp", () => {
  afterEach(() => {
    delete (window as TelegramWindowLike).Telegram;
    window.history.replaceState({}, "", "/");
  });

  it("closes the mini app when running inside Telegram", () => {
    const close = vi.fn();
    setTelegramWebApp({ close, initData: "stub" });

    expect(closeTelegramApp()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("returns false in a plain browser without attempting to close", () => {
    expect(closeTelegramApp()).toBe(false);
  });

  it("returns false when the Telegram runtime exposes no close method", () => {
    setTelegramWebApp({ initData: "stub" });

    expect(closeTelegramApp()).toBe(false);
  });
});
