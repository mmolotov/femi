import { describe, expect, it } from "vitest";

import { supportedLanguages, translations } from "./translations";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key)
  );
}

const referenceKeys = new Set(leafPaths(translations.en));

describe("i18n key parity", () => {
  for (const language of supportedLanguages) {
    if (language === "en") {
      continue;
    }

    it(`${language} has the same keys as English`, () => {
      const keys = new Set(leafPaths(translations[language]));
      const missing = [...referenceKeys].filter((key) => !keys.has(key)).sort();
      const dead = [...keys].filter((key) => !referenceKeys.has(key)).sort();

      // Every locale must match English exactly: no missing keys (which would
      // render as English fallback) and no dead keys (present here, never read).
      expect(missing).toEqual([]);
      expect(dead).toEqual([]);
    });
  }
});
