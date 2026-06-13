import { DEFAULT_ITEM_MARKUP_RATE } from "../constants/appConstants";
import { getNextBusinessDate, getScheduleEndDate, toDateInputValue } from "./appUtils";
import { getTodayDate } from "./dateUtils";
import { getContractorDisplayName } from "./profileUtils";

export const TASK_TRADE_MATCHERS = [
  { trade: "Demolition", keywords: ["demo", "demolition", "remove", "tear out", "tearout"] },
  { trade: "Electrical", keywords: ["electrical", "electric", "wire", "wiring", "outlet", "light", "lighting", "panel"] },
  { trade: "Plumbing", keywords: ["plumbing", "plumber", "pipe", "drain", "water", "toilet", "sink", "faucet", "shower", "tub"] },
  { trade: "HVAC", keywords: ["hvac", "duct", "vent", "furnace", "air conditioning", "ac"] },
  { trade: "Framing", keywords: ["framing", "frame", "stud", "structure"] },
  { trade: "Drywall", keywords: ["drywall", "board", "tape", "mud", "compound"] },
  { trade: "Painting", keywords: ["paint", "painting", "primer", "prime"] },
  { trade: "Flooring", keywords: ["floor", "flooring", "tile", "vinyl", "hardwood", "laminate"] },
  { trade: "Carpentry", keywords: ["carpentry", "carpenter", "trim", "baseboard", "door", "cabinet", "millwork"] },
  { trade: "Masonry", keywords: ["masonry", "brick", "block", "concrete", "cement"] },
  { trade: "Roofing", keywords: ["roof", "roofing", "shingle"] },
  { trade: "Delivery", keywords: ["delivery", "deliver", "pickup", "dump", "bin"] },
  { trade: "General Labour", keywords: ["labour", "labor", "clean", "cleanup", "prep", "general"] }
];
export const getTaskSearchText = (task: any = {}) =>
  [task.name, task.category, task.roomName, task.unit].map((value) => String(value || "").toLowerCase()).join(" ");
export const getScheduleContractorPreferenceKey = (task: any = {}) =>
  [
    task.name,
    task.category,
    task.roomName,
    task.unit
  ].map((value) => String(value || "").trim().toLowerCase()).join("|");
export const getSuggestedTradeForTask = (task: any = {}) => {
  const taskText = getTaskSearchText(task);
  const match = TASK_TRADE_MATCHERS.find(({ keywords }) =>
    keywords.some((keyword) => taskText.includes(keyword))
  );

  return match?.trade || String(task.category || "").trim() || "";
};
export const getContractorTradeList = (contractor: any = {}) =>
  String(contractor.trade || "")
    .split(/[,/|&]+|\band\b/i)
    .map((trade) => trade.trim())
    .filter(Boolean);
export const getContractorTradeSearchText = (contractor: any = {}) =>
  [
    ...getContractorTradeList(contractor),
    contractor.companyName,
    contractor.contactName
  ].map((value) => String(value || "").toLowerCase()).join(" ");
