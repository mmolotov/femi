import {
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
} from "@telegram-apps/sdk-react";

export type TelegramEnvironment = "telegram" | "browser";

type TelegramBootstrapResult = {
  cleanup: VoidFunction;
  environment: TelegramEnvironment;
  initDataRaw?: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: unknown;
  };
};

function hasTelegramRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const search = window.location.search;
  const telegramWindow = window as TelegramWindow;

  return search.includes("tgWebAppPlatform=") || Boolean(telegramWindow.Telegram?.WebApp);
}

export async function initializeTelegramRuntime(): Promise<TelegramBootstrapResult> {
  if (typeof window === "undefined" || !hasTelegramRuntime()) {
    return {
      cleanup: () => {},
      environment: "browser"
    };
  }

  const cleanupSdk = init({
    acceptCustomStyles: true
  });
  const cleanupCallbacks: VoidFunction[] = [];

  try {
    if (mountThemeParamsSync.isAvailable() && !isThemeParamsMounted()) {
      mountThemeParamsSync();
    }

    if (bindThemeParamsCssVars.isAvailable() && !isThemeParamsCssVarsBound()) {
      cleanupCallbacks.push(bindThemeParamsCssVars());
    }

    if (mountMiniAppSync.isAvailable() && !isMiniAppMounted()) {
      mountMiniAppSync();
    }

    if (bindMiniAppCssVars.isAvailable() && !isMiniAppCssVarsBound()) {
      cleanupCallbacks.push(bindMiniAppCssVars());
    }

    if (mountViewport.isAvailable() && !isViewportMounted()) {
      await mountViewport();
    }

    if (bindViewportCssVars.isAvailable() && !isViewportCssVarsBound()) {
      cleanupCallbacks.push(bindViewportCssVars());
    }

    if (expandViewport.isAvailable()) {
      expandViewport();
    }

    if (miniAppReady.isAvailable()) {
      miniAppReady();
    }

    const initDataRaw = retrieveRawInitData();

    return {
      cleanup: () => {
        for (const callback of cleanupCallbacks.reverse()) {
          callback();
        }
        cleanupSdk();
      },
      environment: initDataRaw ? "telegram" : "browser",
      initDataRaw
    };
  } catch {
    return {
      cleanup: () => {
        for (const callback of cleanupCallbacks.reverse()) {
          callback();
        }
        cleanupSdk();
      },
      environment: "browser"
    };
  }
}
