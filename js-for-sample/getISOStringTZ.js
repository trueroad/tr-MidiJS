/**
 * Get ISO 8601 string with timezone.
 * @module getISOStringTZ
 * @author Masamichi Hosoda <trueroad@trueroad.jp>
 * @copyright (C) Masamichi Hosoda 2023
 * @license BSD-2-Clause
 * @see {@link https://github.com/trueroad/tr-MidiJS}
 */

/**
 * Get date and time elements.
 * @private
 * @param {Date} date - Date object.
 * @return {string[]} Date and time elements.
 */
function getDateTimeElements(date) {
  const fullYear = (date.getFullYear()).toString();
  let year;
  if (fullYear < -9999) {
    // ..., -1000000,..., -100000,..., -10000
    year = fullYear.toString();
  } else if (fullYear < 0) {
    // -9999,..., -999,..., -99,..., -9,..., -1
    year = "-" + Math.abs(fullYear).toString().padStart(5, "0");
  } else if (fullYear < 10000) {
    // 0,..., 9,..., 99,..., 999,..., 9999
    year = fullYear.toString().padStart(4, "0");
  } else {
    // 10000,..., 100000,..., 1000000,...
    year = "+" + fullYear.toString();
  }

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = (date.getDate()).toString().padStart(2, "0");
  const hour = (date.getHours()).toString().padStart(2, "0");
  const minute = (date.getMinutes()).toString().padStart(2, "0");
  const second = (date.getSeconds()).toString().padStart(2, "0");
  const millisecond = (date.getMilliseconds()).toString().padStart(3, "0");

  const tzOffset = -date.getTimezoneOffset();
  const tzSign = tzOffset >= 0 ? '+' : '-';
  const tzHour =
        Math.floor(Math.abs(tzOffset) / 60).toString().padStart(2, "0");
  const tzMinute = (Math.abs(tzOffset) % 60).toString().padStart(2, "0");

  return [year, month, day, hour, minute, second, millisecond,
          tzSign, tzHour, tzMinute];
}

/**
 * Get ISO 8601 extra string with timezone.
 * @param {Date} date - Date object.
 * @return {string} String like 2023-04-01T00:00:00.000+09:00.
 */
export function getISOStringTZ(date) {
  let year, month, day, hour, minute, second, millisecond,
      tzSign, tzHour, tzMinute;
  [year, month, day, hour, minute, second, millisecond,
   tzSign, tzHour, tzMinute] = getDateTimeElements(date);

  return year + "-" + month + "-" + day + "T" +
    hour + ":" + minute + ":" + second + "." + millisecond +
    tzSign + tzHour + ":" + tzMinute;
}

/**
 * Get ISO 8601 basic string with timezone.
 * @param {Date} date - Date object.
 * @return {string} String like 20230401T000000.000+0900.
 */
export function getISOStringBasicTZ(date) {
  let year, month, day, hour, minute, second, millisecond,
      tzSign, tzHour, tzMinute;
  [year, month, day, hour, minute, second, millisecond,
   tzSign, tzHour, tzMinute] = getDateTimeElements(date);

  return year + month + day + "T" +
    hour + minute + second + "." + millisecond +
    tzSign + tzHour + tzMinute;
}

/**
 * Get ISO 8601 extra string with timezone.
 * @param {Date} date - Date object.
 * @return {string} String like 2023-04-01T00:00:00+09:00.
 */
export function getISOStringSecondTZ(date) {
  let year, month, day, hour, minute, second,
      tzSign, tzHour, tzMinute;
  [year, month, day, hour, minute, second,,
   tzSign, tzHour, tzMinute] = getDateTimeElements(date);

  return year + "-" + month + "-" + day + "T" +
    hour + ":" + minute + ":" + second +
    tzSign + tzHour + ":" + tzMinute;
}

/**
 * Get ISO 8601 basic string with timezone.
 * @param {Date} date - Date object.
 * @return {string} String like 20230401T000000+0900.
 */
export function getISOStringSecondBasicTZ(date) {
  let year, month, day, hour, minute, second,
      tzSign, tzHour, tzMinute;
  [year, month, day, hour, minute, second,,
   tzSign, tzHour, tzMinute] = getDateTimeElements(date);

  return year + month + day + "T" +
    hour + minute + second +
    tzSign + tzHour + tzMinute;
}
