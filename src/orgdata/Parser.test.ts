/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {
  DATETIME_PATTERN,
  DEADLINE_PATTERN,
  DatetimeFields,
  checkboxStatus,
  makeListItem,
  setCheckboxStatus,
  orgDatetimeToJs,
  jsDatetimeToOrg,
} from "./Parser";

describe('datetime regex', () => {
  it('parses a date', () => {
    const result = DATETIME_PATTERN.exec("2020-01-01 Wed");
    expect(result![DatetimeFields.YEAR]).toBe("2020");
    expect(result![DatetimeFields.MONTH]).toBe("01");
    expect(result![DatetimeFields.DAY]).toBe("01");
    expect(result![DatetimeFields.TIME]).toBe(undefined);
  });

  it('parses a date and time', () => {
    const result = DATETIME_PATTERN.exec("2020-01-01 Wed 12:34");
    expect(result![DatetimeFields.YEAR]).toBe("2020");
    expect(result![DatetimeFields.MONTH]).toBe("01");
    expect(result![DatetimeFields.DAY]).toBe("01");
    expect(result![DatetimeFields.TIME]).toBe("12:34");
    expect(result![DatetimeFields.HOUR]).toBe("12");
    expect(result![DatetimeFields.MINUTE]).toBe("34");
  });
});

describe('deadline regex', () => {
  it('parses a deadline pattern', () => {
    expect(DEADLINE_PATTERN.test("DEADLINE: <2025-03-07 Wed>")).toBe(true);
    expect(DEADLINE_PATTERN.test("DEADLINE: <2025-03-07 Wed 09:05>")).toBe(true);
  });
});

describe('makeListItem', () => {
  it('makes a non-list-item row into a list item row', () => {
    expect(makeListItem("Hello!")).toBe("- Hello!");
    expect(makeListItem("    Hello - how are you?")).toBe("    - Hello - how are you?");
  });
});

describe('checkboxStatus', () => {
  it('identifies patterns correctly', () => {
    expect(checkboxStatus("- [X] get milk")).toBe("checked");
    expect(checkboxStatus("  - [ ] with prefix whitespace")).toBe("unchecked");
    expect(checkboxStatus("Regular line")).toBe("none");
    expect(checkboxStatus("- Regular line")).toBe("none");
    expect(checkboxStatus("[X] Not actually a checkbox because not a list element")).toBe("none");
    expect(checkboxStatus("- [-] Does not really support partial checkboxes")).toBe("unchecked");
  });
  it('identifies interesting list item prefixes', () => {
    expect(checkboxStatus(" + [X] hi")).toBe("checked");
    expect(checkboxStatus("   13. [X] hi")).toBe("checked");
    expect(checkboxStatus("9) [X] hi")).toBe("checked");
    expect(checkboxStatus("  * [X] hi")).toBe("checked");
  });
});

describe('setCheckboxStatus', () => {
  it('sets regular checkboxes correctly', () => {
    expect(setCheckboxStatus("- Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- [ ] Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- [X] Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- Hello!", "unchecked")).toBe("- [ ] Hello!");
    expect(setCheckboxStatus("- Hello!", "checked")).toBe("- [X] Hello!");
    expect(setCheckboxStatus("- [ ] Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- [ ] Hello!", "unchecked")).toBe("- [ ] Hello!");
    expect(setCheckboxStatus("- [X] Hello!", "unchecked")).toBe("- [ ] Hello!");
    expect(setCheckboxStatus("     1) [X] Hello!", "none")).toBe("     1) Hello!");
    expect(setCheckboxStatus("     20. Hello!", "checked")).toBe("     20. [X] Hello!");
    expect(setCheckboxStatus("     20. [X] Hello!", "unchecked")).toBe("     20. [ ] Hello!");


  });
  it('leaves a non-list line alone when setting it to "none"', () => {
    expect(setCheckboxStatus("Not a list item", "none")).toBe("Not a list item");
  });
  it('makes a non-list line into a list line when setting to "unchecked" or "checked"', () => {
    expect(setCheckboxStatus("Not a list item", "unchecked")).toBe("- [ ] Not a list item");
    expect(setCheckboxStatus("Not a list item", "checked")).toBe("- [X] Not a list item");
    expect(setCheckboxStatus("   Not a list item", "checked")).toBe("   - [X] Not a list item");
  });
});

describe('orgDatetimeToJs', () => {
  it('converts a datetime into a Date object', () => {
    expect(orgDatetimeToJs("2020-01-01 Wed")).toEqual(new Date(2020,0,1));
    expect(orgDatetimeToJs("2020-12-25 Wed 12:34")).toEqual(new Date(2020,11,25,12,34));
  });
});

describe('jsDatetimeToOrg', () => {
  it('converts a Date object into a datetime string', () => {
    expect(jsDatetimeToOrg(new Date(2021,1,3))).toEqual("2021-02-03 Wed");
    expect(jsDatetimeToOrg(new Date(2023,3,3,13,5))).toEqual("2023-04-03 Mon 13:05");
  });
});
