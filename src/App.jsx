import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { APP_STYLES } from "./styles";
import { useDarkMode } from "./hooks/useDarkMode";
import {
  UNIT_OPTIONS,
  PAGE_OPTIONS,
  PROJECT_TEMPLATES,
  DEFAULT_ITEM_MARKUP_RATE,
  EMPTY_ITEM,
  EMPTY_PRICE_ITEM,
  DEFAULT_TEMPLATE_VALUES
} from "./constants/appConstants";
import {
  createTemplateItems,
  safeJsonParse,
  formatMoney,
  toDateInputValue,
  getNextBusinessDate,
  getScheduleEndDate,
  getItemBaseTotal,
  getItemMarkupAmount,
  getItemTotal,
  mergeTemplateItemsWithPriceList,
  sanitizeNumericInput,
  getNumericInputValue,
  formatQuoteReferenceNumber,
  getNextQuoteProjectNumber,
  normalizeSavedQuoteReferences
} from "./utils/appUtils";
import { exportQuoteToExcel, exportQuoteToPdf } from "./utils/exportUtils";
import { Card, Button, Input, Select } from "./components/ui";
import AnalysisPage from "./components/analysis/AnalysisPage";
import CustomerPage from "./components/customer/CustomerPage";
import ContractorPage from "./components/contractor/ContractorPage";
import QuoteItemsTable from "./components/quotes/QuoteItemsTable";
import QuotesLandingPage from "./components/quotes/QuotesLandingPage";
import SchedulePage from "./components/schedule/SchedulePage";

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const createRoomId = () => `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createRoomTemplateId = () => `room-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createContractorId = () => `contractor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createCustomerId = () => `customer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const getNormalizedText = (value) => String(value || "").trim().toLowerCase();
const getNormalizedItemName = (name) => getNormalizedText(name);
const DEFAULT_CONTRACTOR_EXPIRY_SETTINGS = {
  enabled: true,
  amount: 6,
  unit: "months"
};
const EMPTY_CONTRACTOR_PROFILE = {
  companyName: "",
  contactName: "",
  trade: "",
  status: "active",
  lastAssignedJobDate: "",
  phone: "",
  email: "",
  rate: "",
  rateType: "hour",
  address: "",
  unitNumber: "",
  city: "",
  province: "",
  postalCode: "",
  notes: ""
};
const EMPTY_CUSTOMER_PROFILE = {
  customerName: "",
  companyName: "",
  phone: "",
  email: "",
  address: "",
  unitNumber: "",
  city: "",
  province: "",
  postalCode: "",
  notes: ""
};
const CONTRACTOR_PROFILE_FIELDS = [
  "companyName",
  "contactName",
  "trade",
  "phone",
  "email",
  "rate",
  "rateType",
  "address",
  "unitNumber",
  "city",
  "province",
  "postalCode",
  "notes"
];
const CUSTOMER_PROFILE_FIELDS = [
  "customerName",
  "companyName",
  "phone",
  "email",
  "address",
  "unitNumber",
  "city",
  "province",
  "postalCode",
  "notes"
];
const getContractorExpirySettings = (settings = {}) => {
  const amount = Number(settings.amount ?? DEFAULT_CONTRACTOR_EXPIRY_SETTINGS.amount);

  return {
    enabled: settings.enabled !== false,
    amount: Number.isFinite(amount)
      ? Math.min(12, Math.max(1, Math.floor(amount)))
      : DEFAULT_CONTRACTOR_EXPIRY_SETTINGS.amount,
    unit: settings.unit === "years" ? "years" : "months"
  };
};
const getContractorExpiryMonths = (settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
  const expirySettings = getContractorExpirySettings(settings);
  return expirySettings.unit === "years"
    ? expirySettings.amount * 12
    : expirySettings.amount;
};
const addMonthsToDateInput = (value, months) => {
  const normalizedDate = toDateInputValue(value);
  if (!normalizedDate) return "";

  const nextDate = new Date(`${normalizedDate}T00:00:00`);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));

  return nextDate.toISOString().slice(0, 10);
};
const getContractorInactiveAfterDate = (profile = {}, settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
  const expirySettings = getContractorExpirySettings(settings);
  if (!expirySettings.enabled) return "";

  return addMonthsToDateInput(profile.lastAssignedJobDate, getContractorExpiryMonths(expirySettings));
};
const getContractorActivityStatus = (profile = {}, settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
  const expirySettings = getContractorExpirySettings(settings);
  if (!expirySettings.enabled) return "active";

  const inactiveAfterDate = getContractorInactiveAfterDate(profile, expirySettings);

  if (inactiveAfterDate && inactiveAfterDate < getTodayDate()) {
    return "inactive";
  }

  return profile.status === "inactive" && !profile.lastAssignedJobDate
    ? "inactive"
    : "active";
};
const normalizeCustomerRecord = (profile = {}) => ({
  id: profile.id || "",
  createdAt: profile.createdAt || "",
  updatedAt: profile.updatedAt || "",
  ...EMPTY_CUSTOMER_PROFILE,
  ...profile
});
const normalizeContractorProfile = (profile = {}, settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
  const normalizedProfile = {
    id: profile.id || "",
    createdAt: profile.createdAt || "",
    updatedAt: profile.updatedAt || "",
    ...EMPTY_CONTRACTOR_PROFILE,
    ...profile,
    lastAssignedJobDate: toDateInputValue(profile.lastAssignedJobDate)
  };

  return {
    ...normalizedProfile,
    status: getContractorActivityStatus(normalizedProfile, settings)
  };
};
const hasContractorProfileData = (profile = EMPTY_CONTRACTOR_PROFILE) =>
  CONTRACTOR_PROFILE_FIELDS.some((field) => String(profile?.[field] || "").trim());
const hasCustomerProfileData = (profile = EMPTY_CUSTOMER_PROFILE) =>
  CUSTOMER_PROFILE_FIELDS.some((field) => String(profile?.[field] || "").trim());
const getCustomerDisplayName = (profile = EMPTY_CUSTOMER_PROFILE) =>
  String(profile?.customerName || "").trim() ||
  String(profile?.companyName || "").trim() ||
  "Customer";
const isProjectLocked = (quote = {}) => ["completed", "invoiced"].includes(quote?.status);
const getProfileAddressDisplay = (profile = {}) => {
  const unitNumber = String(profile?.unitNumber || "").trim();
  const streetAddress = String(profile?.address || "").trim();
  const city = String(profile?.city || "").trim();
  const province = String(profile?.province || "").trim();
  const postalCode = String(profile?.postalCode || "").trim();
  const addressLine = unitNumber && streetAddress
    ? `${unitNumber}-${streetAddress}`
    : streetAddress || (unitNumber ? `Unit ${unitNumber}` : "");
  const localityLine = [city, province, postalCode].filter(Boolean).join(", ");
  return [addressLine, localityLine].filter(Boolean).join(", ");
};
const getLegacyCustomerProfile = () => {
  if (typeof window === "undefined") {
    return normalizeCustomerRecord();
  }

  return normalizeCustomerRecord(safeJsonParse(localStorage.getItem("customerProfile"), EMPTY_CUSTOMER_PROFILE));
};
const getLegacyContractorProfile = () => {
  if (typeof window === "undefined") {
    return normalizeContractorProfile();
  }

  return normalizeContractorProfile(safeJsonParse(localStorage.getItem("contractorProfile"), EMPTY_CONTRACTOR_PROFILE));
};
const createSavedContractorRecord = (profile = {}) => {
  const timestamp = new Date().toISOString();

  return normalizeContractorProfile({
    ...profile,
    id: profile.id || createContractorId(),
    createdAt: profile.createdAt || timestamp,
    updatedAt: timestamp
  });
};
const getInitialSavedContractors = () => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedContractors = safeJsonParse(localStorage.getItem("savedContractors"), []);
  if (storedContractors.length) {
    return storedContractors
      .map((profile) => normalizeContractorProfile(profile))
      .filter((profile) => hasContractorProfileData(profile));
  }

  const legacyContractor = getLegacyContractorProfile();
  return hasContractorProfileData(legacyContractor) ? [createSavedContractorRecord(legacyContractor)] : [];
};
const getInitialContractorProfile = () => {
  if (typeof window === "undefined") {
    return normalizeContractorProfile();
  }

  const activeContractor = getLegacyContractorProfile();
  if (hasContractorProfileData(activeContractor)) {
    return activeContractor;
  }

  const savedContractors = getInitialSavedContractors();
  return savedContractors[0] ? normalizeContractorProfile(savedContractors[0]) : normalizeContractorProfile();
};
const createSavedCustomerRecord = (profile = {}) => {
  const timestamp = new Date().toISOString();

  return normalizeCustomerRecord({
    ...profile,
    id: profile.id || createCustomerId(),
    createdAt: profile.createdAt || timestamp,
    updatedAt: timestamp
  });
};
const getInitialSavedCustomers = () => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedCustomers = safeJsonParse(localStorage.getItem("savedCustomers"), []);
  if (storedCustomers.length) {
    return storedCustomers
      .map((profile) => normalizeCustomerRecord(profile))
      .filter((profile) => hasCustomerProfileData(profile));
  }

  const legacyCustomer = getLegacyCustomerProfile();
  return hasCustomerProfileData(legacyCustomer) ? [createSavedCustomerRecord(legacyCustomer)] : [];
};
const getInitialCustomerProfile = () => {
  if (typeof window === "undefined") {
    return normalizeCustomerRecord();
  }

  const activeCustomer = getLegacyCustomerProfile();
  if (hasCustomerProfileData(activeCustomer)) {
    return activeCustomer;
  }

  const savedCustomers = getInitialSavedCustomers();
  return savedCustomers[0] ? normalizeCustomerRecord(savedCustomers[0]) : normalizeCustomerRecord();
};

