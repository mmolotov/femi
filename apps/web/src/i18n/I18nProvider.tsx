import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useEffect,
  useState
} from "react";

import {
  baseMessages,
  type Messages,
  type SupportedLanguage,
  languageOptions,
  supportedLanguages,
  translations
} from "./translations";

const STORAGE_KEY = "femi.language";
const RTL_LANGUAGES = new Set<SupportedLanguage>(["ar"]);

type I18nContextValue = {
  direction: "ltr" | "rtl";
  language: SupportedLanguage;
  languages: typeof languageOptions;
  messages: Messages;
  setLanguage: Dispatch<SetStateAction<SupportedLanguage>>;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          language_code?: string;
        };
      };
    };
  };
};

const I18nContext = createContext<I18nContextValue | null>(null);

function mergeMessages<T extends Record<string, unknown>>(base: T, override?: unknown): T {
  if (!override || typeof override !== "object") {
    return base;
  }

  const result = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];

    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    if (
      value &&
      typeof value === "object" &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeMessages(baseValue as Record<string, unknown>, value);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

function normalizeLanguage(value?: string | null): SupportedLanguage | null {
  if (!value) {
    return null;
  }

  const [base] = value.toLowerCase().split(/[-_]/u);

  if (supportedLanguages.includes(base as SupportedLanguage)) {
    return base as SupportedLanguage;
  }

  return null;
}

function detectInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));

  if (storedLanguage) {
    return storedLanguage;
  }

  const telegramLanguage = normalizeLanguage(
    (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user?.language_code
  );

  if (telegramLanguage) {
    return telegramLanguage;
  }

  const navigatorLanguage = normalizeLanguage(window.navigator.language);

  return navigatorLanguage ?? "en";
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<SupportedLanguage>(detectInitialLanguage);
  const direction = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  return (
    <I18nContext.Provider
      value={{
        direction,
        language,
        languages: languageOptions,
        messages: mergeMessages(baseMessages, translations[language]) as Messages,
        setLanguage
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return value;
}