export const canContractorDoTrade = (contractor: any = {}, suggestedTrade = "") => {
  const suggestedTradeText = String(suggestedTrade || "").toLowerCase();
  if (!suggestedTradeText || contractor.status === "inactive") return false;

  const contractorText = getContractorTradeSearchText(contractor);
  return Boolean(
    contractorText.includes(suggestedTradeText) ||
    TASK_TRADE_MATCHERS.some(({ trade, keywords }) =>
      trade.toLowerCase() === suggestedTradeText &&
      keywords.some((keyword) => contractorText.includes(keyword))
    )
  );
};
export const getTaskAssignmentRange = (task: any = {}) => {
  const startDate = toDateInputValue(task.startDate);
  if (!startDate) return null;

  const endDate = toDateInputValue(task.endDate) || getScheduleEndDate(startDate, Number(task.duration || 1));
  return {
    startDate,
    endDate: endDate || startDate
  };
};
export const doTaskDateRangesOverlap = (firstRange, secondRange) => {
  if (!firstRange || !secondRange) return false;
  return firstRange.startDate <= secondRange.endDate && secondRange.startDate <= firstRange.endDate;
};
export const getContractorHasDateConflict = (contractorId, taskRange, contractorBookings) => {
  if (!contractorId || !taskRange) return false;

  return (contractorBookings.get(contractorId) || []).some((bookedRange) =>
    doTaskDateRangesOverlap(taskRange, bookedRange)
  );
};
export const addContractorBooking = (contractorId, taskRange, contractorBookings) => {
  if (!contractorId || !taskRange) return;

  contractorBookings.set(contractorId, [
    ...(contractorBookings.get(contractorId) || []),
    taskRange
  ]);
};
export const assignContractorsToSchedule = (scheduleItems = [], contractors: any[] = [], contractorPreferences: Record<string, string> = {}) => {
  const activeContractors = contractors.filter((contractor) => contractor.status !== "inactive");
  const assignmentCounts = new Map();
  const contractorBookings = new Map();

  return normalizeScheduleItems(scheduleItems).map((task) => {
    const suggestedTrade = getSuggestedTradeForTask(task);
    const taskRange = getTaskAssignmentRange(task);
    const preferredContractorId = contractorPreferences[getScheduleContractorPreferenceKey(task)] || "";
    const preferredContractor = activeContractors.find((contractor) => contractor.id && contractor.id === preferredContractorId);
    const existingAssignedContractor = activeContractors.find((contractor) => contractor.id && contractor.id === task.assignedContractorId);
    const matchingContractors = activeContractors.filter((contractor) => canContractorDoTrade(contractor, suggestedTrade));
    const getSortedContractors = (contractorOptions: any[] = []) =>
      contractorOptions
        .slice()
        .sort((contractorA, contractorB) => {
          const contractorAAssignments = assignmentCounts.get(contractorA.id) || 0;
          const contractorBAssignments = assignmentCounts.get(contractorB.id) || 0;
          if (contractorAAssignments !== contractorBAssignments) {
            return contractorBAssignments - contractorAAssignments;
          }

          return getContractorDisplayName(contractorA).localeCompare(getContractorDisplayName(contractorB));
        });

    if (
      existingAssignedContractor &&
      !getContractorHasDateConflict(existingAssignedContractor.id, taskRange, contractorBookings)
    ) {
      assignmentCounts.set(
        existingAssignedContractor.id,
        (assignmentCounts.get(existingAssignedContractor.id) || 0) + 1
      );
      addContractorBooking(existingAssignedContractor.id, taskRange, contractorBookings);

      return {
        ...task,
        suggestedTrade,
        assignedContractorId: existingAssignedContractor.id || "",
        assignedContractorName: getContractorDisplayName(existingAssignedContractor),
        assignedContractorTrade: existingAssignedContractor.trade || suggestedTrade
      };
    }

    if (
      preferredContractor &&
      !getContractorHasDateConflict(preferredContractor.id, taskRange, contractorBookings)
    ) {
      assignmentCounts.set(
        preferredContractor.id,
        (assignmentCounts.get(preferredContractor.id) || 0) + 1
      );
      addContractorBooking(preferredContractor.id, taskRange, contractorBookings);

      return {
        ...task,
        suggestedTrade,
        assignedContractorId: preferredContractor.id || "",
        assignedContractorName: getContractorDisplayName(preferredContractor),
        assignedContractorTrade: preferredContractor.trade || suggestedTrade
      };
    }

    const availableMatchingContractors = matchingContractors.filter(
      (contractor) => !getContractorHasDateConflict(contractor.id, taskRange, contractorBookings)
    );
    const assignedContractor =
      getSortedContractors(availableMatchingContractors)[0] ||
      existingAssignedContractor ||
      getSortedContractors(matchingContractors)[0];

    if (assignedContractor?.id) {
      assignmentCounts.set(assignedContractor.id, (assignmentCounts.get(assignedContractor.id) || 0) + 1);
      addContractorBooking(assignedContractor.id, taskRange, contractorBookings);
    }

    return {
      ...task,
      suggestedTrade,
      assignedContractorId: assignedContractor?.id || "",
      assignedContractorName: assignedContractor ? getContractorDisplayName(assignedContractor) : "",
      assignedContractorTrade: assignedContractor?.trade || suggestedTrade
    };
  });
};
export const getScheduleTaskWithContractor = (task: any = {}, contractor: any = null) => {
  const suggestedTrade = task.suggestedTrade || getSuggestedTradeForTask(task);

  if (!contractor) {
    return {
      ...task,
      suggestedTrade,
      assignedContractorId: "",
      assignedContractorName: "",
      assignedContractorTrade: suggestedTrade
    };
  }

  return {
    ...task,
    suggestedTrade,
    assignedContractorId: contractor.id || "",
    assignedContractorName: getContractorDisplayName(contractor),
    assignedContractorTrade: contractor.trade || suggestedTrade
  };
};

export const buildScheduleFromItems = (quoteItems: any[] = [], scheduleStartDate = "") => {
  const normalizedStartDate = getNextBusinessDate(scheduleStartDate);
  if (!normalizedStartDate) return [];

  let currentStartDate = normalizedStartDate;

  return quoteItems
    .filter((item) => item.name.trim())
    .map((item) => {
      const duration = Math.max(1, Number(item.duration || 1));
      const startDate = currentStartDate;
      const endDate = getScheduleEndDate(startDate, duration);
      currentStartDate = endDate;

      return {
        ...item,
        duration,
        startDate,
        endDate
      };
    });
};

