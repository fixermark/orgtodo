/*
 * Copyright 2026 Mark T. Tomczak
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

export const DATETIME_PATTERN =
  /((\d{4})-(\d{2})-(\d{2})) (Mon|Tue|Wed|Thu|Fri|Sat|Sun)( ((\d{2}):(\d{2})))?/;

export enum DatetimeFields {
  DATE = 1,
  YEAR = 2,
  MONTH = 3,
  DAY = 4,
  DOW = 5,
  SPACED_TIME = 6,
  TIME = 7,
  HOUR = 8,
  MINUTE = 9,
}

/** Softer pattern that is intended to be human-input and can be coerced into a formal Org date */
export const DATE_ONLY_PATTERN = /((\d+)-(\d+)-(\d+))/;

const DAY_OF_WEEK_ORG_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse a year-month-day string into a JavaScript date. */
export function ymdToJsDate(dateStr: string): Date {
  // Expects dateStr in "YYYY-MM-DD" format
  const [year, month, day] = dateStr.split("-").map(Number);
  // Note: JavaScript months are 0-based (0 = January)
  return new Date(year, month - 1, day);
}

/** Returns true if the date parses. */
export function isValidDate(dateStr: string): boolean {
  return DATETIME_PATTERN.test(dateStr) || DATE_ONLY_PATTERN.test(dateStr);
}

/** Convert an Org datetime string into a JavaScript datetime. Return undefined if not a valid datetime. */
export function orgDatetimeToJs(orgDt: string): Date | undefined {
  if (!DATETIME_PATTERN.test(orgDt)) {
    if (!DATE_ONLY_PATTERN.test(orgDt)) {
      return undefined;
    }
    return ymdToJsDate(orgDt);
  }
  const result = DATETIME_PATTERN.exec(orgDt);

  if (!result) {
    return undefined;
  }

  const year = parseInt(result[DatetimeFields.YEAR]);
  const month = parseInt(result[DatetimeFields.MONTH]);
  const day = parseInt(result[DatetimeFields.DAY]);

  let hour = 0;
  let minute = 0;

  if (result[DatetimeFields.HOUR] !== undefined) {
    hour = parseInt(result[DatetimeFields.HOUR]);
    minute = parseInt(result[DatetimeFields.MINUTE]);
  }

  return new Date(year, month - 1, day, hour, minute);
}

/** Convert a Date object to an org datetime. */
export function jsDatetimeToOrg(jsDt: Date): string {
  const dateString =
    `${jsDt.getFullYear()}-${(jsDt.getMonth() + 1).toString().padStart(2, "0")}-` +
    `${jsDt.getDate().toString().padStart(2, "0")} ${DAY_OF_WEEK_ORG_NAMES[jsDt.getDay()]}`;

  if (!jsDt.getHours() && !jsDt.getMinutes()) {
    return dateString;
  }

  return (
    dateString +
    ` ${jsDt.getHours().toString().padStart(2, "0")}:${jsDt.getMinutes().toString().padStart(2, "0")}`
  );
}
