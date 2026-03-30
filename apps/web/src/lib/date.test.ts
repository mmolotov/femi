import { afterEach, describe, expect, it, vi } from "vitest";

import { formatIsoDateForDisplay, formatIsoMonthForDisplay } from "./date";

describe("formatIsoDateForDisplay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats ISO dates with UTC semantics", () => {
    function DateTimeFormatMock() {
      return {
        format: () => "3/29/2026"
      };
    }

    const formatterSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(DateTimeFormatMock as typeof Intl.DateTimeFormat);

    formatIsoDateForDisplay("2026-03-29", "en-US");

    expect(formatterSpy).toHaveBeenCalledWith(
      "en-US",
      expect.objectContaining({
        timeZone: "UTC"
      })
    );
  });

  it("formats ISO months with UTC semantics", () => {
    function DateTimeFormatMock() {
      return {
        format: () => "March 2026"
      };
    }

    const formatterSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(DateTimeFormatMock as typeof Intl.DateTimeFormat);

    formatIsoMonthForDisplay("2026-03", "en-US");

    expect(formatterSpy).toHaveBeenCalledWith(
      "en-US",
      expect.objectContaining({
        month: "long",
        timeZone: "UTC",
        year: "numeric"
      })
    );
  });
});
