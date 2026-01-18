/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {
  DATETIME_PATTERN,
  DatetimeFields,
  jsDatetimeToOrg,
  orgDatetimeToJs,
} from "./Date";

describe("datetime regex", () => {
  it("parses a date", () => {
    const result = DATETIME_PATTERN.exec("2020-01-01 Wed");
    expect(result![DatetimeFields.YEAR]).toBe("2020");
    expect(result![DatetimeFields.MONTH]).toBe("01");
    expect(result![DatetimeFields.DAY]).toBe("01");
    expect(result![DatetimeFields.TIME]).toBe(undefined);
  });

  it("parses a date and time", () => {
    const result = DATETIME_PATTERN.exec("2020-01-01 Wed 12:34");
    expect(result![DatetimeFields.YEAR]).toBe("2020");
    expect(result![DatetimeFields.MONTH]).toBe("01");
    expect(result![DatetimeFields.DAY]).toBe("01");
    expect(result![DatetimeFields.TIME]).toBe("12:34");
    expect(result![DatetimeFields.HOUR]).toBe("12");
    expect(result![DatetimeFields.MINUTE]).toBe("34");
  });
});

describe("orgDatetimeToJs", () => {
  it("converts a datetime into a Date object", () => {
    expect(orgDatetimeToJs("2020-01-01 Wed")).toEqual(new Date(2020, 0, 1));
    expect(orgDatetimeToJs("2020-12-25 Wed 12:34")).toEqual(
      new Date(2020, 11, 25, 12, 34),
    );
  });
});

describe("jsDatetimeToOrg", () => {
  it("converts a Date object into a datetime string", () => {
    expect(jsDatetimeToOrg(new Date(2021, 1, 3))).toEqual("2021-02-03 Wed");
    expect(jsDatetimeToOrg(new Date(2023, 3, 3, 13, 5))).toEqual(
      "2023-04-03 Mon 13:05",
    );
  });
});
