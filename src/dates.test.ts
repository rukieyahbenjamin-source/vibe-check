import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isDateKey, localDateKey } from "./dates";

describe("local calendar dates", () => {
  it("uses the local calendar day, including late in the evening", () => {
    expect(localDateKey(new Date(2026, 4, 9, 23, 59))).toBe("2026-05-09");
    expect(localDateKey(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(localDateKey(new Date(2026, 2, 4, 12))).toBe("2026-03-04");
  });

  it("accepts real calendar dates and rejects impossible ones", () => {
    expect(isDateKey("2026-05-09")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2027-02-29")).toBe(false);
    expect(isDateKey("2026-04-31")).toBe(false);
    expect(isDateKey("2026-5-9")).toBe(false);
    expect(isDateKey(20260509)).toBe(false);
  });
});

describe("adding days", () => {
  it("rolls over a month-end", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-04-30", 1)).toBe("2026-05-01");
  });

  it("rolls over a year-end", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("handles leap days in leap and non-leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("counts whole days between two dates across month and year boundaries", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2026-05-09", "2026-05-09")).toBe(0);
  });

  it("refuses something that is not a date key", () => {
    expect(() => addDays("not-a-date", 1)).toThrow();
  });
});
