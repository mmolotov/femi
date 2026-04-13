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

const viewportMountTimeoutMs = 1500;

type TelegramBootstrapResult = {
  cleanup: VoidFunction;
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
  const webApp = telegramWindow.Telegram?.WebApp;
  const hasInitData = typeof webApp?.initData === "string" && webApp.initData.trim().length > 0;
  const hasInitUser = Boolean(webApp?.initDataUnsafe?.user);

  return search.includes("tgWebAppPlatform=") || hasInitData || hasInitUser;
}

async function waitForViewportMount(): Promise<boolean> {
  if (isViewportMounted()) {
    return true;
  }

  if (!mountViewport.isAvailable()) {
    return false;
  }

  return Promise.race([
    mountViewport()
      .then(() => true)
      .catch(() => false),
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(isViewportMounted());
      }, viewportMountTimeoutMs);
    })
  ]);
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

    const viewportMounted = await waitForViewportMount();

    if (viewportMounted && bindViewportCssVars.isAvailable() && !isViewportCssVarsBound()) {
      cleanupCallbacks.push(bindViewportCssVars());
    }

    if (viewportMounted && expandViewport.isAvailable()) {
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
      environment: "telegram",
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
      environment: "telegram"
    };
  }
}
