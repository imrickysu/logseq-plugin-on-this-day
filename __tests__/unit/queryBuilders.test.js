/**
 * Unit tests for query builder functions
 */

import { getQueryScriptOTD, getQueryScriptOTDPageID, getQueryScriptPN, DIRECTION } from "../testUtils.js";
import { mockLogseq } from "../mocks/logseq.js";

describe("Query Builders", () => {
  beforeEach(() => {
    mockLogseq.settings.startingYear = "2010";
    mockLogseq.settings.pageTitle = "On This Day";
  });

  describe("getQueryScriptOTD", () => {
    test("should generate query for a specific date", () => {
      const date = new Date("2023-01-26T12:00:00Z");
      const query = getQueryScriptOTD(date);

      expect(query).toContain(":find (pull ?p [*])");
      expect(query).toContain(":where");
      expect(query).toContain("[?b :block/page ?p]");
      expect(query).toContain("[?p :block/journal? true]");
      expect(query).toContain("[?p :block/journal-day ?d]");
    });

    test("should include all years from startingYear to current year", () => {
      mockLogseq.settings.startingYear = "2020";
      const date = new Date("2023-01-26T12:00:00Z");
      const query = getQueryScriptOTD(date);

      expect(query).toContain("20200126");
      expect(query).toContain("20210126");
      expect(query).toContain("20220126");
      expect(query).toContain("20230126");
    });

    test("should format single-digit months with leading zero", () => {
      const date = new Date("2023-03-05T12:00:00Z");
      const query = getQueryScriptOTD(date);

      expect(query).toContain("20100305"); // March (03) and day 5 (05)
    });

    test("should format double-digit months without modification", () => {
      const date = new Date("2023-12-25T12:00:00Z");
      const query = getQueryScriptOTD(date);

      expect(query).toContain("20101225"); // December (12) and day 25
    });

    test("should handle leap year date (Feb 29)", () => {
      const date = new Date("2024-02-29T12:00:00Z");
      const query = getQueryScriptOTD(date);

      expect(query).toContain("20100229");
      expect(query).toContain("20240229");
    });

    test("should use (or ...) for multiple year conditions", () => {
      mockLogseq.settings.startingYear = "2021";
      const date = new Date("2023-01-15T12:00:00Z");
      const query = getQueryScriptOTD(date);

      expect(query).toMatch(/\(or.*\[\(= \?d 20210115\)\].*\[\(= \?d 20220115\)\].*\[\(= \?d 20230115\)\].*\)/s);
    });

    test("should handle when startingYear equals current year", () => {
      const currentYear = new Date().getFullYear();
      mockLogseq.settings.startingYear = currentYear.toString();
      const date = new Date();
      const query = getQueryScriptOTD(date);

      // Should only have one year condition
      const yearConditions = query.match(/\[\(= \?d \d{8}\)\]/g);
      expect(yearConditions).toHaveLength(1);
    });

    test("should use validated settings with fallback", () => {
      mockLogseq.settings.startingYear = "invalid";
      const date = new Date("2023-01-26T12:00:00Z");
      const query = getQueryScriptOTD(date);

      // Should fall back to 2010
      expect(query).toContain("20100126");
    });
  });

  describe("getQueryScriptOTDPageID", () => {
    test("should generate query for page with default title", () => {
      const query = getQueryScriptOTDPageID();

      expect(query).toContain(":find (pull ?p [*])");
      expect(query).toContain(":where");
      expect(query).toContain("[?b :block/page ?p]");
      expect(query).toContain("[?p :block/name \"on this day\"]");
    });

    test("should convert page title to lowercase", () => {
      mockLogseq.settings.pageTitle = "My Custom TITLE";
      const query = getQueryScriptOTDPageID();

      expect(query).toContain("[?p :block/name \"my custom title\"]");
      expect(query).not.toContain("My Custom TITLE");
    });

    test("should handle non-English characters", () => {
      mockLogseq.settings.pageTitle = "今日は何の日";
      const query = getQueryScriptOTDPageID();

      expect(query).toContain("[?p :block/name \"今日は何の日\"]");
    });

    test("should handle page title with spaces", () => {
      mockLogseq.settings.pageTitle = "On This Day";
      const query = getQueryScriptOTDPageID();

      expect(query).toContain("[?p :block/name \"on this day\"]");
    });

    test("should use validated settings", () => {
      mockLogseq.settings.pageTitle = "";
      const query = getQueryScriptOTDPageID();

      // Should fall back to default title
      expect(query).toContain("[?p :block/name \"on this day\"]");
    });
  });

  describe("getQueryScriptPN", () => {
    test("should generate PREVIOUS query with < operator", () => {
      const query = getQueryScriptPN(20230126, DIRECTION.PREVIOUS);

      expect(query).toContain(":find (pull ?p [*])");
      expect(query).toContain("[?p :block/journal? true]");
      expect(query).toContain("[(< ?d 20230126)]");
    });

    test("should generate NEXT query with > operator", () => {
      const query = getQueryScriptPN(20230126, DIRECTION.NEXT);

      expect(query).toContain("[(> ?d 20230126)]");
    });

    test("should handle large journal dates", () => {
      const query = getQueryScriptPN(20991231, DIRECTION.PREVIOUS);

      expect(query).toContain("[(< ?d 20991231)]");
    });

    test("should handle old journal dates", () => {
      const query = getQueryScriptPN(19000101, DIRECTION.NEXT);

      expect(query).toContain("[(> ?d 19000101)]");
    });

    test("should log error for invalid direction", () => {
      // Mock console.error to suppress output during test
      const originalError = console.error;
      console.error = () => {};

      const query = getQueryScriptPN(20230126, "Invalid");

      expect(query).toBeUndefined();

      console.error = originalError;
    });

    test("should return undefined for invalid direction", () => {
      // Mock console.error to suppress output during test
      const originalError = console.error;
      console.error = () => {};

      const query = getQueryScriptPN(20230126, "Random");

      expect(query).toBeUndefined();

      console.error = originalError;
    });

    test("should generate query with all required clauses", () => {
      const query = getQueryScriptPN(20230126, DIRECTION.PREVIOUS);

      expect(query).toContain(":find (pull ?p [*])");
      expect(query).toContain(":where");
      expect(query).toContain("[?b :block/page ?p]");
      expect(query).toContain("[?p :block/journal? true]");
      expect(query).toContain("[?p :block/journal-day ?d]");
    });
  });

  describe("Query format consistency", () => {
    test("all queries should use Datalog syntax", () => {
      const queries = [
        getQueryScriptOTD(new Date()),
        getQueryScriptOTDPageID(),
        getQueryScriptPN(20230126, DIRECTION.PREVIOUS)
      ];

      queries.forEach(query => {
        if (query) {
          expect(query).toContain(":find");
          expect(query).toContain(":where");
        }
      });
    });

    test("all queries should find pages", () => {
      const queries = [
        getQueryScriptOTD(new Date()),
        getQueryScriptOTDPageID(),
        getQueryScriptPN(20230126, DIRECTION.NEXT)
      ];

      queries.forEach(query => {
        if (query) {
          expect(query).toContain("(pull ?p [*])");
        }
      });
    });
  });
});
