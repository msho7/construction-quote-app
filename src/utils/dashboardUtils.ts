import { toDateInputValue } from "./appUtils";
import { getProfileAddressDisplay } from "./profileUtils";

export const getQuoteLocation = (quote: any = {}) =>
  quote.projectAddress ||
  getProfileAddressDisplay(quote.customerProfile) ||
  "No location saved";

export const getQuoteScheduleStatus = (quote: any = {}, todayDate = "") => {
  const scheduleItems = quote.schedule || [];

  if (scheduleItems.some((task) => task.completionStatus === "delayed")) {
    return "delayed";
  }

  if (scheduleItems.some((task) => !task.completed && toDateInputValue(task.endDate) && toDateInputValue(task.endDate) < todayDate)) {
    return "delayed";
  }

  return "on-time";
};

export const getDashboardRecords = (savedQuotes = [], todayDate = "") => {
  const openQuoteRecords = savedQuotes.filter((quote) => (quote.status || "open") === "open");
  const ongoingJobRecords = savedQuotes.filter((quote) => {
    const status = quote.status || "open";
    const start = toDateInputValue(quote.startDate);

    return (
      ["approved", "ongoing"].includes(status) &&
      start &&
      start <= todayDate
    );
  });
  const onTimeJobRecords = ongoingJobRecords.filter((quote) => getQuoteScheduleStatus(quote, todayDate) === "on-time");
  const delayedJobRecords = ongoingJobRecords.filter((quote) => getQuoteScheduleStatus(quote, todayDate) === "delayed");
  const dashboardDetailConfig = {
    ongoing: {
      title: "Ongoing Jobs",
      empty: "No ongoing jobs found.",
      records: ongoingJobRecords
    },
    onTime: {
      title: "On-Time Jobs",
      empty: "No on-time jobs found.",
      records: onTimeJobRecords
    },
    delayed: {
      title: "Delayed Jobs",
      empty: "No delayed jobs found.",
      records: delayedJobRecords
    },
    openQuotes: {
      title: "Open Quotes Not Approved",
      empty: "No open quotes waiting for approval.",
      records: openQuoteRecords
    }
  };

  return {
    openQuoteRecords,
    ongoingJobRecords,
    onTimeJobRecords,
    delayedJobRecords,
    dashboardDetailConfig
  };
};