export const normalizeScheduleItems = (scheduleItems: any[] = []) =>
  scheduleItems.map((item) => {
    const duration = Math.max(1, Number(item.duration || 1));
    const startDate = getNextBusinessDate(item.startDate);
    const endDate = getScheduleEndDate(startDate, duration);

    return {
      ...item,
      duration,
      startDate,
      endDate
    };
  });

export const getScheduleTaskCompletionStatus = (task: any = {}, completedAt = getTodayDate()) => {
  const completedDate = toDateInputValue(completedAt);
  const scheduledEndDate = toDateInputValue(task.endDate);

  if (completedDate && scheduledEndDate && completedDate < scheduledEndDate) return "early";
  if (completedDate && scheduledEndDate && completedDate > scheduledEndDate) return "delayed";
  return "on-time";
};

export const markScheduleTaskCompletedInCollection = (scheduleItems: any[] = [], taskIndex) =>
  normalizeScheduleItems(
    scheduleItems.map((task, index) => {
      if (index !== taskIndex) return task;

      const completedAt = getTodayDate();

      return {
        ...task,
        completed: true,
        completedAt,
        completionStatus: getScheduleTaskCompletionStatus(task, completedAt)
      };
    })
  );

export const markScheduleTaskInProgressInCollection = (scheduleItems: any[] = [], taskIndex) =>
  normalizeScheduleItems(
    scheduleItems.map((task, index) =>
      index !== taskIndex
        ? task
        : {
            ...task,
            completed: false,
            completedAt: "",
            completionStatus: ""
          }
    )
  );

export const getScheduleTaskIdentity = (task: any = {}) =>
  task.itemId ||
  [
    task.name,
    task.roomName,
    task.category,
    task.unit
  ].map((value) => String(value || "").trim().toLowerCase()).join("|");

export const preserveScheduleCompletionState = (nextSchedule: any[] = [], previousSchedule: any[] = []) => {
  const completionByTask = new Map<string, any>(
    previousSchedule
      .map((task): [string, any] => [getScheduleTaskIdentity(task), task])
      .filter(([taskKey]) => taskKey)
  );

  return normalizeScheduleItems(
    nextSchedule.map((task) => {
      const previousTask = completionByTask.get(getScheduleTaskIdentity(task));

      if (!previousTask) return task;

      return {
        ...task,
        completed: Boolean(previousTask.completed),
        completedAt: previousTask.completedAt || "",
        completionStatus: previousTask.completionStatus || ""
      };
    })
  );
};

export const resequenceScheduleItems = (scheduleItems: any[] = [], scheduleStartDate = "") => {
  const normalizedSchedule = normalizeScheduleItems(scheduleItems);
  const normalizedStartDate = getNextBusinessDate(scheduleStartDate) || normalizedSchedule[0]?.startDate || "";

  if (!normalizedStartDate) {
    return normalizedSchedule;
  }

  let currentStartDate = normalizedStartDate;

  return normalizedSchedule.map((task) => {
    const duration = Math.max(1, Number(task.duration || 1));
    const startDate = currentStartDate;
    const endDate = getScheduleEndDate(startDate, duration);
    currentStartDate = endDate;

    return {
      ...task,
      duration,
      startDate,
      endDate
    };
  });
};

export const reorderCollectionBeforeIndex = (items: any[] = [], fromIndex, toIndex) => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  const insertionIndex = fromIndex < toIndex ? Math.max(0, toIndex - 1) : toIndex;
  nextItems.splice(insertionIndex, 0, movedItem);

  return nextItems;
};

export const syncQuoteItemsToSchedule = (quoteItems: any[] = [], scheduleItems: any[] = []) => {
  const itemMap = new Map(
    quoteItems
      .filter((item) => item.itemId)
      .map((item) => [item.itemId, item])
  );

  const orderedScheduledItems = scheduleItems
    .map((task) => {
      const matchingItem = task.itemId ? itemMap.get(task.itemId) : null;
      if (!matchingItem) return null;

      return {
        ...matchingItem,
        name: task.name || matchingItem.name,
        roomId: task.roomId || matchingItem.roomId,
        roomName: task.roomName || matchingItem.roomName,
        quantity: Number(task.quantity ?? matchingItem.quantity ?? 0),
        duration: Number(task.duration || matchingItem.duration || 1),
        unit: task.unit || matchingItem.unit,
        category: task.category || matchingItem.category,
        pricePerUnit: Number(task.pricePerUnit ?? matchingItem.pricePerUnit ?? 0),
        markupRate: Number(task.markupRate ?? matchingItem.markupRate ?? DEFAULT_ITEM_MARKUP_RATE)
      };
    })
    .filter(Boolean);

  const scheduledItemIds = new Set(
    orderedScheduledItems
      .map((item) => item.itemId)
      .filter(Boolean)
  );

  const remainingItems = quoteItems.filter((item) => !item.itemId || !scheduledItemIds.has(item.itemId));

  return [...orderedScheduledItems, ...remainingItems];
};
