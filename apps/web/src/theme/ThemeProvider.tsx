import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type ThemeChoice = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (next: ThemeChoice) => void;
  toggle: () => void;
};

const STORAGE_KEY = "femi.theme";
const CHOICES: ThemeChoice[] = ["light", "dark", "system"];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredChoice(): ThemeChoice {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);

    if (stored && (CHOICES as string[]).includes(stored)) {
      return stored as ThemeChoice;
    }
  } catch {
    // localStorage is unavailable; fall back to system.
  }

  return "system";
}

function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveChoice(choice: ThemeChoice): ResolvedTheme {
  if (choice === "system") {
    return prefersDark() ? "dark" : "light";
  }

  return choice;
}

function applyTheme(choice: ThemeChoice, resolved: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-choice", choice);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => readStoredChoice());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveChoice(readStoredChoice()));

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);

    try {
      window.localStorage?.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage is unavailable; the in-memory state is still updated.
    }

    const nextResolved = resolveChoice(next);

    setResolved(nextResolved);
    applyTheme(next, nextResolved);
  }, []);

  const toggle = useCallback(() => {
    setChoice(resolved === "dark" ? "light" : "dark");
  }, [resolved, setChoice]);

  useEffect(() => {
    applyTheme(choice, resolved);
  }, [choice, resolved]);

  useEffect(() => {
    if (
      choice !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const nextResolved: ResolvedTheme = event.matches ? "dark" : "light";

      setResolved(nextResolved);
      applyTheme("system", nextResolved);
    };

    media.addEventListener("change", handler);

    return () => {
      media.removeEventListener("change", handler);
    };
  }, [choice]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      choice,
      resolved,
      setChoice,
      toggle
    }),
    [choice, resolved, setChoice, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const NOOP_THEME: ThemeContextValue = {
  choice: "system",
  resolved: "light",
  setChoice: () => {},
  toggle: () => {}
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? NOOP_THEME;
}
