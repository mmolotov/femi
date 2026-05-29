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

// English-fallback debt tracked in TASK-38.8 (translate these into the listed
// locales, then shrink this list to empty). Keys present in English but missing
// here render as English text, not undefined (I18nProvider merges over English).
const MISSING_TRANSLATIONS = [
  "app.signedOutTitle",
  "app.signedOutBody",
  "week.stripLabel",
  "week.previousWeek",
  "week.nextWeek",
  "week.openCalendar",
  "week.backToToday",
  "week.periodMarker",
  "week.predictedMarker",
  "week.ovulationMarker",
  "week.todayMarker",
  "today.removePeriodDay",
  "today.removePeriodDayPending",
  "today.removePeriodDaySuccess",
  "today.removePeriodDayError",
  "today.dayDetailsTitle",
  "today.dayDetailsDescription",
  "today.selectedDateToday",
  "today.selectedDateFromCalendar",
  "today.selectedDateCheckinDescription",
  "today.selectedDatePeriodDescription",
  "today.futureCheckinLocked",
  "calendar.selectedDateEmpty",
  "calendar.selectedDatePredicted",
  "calendar.futureDateReadOnly",
  "calendar.projectionMonth",
  "calendar.projectionYear",
  "calendar.previousYear",
  "calendar.nextYear",
  "calendar.legendOvulation",
  "calendar.bulkEditEnter",
  "calendar.bulkEditSave",
  "calendar.bulkEditSavePending",
  "calendar.bulkEditCancel",
  "calendar.bulkEditHint",
  "calendar.bulkEditSaveSuccess",
  "calendar.bulkEditSaveError",
  "calendar.bulkEditFutureLocked",
  "calendar.backToToday",
  "settings.accountTitle",
  "settings.accountWarning",
  "settings.deleteAccountIdle",
  "settings.deletePending",
  "settings.deleteError",
  "settings.deleteDialogTitle",
  "settings.deleteDialogDescription",
  "settings.deleteDialogCancel",
  "settings.deleteDialogConfirm"
];

// Dead keys (not present in English, so never read) tracked for removal in
// TASK-38.8. Shrink to empty as they are deleted.
const DEAD_KEYS_SHARED = [
  "today.periodActionsTitle",
  "today.periodActionsDescription",
  "today.startPeriod",
  "today.endPeriod",
  "today.startPeriodError",
  "today.endPeriodError",
  "calendar.startPeriod",
  "calendar.endPeriod",
  "calendar.startSuccess",
  "calendar.endSuccess"
];
const DEAD_KEYS_WITH_STALE_SCREENS = [
  ...DEAD_KEYS_SHARED,
  "today.description",
  "settings.title",
  "settings.description"
];
const DEAD_KEYS_WITH_STALE_SETTINGS = [
  ...DEAD_KEYS_WITH_STALE_SCREENS,
  "settings.timezoneLabel",
  "settings.remindersEnabledLabel",
  "settings.productType",
  "settings.productTypeValue",
  "settings.coreModel",
  "settings.coreModelValue",
  "settings.dataPosture",
  "settings.dataPostureValue",
  "settings.environment",
  "settings.environmentTelegram",
  "settings.environmentBrowser",
  "settings.sessionStatus",
  "settings.sessionAuthenticating",
  "settings.sessionAuthenticated",
  "settings.sessionPreview",
  "settings.sessionError",
  "settings.telegramLanguage",
  "settings.telegramLanguageFallback",
  "settings.authErrorLabel",
  "settings.languageDescription"
];

const KNOWN_MISSING: Record<string, string[]> = {
  ru: [],
  es: MISSING_TRANSLATIONS,
  pt: MISSING_TRANSLATIONS,
  tr: MISSING_TRANSLATIONS,
  uk: MISSING_TRANSLATIONS,
  ar: MISSING_TRANSLATIONS
};

const KNOWN_DEAD: Record<string, string[]> = {
  ru: DEAD_KEYS_SHARED,
  es: DEAD_KEYS_WITH_STALE_SCREENS,
  pt: DEAD_KEYS_WITH_STALE_SETTINGS,
  tr: DEAD_KEYS_WITH_STALE_SETTINGS,
  uk: DEAD_KEYS_WITH_STALE_SETTINGS,
  ar: DEAD_KEYS_WITH_STALE_SETTINGS
};

describe("i18n key parity", () => {
  for (const language of supportedLanguages) {
    if (language === "en") {
      continue;
    }

    it(`${language} matches the documented key parity against English`, () => {
      const keys = new Set(leafPaths(translations[language]));
      const missing = [...referenceKeys].filter((key) => !keys.has(key)).sort();
      const dead = [...keys].filter((key) => !referenceKeys.has(key)).sort();

      // Equality (not subset) so the lists must shrink as keys are
      // translated/removed; any new drift fails the test.
      expect(missing).toEqual([...(KNOWN_MISSING[language] ?? [])].sort());
      expect(dead).toEqual([...(KNOWN_DEAD[language] ?? [])].sort());
    });
  }
});
