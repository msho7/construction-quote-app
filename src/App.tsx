// @ts-nocheck
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import {
  PROJECT_TEMPLATES,
  DEFAULT_ITEM_MARKUP_RATE,
  EMPTY_PRICE_ITEM,
  DEFAULT_TEMPLATE_VALUES
} from "./constants/appConstants";
import {
  safeJsonParse,
  formatMoney,
  toDateInputValue,
  getNextBusinessDate,
  getScheduleEndDate,
  getItemBaseTotal,
  getItemMarkupAmount,
  mergeTemplateItemsWithPriceList,
  sanitizeNumericInput,
  formatQuoteReferenceNumber,
  getNextQuoteProjectNumber,
  normalizeSavedQuoteReferences,
  createTemplateItems
} from "./utils/appUtils";
import { getTodayDate } from "./utils/dateUtils";
import {
  getDashboardRecords,
  getQuoteLocation,
  getQuoteScheduleStatus as getDashboardQuoteScheduleStatus
} from "./utils/dashboardUtils";
import { createQuoteId, createRoomId, createRoomTemplateId } from "./utils/idUtils";
import { getNormalizedItemName, getNormalizedText } from "./utils/textUtils";
import {
  COMPANY_TYPE_OPTIONS,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_CONTRACTOR_EXPIRY_SETTINGS,
  EMPTY_CONTRACTOR_PROFILE,
  EMPTY_CUSTOMER_PROFILE,
  createSavedContractorRecord,
  createSavedCustomerRecord,
  getCompanySettings,
  getContractorExpirySettings,
  getCustomerDisplayName,
  getInitialContractorProfile,
  getInitialCustomerProfile,
  getInitialSavedContractors,
  getInitialSavedCustomers,
  getProfileAddressDisplay,
  hasContractorProfileData,
  hasCustomerProfileData,
  isProjectLocked,
  normalizeContractorProfile,
  normalizeCustomerRecord
} from "./utils/profileUtils";
import {
  assignContractorsToSchedule,
  buildScheduleFromItems,
  getContractorTradeList,
  getScheduleTaskWithContractor,
  getSuggestedTradeForTask,
  markScheduleTaskCompletedInCollection,
  markScheduleTaskInProgressInCollection,
  normalizeScheduleItems,
  preserveScheduleCompletionState,
  reorderCollectionBeforeIndex,
  resequenceScheduleItems,
  syncQuoteItemsToSchedule
} from "./utils/scheduleUtils";
import { createEmptyQuoteItem, normalizeQuoteItems } from "./utils/quoteItemUtils";
import {
  createEmptyRoomTemplateItem,
  isBuiltInRoomTemplateId,
  mergeSavedRoomTemplatesWithBuiltIns,
  normalizeRoomTemplateItems,
  serializeRoomTemplateItems
} from "./utils/roomTemplateUtils";
import {
  normalizeRemoteSavedContractors,
  normalizeRemoteSavedCustomers,
  normalizeRemoteSavedQuotes,
  persistAppStateToLocalStorage
} from "./utils/storageUtils";
import { exportQuoteToExcel, exportQuoteToPdf } from "./utils/exportUtils";
import {
  getCurrentQuoteTakeoffPayload as buildCurrentQuoteTakeoffPayload,
  getDefaultExportFileName as buildDefaultExportFileName,
  getQuoteDocumentPayload as buildQuoteDocumentPayload
} from "./utils/quotePayloadUtils";
import { Card } from "./components/ui";
import AnalysisPage from "./components/analysis/AnalysisPage";
import CustomerPage from "./components/customer/CustomerPage";
import DashboardHomePage from "./components/dashboard/DashboardHomePage";
import AppShell from "./components/layout/AppShell";
import PriceListPage from "./components/pricelist/PriceListPage";
import QuoteBuilderPage from "./components/quotes/QuoteBuilderPage";
import QuotesLandingPage from "./components/quotes/QuotesLandingPage";
import SchedulePage from "./components/schedule/SchedulePage";
import ServerPage from "./components/server/ServerPage";
import SettingsPage from "./components/settings/SettingsPage";
import MaterialTakeoffPage from "./components/takeoff/MaterialTakeoffPage";

