/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

import {
  DEADLINE_PATTERN,
  checkboxStatus,
  makeListItem,
  setCheckboxStatus,
} from "./Parser";

describe("deadline regex", () => {
  it("parses a deadline pattern", () => {
    expect(DEADLINE_PATTERN.test("DEADLINE: <2025-03-07 Wed>")).toBe(true);
    expect(DEADLINE_PATTERN.test("DEADLINE: <2025-03-07 Wed 09:05>")).toBe(
      true,
    );
  });
});

describe("makeListItem", () => {
  it("makes a non-list-item row into a list item row", () => {
    expect(makeListItem("Hello!")).toBe("- Hello!");
    expect(makeListItem("    Hello - how are you?")).toBe(
      "    - Hello - how are you?",
    );
  });
});

describe("checkboxStatus", () => {
  it("identifies patterns correctly", () => {
    expect(checkboxStatus("- [X] get milk")).toBe("checked");
    expect(checkboxStatus("  - [ ] with prefix whitespace")).toBe("unchecked");
    expect(checkboxStatus("Regular line")).toBe("none");
    expect(checkboxStatus("- Regular line")).toBe("none");
    expect(
      checkboxStatus("[X] Not actually a checkbox because not a list element"),
    ).toBe("none");
    expect(
      checkboxStatus("- [-] Does not really support partial checkboxes"),
    ).toBe("unchecked");
  });
  it("identifies interesting list item prefixes", () => {
    expect(checkboxStatus(" + [X] hi")).toBe("checked");
    expect(checkboxStatus("   13. [X] hi")).toBe("checked");
    expect(checkboxStatus("9) [X] hi")).toBe("checked");
    expect(checkboxStatus("  * [X] hi")).toBe("checked");
  });
});

describe("setCheckboxStatus", () => {
  it("sets regular checkboxes correctly", () => {
    expect(setCheckboxStatus("- Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- [ ] Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- [X] Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- Hello!", "unchecked")).toBe("- [ ] Hello!");
    expect(setCheckboxStatus("- Hello!", "checked")).toBe("- [X] Hello!");
    expect(setCheckboxStatus("- [ ] Hello!", "none")).toBe("- Hello!");
    expect(setCheckboxStatus("- [ ] Hello!", "unchecked")).toBe("- [ ] Hello!");
    expect(setCheckboxStatus("- [X] Hello!", "unchecked")).toBe("- [ ] Hello!");
    expect(setCheckboxStatus("     1) [X] Hello!", "none")).toBe(
      "     1) Hello!",
    );
    expect(setCheckboxStatus("     20. Hello!", "checked")).toBe(
      "     20. [X] Hello!",
    );
    expect(setCheckboxStatus("     20. [X] Hello!", "unchecked")).toBe(
      "     20. [ ] Hello!",
    );
  });
  it('leaves a non-list line alone when setting it to "none"', () => {
    expect(setCheckboxStatus("Not a list item", "none")).toBe(
      "Not a list item",
    );
  });
  it('makes a non-list line into a list line when setting to "unchecked" or "checked"', () => {
    expect(setCheckboxStatus("Not a list item", "unchecked")).toBe(
      "- [ ] Not a list item",
    );
    expect(setCheckboxStatus("Not a list item", "checked")).toBe(
      "- [X] Not a list item",
    );
    expect(setCheckboxStatus("   Not a list item", "checked")).toBe(
      "   - [X] Not a list item",
    );
  });
});
