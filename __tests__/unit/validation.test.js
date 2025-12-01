/**
 * Unit tests for settings validation
 */

import { validateSettings, DEFAULTS } from "../testUtils.js";
import { mockLogseq } from "../mocks/logseq.js";

describe("Settings Validation", () => {
  beforeEach(() => {
    mockLogseq.App.showMsg.mockClear();
    mockLogseq.settings.startingYear = "2010";
    mockLogseq.settings.pageTitle = "On This Day";
  });

  describe("validateSettings", () => {
    describe("startingYear validation", () => {
      test("should accept valid year", () => {
        mockLogseq.settings.startingYear = "2020";
        const result = validateSettings();

        expect(result.isValid).toBe(true);
        expect(result.startingYear).toBe("2020");
        expect(mockLogseq.App.showMsg.calls.length).toBe(0);
      });

      test("should reject year that is not a number", () => {
        mockLogseq.settings.startingYear = "abc123";
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.startingYear).toBe(DEFAULTS.STARTING_YEAR);
        expect(mockLogseq.App.showMsg.calls.length).toBeGreaterThan(0);
        expect(mockLogseq.App.showMsg.calls[0][0]).toContain("Invalid starting year");
        expect(mockLogseq.App.showMsg.calls[0][1]).toBe("warning");
      });

      test("should reject year before minimum (1900)", () => {
        mockLogseq.settings.startingYear = "1899";
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.startingYear).toBe(DEFAULTS.STARTING_YEAR);
        expect(mockLogseq.App.showMsg.calls.length).toBeGreaterThan(0);
      });

      test("should reject future year", () => {
        const futureYear = new Date().getFullYear() + 10;
        mockLogseq.settings.startingYear = futureYear.toString();
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.startingYear).toBe(DEFAULTS.STARTING_YEAR);
        expect(mockLogseq.App.showMsg.calls.length).toBeGreaterThan(0);
      });

      test("should accept current year", () => {
        const currentYear = new Date().getFullYear();
        mockLogseq.settings.startingYear = currentYear.toString();
        const result = validateSettings();

        expect(result.isValid).toBe(true);
        expect(result.startingYear).toBe(currentYear.toString());
      });

      test("should accept minimum year (1900)", () => {
        mockLogseq.settings.startingYear = "1900";
        const result = validateSettings();

        expect(result.isValid).toBe(true);
        expect(result.startingYear).toBe("1900");
      });
    });

    describe("pageTitle validation", () => {
      test("should accept valid non-empty title", () => {
        mockLogseq.settings.pageTitle = "My Custom Title";
        const result = validateSettings();

        expect(result.isValid).toBe(true);
        expect(result.pageTitle).toBe("My Custom Title");
        expect(mockLogseq.App.showMsg.calls.length).toBe(0);
      });

      test("should reject empty string", () => {
        mockLogseq.settings.pageTitle = "";
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.pageTitle).toBe(DEFAULTS.PAGE_TITLE);
        expect(mockLogseq.App.showMsg.calls.length).toBeGreaterThan(0);
        const lastCall = mockLogseq.App.showMsg.calls[mockLogseq.App.showMsg.calls.length - 1];
        expect(lastCall[0]).toContain("Page title cannot be empty");
      });

      test("should reject whitespace-only string", () => {
        mockLogseq.settings.pageTitle = "   ";
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.pageTitle).toBe(DEFAULTS.PAGE_TITLE);
      });

      test("should reject null", () => {
        mockLogseq.settings.pageTitle = null;
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.pageTitle).toBe(DEFAULTS.PAGE_TITLE);
      });

      test("should reject undefined", () => {
        mockLogseq.settings.pageTitle = undefined;
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.pageTitle).toBe(DEFAULTS.PAGE_TITLE);
      });

      test("should accept non-English characters", () => {
        mockLogseq.settings.pageTitle = "今日は何の日";
        const result = validateSettings();

        expect(result.isValid).toBe(true);
        expect(result.pageTitle).toBe("今日は何の日");
      });

      test("should accept title with leading/trailing spaces", () => {
        mockLogseq.settings.pageTitle = "  Valid Title  ";
        const result = validateSettings();

        expect(result.isValid).toBe(true);
        expect(result.pageTitle).toBe("  Valid Title  ");
      });
    });

    describe("multiple validation failures", () => {
      test("should handle both invalid year and empty title", () => {
        mockLogseq.settings.startingYear = "invalid";
        mockLogseq.settings.pageTitle = "";
        const result = validateSettings();

        expect(result.isValid).toBe(false);
        expect(result.startingYear).toBe(DEFAULTS.STARTING_YEAR);
        expect(result.pageTitle).toBe(DEFAULTS.PAGE_TITLE);
        expect(mockLogseq.App.showMsg.calls.length).toBe(2);
      });
    });

    describe("return value structure", () => {
      test("should return object with correct properties", () => {
        const result = validateSettings();

        expect(result).toHaveProperty("isValid");
        expect(result).toHaveProperty("startingYear");
        expect(result).toHaveProperty("pageTitle");
        expect(typeof result.isValid).toBe("boolean");
        expect(typeof result.startingYear).toBe("string");
        expect(typeof result.pageTitle).toBe("string");
      });
    });
  });
});