const ContractorPage = lazy(() => import("./components/contractor/ContractorPage"));

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
  const [companySettings, setCompanySettings] = useState(() => {
    if (typeof window === "undefined") return { ...DEFAULT_COMPANY_SETTINGS };
    return getCompanySettings(
      safeJsonParse(localStorage.getItem("companySettings"), DEFAULT_COMPANY_SETTINGS)
    );
  });

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [navigationOpen, setNavigationOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("navigationOpen") === "true";
  });
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
  const [selectedTakeoffQuoteId, setSelectedTakeoffQuoteId] = useState(null);
  const [selectedTakeoffQuoteDraft, setSelectedTakeoffQuoteDraft] = useState(null);
  const [showDraftSchedulePreview, setShowDraftSchedulePreview] = useState(false);
  const [quotesCustomerFilter, setQuotesCustomerFilter] = useState(null);
  const [quotesInitialProjectList, setQuotesInitialProjectList] = useState("");
  const [dashboardDetailView, setDashboardDetailView] = useState("");
  const [notification, setNotification] = useState(null);
  const [serverStatus, setServerStatus] = useState({
    loading: false,
    data: null,
    error: ""
  });
  const [storageStatus, setStorageStatus] = useState({
    loading: true,
    connected: false,
    saving: false,
    lastSavedAt: "",
    error: ""
  });
  const [remoteStorageReady, setRemoteStorageReady] = useState(false);
  const notificationTimeoutRef = useRef(null);

  const showNotification = (message, variant = "success") => {
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({
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
    let cancelled = false;

    const loadRemoteAppState = async () => {
      try {
        const response = await fetch("/api/app-state");
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Could not load MongoDB app data.");
        }

        if (cancelled) return;

        const remoteState = payload.state || {};

        if (Object.prototype.hasOwnProperty.call(remoteState, "themeMode")) {
          setThemeMode(["light", "dark", "system"].includes(remoteState.themeMode) ? remoteState.themeMode : "system");
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "navigationOpen")) {
          setNavigationOpen(Boolean(remoteState.navigationOpen));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "contractorExpirySettings")) {
          setContractorExpirySettings(getContractorExpirySettings(remoteState.contractorExpirySettings));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "companySettings")) {
          setCompanySettings(getCompanySettings(remoteState.companySettings));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "savedContractors")) {
          setSavedContractors(normalizeRemoteSavedContractors(remoteState.savedContractors));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "contractorProfile")) {
          setContractorProfile(normalizeContractorProfile(remoteState.contractorProfile));
          setContractorDraft(normalizeContractorProfile(remoteState.contractorProfile));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "savedCustomers")) {
          setSavedCustomers(normalizeRemoteSavedCustomers(remoteState.savedCustomers));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "customerProfile")) {
          setCustomerProfile(normalizeCustomerRecord(remoteState.customerProfile));
          setCustomerDraft(normalizeCustomerRecord(remoteState.customerProfile));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "savedQuotes")) {
          setSavedQuotes(normalizeRemoteSavedQuotes(remoteState.savedQuotes));
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "priceList")) {
          setPriceList(Array.isArray(remoteState.priceList) ? remoteState.priceList : []);
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "savedRoomTemplates")) {
          setSavedRoomTemplates(mergeSavedRoomTemplatesWithBuiltIns(
            Array.isArray(remoteState.savedRoomTemplates) ? remoteState.savedRoomTemplates : []
          ));
        }

        setStorageStatus({
          loading: false,
          connected: true,
          saving: false,
          lastSavedAt: "",
          error: ""
        });
        setRemoteStorageReady(true);
      } catch (error) {
        if (cancelled) return;

        setStorageStatus({
          loading: false,
          connected: false,
          saving: false,
          lastSavedAt: "",
          error: error.message
        });
        setRemoteStorageReady(true);
      }
    };

    loadRemoteAppState();

    return () => {
      cancelled = true;
    };
  }, []);

  const appStatePayload = useMemo(() => ({
    companySettings,
    contractorExpirySettings: getContractorExpirySettings(contractorExpirySettings),
    contractorProfile,
    customerProfile,
    navigationOpen,
    priceList,
    savedContractors,
    savedCustomers,
    savedQuotes,
    savedRoomTemplates: savedRoomTemplates.filter((template) => !template.builtIn),
    themeMode
  }), [
    companySettings,
    contractorExpirySettings,
    contractorProfile,
    customerProfile,
    navigationOpen,
    priceList,
    savedContractors,
    savedCustomers,
    savedQuotes,
    savedRoomTemplates,
    themeMode
  ]);

  useEffect(() => {
    persistAppStateToLocalStorage(appStatePayload);

    if (!remoteStorageReady) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setStorageStatus((previousStatus) => ({
        ...previousStatus,
        saving: true,
        error: ""
      }));

      try {
        const response = await fetch("/api/app-state", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ state: appStatePayload }),
          signal: controller.signal
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Could not save app data to MongoDB.");
        }

        setStorageStatus({
          loading: false,
          connected: true,
          saving: false,
          lastSavedAt: payload.updatedAt || new Date().toISOString(),
          error: ""
        });
      } catch (error) {
        if (error.name === "AbortError") return;

        setStorageStatus((previousStatus) => ({
          ...previousStatus,
          loading: false,
          connected: false,
          saving: false,
          error: error.message
        }));
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [appStatePayload, remoteStorageReady]);

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

  const openMaterialTakeoff = (quoteId, quoteDraft = null) => {
    setSelectedTakeoffQuoteId(quoteId);
    setSelectedTakeoffQuoteDraft(quoteDraft);
    setCurrentPage("takeoff");
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

    const regeneratedSchedule = assignContractorsToSchedule(
      preserveScheduleCompletionState(
        buildScheduleFromItems(savedQuote.items || [], savedQuote.startDate),
        savedQuote.schedule || []
      ),
      savedContractors
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

  const addTradeToContractorIfNeeded = (contractorId, trade) => {
    const normalizedTrade = String(trade || "").trim();
    if (!contractorId || !normalizedTrade) return;

    setSavedContractors((previous) =>
      previous.map((contractor) => {
        if (contractor.id !== contractorId) return contractor;

        const tradeList = getContractorTradeList(contractor);
        const alreadyHasTrade = tradeList.some((contractorTrade) =>
          contractorTrade.toLowerCase() === normalizedTrade.toLowerCase()
        );

        if (alreadyHasTrade) return contractor;

        return normalizeContractorProfile({
          ...contractor,
          trade: [...tradeList, normalizedTrade].join(", ")
        }, contractorExpirySettings);
      })
    );
  };

  const assignDraftScheduleTaskContractor = (taskIndex, contractorId) => {
    const selectedContractor = savedContractors.find((contractor) => contractor.id === contractorId) || null;
    let taskTrade = "";

    setSchedule((previous) =>
      normalizeScheduleItems(
        previous.map((task, index) => {
          if (index !== taskIndex) return task;
          taskTrade = task.suggestedTrade || getSuggestedTradeForTask(task);
          return getScheduleTaskWithContractor(task, selectedContractor);
        })
      )
    );

    addTradeToContractorIfNeeded(contractorId, taskTrade);
  };

  const assignSavedQuoteScheduleTaskContractor = (quoteId, taskIndex, contractorId) => {
    const selectedContractor = savedContractors.find((contractor) => contractor.id === contractorId) || null;
    let taskTrade = "";

    setSavedQuotes((previous) =>
      previous.map((quote) => {
        if (quote.id !== quoteId) return quote;

        return {
          ...quote,
          schedule: normalizeScheduleItems(
            (quote.schedule || []).map((task, index) => {
              if (index !== taskIndex) return task;
              taskTrade = task.suggestedTrade || getSuggestedTradeForTask(task);
              return getScheduleTaskWithContractor(task, selectedContractor);
            })
          )
        };
      })
    );

    addTradeToContractorIfNeeded(contractorId, taskTrade);
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

  const getQuotePayloadContext = () => ({
    editingQuoteId,
    savedQuotes,
    quoteCustomerProfile,
    contractorProfile,
    contractorExpirySettings,
    projectTitle,
    clientName,
    selectedQuoteCustomerId,
    projectAddress,
    quoteDate,
    startDate,
    taxRate,
    items,
    totals,
    schedule,
    savedContractors,
    showNotification
  });

  const getCurrentQuoteTakeoffPayload = () =>
    buildCurrentQuoteTakeoffPayload(getQuotePayloadContext());

  const getQuoteDocumentPayload = () =>
    buildQuoteDocumentPayload(getQuotePayloadContext());

  const getDefaultExportFileName = () =>
    buildDefaultExportFileName({ projectTitle, savedQuotes });

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

  const generateSchedule = () => {
    if (!startDate) {
      showNotification("Please select a start date.", "warning");
      return;
    }

    const newSchedule = assignContractorsToSchedule(
      buildScheduleFromItems(items, startDate),
      savedContractors
    );

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
      id: existingQuote?.id || createQuoteId(),
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
      schedule: assignContractorsToSchedule(schedule, savedContractors)
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
  const savedTakeoffQuote = savedQuotes.find((quote) => quote.id === selectedTakeoffQuoteId) || null;
  const selectedTakeoffQuote = selectedTakeoffQuoteDraft || savedTakeoffQuote || null;
  const todayDate = getTodayDate();
  const {
    openQuoteRecords,
    ongoingJobRecords,
    onTimeJobRecords,
    delayedJobRecords,
    dashboardDetailConfig
  } = getDashboardRecords(savedQuotes, todayDate);
  const getQuoteScheduleStatus = (quote = {}) => getDashboardQuoteScheduleStatus(quote, todayDate);
  const activeDashboardDetail = dashboardDetailView ? dashboardDetailConfig[dashboardDetailView] : null;

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
    <DashboardHomePage
      dark={dark}
      savedQuotes={savedQuotes}
      ongoingJobRecords={ongoingJobRecords}
      onTimeJobRecords={onTimeJobRecords}
      delayedJobRecords={delayedJobRecords}
      openQuoteRecords={openQuoteRecords}
      activeDashboardDetail={activeDashboardDetail}
      getQuoteLocation={getQuoteLocation}
      getQuoteScheduleStatus={getQuoteScheduleStatus}
      onSetDashboardDetailView={setDashboardDetailView}
      onStartNewQuote={startNewQuote}
      onOpenScheduleLanding={openScheduleLanding}
      onOpenQuotesLanding={openQuotesLanding}
      onOpenPriceList={() => setCurrentPage("pricelist")}
      onOpenContractors={() => setCurrentPage("contractor")}
      onOpenCustomers={() => setCurrentPage("customer")}
      onOpenApprovedQuoteSchedule={openApprovedQuoteSchedule}
      onLoadQuote={loadQuote}
    />
  );

  const renderQuotes = () => (
    <QuoteBuilderPage
      dark={dark}
      isCurrentQuoteLocked={isCurrentQuoteLocked}
      currentQuoteReference={currentQuoteReference}
      activeQuoteRecord={activeQuoteRecord}
      isCurrentQuoteApproved={isCurrentQuoteApproved}
      savedCustomers={savedCustomers}
      selectedQuoteCustomerId={selectedQuoteCustomerId}
      clientName={clientName}
      projectTitle={projectTitle}
      projectAddress={projectAddress}
      quoteDate={quoteDate}
      taxRate={taxRate}
      startDate={startDate}
      showTemplateBuilder={showTemplateBuilder}
      selectedTemplateId={selectedTemplateId}
      templateFormValues={templateFormValues}
      items={items}
      priceList={priceList}
      activeQuoteItemIndex={activeQuoteItemIndex}
      savedRoomTemplates={savedRoomTemplates}
      totals={totals}
      showExportModal={showExportModal}
      exportFileName={exportFileName}
      exportFormat={exportFormat}
      openQuotesLanding={openQuotesLanding}
      openApprovedQuoteSchedule={openApprovedQuoteSchedule}
      openMaterialTakeoff={openMaterialTakeoff}
      getCurrentQuoteTakeoffPayload={getCurrentQuoteTakeoffPayload}
      markQuoteApproved={markQuoteApproved}
      deleteUnapprovedQuote={deleteUnapprovedQuote}
      setProjectTitle={setProjectTitle}
      selectQuoteCustomer={selectQuoteCustomer}
      setProjectAddress={setProjectAddress}
      setQuoteDate={setQuoteDate}
      setTaxRate={setTaxRate}
      setStartDate={setStartDate}
      setShowTemplateBuilder={setShowTemplateBuilder}
      updateTemplateField={updateTemplateField}
      applyTemplateToQuote={applyTemplateToQuote}
      addItem={addItem}
      addRoom={addRoom}
      openTemplateBuilder={openTemplateBuilder}
      generateSchedule={generateSchedule}
      saveQuote={saveQuote}
      openExportModal={openExportModal}
      updateItem={updateItem}
      selectPriceItem={selectPriceItem}
      isSavedPriceListItem={isSavedPriceListItem}
      setActiveQuoteItemIndex={setActiveQuoteItemIndex}
      saveToPriceList={saveToPriceList}
      shouldShowSaveItemButton={shouldShowSaveItemButton}
      dismissSaveItemPrompt={dismissSaveItemPrompt}
      saveRoomTemplate={saveRoomTemplate}
      removeItem={removeItem}
      applySavedRoomTemplate={applySavedRoomTemplate}
      closeExportModal={closeExportModal}
      setExportFileName={setExportFileName}
      setExportFormat={setExportFormat}
      submitExport={submitExport}
    />
  );

  const renderSchedule = () => (
    <SchedulePage
      dark={dark}
      schedule={schedule}
      savedContractors={savedContractors}
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
      onAssignDraftTaskContractor={assignDraftScheduleTaskContractor}
      onAssignQuoteTaskContractor={(quote, taskIndex, contractorId) =>
        assignSavedQuoteScheduleTaskContractor(quote.id, taskIndex, contractorId)}
      onUpdateDraftScheduleStartDate={updateDraftScheduleStartDate}
      onUpdateQuoteScheduleStartDate={(quote, value, scheduleSnapshot) =>
        updateSavedQuoteScheduleStartDate(quote.id, value, scheduleSnapshot)}
      onReorderDraftScheduleTasks={reorderDraftScheduleTasks}
      onReorderQuoteScheduleTasks={(quote, fromIndex, toIndex, scheduleSnapshot) =>
        reorderSavedQuoteScheduleTasks(quote.id, fromIndex, toIndex, scheduleSnapshot)}
      onOpenQuote={loadQuote}
      onOpenQuoteSchedule={(quote) => openApprovedQuoteSchedule(quote.id)}
      onBackToLanding={openScheduleLanding}
    />
  );

  const renderTakeoff = () => (
    <MaterialTakeoffPage
      dark={dark}
      quote={selectedTakeoffQuote}
      savedQuote={savedTakeoffQuote}
      priceList={priceList}
      onBack={openQuotesLanding}
      onOpenQuote={loadQuote}
    />
  );

  const renderPriceList = () => (
    <PriceListPage
      dark={dark}
      newPriceItem={newPriceItem}
      setNewPriceItem={setNewPriceItem}
      addManualPriceListItem={addManualPriceListItem}
      priceList={priceList}
      editingPriceItemName={editingPriceItemName}
      priceItemDraft={priceItemDraft}
      updatePriceItemDraft={updatePriceItemDraft}
      savePriceListItemEdits={savePriceListItemEdits}
      cancelEditingPriceListItem={cancelEditingPriceListItem}
      deletePriceListItem={deletePriceListItem}
      startEditingPriceListItem={startEditingPriceListItem}
      savedRoomTemplates={savedRoomTemplates}
      editingRoomTemplateId={editingRoomTemplateId}
      roomTemplateDraft={roomTemplateDraft}
      openRoomTemplateEditor={openRoomTemplateEditor}
      closeRoomTemplateEditor={closeRoomTemplateEditor}
      saveRoomTemplateEdits={saveRoomTemplateEdits}
      updateRoomTemplateDraft={updateRoomTemplateDraft}
      updateRoomTemplateDraftItem={updateRoomTemplateDraftItem}
      removeRoomTemplateDraftItem={removeRoomTemplateDraftItem}
      addRoomTemplateDraftItem={addRoomTemplateDraftItem}
      deleteRoomTemplate={deleteRoomTemplate}
    />
  );

  const renderContractor = () => (
    <Suspense fallback={<Card dark={dark}>Loading contractors...</Card>}>
      <ContractorPage
        dark={dark}
        savedContractors={savedContractors}
        contractorDraft={contractorDraft}
        selectedContractorId={selectedContractorId}
        isEditingContractor={isEditingContractor}
        showContractorNotes={showContractorNotes}
        companyType={companySettings.companyType}
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
    </Suspense>
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

  const checkServerMongoConnection = async () => {
    setServerStatus({
      loading: true,
      data: null,
      error: ""
    });

    try {
      const response = await fetch("/api/mongodb/status");
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "MongoDB connection failed.");
      }

      setServerStatus({
        loading: false,
        data: payload,
        error: ""
      });
      showNotification("MongoDB connection verified.");
    } catch (error) {
      setServerStatus({
        loading: false,
        data: null,
        error: error.message
      });
      showNotification("MongoDB connection failed.", "warning");
    }
  };

  const renderServer = () => (
    <ServerPage
      dark={dark}
      serverStatus={serverStatus}
      storageStatus={storageStatus}
      onCheckServerMongoConnection={checkServerMongoConnection}
    />
  );

  const renderSettings = () => (
    <SettingsPage
      dark={dark}
      themeMode={themeMode}
      companySettings={companySettings}
      contractorExpirySettings={contractorExpirySettings}
      onSetThemeMode={setThemeMode}
      onSetCompanySettings={setCompanySettings}
      onUpdateContractorExpirySettings={updateContractorExpirySettings}
      onSetContractorExpirySettings={setContractorExpirySettings}
      onSetContractorProfile={setContractorProfile}
      onSetSavedContractors={setSavedContractors}
      onSetContractorDraft={setContractorDraft}
      onSetSelectedContractorId={setSelectedContractorId}
      onSetIsEditingContractor={setIsEditingContractor}
      onSetSavedCustomers={setSavedCustomers}
      onSetCustomerProfile={setCustomerProfile}
      onSetCustomerDraft={setCustomerDraft}
      onSetSelectedCustomerId={setSelectedCustomerId}
      onSetIsEditingCustomer={setIsEditingCustomer}
      onSetShowCustomerNotes={setShowCustomerNotes}
      onSetPriceList={setPriceList}
      onSetSavedRoomTemplates={setSavedRoomTemplates}
      onSetEditingRoomTemplateId={setEditingRoomTemplateId}
      onSetRoomTemplateDraft={setRoomTemplateDraft}
      onSetSavedQuotes={setSavedQuotes}
      onSetEditingQuoteId={setEditingQuoteId}
      onSetQuotesView={setQuotesView}
    />
  );

  const closeNavigationOnSmallScreen = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1100px)").matches) {
      setNavigationOpen(false);
    }
  };
  const openNavigationPage = (pageId) => {
    if (pageId === "quotes") {
      openQuotesLanding();
    } else if (pageId === "schedule") {
      openScheduleLanding();
    } else {
      setCurrentPage(pageId);
    }

    closeNavigationOnSmallScreen();
  };

  return (
    <AppShell
      dark={dark}
      currentPage={currentPage}
      navigationOpen={navigationOpen}
      setNavigationOpen={setNavigationOpen}
      openNavigationPage={openNavigationPage}
      notification={notification}
      onDismissNotification={() => setNotification(null)}
    >
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
          onOpenMaterialTakeoff={(quote) => openMaterialTakeoff(quote.id)}
          onToggleQuoteApproval={toggleQuoteApproval}
          onDeleteQuote={deleteUnapprovedQuote}
          onIncrementQuoteInvoicePart={incrementQuoteInvoicePart}
          onSetQuoteProjectStatus={setQuoteProjectStatus}
        />
      )}
      {currentPage === "quotes" && quotesView === "builder" && renderQuotes()}
      {currentPage === "schedule" && renderSchedule()}
      {currentPage === "takeoff" && renderTakeoff()}
      {currentPage === "pricelist" && renderPriceList()}
      {currentPage === "server" && renderServer()}
      {currentPage === "settings" && renderSettings()}

    </AppShell>
  );
}
