import { describe, it, expect } from "vitest";
import {
  toBoliviaDate,
  formatDateTimeBolivia,
  formatTimeBolivia,
  dateRangeFrom,
  dateRangeTo,
} from "./timezone";

describe("toBoliviaDate", () => {
  it("shifts a UTC date 4 hours back", () => {
    const utc = new Date("2026-06-10T12:00:00Z");
    expect(toBoliviaDate(utc).toISOString()).toBe("2026-06-10T08:00:00.000Z");
  });
});

describe("formatDateTimeBolivia", () => {
  it("formats a UTC ISO string as DD/MM/YYYY HH:mm in Bolivia time", () => {
    expect(formatDateTimeBolivia("2026-06-10T12:00:00Z")).toBe("10/06/2026 08:00");
  });

  it("crosses to the previous day when UTC is past midnight", () => {
    // 02:30 UTC = 22:30 of the previous day in Bolivia
    expect(formatDateTimeBolivia("2026-06-11T02:30:00Z")).toBe("10/06/2026 22:30");
  });
});

describe("formatTimeBolivia", () => {
  it("formats afternoon times with PM", () => {
    // 16:30 UTC = 12:30 PM Bolivia
    expect(formatTimeBolivia("2026-06-10T16:30:00Z")).toBe("12:30 PM");
  });

  it("formats morning times with AM", () => {
    // 13:05 UTC = 9:05 AM Bolivia
    expect(formatTimeBolivia("2026-06-10T13:05:00Z")).toBe("9:05 AM");
  });

  it("formats midnight as 12 AM", () => {
    // 04:00 UTC = 00:00 Bolivia
    expect(formatTimeBolivia("2026-06-10T04:00:00Z")).toBe("12:00 AM");
  });
});

describe("date ranges for queries", () => {
  it("builds start of day with Bolivia offset", () => {
    expect(dateRangeFrom("2026-06-10")).toBe("2026-06-10T00:00:00-04:00");
  });

  it("builds end of day with Bolivia offset", () => {
    expect(dateRangeTo("2026-06-10")).toBe("2026-06-10T23:59:59-04:00");
  });
});