const buildScheduleFromItems = (quoteItems = [], scheduleStartDate = "") => {
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

const normalizeScheduleItems = (scheduleItems = []) =>
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

const getScheduleTaskCompletionStatus = (task = {}, completedAt = getTodayDate()) => {
  const completedDate = toDateInputValue(completedAt);
  const scheduledEndDate = toDateInputValue(task.endDate);

  if (completedDate && scheduledEndDate && completedDate < scheduledEndDate) return "early";
  if (completedDate && scheduledEndDate && completedDate > scheduledEndDate) return "delayed";
  return "on-time";
};

const markScheduleTaskCompletedInCollection = (scheduleItems = [], taskIndex) =>
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

const markScheduleTaskInProgressInCollection = (scheduleItems = [], taskIndex) =>
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

const getScheduleTaskIdentity = (task = {}) =>
  task.itemId ||
  [
    task.name,
    task.roomName,
    task.category,
    task.unit
  ].map((value) => String(value || "").trim().toLowerCase()).join("|");

const preserveScheduleCompletionState = (nextSchedule = [], previousSchedule = []) => {
  const completionByTask = new Map(
    previousSchedule
      .map((task) => [getScheduleTaskIdentity(task), task])
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

const resequenceScheduleItems = (scheduleItems = [], scheduleStartDate = "") => {
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

const reorderCollectionBeforeIndex = (items = [], fromIndex, toIndex) => {
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

const syncQuoteItemsToSchedule = (quoteItems = [], scheduleItems = []) => {
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

const createEmptyQuoteItem = (overrides = {}) => {
  const roomId = overrides.roomId || createRoomId();
  const itemId = overrides.itemId || createItemId();
  const markupRate = overrides.markupRate === undefined || overrides.markupRate === null || overrides.markupRate === ""
    ? EMPTY_ITEM.markupRate
    : Number(overrides.markupRate || 0);

  return {
    ...EMPTY_ITEM,
    ...overrides,
    itemId,
    roomId,
    roomName: overrides.roomName || "",
    quantity: Number(overrides.quantity ?? EMPTY_ITEM.quantity),
    pricePerUnit: Number(overrides.pricePerUnit ?? EMPTY_ITEM.pricePerUnit),
    duration: Number(overrides.duration ?? EMPTY_ITEM.duration),
    markupRate
  };
};

const normalizeQuoteItems = (quoteItems = [], fallbackMarkupRate = DEFAULT_ITEM_MARKUP_RATE) => {
  if (!quoteItems.length) return [createEmptyQuoteItem()];

  let currentRoomId = null;
  let previousRoomName = null;

  return quoteItems.map((item) => {
    const normalizedRoomName = item.roomName || "";

    if (item.roomId) {
      currentRoomId = item.roomId;
      previousRoomName = normalizedRoomName || null;
      return createEmptyQuoteItem({
        ...item,
        roomId: item.roomId,
        roomName: normalizedRoomName,
        markupRate: item.markupRate ?? fallbackMarkupRate
      });
    }

    if (!normalizedRoomName || normalizedRoomName !== previousRoomName || !currentRoomId) {
      currentRoomId = createRoomId();
    }

    previousRoomName = normalizedRoomName || null;

    return createEmptyQuoteItem({
      ...item,
      roomId: currentRoomId,
      roomName: normalizedRoomName,
      markupRate: item.markupRate ?? fallbackMarkupRate
    });
  });
};

const createEmptyRoomTemplateItem = (overrides = {}) => {
  const markupRate = overrides.markupRate === undefined || overrides.markupRate === null || overrides.markupRate === ""
    ? DEFAULT_ITEM_MARKUP_RATE
    : Number(overrides.markupRate || 0);

  const nextItem = {
    itemId: overrides.itemId || createItemId(),
    name: "",
    quantity: 0,
    unit: "each",
    pricePerUnit: 0,
    markupRate: DEFAULT_ITEM_MARKUP_RATE,
    duration: 1,
    category: "Labor"
  };

  return {
    ...nextItem,
    ...overrides,
    quantity: Number(overrides.quantity ?? nextItem.quantity),
    pricePerUnit: Number(overrides.pricePerUnit ?? nextItem.pricePerUnit),
    markupRate,
    duration: Number(overrides.duration ?? nextItem.duration)
  };
};

const normalizeRoomTemplateItems = (templateItems = []) => {
  if (!templateItems.length) return [createEmptyRoomTemplateItem()];

  return templateItems.map((item) =>
    createEmptyRoomTemplateItem({
      ...item,
      quantity: Number(item.quantity || 0),
      pricePerUnit: Number(item.pricePerUnit || 0),
      markupRate: Number(item.markupRate ?? DEFAULT_ITEM_MARKUP_RATE),
      duration: Number(item.duration || 1)
    })
  );
};

const serializeRoomTemplateItems = (templateItems = []) =>
  templateItems
    .filter((item) => item.name.trim())
    .map((item) => ({
      itemId: item.itemId || createItemId(),
      name: item.name.trim(),
      quantity: Number(item.quantity || 0),
      unit: item.unit || "each",
      pricePerUnit: Number(item.pricePerUnit || 0),
      markupRate: Number(item.markupRate ?? DEFAULT_ITEM_MARKUP_RATE),
      duration: Number(item.duration || 1),
      category: item.category || "Labor"
    }));

const isBuiltInRoomTemplateId = (templateId) =>
  PROJECT_TEMPLATES.some((template) => template.id === templateId);

const createBuiltInRoomTemplates = () =>
  PROJECT_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.label,
    builtIn: true,
    updatedAt: "Preinstalled",
    items: serializeRoomTemplateItems(
      createTemplateItems(
        template.id,
        DEFAULT_TEMPLATE_VALUES[template.id] || template.defaults || {}
      )
    )
  }));

const normalizeRoomTemplateRecord = (template = {}) => {
  const builtInTemplate = PROJECT_TEMPLATES.find((entry) => entry.id === template.id);

  return {
    id: template.id || createRoomTemplateId(),
    name: template.name || builtInTemplate?.label || "Room Template",
    builtIn: Boolean(template.builtIn || builtInTemplate),
    updatedAt: template.updatedAt || (builtInTemplate ? "Preinstalled" : ""),
    items: serializeRoomTemplateItems(template.items || [])
  };
};

const mergeSavedRoomTemplatesWithBuiltIns = (templates = []) => {
  const normalizedTemplates = templates.map(normalizeRoomTemplateRecord);
  const existingTemplateIds = new Set(normalizedTemplates.map((template) => template.id));
  const missingBuiltIns = createBuiltInRoomTemplates().filter(
    (template) => !existingTemplateIds.has(template.id)
  );

  return [...missingBuiltIns, ...normalizedTemplates];
};

export default function ConstructionQuoteApp() {
  const systemDark = useDarkMode();
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem("themeMode") || "system";
  });
  const dark = themeMode === "system" ? systemDark : themeMode === "dark";
  const [contractorExpirySettings, setContractorExpirySettings] = useState(() => {
    if (typeof window === "undefined") return { ...DEFAULT_CONTRACTOR_EXPIRY_SETTINGS };
    return getContractorExpirySettings(
      safeJsonParse(localStorage.getItem("contractorExpirySettings"), DEFAULT_CONTRACTOR_EXPIRY_SETTINGS)
    );
  });

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [savedContractors, setSavedContractors] = useState(getInitialSavedContractors);
  const [contractorProfile, setContractorProfile] = useState(getInitialContractorProfile);
  const [contractorDraft, setContractorDraft] = useState(getInitialContractorProfile);
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [isEditingContractor, setIsEditingContractor] = useState(false);
  const [showContractorNotes, setShowContractorNotes] = useState(() => Boolean(getInitialContractorProfile().notes?.trim()));
  const [savedCustomers, setSavedCustomers] = useState(getInitialSavedCustomers);
  const [customerProfile, setCustomerProfile] = useState(getInitialCustomerProfile);
  const [customerDraft, setCustomerDraft] = useState(getInitialCustomerProfile);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(() => !hasCustomerProfileData(getInitialCustomerProfile()));
  const [showCustomerNotes, setShowCustomerNotes] = useState(() => Boolean(getInitialCustomerProfile().notes?.trim()));
  const [customerJobViews, setCustomerJobViews] = useState({});
  const [selectedQuoteCustomerId, setSelectedQuoteCustomerId] = useState("");
  const [quoteCustomerProfile, setQuoteCustomerProfile] = useState(() => normalizeCustomerRecord());
  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [quoteDate, setQuoteDate] = useState(getTodayDate());
  const [taxRate, setTaxRate] = useState(13);
  const [startDate, setStartDate] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [savedQuotes, setSavedQuotes] = useState(() => {
    if (typeof window === "undefined") return [];
    return normalizeSavedQuoteReferences(safeJsonParse(localStorage.getItem("savedQuotes"), [])).map((quote) => ({
      ...quote,
      schedule: normalizeScheduleItems(quote.schedule || [])
    }));
  });
  const [priceList, setPriceList] = useState(() => {
    if (typeof window === "undefined") return [];
    return safeJsonParse(localStorage.getItem("priceList"), []);
  });
  const [savedRoomTemplates, setSavedRoomTemplates] = useState(() => {
    if (typeof window === "undefined") return [];
    return mergeSavedRoomTemplatesWithBuiltIns(
      safeJsonParse(localStorage.getItem("savedRoomTemplates"), [])
    );
  });
  const [items, setItems] = useState(() => [createEmptyQuoteItem()]);
  const [newPriceItem, setNewPriceItem] = useState({ ...EMPTY_PRICE_ITEM });
  const [editingPriceItemName, setEditingPriceItemName] = useState("");
  const [priceItemDraft, setPriceItemDraft] = useState({ ...EMPTY_PRICE_ITEM });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [templateFormValues, setTemplateFormValues] = useState({ ...DEFAULT_TEMPLATE_VALUES.bathroom });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportFileName, setExportFileName] = useState("");
  const [activeQuoteItemIndex, setActiveQuoteItemIndex] = useState(null);
  const [dismissedSaveItemKeys, setDismissedSaveItemKeys] = useState([]);
  const [editingRoomTemplateId, setEditingRoomTemplateId] = useState(null);
  const [roomTemplateDraft, setRoomTemplateDraft] = useState(null);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [lockedQuoteViewId, setLockedQuoteViewId] = useState(null);
  const [quotesView, setQuotesView] = useState("landing");
  const [selectedScheduleQuoteId, setSelectedScheduleQuoteId] = useState(null);
  const [showDraftSchedulePreview, setShowDraftSchedulePreview] = useState(false);
  const [quotesCustomerFilter, setQuotesCustomerFilter] = useState(null);
  const [quotesInitialProjectList, setQuotesInitialProjectList] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

  const showNotification = (message, variant = "success") => {
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({
      id: Date.now(),
      message,
      variant
    });

    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3600);
  };

  const updateScheduleTaskCollection = (scheduleItems, taskIndex, field, value) => {
    const normalizedDuration = Math.max(1, Number(sanitizeNumericInput(value, { allowDecimal: false }) || 1));
    const normalizedStartDate = getNextBusinessDate(value);

    return normalizeScheduleItems(
      scheduleItems.map((task, index) => {
        if (index !== taskIndex) return task;

        if (field === "duration") {
          return {
            ...task,
            duration: normalizedDuration,
            endDate: getScheduleEndDate(task.startDate, normalizedDuration)
          };
        }

        return {
          ...task,
          startDate: normalizedStartDate,
          endDate: getScheduleEndDate(normalizedStartDate, task.duration)
        };
      })
    );
  };

  const syncScheduleDurationToItems = (quoteItems, scheduleTask) =>
    quoteItems.map((item) =>
      item.itemId && scheduleTask.itemId && item.itemId === scheduleTask.itemId
        ? {
            ...item,
            duration: Number(scheduleTask.duration || item.duration || 1)
          }
        : item
    );

  const getSaveItemDismissalKey = (item, nameOverride) => {
    const normalizedName = getNormalizedItemName(nameOverride ?? item?.name);
    if (!item?.itemId || !normalizedName) return "";
    return `${item.itemId}:${normalizedName}`;
  };

  const dismissSaveItemPrompt = (item, nameOverride) => {
    const key = getSaveItemDismissalKey(item, nameOverride);
    if (!key) return;

    setDismissedSaveItemKeys((previous) => (
      previous.includes(key) ? previous : [...previous, key]
    ));
  };

  const shouldShowSaveItemButton = (item, index) => {
    const key = getSaveItemDismissalKey(item);

    return (
      !isSavedPriceListItem(item.name) &&
      item.name.trim() &&
      activeQuoteItemIndex !== index &&
      !dismissedSaveItemKeys.includes(key)
    );
  };

  const updateContractorExpirySettings = (updater) => {
    const nextSettings = getContractorExpirySettings(
      typeof updater === "function" ? updater(contractorExpirySettings) : updater
    );

    setContractorExpirySettings(nextSettings);
    setSavedContractors((previousContractors) =>
      previousContractors.map((contractor) => normalizeContractorProfile(contractor, nextSettings))
    );
    setContractorProfile((previousContractor) => normalizeContractorProfile(previousContractor, nextSettings));
    setContractorDraft((previousContractor) => normalizeContractorProfile(previousContractor, nextSettings));
  };

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("priceList", JSON.stringify(priceList));
  }, [priceList]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedRoomTemplates", JSON.stringify(savedRoomTemplates));
    }
  }, [savedRoomTemplates]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedContractors", JSON.stringify(savedContractors));
    }
  }, [savedContractors]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedCustomers", JSON.stringify(savedCustomers));
    }
  }, [savedCustomers]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
  }, [savedQuotes]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    const normalizedSettings = getContractorExpirySettings(contractorExpirySettings);
    if (typeof window !== "undefined") {
      localStorage.setItem("contractorExpirySettings", JSON.stringify(normalizedSettings));
    }
  }, [contractorExpirySettings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("contractorProfile", JSON.stringify(contractorProfile));
    }
  }, [contractorProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customerProfile", JSON.stringify(customerProfile));
    }
  }, [customerProfile]);

  useEffect(
    () => () => {
      if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    },
    []
  );

  const updateItem = (index, field, value) => {
    setItems((previous) => {
      const targetItem = previous[index];
      if (!targetItem) return previous;

      if (field === "roomName") {
        return previous.map((item) =>
          item.roomId !== targetItem.roomId
            ? item
            : {
                ...item,
                roomName: value
              }
        );
      }

      return previous.map((item, itemIndex) =>
        itemIndex !== index
          ? item
          : {
              ...item,
              [field]: ["name", "unit", "category"].includes(field)
                ? value
                : sanitizeNumericInput(value)
            }
      );
    });
  };

  const updateContractorProfile = (field, value) => {
    setContractorDraft((previous) => ({ ...previous, [field]: value }));
  };

  const updateCustomerProfile = (field, value) => {
    setCustomerDraft((previous) => ({ ...previous, [field]: value }));
  };

  const saveContractorProfile = () => {
    const nextContractorProfile = normalizeContractorProfile(
      createSavedContractorRecord({
        ...contractorDraft,
        status: contractorDraft.status || "active"
      }),
      contractorExpirySettings
    );
    const existingContractor = savedContractors.find((contractor) => contractor.id === nextContractorProfile.id);

    setSavedContractors((previous) => {
      if (!existingContractor) {
        return [
          {
            ...nextContractorProfile,
            status: "active"
          },
          ...previous
        ];
      }

      return previous.map((contractor) =>
        contractor.id === nextContractorProfile.id
          ? nextContractorProfile
          : contractor
      );
    });
    setSelectedContractorId(existingContractor ? nextContractorProfile.id : null);
    setContractorProfile(nextContractorProfile);
    setContractorDraft(nextContractorProfile);
    setIsEditingContractor(false);
    setShowContractorNotes(existingContractor ? Boolean(nextContractorProfile.notes?.trim()) : false);

    showNotification(existingContractor ? "Contractor updated successfully." : "Contractor saved successfully.");
  };

  const getContractorAssignmentDate = (quote = {}) =>
    toDateInputValue(quote.startDate) ||
    toDateInputValue(quote.quoteDate) ||
    getTodayDate();

  const updateContractorJobAssignment = (contractorLike = {}, assignmentDate = getTodayDate()) => {
    const contractorId = contractorLike?.id;
    if (!contractorId) return;

    const normalizedAssignmentDate = toDateInputValue(assignmentDate) || getTodayDate();

    setSavedContractors((previous) =>
      previous.map((contractor) =>
        contractor.id !== contractorId
          ? normalizeContractorProfile(contractor, contractorExpirySettings)
          : normalizeContractorProfile({
              ...contractor,
              status: "active",
              lastAssignedJobDate: normalizedAssignmentDate
            }, contractorExpirySettings)
      )
    );

    setContractorProfile((previous) =>
      previous?.id === contractorId
        ? normalizeContractorProfile({
            ...previous,
            status: "active",
            lastAssignedJobDate: normalizedAssignmentDate
          }, contractorExpirySettings)
        : previous
    );

    setContractorDraft((previous) =>
      previous?.id === contractorId
        ? normalizeContractorProfile({
            ...previous,
            status: "active",
            lastAssignedJobDate: normalizedAssignmentDate
          }, contractorExpirySettings)
        : previous
    );
  };

  const selectContractor = (contractor) => {
    const selectedContractor = normalizeContractorProfile(contractor, contractorExpirySettings);

    if (!isEditingContractor && selectedContractorId === selectedContractor.id) {
      setSelectedContractorId(null);
      return;
    }

    setSelectedContractorId(selectedContractor.id || null);
    setContractorProfile(selectedContractor);
    setContractorDraft(selectedContractor);
    setShowContractorNotes(Boolean(selectedContractor.notes?.trim()));
    setIsEditingContractor(false);
  };

  const startNewContractor = () => {
    setSelectedContractorId(null);
    setContractorDraft(normalizeContractorProfile({ status: "active" }, contractorExpirySettings));
    setShowContractorNotes(false);
    setIsEditingContractor(true);
  };

  const startEditingContractor = (contractor = contractorProfile) => {
    const nextDraft = normalizeContractorProfile(contractor, contractorExpirySettings);
    setSelectedContractorId(nextDraft.id || selectedContractorId || null);
    setContractorDraft(nextDraft);
    setShowContractorNotes(Boolean(nextDraft.notes?.trim()));
    setIsEditingContractor(true);
  };

  const cancelContractorEditing = () => {
    if (selectedContractorId) {
      const selectedContractor = savedContractors.find((contractor) => contractor.id === selectedContractorId);
      const nextContractor = normalizeContractorProfile(selectedContractor || contractorProfile, contractorExpirySettings);
      setContractorProfile(nextContractor);
      setContractorDraft(nextContractor);
      setShowContractorNotes(Boolean(nextContractor.notes?.trim()));
      setIsEditingContractor(false);
      return;
    }

    if (savedContractors.length) {
      const nextContractor = normalizeContractorProfile(contractorProfile, contractorExpirySettings);
      setContractorProfile(nextContractor);
      setContractorDraft(nextContractor);
      setShowContractorNotes(false);
      setIsEditingContractor(false);
      return;
    }

    setContractorDraft(normalizeContractorProfile({}, contractorExpirySettings));
    setShowContractorNotes(false);
    setIsEditingContractor(false);
  };

  const saveCustomerProfile = () => {
    const nextCustomerProfile = createSavedCustomerRecord(customerDraft);
    const existingCustomer = savedCustomers.find((customer) => customer.id === nextCustomerProfile.id);

    setSavedCustomers((previous) => {
      if (!existingCustomer) {
        return [nextCustomerProfile, ...previous];
      }

      return previous.map((customer) =>
        customer.id === nextCustomerProfile.id
          ? nextCustomerProfile
          : customer
      );
    });
    setSelectedCustomerId(existingCustomer ? nextCustomerProfile.id : null);
    setCustomerProfile(nextCustomerProfile);
    setCustomerDraft(nextCustomerProfile);
    setIsEditingCustomer(false);
    setShowCustomerNotes(existingCustomer ? Boolean(nextCustomerProfile.notes?.trim()) : false);

    showNotification(existingCustomer ? "Customer updated successfully." : "Customer saved successfully.");
  };

  const selectCustomer = (customer) => {
    const selectedCustomer = normalizeCustomerRecord(customer);

    if (!isEditingCustomer && selectedCustomerId === selectedCustomer.id) {
      setSelectedCustomerId(null);
      setShowCustomerNotes(false);
      return;
    }

    setSelectedCustomerId(selectedCustomer.id || null);
    setCustomerProfile(selectedCustomer);
    setCustomerDraft(selectedCustomer);
    setShowCustomerNotes(Boolean(selectedCustomer.notes?.trim()));
    setIsEditingCustomer(false);
  };

  const toggleCustomerJobView = (customerId) => {
    setCustomerJobViews((previous) => ({
      ...previous,
      [customerId]: previous[customerId] === "previous" ? "ongoing" : "previous"
    }));
  };

  const startNewCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerDraft(normalizeCustomerRecord());
    setShowCustomerNotes(false);
    setIsEditingCustomer(true);
  };

  const startEditingCustomer = (customer = customerProfile) => {
    const nextDraft = normalizeCustomerRecord(customer);
    setSelectedCustomerId(nextDraft.id || selectedCustomerId || null);
    setCustomerDraft(nextDraft);
    setShowCustomerNotes(Boolean(nextDraft.notes?.trim()));
    setIsEditingCustomer(true);
  };

  const cancelCustomerEditing = () => {
    if (selectedCustomerId) {
      const selectedCustomer = savedCustomers.find((customer) => customer.id === selectedCustomerId);
      const nextCustomer = normalizeCustomerRecord(selectedCustomer || customerProfile);
      setCustomerProfile(nextCustomer);
      setCustomerDraft(nextCustomer);
      setShowCustomerNotes(Boolean(nextCustomer.notes?.trim()));
      setIsEditingCustomer(false);
      return;
    }

    if (savedCustomers.length) {
      const nextCustomer = normalizeCustomerRecord(customerProfile);
      setCustomerProfile(nextCustomer);
      setCustomerDraft(nextCustomer);
      setShowCustomerNotes(false);
      setIsEditingCustomer(false);
      return;
    }

    setCustomerDraft(normalizeCustomerRecord());
    setShowCustomerNotes(false);
    setIsEditingCustomer(true);
  };

  const selectQuoteCustomer = (customerId) => {
    setSelectedQuoteCustomerId(customerId);

    if (!customerId) {
      setQuoteCustomerProfile(normalizeCustomerRecord());
      setClientName("");
      return;
    }

    const selectedCustomer = savedCustomers.find((customer) => customer.id === customerId);
    if (!selectedCustomer) return;

    const normalizedCustomer = normalizeCustomerRecord(selectedCustomer);
    setQuoteCustomerProfile(normalizedCustomer);
    setClientName(getCustomerDisplayName(normalizedCustomer));
    setProjectAddress(getProfileAddressDisplay(normalizedCustomer) || "");
  };

  const selectPriceItem = (index, selectedName) => {
    const found = priceList.find((priceItem) => priceItem.name === selectedName);
    if (!found) return;

    setItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              name: found.name,
              unit: found.unit,
              pricePerUnit: Number(found.pricePerUnit || 0),
              duration: Number(found.duration || 1),
              category: found.category || "Labor"
            }
          : item
      )
    );
  };

  const isSavedPriceListItem = (name) => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return false;
    return priceList.some((priceItem) => priceItem.name.trim().toLowerCase() === trimmedName);
  };

  const addItem = () => {
    setItems((previous) => {
      const currentRoom = previous[previous.length - 1];
      setActiveQuoteItemIndex(previous.length);
      return [
        ...previous,
        createEmptyQuoteItem({
          roomId: currentRoom?.roomId || createRoomId(),
          roomName: currentRoom?.roomName || "",
          markupRate: currentRoom?.markupRate ?? DEFAULT_ITEM_MARKUP_RATE
        })
      ];
    });
  };

  const addRoom = () => {
    setItems((previous) => {
      setActiveQuoteItemIndex(previous.length);
      return [
        ...previous,
        createEmptyQuoteItem({
          markupRate: previous[previous.length - 1]?.markupRate ?? DEFAULT_ITEM_MARKUP_RATE
        })
      ];
    });
  };

  const removeItem = (index) => {
    const removedItem = items[index];

    setActiveQuoteItemIndex((previous) => {
      if (previous === null) return null;
      if (previous === index) return null;
      return previous > index ? previous - 1 : previous;
    });

    if (removedItem?.itemId) {
      setDismissedSaveItemKeys((previous) =>
        previous.filter((key) => !key.startsWith(`${removedItem.itemId}:`))
      );
    }

    setItems((previous) => {
      const next = previous.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [createEmptyQuoteItem()];
    });
  };

  const saveToPriceList = (item) => {
    const trimmedName = item.name.trim();
    if (!trimmedName) return;
    if (priceList.some((priceItem) => priceItem.name.toLowerCase() === trimmedName.toLowerCase())) return;

    setPriceList((previous) => [
      ...previous,
      {
        name: trimmedName,
        unit: item.unit,
        pricePerUnit: Number(item.pricePerUnit || 0),
        duration: Number(item.duration || 1),
        category: item.category || "Labor"
      }
    ]);
  };

  const addManualPriceListItem = () => {
    const trimmedName = newPriceItem.name.trim();
    if (!trimmedName) return;
    if (priceList.some((priceItem) => priceItem.name.toLowerCase() === trimmedName.toLowerCase())) return;

    setPriceList((previous) => [
      ...previous,
      {
        ...newPriceItem,
        name: trimmedName,
        pricePerUnit: Number(newPriceItem.pricePerUnit || 0),
        duration: Number(newPriceItem.duration || 1)
      }
    ]);

    setNewPriceItem({ ...EMPTY_PRICE_ITEM });
  };

  const deletePriceListItem = (name) => {
    setPriceList((previous) => previous.filter((item) => item.name !== name));
    if (editingPriceItemName === name) {
      setEditingPriceItemName("");
      setPriceItemDraft({ ...EMPTY_PRICE_ITEM });
    }
  };

  const startEditingPriceListItem = (item) => {
    setEditingPriceItemName(item.name);
    setPriceItemDraft({
      ...EMPTY_PRICE_ITEM,
      ...item,
      pricePerUnit: Number(item.pricePerUnit || 0),
      duration: Number(item.duration || 1)
    });
  };

  const updatePriceItemDraft = (field, value) => {
    setPriceItemDraft((previous) => ({
      ...previous,
      [field]:
        field === "pricePerUnit" || field === "duration"
          ? sanitizeNumericInput(value)
          : value
    }));
  };

  const cancelEditingPriceListItem = () => {
    setEditingPriceItemName("");
    setPriceItemDraft({ ...EMPTY_PRICE_ITEM });
  };

  const savePriceListItemEdits = () => {
    const trimmedName = priceItemDraft.name.trim();
    if (!trimmedName) return;

    const duplicateItem = priceList.find(
      (item) =>
        item.name.toLowerCase() === trimmedName.toLowerCase() &&
        item.name !== editingPriceItemName
    );
    if (duplicateItem) {
      showNotification("A price list item with that name already exists.", "warning");
      return;
    }

    setPriceList((previous) =>
      previous.map((item) =>
        item.name !== editingPriceItemName
          ? item
          : {
              ...priceItemDraft,
              name: trimmedName,
              pricePerUnit: Number(priceItemDraft.pricePerUnit || 0),
              duration: Number(priceItemDraft.duration || 1)
            }
      )
    );
    cancelEditingPriceListItem();
  };

  const openRoomTemplateEditor = (templateId) => {
    const template = savedRoomTemplates.find((entry) => entry.id === templateId);
    if (!template) return;

    setEditingRoomTemplateId(template.id);
    setRoomTemplateDraft({
      id: template.id,
      name: template.name || "",
      builtIn: Boolean(template.builtIn || isBuiltInRoomTemplateId(template.id)),
      updatedAt: template.updatedAt || "",
      items: normalizeRoomTemplateItems(template.items || [])
    });
  };

  const closeRoomTemplateEditor = () => {
    setEditingRoomTemplateId(null);
    setRoomTemplateDraft(null);
  };

  const updateRoomTemplateDraft = (field, value) => {
    setRoomTemplateDraft((previous) => (
      previous
        ? {
            ...previous,
            [field]: value
          }
        : previous
    ));
  };

  const updateRoomTemplateDraftItem = (index, field, value) => {
    setRoomTemplateDraft((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        items: previous.items.map((item, itemIndex) =>
          itemIndex !== index
            ? item
            : {
                ...item,
                [field]: ["name", "unit", "category"].includes(field)
                  ? value
                  : sanitizeNumericInput(value)
              }
        )
      };
    });
  };

  const addRoomTemplateDraftItem = () => {
    setRoomTemplateDraft((previous) => (
      previous
        ? {
            ...previous,
            items: [...previous.items, createEmptyRoomTemplateItem()]
          }
        : previous
    ));
  };

  const removeRoomTemplateDraftItem = (index) => {
    setRoomTemplateDraft((previous) => {
      if (!previous) return previous;

      const nextItems = previous.items.filter((_, itemIndex) => itemIndex !== index);

      return {
        ...previous,
        items: nextItems.length ? nextItems : [createEmptyRoomTemplateItem()]
      };
    });
  };

  const saveRoomTemplate = (roomId) => {
    const roomLeadItem = items.find((item) => item.roomId === roomId);
    const roomName = roomLeadItem?.roomName?.trim();
    const roomItems = serializeRoomTemplateItems(items.filter((item) => item.roomId === roomId));

    if (!roomName) {
      showNotification("Add a room name before saving the room.", "warning");
      return;
    }

    if (!roomItems.length) {
      showNotification("Add at least one quote item in this room before saving the template.", "warning");
      return;
    }

    const templateId = roomLeadItem?.roomTemplateId || createRoomTemplateId();
    const nextTemplate = {
      id: templateId,
      name: roomName,
      builtIn: isBuiltInRoomTemplateId(templateId),
      updatedAt: new Date().toLocaleString(),
      items: roomItems
    };

    setSavedRoomTemplates((previous) => {
      const remainingTemplates = previous.filter((template) => template.id !== templateId);
      return [nextTemplate, ...remainingTemplates];
    });

    setItems((previous) =>
      previous.map((item) =>
        item.roomId !== roomId
          ? item
          : {
              ...item,
              roomTemplateId: templateId
            }
      )
    );

    if (editingRoomTemplateId === templateId) {
      setRoomTemplateDraft({
        id: nextTemplate.id,
        name: nextTemplate.name,
        builtIn: nextTemplate.builtIn,
        updatedAt: nextTemplate.updatedAt,
        items: normalizeRoomTemplateItems(nextTemplate.items)
      });
    }

    showNotification(roomLeadItem?.roomTemplateId ? "Room template updated successfully." : "Room template saved successfully.");
  };

  const saveRoomTemplateEdits = () => {
    if (!roomTemplateDraft) return;

    const trimmedName = roomTemplateDraft.name.trim();
    const nextItems = serializeRoomTemplateItems(roomTemplateDraft.items);

    if (!trimmedName) {
      showNotification("Enter a template name before saving.", "warning");
      return;
    }

    if (!nextItems.length) {
      showNotification("Add at least one template item before saving.", "warning");
      return;
    }

    const nextTemplate = {
      id: roomTemplateDraft.id,
      name: trimmedName,
      builtIn: Boolean(roomTemplateDraft.builtIn || isBuiltInRoomTemplateId(roomTemplateDraft.id)),
      updatedAt: new Date().toLocaleString(),
      items: nextItems
    };

    setSavedRoomTemplates((previous) => {
      const remainingTemplates = previous.filter((template) => template.id !== nextTemplate.id);
      return [nextTemplate, ...remainingTemplates];
    });

    setEditingRoomTemplateId(nextTemplate.id);
    setRoomTemplateDraft({
      id: nextTemplate.id,
      name: nextTemplate.name,
      builtIn: nextTemplate.builtIn,
      updatedAt: nextTemplate.updatedAt,
      items: normalizeRoomTemplateItems(nextTemplate.items)
    });

    showNotification("Room template updated successfully.");
  };

  const deleteRoomTemplate = (templateId) => {
    if (isBuiltInRoomTemplateId(templateId)) {
      showNotification("Preinstalled templates can be edited, but not deleted.", "warning");
      return;
    }

    setSavedRoomTemplates((previous) => previous.filter((template) => template.id !== templateId));
    setItems((previous) =>
      previous.map((item) =>
        item.roomTemplateId === templateId
          ? {
              ...item,
              roomTemplateId: ""
            }
          : item
      )
    );

    if (editingRoomTemplateId === templateId) {
      closeRoomTemplateEditor();
    }
  };

  const openQuotesLanding = (options = {}) => {
    setQuotesCustomerFilter(options.customerFilter || null);
    setQuotesInitialProjectList(options.projectList || "");
    setQuotesView("landing");
    setCurrentPage("quotes");
  };

  const openCustomerQuotesLanding = (customer, projectList = "") => {
    openQuotesLanding({
      projectList,
      customerFilter: {
        id: customer.id || "",
        label: getCustomerDisplayName(customer),
        email: customer.email || "",
        customerName: customer.customerName || "",
        companyName: customer.companyName || ""
      }
    });
  };

  const openQuoteBuilder = () => {
    setQuotesView("builder");
    setCurrentPage("quotes");
  };

  const openScheduleLanding = () => {
    setSelectedScheduleQuoteId(null);
    setShowDraftSchedulePreview(false);
    setCurrentPage("schedule");
  };

  const openApprovedQuoteSchedule = (quoteId) => {
    setSelectedScheduleQuoteId(quoteId);
    setShowDraftSchedulePreview(false);
    setCurrentPage("schedule");
  };

  const openCurrentDraftSchedule = () => {
    setSelectedScheduleQuoteId(null);
    setShowDraftSchedulePreview(true);
    setCurrentPage("schedule");
  };

  const generateScheduleForSavedQuote = (quoteId) => {
    const savedQuote = savedQuotes.find((quote) => quote.id === quoteId);
    if (!savedQuote) return;

    if (!savedQuote.startDate) {
      showNotification("Please add a start date to this quote before generating its schedule.", "warning");
      return;
    }

    const regeneratedSchedule = preserveScheduleCompletionState(
      buildScheduleFromItems(savedQuote.items || [], savedQuote.startDate),
      savedQuote.schedule || []
    );

    setSavedQuotes((previous) =>
      previous.map((quote) =>
        quote.id !== quoteId
          ? quote
          : {
              ...quote,
              startDate: regeneratedSchedule[0]?.startDate || quote.startDate,
              schedule: regeneratedSchedule
            }
      )
    );

    setSelectedScheduleQuoteId(quoteId);
    setShowDraftSchedulePreview(false);
    setCurrentPage("schedule");
  };

  const updateDraftScheduleTask = (taskIndex, field, value) => {
    setSchedule((previous) => {
      const nextSchedule = updateScheduleTaskCollection(previous, taskIndex, field, value);
      const updatedTask = nextSchedule[taskIndex];

      if (!updatedTask) return previous;

      if (field === "duration") {
        setItems((previousItems) => syncScheduleDurationToItems(previousItems, updatedTask));
      }

      if (field === "startDate" && taskIndex === 0) {
        setStartDate(updatedTask.startDate || "");
      }

      return nextSchedule;
    });
  };

  const updateSavedQuoteScheduleTask = (quoteId, taskIndex, field, value) => {
    setSavedQuotes((previous) =>
      previous.map((quote) => {
        if (quote.id !== quoteId) return quote;

        const nextSchedule = updateScheduleTaskCollection(quote.schedule || [], taskIndex, field, value);
        const updatedTask = nextSchedule[taskIndex];
        const nextItems = updatedTask && field === "duration"
          ? syncScheduleDurationToItems(quote.items || [], updatedTask)
          : quote.items;

        return {
          ...quote,
          startDate:
            field === "startDate" && taskIndex === 0
              ? updatedTask?.startDate || ""
              : quote.startDate,
          items: nextItems,
          schedule: nextSchedule
        };
      })
    );
  };

  const markDraftScheduleTaskCompleted = (taskIndex) => {
    setSchedule((previous) => markScheduleTaskCompletedInCollection(previous, taskIndex));
  };

  const markSavedQuoteScheduleTaskCompleted = (quoteId, taskIndex) => {
    setSavedQuotes((previous) =>
      previous.map((quote) =>
        quote.id !== quoteId
          ? quote
          : {
              ...quote,
              schedule: markScheduleTaskCompletedInCollection(quote.schedule || [], taskIndex)
            }
      )
    );
  };

  const markDraftScheduleTaskInProgress = (taskIndex) => {
    setSchedule((previous) => markScheduleTaskInProgressInCollection(previous, taskIndex));
  };

  const markSavedQuoteScheduleTaskInProgress = (quoteId, taskIndex) => {
    setSavedQuotes((previous) =>
      previous.map((quote) =>
        quote.id !== quoteId
          ? quote
          : {
              ...quote,
              schedule: markScheduleTaskInProgressInCollection(quote.schedule || [], taskIndex)
            }
      )
    );
  };

  const updateDraftScheduleStartDate = (value, scheduleSnapshot = []) => {
    const normalizedStartDate = getNextBusinessDate(value);
    if (!normalizedStartDate) return;

    setSchedule((previous) => {
      const baseSchedule = scheduleSnapshot.length ? scheduleSnapshot : previous;
      const nextSchedule = resequenceScheduleItems(baseSchedule, normalizedStartDate);

      setItems((previousItems) => syncQuoteItemsToSchedule(previousItems, nextSchedule));
      setStartDate(normalizedStartDate);

      return nextSchedule;
    });
  };

  const updateSavedQuoteScheduleStartDate = (quoteId, value, scheduleSnapshot = []) => {
    const normalizedStartDate = getNextBusinessDate(value);
    if (!normalizedStartDate) return;

    setSavedQuotes((previous) =>
      previous.map((quote) => {
        if (quote.id !== quoteId) return quote;

        const baseSchedule = scheduleSnapshot.length ? scheduleSnapshot : (quote.schedule || []);
        const nextSchedule = resequenceScheduleItems(baseSchedule, normalizedStartDate);

        return {
          ...quote,
          startDate: normalizedStartDate,
          items: syncQuoteItemsToSchedule(quote.items || [], nextSchedule),
          schedule: nextSchedule
        };
      })
    );
  };

  const reorderDraftScheduleTasks = (fromIndex, toIndex, scheduleSnapshot = []) => {
    setSchedule((previous) => {
      const baseSchedule = scheduleSnapshot.length ? scheduleSnapshot : previous;
      const reorderedSchedule = reorderCollectionBeforeIndex(baseSchedule, fromIndex, toIndex);
      const nextSchedule = resequenceScheduleItems(
        reorderedSchedule,
        startDate || reorderedSchedule[0]?.startDate || baseSchedule[0]?.startDate || previous[0]?.startDate || ""
      );

      setItems((previousItems) => syncQuoteItemsToSchedule(previousItems, nextSchedule));

      if (nextSchedule[0]?.startDate) {
        setStartDate(nextSchedule[0].startDate);
      }

      return nextSchedule;
    });
  };

  const reorderSavedQuoteScheduleTasks = (quoteId, fromIndex, toIndex, scheduleSnapshot = []) => {
    setSavedQuotes((previous) =>
      previous.map((quote) => {
        if (quote.id !== quoteId) return quote;

        const baseSchedule = scheduleSnapshot.length ? scheduleSnapshot : (quote.schedule || []);
        const reorderedSchedule = reorderCollectionBeforeIndex(baseSchedule, fromIndex, toIndex);
        const nextSchedule = resequenceScheduleItems(
          reorderedSchedule,
          quote.startDate || reorderedSchedule[0]?.startDate || baseSchedule[0]?.startDate || quote.schedule?.[0]?.startDate || ""
        );

        return {
          ...quote,
          startDate: nextSchedule[0]?.startDate || quote.startDate,
          items: syncQuoteItemsToSchedule(quote.items || [], nextSchedule),
          schedule: nextSchedule
        };
      })
    );
  };

  const startNewQuote = () => {
    setEditingQuoteId(null);
    setLockedQuoteViewId(null);
    setSelectedQuoteCustomerId("");
    setQuoteCustomerProfile(normalizeCustomerRecord());
    setProjectTitle("");
    setClientName("");
    setProjectAddress("");
    setQuoteDate(getTodayDate());
    setTaxRate(13);
    setStartDate("");
    setSchedule([]);
    setItems([createEmptyQuoteItem()]);
    setSelectedTemplateId("");
    setShowTemplateBuilder(false);
    setTemplateFormValues({ ...DEFAULT_TEMPLATE_VALUES.bathroom });
    setShowExportModal(false);
    setExportFileName("");
    setActiveQuoteItemIndex(null);
    setDismissedSaveItemKeys([]);
    setShowDraftSchedulePreview(false);
    openQuoteBuilder();
  };

  const openTemplateBuilder = (templateId) => {
    const template = PROJECT_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) return;
    const generatedItems = mergeTemplateItemsWithPriceList(
      createTemplateItems(templateId, DEFAULT_TEMPLATE_VALUES[templateId] || template.defaults || {}),
      priceList
    );

    if (!generatedItems.length) return;

    setItems((previous) => {
      const existingFilledItems = previous.filter((item) => item.name.trim());
      const roomId = createRoomId();
      const generatedItemsWithRoom = generatedItems.map((item) =>
        createEmptyQuoteItem({
          ...item,
          roomId,
          roomName: template.label
        })
      );
      return [...existingFilledItems, ...generatedItemsWithRoom];
    });

    if (!projectTitle.trim()) setProjectTitle(`${template.label} Project`);
    setShowTemplateBuilder(false);
    setSelectedTemplateId(templateId);
    setTemplateFormValues({ ...(DEFAULT_TEMPLATE_VALUES[templateId] || template.defaults) });
  };

  const applySavedRoomTemplate = (templateId) => {
    const template = savedRoomTemplates.find((entry) => entry.id === templateId);
    if (!template) return;

    const roomItems = serializeRoomTemplateItems(template.items || []);
    if (!roomItems.length) return;

    const roomId = createRoomId();
    const generatedItemsWithRoom = roomItems.map((item) =>
      createEmptyQuoteItem({
        ...item,
        roomId,
        roomName: template.name,
        roomTemplateId: template.id
      })
    );

    setItems((previous) => {
      const existingFilledItems = previous.filter((item) => item.name.trim());
      return [...existingFilledItems, ...generatedItemsWithRoom];
    });

    if (!projectTitle.trim()) setProjectTitle(`${template.name} Project`);
  };

  const updateTemplateField = (field, value) => {
    setTemplateFormValues((previous) => ({
      ...previous,
      [field]: sanitizeNumericInput(value)
    }));
  };

  const applyTemplateToQuote = () => {
    openTemplateBuilder(selectedTemplateId);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + getItemBaseTotal(item), 0);
    const markup = items.reduce((sum, item) => sum + getItemMarkupAmount(item), 0);
    const tax = (subtotal + markup) * (Number(taxRate || 0) / 100);
    return { subtotal, markup, tax, total: subtotal + markup + tax };
  }, [items, taxRate]);

  const getQuoteDocumentPayload = () => {
    const existingQuote = editingQuoteId
      ? savedQuotes.find((savedQuote) => savedQuote.id === editingQuoteId)
      : null;
    const filledItems = items.filter((item) => item.name.trim());
    const normalizedQuoteCustomerProfile = hasCustomerProfileData(quoteCustomerProfile)
      ? normalizeCustomerRecord(quoteCustomerProfile)
      : null;
    const normalizedQuoteContractorProfile = hasContractorProfileData(contractorProfile)
      ? normalizeContractorProfile(contractorProfile, contractorExpirySettings)
      : null;
    const projectNumber = existingQuote?.projectNumber || getNextQuoteProjectNumber(savedQuotes);
    const quoteStatus = existingQuote?.status || "open";
    const invoicePartNumber = existingQuote?.invoicePartNumber || 1;

    if (!filledItems.length) {
      showNotification("Add at least one quote item before exporting.", "warning");
      return null;
    }

    return {
      id: editingQuoteId || null,
      projectNumber,
      status: quoteStatus,
      invoicePartNumber,
      quoteNumber: formatQuoteReferenceNumber({
        projectNumber,
        status: quoteStatus,
        invoicePartNumber
      }),
      projectTitle: projectTitle || `Quote ${savedQuotes.length + 1}`,
      clientName,
      projectAddress,
      quoteDate,
      startDate,
      createdAt: new Date().toLocaleString(),
      taxRate: Number(taxRate || 0),
      validForDays: 14,
      contractorProfile: normalizedQuoteContractorProfile,
      customerId: selectedQuoteCustomerId || normalizedQuoteCustomerProfile?.id || "",
      customerProfile: normalizedQuoteCustomerProfile,
      items: filledItems,
      totals: {
        subtotal: Number(totals.subtotal || 0),
        markup: Number(totals.markup || 0),
        tax: Number(totals.tax || 0),
        total: Number(totals.total || 0)
      },
      schedule: schedule.filter((task) => task.name?.trim())
    };
  };

  const getDefaultExportFileName = () => {
    const baseName = projectTitle.trim() || `Quote ${savedQuotes.length + 1}`;
    return baseName;
  };

  const openExportModal = () => {
    const quote = getQuoteDocumentPayload();
    if (!quote) return;

    setExportFileName(getDefaultExportFileName());
    setExportFormat("pdf");
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
  };

  const submitExport = () => {
    const quote = getQuoteDocumentPayload();
    if (!quote) return;

    const trimmedFileName = exportFileName.trim() || getDefaultExportFileName();

    if (exportFormat === "excel") {
      exportQuoteToExcel(quote, trimmedFileName);
    } else {
      const didOpenPrintWindow = exportQuoteToPdf(quote, trimmedFileName);
      if (didOpenPrintWindow === false) {
        showNotification("Please allow pop-ups to save the quote as PDF.", "warning");
        return;
      }
    }

    closeExportModal();
  };

  const totalDuration = useMemo(() => items.reduce((sum, item) => sum + Number(item.duration || 0), 0), [items]);

  const generateSchedule = () => {
    if (!startDate) {
      showNotification("Please select a start date.", "warning");
      return;
    }

    const newSchedule = buildScheduleFromItems(items, startDate);

    if (newSchedule[0]?.startDate) {
      setStartDate(newSchedule[0].startDate);
    }

    setSchedule(newSchedule);
    openCurrentDraftSchedule();
  };

  const saveQuote = (options = {}) => {
    const existingQuote = editingQuoteId
      ? savedQuotes.find((savedQuote) => savedQuote.id === editingQuoteId)
      : null;

    if (isProjectLocked(existingQuote) || (editingQuoteId && lockedQuoteViewId === editingQuoteId)) {
      showNotification("Completed projects are locked and cannot be edited.", "warning");
      return;
    }

    const normalizedQuoteCustomerProfile = hasCustomerProfileData(quoteCustomerProfile)
      ? normalizeCustomerRecord(quoteCustomerProfile)
      : null;
    const normalizedQuoteContractorProfile = hasContractorProfileData(contractorProfile)
      ? normalizeContractorProfile(contractorProfile, contractorExpirySettings)
      : null;
    const projectNumber = existingQuote?.projectNumber || getNextQuoteProjectNumber(savedQuotes);
    const quoteStatus = options.status || existingQuote?.status || "open";
    const invoicePartNumber =
      quoteStatus === "invoiced"
        ? existingQuote?.invoicePartNumber || 1
        : 1;

    const quote = {
      id: existingQuote?.id || Date.now(),
      status: quoteStatus,
      projectNumber,
      invoicePartNumber,
      projectTitle: projectTitle || `Quote ${savedQuotes.length + 1}`,
      clientName,
      customerId: selectedQuoteCustomerId || normalizedQuoteCustomerProfile?.id || "",
      customerProfile: normalizedQuoteCustomerProfile,
      projectAddress,
      quoteDate,
      startDate,
      createdAt: new Date().toLocaleString(),
      taxRate: Number(taxRate || 0),
      contractorProfile: normalizedQuoteContractorProfile,
      items,
      totals,
      schedule
    };

    setSavedQuotes((previous) => {
      const remainingQuotes = previous.filter((savedQuote) => savedQuote.id !== quote.id);
      return [quote, ...remainingQuotes];
    });
    setEditingQuoteId(quote.id);

    if (quoteStatus !== "open") {
      updateContractorJobAssignment(
        normalizedQuoteContractorProfile,
        getContractorAssignmentDate(quote)
      );
    }

    if (quoteStatus === "approved") {
      showNotification(existingQuote ? "Quote approved successfully." : "Quote saved and approved successfully.");
    } else {
      showNotification(existingQuote ? "Quote updated successfully." : "Quote saved successfully.");
    }
  };

  const markQuoteApproved = () => {
    saveQuote({ status: "approved" });
  };

  const loadQuote = (quote, options = {}) => {
    const matchedSavedCustomer = savedCustomers.find((customer) => {
      if (quote.customerId && customer.id === quote.customerId) return true;
      if (quote.customerProfile?.id && customer.id === quote.customerProfile.id) return true;
      return getNormalizedText(getCustomerDisplayName(customer)) === getNormalizedText(quote.clientName);
    });
    const nextQuoteCustomerProfile = normalizeCustomerRecord(matchedSavedCustomer || quote.customerProfile || {});

    setEditingQuoteId(quote.id);
    setLockedQuoteViewId(options.readOnly || isProjectLocked(quote) ? quote.id : null);
    setProjectTitle(quote.projectTitle || "");
    setClientName(quote.clientName || (hasCustomerProfileData(nextQuoteCustomerProfile) ? getCustomerDisplayName(nextQuoteCustomerProfile) : ""));
    setSelectedQuoteCustomerId(matchedSavedCustomer?.id || quote.customerId || quote.customerProfile?.id || "");
    setQuoteCustomerProfile(nextQuoteCustomerProfile);
    setProjectAddress(quote.projectAddress || getProfileAddressDisplay(nextQuoteCustomerProfile) || "");
    setQuoteDate(quote.quoteDate || getTodayDate());
    setTaxRate(Number(quote.taxRate ?? 13));
    setStartDate(quote.startDate || "");
    setItems(normalizeQuoteItems(quote.items || [], Number(quote.markupRate ?? DEFAULT_ITEM_MARKUP_RATE)));
    setSchedule(normalizeScheduleItems(quote.schedule || []));
    setDismissedSaveItemKeys([]);
    setShowDraftSchedulePreview(false);
    openQuoteBuilder();
  };

  const toggleQuoteApproval = (quoteId) => {
    const targetQuote = savedQuotes.find((quote) => quote.id === quoteId);
    const willBecomeApproved = targetQuote && targetQuote.status !== "approved";

    setSavedQuotes((previous) =>
      previous.map((quote) =>
        quote.id !== quoteId
          ? quote
          : {
              ...quote,
              status: quote.status === "approved" ? "open" : "approved",
              invoicePartNumber: quote.status === "approved" ? 1 : quote.invoicePartNumber || 1
            }
      )
    );

    if (willBecomeApproved) {
      updateContractorJobAssignment(
        targetQuote.contractorProfile,
        getContractorAssignmentDate(targetQuote)
      );
    }
  };

  const deleteUnapprovedQuote = (quoteToDelete) => {
    if (!quoteToDelete?.id) return;

    const savedQuote = savedQuotes.find((quote) => quote.id === quoteToDelete.id);
    const savedQuoteStatus = savedQuote?.status || "open";
    if (!savedQuote || savedQuoteStatus !== "open") {
      showNotification("Only quotes that have not been approved can be deleted.", "warning");
      return;
    }

    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm(`Delete "${savedQuote.projectTitle || "this quote"}"? This cannot be undone.`);

    if (!confirmed) return;

    setSavedQuotes((previous) => previous.filter((quote) => quote.id !== savedQuote.id));

    if (editingQuoteId === savedQuote.id) {
      setEditingQuoteId(null);
      setLockedQuoteViewId(null);
      startNewQuote();
      openQuotesLanding();
    }

    showNotification("Quote deleted successfully.");
  };

  const incrementQuoteInvoicePart = (quoteId) => {
    setSavedQuotes((previous) =>
      previous.map((quote) =>
        quote.id !== quoteId
          ? quote
          : {
              ...quote,
              status: "invoiced",
              invoicePartNumber: Math.max(2, Number(quote.invoicePartNumber || 1) + 1)
            }
      )
    );
  };

  const setQuoteProjectStatus = (quoteId, status) => {
    const targetQuote = savedQuotes.find((quote) => quote.id === quoteId);

    setSavedQuotes((previous) =>
      previous.map((quote) =>
        quote.id !== quoteId
          ? quote
          : {
              ...quote,
              status,
              invoicePartNumber:
                status === "invoiced"
                  ? Math.max(1, Number(quote.invoicePartNumber || 1))
                  : 1
            }
      )
    );

    if (targetQuote && status !== "open") {
      updateContractorJobAssignment(
        targetQuote.contractorProfile,
        getContractorAssignmentDate(targetQuote)
      );
    }
  };

  const statCards = [
    { label: "Price List Items", value: priceList.length },
    { label: "Quote Items", value: items.filter((item) => item.name.trim()).length },
    { label: "Project Total", value: formatMoney(totals.total) },
    { label: "Schedule Days", value: totalDuration }
  ];

  const activeQuoteRecord = editingQuoteId
    ? savedQuotes.find((quote) => quote.id === editingQuoteId)
    : null;
  const isCurrentQuoteLocked = isProjectLocked(activeQuoteRecord) || Boolean(editingQuoteId && lockedQuoteViewId === editingQuoteId);
  const isCurrentQuoteApproved = activeQuoteRecord?.status === "approved";
  const currentQuoteReference = activeQuoteRecord
    ? formatQuoteReferenceNumber({
        projectNumber: activeQuoteRecord.projectNumber,
        status: activeQuoteRecord.status || "open",
        invoicePartNumber: activeQuoteRecord.invoicePartNumber || 1
      })
    : "";
  const approvedScheduleQuotes = savedQuotes.filter((quote) =>
    ["approved", "ongoing", "completed", "invoiced"].includes(quote.status)
  );
  const selectedApprovedScheduleQuote = approvedScheduleQuotes.find(
    (quote) => quote.id === selectedScheduleQuoteId
  ) || null;

  const renderAnalysis = () => (
    <AnalysisPage
      dark={dark}
      savedQuotes={savedQuotes}
      onOpenQuotes={openQuotesLanding}
      onOpenSchedule={openScheduleLanding}
      onOpenContractors={() => setCurrentPage("contractor")}
    />
  );

  const renderDashboard = () => (
    <>
      <div className="stats-grid">
        {statCards.map((stat) => (
          <Card key={stat.label} dark={dark}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="two-col-layout">
        <Card dark={dark}>
          <h3>Current Project Snapshot</h3>
          <div className="details-list">
            <div><strong>Project:</strong> {projectTitle || "Not set"}</div>
            <div><strong>Client:</strong> {clientName || "Not set"}</div>
            <div><strong>Address:</strong> {projectAddress || "Not set"}</div>
            <div><strong>Quote Date:</strong> {quoteDate || "Not set"}</div>
            <div><strong>Start Date:</strong> {startDate || "Not set"}</div>
          </div>
        </Card>

        <Card dark={dark}>
          <h3>Quick Actions</h3>
          <div className="button-stack">
            <Button onClick={openQuoteBuilder}>Open Quote Builder</Button>
            <Button variant="secondary" onClick={openQuotesLanding}>Quotes Overview</Button>
            <Button variant="secondary" onClick={() => setCurrentPage("analysis")}>View Analysis</Button>
            <Button variant="secondary" onClick={openScheduleLanding}>View Schedules</Button>
            <Button variant="secondary" onClick={() => setCurrentPage("pricelist")}>Manage Price List</Button>
            <Button variant="secondary" onClick={() => setCurrentPage("contractor")}>Manage Contractors</Button>
            <Button variant="secondary" onClick={() => setCurrentPage("customer")}>Manage Customers</Button>
          </div>
        </Card>
      </div>

      <Card dark={dark}>
        <h3>Recent Quotes</h3>
        {savedQuotes.length === 0 ? (
          <p>No saved quotes yet.</p>
        ) : (
          <div className="list-table">
            {savedQuotes.slice(0, 5).map((quote) => (
              <div key={quote.id} className="list-row clickable" onClick={() => loadQuote(quote)}>
                <div>
                  <div className="row-title">{quote.projectTitle}</div>
                  <div className="row-subtitle">
                    {formatQuoteReferenceNumber(quote)} • {quote.clientName || "No client name"}
                  </div>
                </div>
                <div>{formatMoney(quote.totals?.total)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );

  const renderQuotes = () => (
    <>
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>{isCurrentQuoteLocked ? "Project Details" : "Project Info"}</h3>
            <p className="row-subtitle">
              {isCurrentQuoteLocked
                ? "This project is complete, so it is locked for editing."
                : "Use a template for repeat jobs like bathrooms, then add custom items if needed."}
            </p>
            {currentQuoteReference ? (
              <div className="quote-reference-line">
                Quote Reference: <strong>{currentQuoteReference}</strong>
              </div>
            ) : null}
          </div>
          {isCurrentQuoteLocked && activeQuoteRecord ? (
            <div className="button-row">
              <Button variant="secondary" onClick={() => openApprovedQuoteSchedule(activeQuoteRecord.id)}>
                View Schedule
              </Button>
            </div>
          ) : null}
          {!isCurrentQuoteApproved && !isCurrentQuoteLocked ? (
            <div className="button-row">
              <Button variant="secondary" onClick={markQuoteApproved}>✅ Mark Approved</Button>
            </div>
          ) : null}
        </div>

        <div className="grid three-col">
          <label>
            Project Title
            <Input
              placeholder="Project Title"
              value={projectTitle}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </label>
          <label>
            Customer
            <Select
              value={selectedQuoteCustomerId}
              onChange={(e) => selectQuoteCustomer(e.target.value)}
              disabled={isCurrentQuoteLocked || (!savedCustomers.length && !selectedQuoteCustomerId)}
            >
              <option value="">
                {savedCustomers.length ? "Select saved customer" : "No saved customers yet"}
              </option>
              {selectedQuoteCustomerId && !savedCustomers.some((customer) => customer.id === selectedQuoteCustomerId) && clientName ? (
                <option value={selectedQuoteCustomerId}>{clientName} (Saved On Quote)</option>
              ) : null}
              {savedCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {getCustomerDisplayName(customer)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Project Address
            <Input
              placeholder="Project Address"
              value={projectAddress}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setProjectAddress(e.target.value)}
            />
          </label>
          <label>
            Quote Date
            <Input
              type="date"
              value={quoteDate}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setQuoteDate(e.target.value)}
            />
          </label>
          <label>
            Tax:
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Tax %"
              value={getNumericInputValue(taxRate)}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setTaxRate(sanitizeNumericInput(e.target.value))}
            />
          </label>
          <label>
            Start Date
            <Input
            type="date"
            value={startDate}
            disabled={isCurrentQuoteLocked}
            onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          
        </div>
      </Card>

      {showTemplateBuilder && !isCurrentQuoteLocked && (
        <Card dark={dark} className="template-builder-card">
          <div className="section-header">
            <div>
              <h3>{PROJECT_TEMPLATES.find((template) => template.id === selectedTemplateId)?.label} Template Builder</h3>
              <p className="row-subtitle">Enter the project sizes below and the quote items will be generated automatically.</p>
            </div>
            <Button variant="danger" onClick={() => setShowTemplateBuilder(false)}>Close</Button>
          </div>

          {selectedTemplateId === "bathroom" && (
            <div className="grid template-grid">
              <Input type="text" inputMode="decimal" placeholder="Room length" value={getNumericInputValue(templateFormValues.roomLength)} onChange={(e) => updateTemplateField("roomLength", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Room width" value={getNumericInputValue(templateFormValues.roomWidth)} onChange={(e) => updateTemplateField("roomWidth", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Wall height" value={getNumericInputValue(templateFormValues.wallHeight)} onChange={(e) => updateTemplateField("wallHeight", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Vanity count" value={getNumericInputValue(templateFormValues.vanityCount)} onChange={(e) => updateTemplateField("vanityCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Toilet count" value={getNumericInputValue(templateFormValues.toiletCount)} onChange={(e) => updateTemplateField("toiletCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Shower count" value={getNumericInputValue(templateFormValues.showerCount)} onChange={(e) => updateTemplateField("showerCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Bathtub count" value={getNumericInputValue(templateFormValues.bathtubCount)} onChange={(e) => updateTemplateField("bathtubCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Door count" value={getNumericInputValue(templateFormValues.doorCount)} onChange={(e) => updateTemplateField("doorCount", e.target.value)} />
            </div>
          )}

          {selectedTemplateId === "kitchen" && (
            <div className="grid template-grid">
              <Input type="text" inputMode="decimal" placeholder="Room length" value={getNumericInputValue(templateFormValues.roomLength)} onChange={(e) => updateTemplateField("roomLength", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Room width" value={getNumericInputValue(templateFormValues.roomWidth)} onChange={(e) => updateTemplateField("roomWidth", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Wall height" value={getNumericInputValue(templateFormValues.wallHeight)} onChange={(e) => updateTemplateField("wallHeight", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Cabinet length" value={getNumericInputValue(templateFormValues.cabinetLength)} onChange={(e) => updateTemplateField("cabinetLength", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Appliance count" value={getNumericInputValue(templateFormValues.applianceCount)} onChange={(e) => updateTemplateField("applianceCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Sink count" value={getNumericInputValue(templateFormValues.sinkCount)} onChange={(e) => updateTemplateField("sinkCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Backsplash area" value={getNumericInputValue(templateFormValues.backsplashArea)} onChange={(e) => updateTemplateField("backsplashArea", e.target.value)} />
            </div>
          )}

          <div className="button-row template-actions">
            <Button onClick={applyTemplateToQuote}>Add Template Items</Button>
            <Button variant="secondary" onClick={() => setShowTemplateBuilder(false)}>Keep Editing Manually</Button>
          </div>
        </Card>
      )}

      {isCurrentQuoteLocked ? (
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Project Items</h3>
              <p className="row-subtitle">Completed projects are read-only.</p>
            </div>
          </div>

          <div className="list-table">
            {items.filter((item) => item.name?.trim()).map((item, index) => (
              <div key={`${item.itemId || item.name}-${index}`} className="list-row">
                <div>
                  <div className="row-title">{item.name}</div>
                  <div className="row-subtitle">
                    {item.roomName || "No room"} • {item.quantity} {item.unit} • {item.category} • Markup {Number(item.markupRate || 0)}%
                  </div>
                </div>
                <div>{formatMoney(getItemTotal(item))}</div>
              </div>
            ))}
          </div>

          {items.filter((item) => item.name?.trim()).length === 0 ? (
            <p className="row-subtitle">No project items were saved.</p>
          ) : null}
        </Card>
      ) : (
        <>
          <QuoteItemsTable
            dark={dark}
            items={items}
            priceList={priceList}
            projectTemplates={[]}
            onAddItem={addItem}
            onAddRoom={addRoom}
            onOpenTemplateBuilder={openTemplateBuilder}
            onGenerateSchedule={generateSchedule}
            onSaveQuote={saveQuote}
            onExportQuote={openExportModal}
            onUpdateItem={updateItem}
            onSelectPriceItem={selectPriceItem}
            isSavedPriceListItem={isSavedPriceListItem}
            activeQuoteItemIndex={activeQuoteItemIndex}
            onSetActiveQuoteItemIndex={setActiveQuoteItemIndex}
            onSaveToPriceList={saveToPriceList}
            shouldShowSaveItemButton={shouldShowSaveItemButton}
            onDismissSaveItemPrompt={dismissSaveItemPrompt}
            onSaveRoomTemplate={saveRoomTemplate}
            onRemoveItem={removeItem}
          />

          <Card dark={dark}>
            <div className="section-header">
              <div>
                <h3>Room Templates</h3>
                <p className="row-subtitle">Use the built-in templates or any saved room templates below to autofill the current quote.</p>
              </div>
            </div>

            <div className="template-button-grid">
              {savedRoomTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-button-card${dark ? " dark" : ""}`}
                  onClick={() => applySavedRoomTemplate(template.id)}
                >
                  <span className="template-button-title">{template.name}</span>
                </button>
              ))}
            </div>

            {savedRoomTemplates.length === 0 ? (
              <p className="row-subtitle room-template-empty-note">Save a room above and it will appear here as a reusable template button.</p>
            ) : null}
          </Card>
        </>
      )}

      <Card dark={dark}>
        <h3>Quote Totals</h3>
        <div className="totals-list">
          <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
          <div><span>Markup</span><strong>{formatMoney(totals.markup)}</strong></div>
          <div><span>Tax</span><strong>{formatMoney(totals.tax)}</strong></div>
          <div className="grand-total"><span>Total</span><strong>{formatMoney(totals.total)}</strong></div>
        </div>
      </Card>

      <Card dark={dark} className="quote-actions-card">
        <div className="section-header quote-actions-header">
          <div>
            <h3>Ready To Save Or Export?</h3>
            <p className="row-subtitle">
              {isCurrentQuoteLocked
                ? "This completed project can be exported, but it cannot be edited."
                : "Save this quote to keep it in the app, or export it as a file to share with your customer."}
            </p>
          </div>
          <div className="button-row">
            {!isCurrentQuoteLocked ? (
              <Button variant="secondary" onClick={saveQuote}>💾 Save Quote</Button>
            ) : null}
            <Button variant="secondary" onClick={openExportModal}>📤 Export Quote</Button>
          </div>
        </div>
      </Card>

      {showExportModal && (
        <div className="modal-backdrop" onClick={closeExportModal}>
          <div
            className={dark ? "modal-card dark" : "modal-card"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="section-header modal-header">
              <div>
                <h3>Export Quote</h3>
                <p className="row-subtitle">Choose the file type and name for this quote export.</p>
              </div>
              <Button variant="danger" onClick={closeExportModal}>Close</Button>
            </div>

            <div className="grid export-modal-grid">
              <label>
                File Name
                <Input
                  placeholder="Enter file name"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                />
              </label>

              <label>
                Format
                <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </Select>
              </label>
            </div>

            <div className="button-row modal-actions">
              <Button onClick={submitExport}>Create File</Button>
              <Button variant="secondary" onClick={closeExportModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderSchedule = () => (
    <SchedulePage
      dark={dark}
      schedule={schedule}
      approvedQuotes={approvedScheduleQuotes}
      selectedQuoteSchedule={selectedApprovedScheduleQuote}
      currentDraftSchedule={schedule}
      currentDraftTitle={projectTitle || "Current Quote Schedule"}
      currentDraftSubtitle={clientName || "No client name"}
      currentDraftStartDate={startDate}
      currentDraftQuoteDate={quoteDate}
      currentDraftProjectAddress={projectAddress}
      currentDraftTotal={totals.total}
      isViewingDraftSchedule={showDraftSchedulePreview}
      onGenerateDraftSchedule={generateSchedule}
      onGenerateQuoteSchedule={(quote) => generateScheduleForSavedQuote(quote.id)}
      onUpdateDraftScheduleTask={updateDraftScheduleTask}
      onUpdateQuoteScheduleTask={(quote, taskIndex, field, value) => updateSavedQuoteScheduleTask(quote.id, taskIndex, field, value)}
      onMarkDraftTaskCompleted={markDraftScheduleTaskCompleted}
      onMarkQuoteTaskCompleted={(quote, taskIndex) => markSavedQuoteScheduleTaskCompleted(quote.id, taskIndex)}
      onMarkDraftTaskInProgress={markDraftScheduleTaskInProgress}
      onMarkQuoteTaskInProgress={(quote, taskIndex) => markSavedQuoteScheduleTaskInProgress(quote.id, taskIndex)}
      onUpdateDraftScheduleStartDate={updateDraftScheduleStartDate}
      onUpdateQuoteScheduleStartDate={(quote, value, scheduleSnapshot) =>
        updateSavedQuoteScheduleStartDate(quote.id, value, scheduleSnapshot)}
      onReorderDraftScheduleTasks={reorderDraftScheduleTasks}
      onReorderQuoteScheduleTasks={(quote, fromIndex, toIndex, scheduleSnapshot) =>
        reorderSavedQuoteScheduleTasks(quote.id, fromIndex, toIndex, scheduleSnapshot)}
      onOpenQuoteSchedule={(quote) => openApprovedQuoteSchedule(quote.id)}
      onBackToLanding={openScheduleLanding}
    />
  );

  const renderRoomTemplateEditor = () => {
    if (!roomTemplateDraft) return null;

    return (
      <div className="room-template-inline-editor">
        <div className="section-header room-template-inline-header">
          <div>
            <h4>Edit Room Template</h4>
            <p className="row-subtitle">Update the room name and item defaults, then save the template.</p>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={saveRoomTemplateEdits}>Save Template</Button>
            <Button variant="secondary" onClick={closeRoomTemplateEditor}>Done</Button>
          </div>
        </div>

        <div className="grid three-col">
          <label>
            Template Name
            <Input
              placeholder="Template name"
              value={roomTemplateDraft.name}
              onChange={(e) => updateRoomTemplateDraft("name", e.target.value)}
            />
          </label>
        </div>

        <div className="room-template-editor">
          <div className="room-template-editor-header">
            <div>Item</div>
            <div>Qty</div>
            <div>Unit</div>
            <div>Category</div>
            <div>Price</div>
            <div>Markup</div>
            <div>Days</div>
            <div>Actions</div>
          </div>

          {roomTemplateDraft.items.map((item, index) => (
            <div key={item.itemId || `room-template-item-${index}`} className="room-template-editor-row">
              <Input
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateRoomTemplateDraftItem(index, "name", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                value={getNumericInputValue(item.quantity)}
                onChange={(e) => updateRoomTemplateDraftItem(index, "quantity", e.target.value)}
              />
              <Select
                value={item.unit}
                onChange={(e) => updateRoomTemplateDraftItem(index, "unit", e.target.value)}
              >
                {UNIT_OPTIONS.map((unitOption) => (
                  <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>
                ))}
              </Select>
              <Select
                value={item.category}
                onChange={(e) => updateRoomTemplateDraftItem(index, "category", e.target.value)}
              >
                <option value="Labor">Labor</option>
                <option value="Material">Material</option>
                <option value="Equipment">Equipment</option>
              </Select>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="$0.00"
                value={getNumericInputValue(item.pricePerUnit, { hideZero: true })}
                onChange={(e) => updateRoomTemplateDraftItem(index, "pricePerUnit", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Markup %"
                value={getNumericInputValue(item.markupRate)}
                onChange={(e) => updateRoomTemplateDraftItem(index, "markupRate", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Days"
                value={getNumericInputValue(item.duration)}
                onChange={(e) => updateRoomTemplateDraftItem(index, "duration", e.target.value)}
              />
              <Button variant="danger" onClick={() => removeRoomTemplateDraftItem(index)}>Delete</Button>
            </div>
          ))}
        </div>

        <div className="button-row template-actions">
          <Button onClick={addRoomTemplateDraftItem}>Add Template Item</Button>
          <Button variant="secondary" onClick={saveRoomTemplateEdits}>Save Template</Button>
        </div>
      </div>
    );
  };

  const renderPriceList = () => (
    <>
      <Card dark={dark}>
        <h3>Add Price List Item</h3>
        <div className="grid price-grid">
          <label className="price-field-label">
            Item
            <Input placeholder="Item name" value={newPriceItem.name} onChange={(e) => setNewPriceItem((previous) => ({ ...previous, name: e.target.value }))} />
          </label>
          <label className="price-field-label">
            Unit
            <Select value={newPriceItem.unit} onChange={(e) => setNewPriceItem((previous) => ({ ...previous, unit: e.target.value }))}>
              {UNIT_OPTIONS.map((unitOption) => (
                <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>
              ))}
            </Select>
          </label>
          <label className="price-field-label">
            Category
            <Select value={newPriceItem.category} onChange={(e) => setNewPriceItem((previous) => ({ ...previous, category: e.target.value }))}>
              <option value="Labor">Labor</option>
              <option value="Material">Material</option>
              <option value="Equipment">Equipment</option>
            </Select>
          </label>
          <label className="price-field-label">
            Price
            <Input
              type="text"
              inputMode="decimal"
              placeholder="$0.00"
              value={getNumericInputValue(newPriceItem.pricePerUnit, { hideZero: true })}
              onChange={(e) => setNewPriceItem((previous) => ({ ...previous, pricePerUnit: sanitizeNumericInput(e.target.value) }))}
            />
          </label>
          <label className="price-field-label">
            Days
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Days"
              value={getNumericInputValue(newPriceItem.duration)}
              onChange={(e) => setNewPriceItem((previous) => ({ ...previous, duration: sanitizeNumericInput(e.target.value) }))}
            />
          </label>
          <div className="price-action-column">
            <span>Actions</span>
            <div className="button-row price-list-edit-actions">
              <Button onClick={addManualPriceListItem}>Add Item</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card dark={dark}>
        <h3>Stored Price List</h3>
        {priceList.length === 0 ? (
          <p>No items in the price list yet.</p>
        ) : (
          <div className="list-table">
            {priceList.map((item) => {
              const isEditingPriceItem = editingPriceItemName === item.name;

              return (
                <div key={item.name} className={`list-row price-list-row${isEditingPriceItem ? " editing" : ""}`}>
                  {isEditingPriceItem ? (
                    <div className="price-list-edit-row">
                      <label className="price-field-label">
                        Item
                        <Input
                          placeholder="Item name"
                          value={priceItemDraft.name}
                          onChange={(e) => updatePriceItemDraft("name", e.target.value)}
                        />
                      </label>
                      <label className="price-field-label">
                        Unit
                        <Select
                          value={priceItemDraft.unit}
                          onChange={(e) => updatePriceItemDraft("unit", e.target.value)}
                        >
                          {UNIT_OPTIONS.map((unitOption) => (
                            <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="price-field-label">
                        Category
                        <Select
                          value={priceItemDraft.category}
                          onChange={(e) => updatePriceItemDraft("category", e.target.value)}
                        >
                          <option value="Labor">Labor</option>
                          <option value="Material">Material</option>
                          <option value="Equipment">Equipment</option>
                        </Select>
                      </label>
                      <label className="price-field-label">
                        Price
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="$0.00"
                          value={getNumericInputValue(priceItemDraft.pricePerUnit, { hideZero: true })}
                          onChange={(e) => updatePriceItemDraft("pricePerUnit", e.target.value)}
                        />
                      </label>
                      <label className="price-field-label">
                        Days
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Days"
                          value={getNumericInputValue(priceItemDraft.duration)}
                          onChange={(e) => updatePriceItemDraft("duration", e.target.value)}
                        />
                      </label>
                      <div className="price-action-column price-edit-action-column">
                        <span>Actions</span>
                        <div className="button-row price-list-edit-actions">
                          <Button variant="secondary" onClick={savePriceListItemEdits}>Save</Button>
                          <Button variant="secondary" onClick={cancelEditingPriceListItem}>Cancel</Button>
                          <Button variant="danger" onClick={() => deletePriceListItem(item.name)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="row-title">{item.name}</div>
                        <div className="row-subtitle">
                          {item.category} • {item.duration} day(s) • {UNIT_OPTIONS.find((unitOption) => unitOption.value === item.unit)?.label || item.unit}
                        </div>
                      </div>
                      <div className="price-list-actions">
                        <span>{formatMoney(item.pricePerUnit)}</span>
                        <Button variant="secondary" onClick={() => startEditingPriceListItem(item)}>Edit</Button>
                        <Button variant="danger" onClick={() => deletePriceListItem(item.name)}>Delete</Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Saved Room Templates</h3>
            <p className="row-subtitle">Save rooms from the quote page, then review and update those templates here.</p>
          </div>
        </div>

        {savedRoomTemplates.length === 0 ? (
          <p>No saved room templates yet.</p>
        ) : (
          <div className="list-table">
            {savedRoomTemplates.map((template) => {
              const isEditingTemplate = editingRoomTemplateId === template.id && roomTemplateDraft;

              return (
                <div key={template.id} className={`list-row room-template-list-row${isEditingTemplate ? " editing" : ""}`}>
                  {isEditingTemplate ? (
                    renderRoomTemplateEditor()
                  ) : (
                    <>
                      <div>
                        <div className="directory-title-row">
                          <div className="row-title">{template.name}</div>
                          {template.builtIn ? (
                            <span className="status-pill approved">Preinstalled</span>
                          ) : null}
                        </div>
                        <div className="row-subtitle">
                          {(template.items || []).length} item(s) • Updated {template.updatedAt || "Recently"}
                        </div>
                      </div>
                      <div className="button-row">
                        <Button variant="secondary" onClick={() => openRoomTemplateEditor(template.id)}>Edit Template</Button>
                        {!template.builtIn ? (
                          <Button variant="danger" onClick={() => deleteRoomTemplate(template.id)}>Delete</Button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );

  const renderContractor = () => (
    <ContractorPage
      dark={dark}
      savedContractors={savedContractors}
      contractorDraft={contractorDraft}
      selectedContractorId={selectedContractorId}
      isEditingContractor={isEditingContractor}
      showContractorNotes={showContractorNotes}
      contractorExpirySettings={contractorExpirySettings}
      onUpdateContractorProfile={updateContractorProfile}
      onSaveContractor={saveContractorProfile}
      onCancelContractorEditing={cancelContractorEditing}
      onSelectContractor={selectContractor}
      onStartNewContractor={startNewContractor}
      onStartEditingContractor={startEditingContractor}
      onToggleContractorNotes={() => setShowContractorNotes((previous) => !previous)}
      onOpenQuotes={openQuotesLanding}
    />
  );

  const renderCustomer = () => (
    <CustomerPage
      dark={dark}
      savedCustomers={savedCustomers}
      savedQuotes={savedQuotes}
      customerDraft={customerDraft}
      selectedCustomerId={selectedCustomerId}
      isEditingCustomer={isEditingCustomer}
      showCustomerNotes={showCustomerNotes}
      customerJobViews={customerJobViews}
      onUpdateCustomerProfile={updateCustomerProfile}
      onSaveCustomer={saveCustomerProfile}
      onCancelCustomerEditing={cancelCustomerEditing}
      onSelectCustomer={selectCustomer}
      onToggleCustomerJobView={toggleCustomerJobView}
      onStartNewCustomer={startNewCustomer}
      onStartEditingCustomer={startEditingCustomer}
      onToggleCustomerNotes={() => setShowCustomerNotes((previous) => !previous)}
      onOpenQuotes={openQuotesLanding}
      onOpenCustomerQuotes={openCustomerQuotesLanding}
      onLoadQuote={loadQuote}
    />
  );

  const renderSettings = () => (
    <Card dark={dark}>
      <h3>Settings</h3>
      <div className="settings-group">
        <label>Theme Mode</label>
        <div className="button-row">
          <Button variant={themeMode === "light" ? "primary" : "secondary"} onClick={() => setThemeMode("light")}>Light</Button>
          <Button variant={themeMode === "dark" ? "primary" : "secondary"} onClick={() => setThemeMode("dark")}>Dark</Button>
          <Button variant={themeMode === "system" ? "primary" : "secondary"} onClick={() => setThemeMode("system")}>System</Button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-expiry-row">
          <div className="settings-row-label">Contractor Auto-Expiry</div>
          <div className="settings-expiry-controls">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={contractorExpirySettings.enabled}
                onChange={(event) =>
                  updateContractorExpirySettings((previous) =>
                    getContractorExpirySettings({
                      ...previous,
                      enabled: event.target.checked
                    })
                  )}
              />
              Enable contractor auto-expiry
            </label>

            {contractorExpirySettings.enabled ? (
              <>
                <label className="settings-expiry-field">
                  Amount
                  <Select
                    value={contractorExpirySettings.amount}
                    onChange={(event) =>
                      updateContractorExpirySettings((previous) =>
                        getContractorExpirySettings({
                          ...previous,
                          amount: Number(event.target.value)
                        })
                      )}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((amount) => (
                      <option key={amount} value={amount}>{amount}</option>
                    ))}
                  </Select>
                </label>

                <label className="settings-expiry-field">
                  Unit
                  <Select
                    value={contractorExpirySettings.unit}
                    onChange={(event) =>
                      updateContractorExpirySettings((previous) =>
                        getContractorExpirySettings({
                          ...previous,
                          unit: event.target.value
                        })
                      )}
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </Select>
                </label>
              </>
            ) : null}
          </div>
        </div>

        <p className="row-subtitle">
          Contractors become inactive after the selected time from their last assigned job.
        </p>
      </div>

      <div className="settings-group">
        <label>Storage</label>
        <div className="button-row">
          <Button
            variant="danger"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("contractorProfile");
                localStorage.removeItem("savedContractors");
                localStorage.removeItem("customerProfile");
                localStorage.removeItem("savedCustomers");
                localStorage.removeItem("priceList");
                localStorage.removeItem("savedRoomTemplates");
                localStorage.removeItem("savedQuotes");
                localStorage.removeItem("contractorExpirySettings");
              }
              const defaultContractorExpirySettings = { ...DEFAULT_CONTRACTOR_EXPIRY_SETTINGS };
              setContractorExpirySettings(defaultContractorExpirySettings);
              setContractorProfile(normalizeContractorProfile({}, defaultContractorExpirySettings));
              setSavedContractors([]);
              setContractorDraft(normalizeContractorProfile({}, defaultContractorExpirySettings));
              setSelectedContractorId(null);
              setIsEditingContractor(false);
              setSavedCustomers([]);
              setCustomerProfile({ ...EMPTY_CUSTOMER_PROFILE });
              setCustomerDraft({ ...EMPTY_CUSTOMER_PROFILE });
              setSelectedCustomerId(null);
              setIsEditingCustomer(true);
              setShowCustomerNotes(false);
              setPriceList([]);
              setSavedRoomTemplates([]);
              setEditingRoomTemplateId(null);
              setRoomTemplateDraft(null);
              setSavedQuotes([]);
              setEditingQuoteId(null);
              setQuotesView("landing");
            }}
          >
            Clear Saved Data
          </Button>
        </div>
      </div>
    </Card>
  );

  const MotionDiv = motion.div;

  return (
    <>
      <style>{APP_STYLES}</style>
      <div className={dark ? "app-shell dark" : "app-shell"}>
        <aside className="sidebar">
          <div>
            <h2 className="sidebar-title">🏗️</h2>
            <p className="sidebar-subtitle">Construction quoting and scheduling</p>
          </div>

          <nav className="nav-list">
            {PAGE_OPTIONS.map((page) => (
              <button
                key={page.id}
                className={`nav-item ${currentPage === page.id ? "active" : ""}`}
                type="button"
                onClick={() => {
                  if (page.id === "quotes") {
                    openQuotesLanding();
                    return;
                  }
                  if (page.id === "schedule") {
                    openScheduleLanding();
                    return;
                  }
                  setCurrentPage(page.id);
                }}
              >
                {page.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <div>
                <h1>🏗️ Construction Quote Generator</h1>
                <p>Build quotes, manage pricing, and generate project schedules.</p>
              </div>
            </div>

            {currentPage === "dashboard" && renderDashboard()}
            {currentPage === "analysis" && renderAnalysis()}
            {currentPage === "contractor" && renderContractor()}
            {currentPage === "customer" && renderCustomer()}
            {currentPage === "quotes" && quotesView === "landing" && (
              <QuotesLandingPage
                key={`${quotesCustomerFilter?.id || quotesCustomerFilter?.label || "all"}:${quotesInitialProjectList || "approved"}`}
                dark={dark}
                savedQuotes={savedQuotes}
                customerFilter={quotesCustomerFilter}
                initialProjectList={quotesInitialProjectList}
                onClearCustomerFilter={() => {
                  setQuotesCustomerFilter(null);
                  setQuotesInitialProjectList("");
                }}
                onNewQuote={startNewQuote}
                onOpenQuote={loadQuote}
                onOpenQuoteSchedule={(quote) => openApprovedQuoteSchedule(quote.id)}
                onToggleQuoteApproval={toggleQuoteApproval}
                onDeleteQuote={deleteUnapprovedQuote}
                onIncrementQuoteInvoicePart={incrementQuoteInvoicePart}
                onSetQuoteProjectStatus={setQuoteProjectStatus}
              />
            )}
            {currentPage === "quotes" && quotesView === "builder" && renderQuotes()}
            {currentPage === "schedule" && renderSchedule()}
            {currentPage === "pricelist" && renderPriceList()}
            {currentPage === "settings" && renderSettings()}
          </MotionDiv>
        </main>
      </div>
      {notification ? (
        <div className={`app-notification ${notification.variant}`} role="status" aria-live="polite">
          <span>{notification.message}</span>
          <button
            type="button"
            className="app-notification-close"
            aria-label="Dismiss notification"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
