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

export type TelegramDiagnostics = {
  directInitDataLength: number;
  hasTelegramObject: boolean;
  hasTgWebAppPlatformParam: boolean;
  hasUnsafeUser: boolean;
  hasWebAppObject: boolean;
  sdkInitDataLength: number;
};

type TelegramBootstrapResult = {
  cleanup: VoidFunction;
  diagnostics: TelegramDiagnostics;
  environment: TelegramEnvironment;
  initDataRaw?: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        user?: unknown;
      };
    };
  };
};

function readTelegramWindow(): TelegramWindow | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window as TelegramWindow;
}

function hasTelegramRuntime(): boolean {
  const telegramWindow = readTelegramWindow();

  if (!telegramWindow) {
    return false;
  }

  const search = telegramWindow.location.search;

  return search.includes("tgWebAppPlatform=") || Boolean(telegramWindow.Telegram?.WebApp);
}

function collectTelegramDiagnostics(sdkInitDataRaw?: string): TelegramDiagnostics {
  const telegramWindow = readTelegramWindow();
  const webApp = telegramWindow?.Telegram?.WebApp;
  const directInitData = typeof webApp?.initData === "string" ? webApp.initData : "";

  return {
    directInitDataLength: directInitData.length,
    hasTelegramObject: Boolean(telegramWindow?.Telegram),
    hasTgWebAppPlatformParam: Boolean(
      telegramWindow?.location.search.includes("tgWebAppPlatform=")
    ),
    hasUnsafeUser: Boolean(webApp?.initDataUnsafe?.user),
    hasWebAppObject: Boolean(webApp),
    sdkInitDataLength: sdkInitDataRaw?.length ?? 0
  };
}

export async function initializeTelegramRuntime(): Promise<TelegramBootstrapResult> {
  if (typeof window === "undefined" || !hasTelegramRuntime()) {
    return {
      cleanup: () => {},
      diagnostics: collectTelegramDiagnostics(),
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
      diagnostics: collectTelegramDiagnostics(initDataRaw),
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
      diagnostics: collectTelegramDiagnostics(),
      environment: "browser"
    };
  }
}
