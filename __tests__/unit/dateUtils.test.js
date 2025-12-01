/**
 * Unit tests for date utility functions
 */

import { previousDay, nextDay, getTodayDict } from "../testUtils.js";

describe("Date Utility Functions", () => {
  describe("previousDay", () => {
    test("should return the previous day", () => {
      const date = new Date("2023-01-15T12:00:00Z");
      const result = previousDay(date);

      expect(result.getDate()).toBe(14);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2023);
    });

    test("should handle month boundaries", () => {
      const date = new Date("2023-02-01T12:00:00Z");
      const result = previousDay(date);

      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2023);
    });

    test("should handle year boundaries", () => {
      const date = new Date("2023-01-01T12:00:00Z");
      const result = previousDay(date);

      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getFullYear()).toBe(2022);
    });

    test("should handle leap years", () => {
      const date = new Date("2024-03-01T12:00:00Z");
      const result = previousDay(date);

      expect(result.getDate()).toBe(29); // Feb 29 in leap year
      expect(result.getMonth()).toBe(1); // February
      expect(result.getFullYear()).toBe(2024);
    });

    test("should not mutate original date", () => {
      const date = new Date("2023-01-15T12:00:00Z");
      const originalTime = date.getTime();

      previousDay(date);

      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe("nextDay", () => {
    test("should return the next day", () => {
      const date = new Date("2023-01-15T12:00:00Z");
      const result = nextDay(date);

      expect(result.getDate()).toBe(16);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2023);
    });

    test("should handle month boundaries", () => {
      const date = new Date("2023-01-31T12:00:00Z");
      const result = nextDay(date);

      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getFullYear()).toBe(2023);
    });

    test("should handle year boundaries", () => {
      const date = new Date("2023-12-31T12:00:00Z");
      const result = nextDay(date);

      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
    });

    test("should handle leap years", () => {
      const date = new Date("2024-02-28T12:00:00Z");
      const result = nextDay(date);

      expect(result.getDate()).toBe(29); // Feb 29 in leap year
      expect(result.getMonth()).toBe(1); // February
      expect(result.getFullYear()).toBe(2024);
    });

    test("should not mutate original date", () => {
      const date = new Date("2023-01-15T12:00:00Z");
      const originalTime = date.getTime();

      nextDay(date);

      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe("getTodayDict", () => {
    test("should return today's date as a dictionary", () => {
      const result = getTodayDict();
      const now = new Date();

      expect(result.year).toBe(now.getFullYear());
      expect(result.month).toBe(now.getMonth() + 1);
      expect(result.day).toBe(now.getDate());
    });

    test("should have correct structure", () => {
      const result = getTodayDict();

      expect(result).toHaveProperty("year");
      expect(result).toHaveProperty("month");
      expect(result).toHaveProperty("day");
      expect(typeof result.year).toBe("number");
      expect(typeof result.month).toBe("number");
      expect(typeof result.day).toBe("number");
    });

    test("month should be 1-12 (not 0-11)", () => {
      const result = getTodayDict();

      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });
  });
});
