import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const MAX_DAYS = 31;
export const DATE_FORMAT = "YYYY-MM-DD";
export const DISPLAY_FORMAT = "MMM D, YYYY";
export const DISPLAY_FORMAT_TIME = "MMM D, YYYY HH:mm";

/**
 * Returns the default date range — last 7 days.
 */
export const getDefaultDateRange = () => {
  const end = dayjs().format(DATE_FORMAT);
  const start = dayjs().subtract(7, "day").format(DATE_FORMAT);
  return { start, end };
};

/**
 * Returns the earliest allowed start date — 31 days ago.
 */
export const getEarliestAllowedDate = () => {
  return dayjs().subtract(MAX_DAYS, "day").format(DATE_FORMAT);
};

/**
 * Returns today's date as the max allowed end date.
 */
export const getTodayDate = () => {
  return dayjs().format(DATE_FORMAT);
};

/**
 * Validates a date range against API constraints.
 * Returns null if valid, or an error string if invalid.
 */
export const validateDateRange = (start, end) => {
  if (!start || !end) {
    return "Please select both a start and end date.";
  }

  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const earliest = dayjs().subtract(MAX_DAYS, "day");

  if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
    return "End date must be after start date.";
  }

  if (endDate.diff(startDate, "day") > MAX_DAYS) {
    return `Date range cannot exceed ${MAX_DAYS} days.`;
  }

  if (startDate.isBefore(earliest)) {
    return `Data is only available for the last ${MAX_DAYS} days.`;
  }

  return null;
};

/**
 * Format ISO timestamp for display in table.
 */
export const formatDateTime = (isoString) => {
  return dayjs(isoString).format(DISPLAY_FORMAT_TIME);
};

/**
 * Format ISO timestamp for chart x-axis — shorter label.
 */
export const formatChartDate = (isoString) => {
  return dayjs(isoString).format("MMM D HH:mm");
};
