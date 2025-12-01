/**
 * Date utility functions for the On This Day plugin
 */

/**
 * Gets today's date as a dictionary object
 * @returns {{year: number, month: number, day: number}} Today's date components
 * @example
 * const today = getTodayDict();
 * // { year: 2023, month: 1, day: 26 }
 */
export function getTodayDict() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return { year: year, month: month, day: day };
}

/**
 * Returns the previous day from the given date
 * @param {Date} date - The reference date
 * @returns {Date} A new Date object representing the previous day
 * @example
 * const yesterday = previousDay(new Date('2023-01-26'));
 * // Returns Date for January 25, 2023
 */
export function previousDay(date) {
  const previous = new Date(date.getTime());
  previous.setDate(date.getDate() - 1);
  return previous;
}

/**
 * Returns the next day from the given date
 * @param {Date} date - The reference date
 * @returns {Date} A new Date object representing the next day
 * @example
 * const tomorrow = nextDay(new Date('2023-01-26'));
 * // Returns Date for January 27, 2023
 */
export function nextDay(date) {
  const next = new Date(date.getTime());
  next.setDate(date.getDate() + 1);
  return next;
}
