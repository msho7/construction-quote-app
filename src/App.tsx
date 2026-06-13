import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useDarkMode } from "./hooks/useDarkMode";
import {
  PROJECT_TEMPLATES,
  DEFAULT_ITEM_MARKUP_RATE,
  EMPTY_PRICE_ITEM,
  DEFAULT_TEMPLATE_VALUES,
  ACCESS_PAGE_OPTIONS,
  DEFAULT_ROLE_ACCESS
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
  getScheduleContractorPreferenceKey,
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
import LoginPage from "./components/auth/LoginPage";
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

const isNativeTabletDevice = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !Capacitor.isNativePlatform()) {
    return false;
  }

  const platform = Capacitor.getPlatform();
  const userAgent = navigator.userAgent || "";
  const navigatorPlatform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  if (platform === "ios") {
    return (
      /iPad/i.test(userAgent) ||
      (navigatorPlatform === "MacIntel" && maxTouchPoints > 1)
    );
  }

  if (platform === "android") {
    const shortestScreenSide = Math.min(window.screen?.width || 0, window.screen?.height || 0);
    return shortestScreenSide >= 600;
  }

  return false;
};

const shouldUseNativePhoneExperience = () => {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform() || isNativeTabletDevice()) {
    return false;
  }

  return window.matchMedia("(max-width: 767px)").matches;
};

const DEFAULT_ADMIN_ACCOUNT = {
  id: "user-default-administrator",
  name: "Administrator",
  email: "admin@buildquote.local",
  password: "Admin123!",
  role: "administrator",
  allowedPageIds: DEFAULT_ROLE_ACCESS.administrator,
  createdAt: "2026-06-08T00:00:00.000Z"
};

const getDefaultPageAccessForRole = (role = "manager") =>
  role === "administrator"
    ? DEFAULT_ROLE_ACCESS.administrator
    : DEFAULT_ROLE_ACCESS[role] || DEFAULT_ROLE_ACCESS.contractor;

const getInitialLocalUserAccounts = () => {
  if (typeof window === "undefined") return [DEFAULT_ADMIN_ACCOUNT];

  const storedAccounts = safeJsonParse(localStorage.getItem("appUserAccounts"), []);
  const hasDefaultAdmin = storedAccounts.some(
    (account) => String(account.email || "").toLowerCase() === DEFAULT_ADMIN_ACCOUNT.email
  );
  const nextAccounts = hasDefaultAdmin
    ? storedAccounts
    : [DEFAULT_ADMIN_ACCOUNT, ...storedAccounts];

  if (!hasDefaultAdmin) {
    localStorage.setItem("appUserAccounts", JSON.stringify(nextAccounts));
  }

  return nextAccounts;
};

export default function ConstructionQuoteApp() {
  const systemDark = useDarkMode();
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") return null;
    return safeJsonParse(localStorage.getItem("appSessionUser"), null);
  });
  const [localUserAccounts, setLocalUserAccounts] = useState(() => {
    return getInitialLocalUserAccounts();
  });
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
  const [savedTakeoffProducts, setSavedTakeoffProducts] = useState(() => {
    if (typeof window === "undefined") return {};
    return safeJsonParse(localStorage.getItem("savedTakeoffProducts"), {});
  });
  const [scheduleContractorPreferences, setScheduleContractorPreferences] = useState(() => {
    if (typeof window === "undefined") return {};
    return safeJsonParse(localStorage.getItem("scheduleContractorPreferences"), {});
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
  const [scopeLocationLoading, setScopeLocationLoading] = useState(false);
  const [isNativeTabletExperience, setIsNativeTabletExperience] = useState(isNativeTabletDevice);
  const [isPhoneExperience, setIsPhoneExperience] = useState(shouldUseNativePhoneExperience);
  const [remoteStorageReady, setRemoteStorageReady] = useState(false);
  const notificationTimeoutRef = useRef(null);
  const phoneRestrictedPages = useMemo(() => new Set(["analysis", "takeoff", "contractor"]), []);
  const userAccessLevel = currentUser?.role || "contractor";
  const canManageAccess = userAccessLevel === "administrator";
  const canAssignScopeWork = userAccessLevel === "administrator" || userAccessLevel === "manager";
  const currentUserAllowedPageIds = useMemo(() => {
    if (userAccessLevel === "administrator") return ACCESS_PAGE_OPTIONS.map((page) => page.id);
    return Array.isArray(currentUser?.allowedPageIds)
      ? currentUser.allowedPageIds
      : getDefaultPageAccessForRole(userAccessLevel);
  }, [currentUser, userAccessLevel]);
  const allowedPageSet = useMemo(() => new Set(currentUserAllowedPageIds), [currentUserAllowedPageIds]);
  const canAssignScheduleContractors =
    userAccessLevel === "administrator" ||
    userAccessLevel === "manager" ||
    (allowedPageSet.has("schedule") && allowedPageSet.has("contractor"));
  const hasPageAccess = (pageId) => {
    if (!currentUser) return true;
    if (userAccessLevel === "administrator") return true;
    if (isPhoneExperience && pageId === "quotes") {
      return allowedPageSet.has("scope") || allowedPageSet.has("quotes");
    }
    return allowedPageSet.has(pageId);
  };
  const firstAllowedPageId = currentUserAllowedPageIds[0] || "";

  const persistLocalUserAccounts = (accounts = []) => {
    setLocalUserAccounts(accounts);
    if (typeof window !== "undefined") {
      localStorage.setItem("appUserAccounts", JSON.stringify(accounts));
    }
  };

  const upsertContractorProfileForUserAccount = (account: any = {}) => {
    if (account.role !== "contractor") return;

    const accountKey = account.id || account.email;
    const accountEmail = String(account.email || "").trim().toLowerCase();

    setSavedContractors((previous) => {
      const existingContractor = previous.find((contractor) =>
        contractor.userAccountId === accountKey ||
        (accountEmail && String(contractor.email || "").trim().toLowerCase() === accountEmail)
      );

      if (existingContractor) {
        return previous.map((contractor) =>
          contractor.id !== existingContractor.id
            ? contractor
            : normalizeContractorProfile({
                ...contractor,
                userAccountId: accountKey,
                contactName: account.name || contractor.contactName || "",
                companyName: contractor.companyName || account.name || account.email,
                email: account.email || contractor.email || "",
                status: "active"
              }, contractorExpirySettings)
        );
      }

      return [
        createSavedContractorRecord({
          userAccountId: accountKey,
          companyName: account.name || account.email,
          contactName: account.name || "",
          email: account.email || "",
          status: "active",
          notes: "Created from contractor user account."
        }),
        ...previous
      ];
    });
  };

  const loginUser = ({ email, password }) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const account = localUserAccounts.find((user) => String(user.email || "").toLowerCase() === trimmedEmail);

    if (!account || account.password !== password) {
      return { ok: false, message: "That email and password do not match an account." };
    }

    const nextUser = {
      name: account.name,
      email: account.email,
      role: account.role,
      allowedPageIds: account.role === "administrator"
        ? DEFAULT_ROLE_ACCESS.administrator
        : Array.isArray(account.allowedPageIds)
          ? account.allowedPageIds
          : getDefaultPageAccessForRole(account.role),
      signedInAt: new Date().toISOString()
    };

    setCurrentUser(nextUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("appSessionUser", JSON.stringify(nextUser));
    }

    return { ok: true };
  };

  const createUserAccount = ({ name, email, password, role, allowedPageIds }, options: any = {}) => {
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();

    if (localUserAccounts.some((user) => String(user.email || "").toLowerCase() === trimmedEmail)) {
      return { ok: false, message: "An account already exists for that email." };
    }

    const nextAccount = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: role || "manager",
      allowedPageIds: role === "administrator"
        ? getDefaultPageAccessForRole("administrator")
        : Array.isArray(allowedPageIds)
          ? allowedPageIds
          : getDefaultPageAccessForRole(role || "manager"),
      createdAt: new Date().toISOString()
    };

    persistLocalUserAccounts([...localUserAccounts, nextAccount]);
    upsertContractorProfileForUserAccount(nextAccount);

    if (options.signIn === false) {
      return { ok: true };
    }

    const nextUser = {
      name: nextAccount.name,
      email: nextAccount.email,
      role: nextAccount.role,
      allowedPageIds: nextAccount.allowedPageIds,
      signedInAt: new Date().toISOString()
    };

    setCurrentUser(nextUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("appSessionUser", JSON.stringify(nextUser));
    }

    return { ok: true };
  };

  const deleteUserAccount = (accountKey) => {
    const nextAccounts = localUserAccounts.filter((account) => (account.id || account.email) !== accountKey);
    persistLocalUserAccounts(nextAccounts);
  };

  const updateUserAccount = (accountKey, updates) => {
    const trimmedName = String(updates.name || "").trim();
    const trimmedEmail = String(updates.email || "").trim().toLowerCase();
    const nextPassword = String(updates.password || "");
    const nextRole = updates.role || "manager";
    const nextAllowedPageIds = nextRole === "administrator"
      ? DEFAULT_ROLE_ACCESS.administrator
      : Array.isArray(updates.allowedPageIds)
        ? updates.allowedPageIds
        : getDefaultPageAccessForRole(nextRole);

    if (!trimmedName || !trimmedEmail || !nextPassword) {
      return { ok: false, message: "Enter a name, email, and password for the user." };
    }

    if (nextPassword.length < 6) {
      return { ok: false, message: "Use at least 6 characters for the password." };
    }

    const duplicateAccount = localUserAccounts.find((account) => {
      const key = account.id || account.email;
      return key !== accountKey && String(account.email || "").toLowerCase() === trimmedEmail;
    });

    if (duplicateAccount) {
      return { ok: false, message: "Another account already uses that email." };
    }

    let updatedAccount = null;
    const nextAccounts = localUserAccounts.map((account) => {
      const key = account.id || account.email;
      if (key !== accountKey) return account;

      updatedAccount = {
        ...account,
        name: trimmedName,
        email: trimmedEmail,
        password: nextPassword,
        role: nextRole,
        allowedPageIds: nextAllowedPageIds,
        updatedAt: new Date().toISOString()
      };

      return updatedAccount;
    });

    if (!updatedAccount) {
      return { ok: false, message: "Could not find that user account." };
    }

    persistLocalUserAccounts(nextAccounts);
    upsertContractorProfileForUserAccount(updatedAccount);

    if (currentUser && String(currentUser.email || "").toLowerCase() === String(localUserAccounts.find((account) => (account.id || account.email) === accountKey)?.email || "").toLowerCase()) {
      const nextUser = {
        name: updatedAccount.name,
        email: updatedAccount.email,
        role: updatedAccount.role,
        allowedPageIds: updatedAccount.allowedPageIds,
        signedInAt: currentUser.signedInAt || new Date().toISOString()
      };

      setCurrentUser(nextUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("appSessionUser", JSON.stringify(nextUser));
      }
    }

    return { ok: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("appSessionUser");
    }
  };

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

  const getSaveItemDismissalKey = (item: any, nameOverride?: string) => {
    const normalizedName = getNormalizedItemName(nameOverride ?? item?.name);
    if (!item?.itemId || !normalizedName) return "";
    return `${item.itemId}:${normalizedName}`;
  };

  const dismissSaveItemPrompt = (item: any, nameOverride?: string) => {
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

        if (Object.prototype.hasOwnProperty.call(remoteState, "savedTakeoffProducts")) {
          setSavedTakeoffProducts(
            remoteState.savedTakeoffProducts && typeof remoteState.savedTakeoffProducts === "object"
              ? remoteState.savedTakeoffProducts
              : {}
          );
        }

        if (Object.prototype.hasOwnProperty.call(remoteState, "scheduleContractorPreferences")) {
          setScheduleContractorPreferences(
            remoteState.scheduleContractorPreferences && typeof remoteState.scheduleContractorPreferences === "object"
              ? remoteState.scheduleContractorPreferences
              : {}
          );
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
    savedTakeoffProducts,
    scheduleContractorPreferences,
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
    savedTakeoffProducts,
    scheduleContractorPreferences,
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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateDeviceExperience = () => {
      setIsNativeTabletExperience(isNativeTabletDevice());
      setIsPhoneExperience(shouldUseNativePhoneExperience());
    };

    updateDeviceExperience();
    mediaQuery.addEventListener?.("change", updateDeviceExperience);

    return () => mediaQuery.removeEventListener?.("change", updateDeviceExperience);
  }, []);

  useEffect(() => {
    if (!isPhoneExperience || !phoneRestrictedPages.has(currentPage)) return;
    openQuotesLanding();
  }, [currentPage, isPhoneExperience, phoneRestrictedPages]);

  useEffect(() => {
    if (!currentUser || hasPageAccess(currentPage)) return;
    if (!firstAllowedPageId) return;

    if (firstAllowedPageId === "scope") {
      openScopeLanding();
      return;
    }

    openNavigationPage(firstAllowedPageId);
  }, [currentPage, currentUser, firstAllowedPageId, currentUserAllowedPageIds, isPhoneExperience]);

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
              [field]: ["name", "unit", "category", "assignedContractorId", "assignedContractorName", "scopePhotoNames"].includes(field)
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

  const getContractorAssignmentDate = (quote: any = {}) =>
    toDateInputValue(quote.startDate) ||
    toDateInputValue(quote.quoteDate) ||
    getTodayDate();

  const updateContractorJobAssignment = (contractorLike: any = {}, assignmentDate = getTodayDate()) => {
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

  const updateQuoteCustomerProfile = (field, value) => {
    const previousCustomer = normalizeCustomerRecord(quoteCustomerProfile);
    const previousAddress = getProfileAddressDisplay(previousCustomer);
    const nextCustomer = normalizeCustomerRecord({
      ...previousCustomer,
      [field]: value
    });
    const nextCustomerName = getCustomerDisplayName(nextCustomer);
    const nextAddress = getProfileAddressDisplay(nextCustomer);

    if (selectedQuoteCustomerId) {
      setSelectedQuoteCustomerId("");
    }

    setQuoteCustomerProfile(nextCustomer);
    setClientName(nextCustomerName === "Customer" ? "" : nextCustomerName);

    if (
      ["address", "unitNumber", "city", "province", "postalCode"].includes(field) &&
      (!projectAddress.trim() || projectAddress === previousAddress)
    ) {
      setProjectAddress(nextAddress);
    }
  };

  const normalizeAddressForMatching = (value = "") =>
    String(value || "")
      .toLowerCase()
      .replace(/\b(street|st)\b/g, "st")
      .replace(/\b(avenue|ave)\b/g, "ave")
      .replace(/\b(road|rd)\b/g, "rd")
      .replace(/\b(drive|dr)\b/g, "dr")
      .replace(/\b(north|south|east|west)\b/g, "")
      .replace(/[^a-z0-9]/g, "");

  const getLocatedAddressDisplay = (address: Record<string, string> = {}) => {
    const houseNumber = address.house_number || "";
    const road = address.road || address.pedestrian || address.footway || address.path || "";
    const city = address.city || address.town || address.village || address.hamlet || "";
    const province = address.state || address.region || "";
    const postalCode = address.postcode || "";
    const streetLine = [houseNumber, road].filter(Boolean).join(" ");

    if (Capacitor.isNativePlatform()) {
      return [streetLine, province].filter(Boolean).join(", ");
    }

    const localityLine = [city, province, postalCode].filter(Boolean).join(", ");
    return [streetLine, localityLine].filter(Boolean).join(", ");
  };

  const findCustomerByAddress = (address = "") => {
    const normalizedLocatedAddress = normalizeAddressForMatching(address);
    if (!normalizedLocatedAddress) return null;

    return savedCustomers.find((customer) => {
      const customerAddress = getProfileAddressDisplay(customer);
      const normalizedCustomerAddress = normalizeAddressForMatching(customerAddress);
      if (!normalizedCustomerAddress) return false;

      return (
        normalizedLocatedAddress.includes(normalizedCustomerAddress) ||
        normalizedCustomerAddress.includes(normalizedLocatedAddress)
      );
    }) || null;
  };

  const applyScopeLocatedAddress = (address = "") => {
    const trimmedAddress = String(address || "").trim();
    if (!trimmedAddress) return;

    setProjectAddress(trimmedAddress);

    const matchedCustomer = findCustomerByAddress(trimmedAddress);
    if (!matchedCustomer) {
      showNotification("Location added. No saved customer matched that address.", "warning");
      return;
    }

    const normalizedCustomer = normalizeCustomerRecord(matchedCustomer);
    setSelectedQuoteCustomerId(normalizedCustomer.id || "");
    setQuoteCustomerProfile(normalizedCustomer);
    setClientName(getCustomerDisplayName(normalizedCustomer));
    showNotification(`Location added and ${getCustomerDisplayName(normalizedCustomer)} was selected.`);
  };

  const useScopeCurrentLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showNotification("Precise location is not available on this device.", "warning");
      return;
    }

    setScopeLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const locationData = await response.json();
          const locatedAddress =
            getLocatedAddressDisplay(locationData.address || {}) ||
            locationData.display_name ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          applyScopeLocatedAddress(locatedAddress);
        } catch (error) {
          applyScopeLocatedAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          showNotification("Precise location was added, but the address lookup did not respond.", "warning");
        } finally {
          setScopeLocationLoading(false);
        }
      },
      (error) => {
        setScopeLocationLoading(false);
        const permissionDenied = error.code === error.PERMISSION_DENIED;
        showNotification(
          permissionDenied
            ? "Location permission was denied. Enable location access for this app in iPhone Settings."
            : "Could not get the current location. Try again near the jobsite.",
          "warning"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
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

  const openQuotesLanding = (options: any = {}) => {
    setQuotesCustomerFilter(options.customerFilter || null);
    setQuotesInitialProjectList(options.projectList || "");
    setQuotesView("landing");
    setCurrentPage(options.page || "quotes");
  };

  const openScopeLanding = (options: any = {}) => {
    openQuotesLanding({ ...options, page: "scope" });
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

  const openQuoteBuilder = (page = "quotes") => {
    setQuotesView("builder");
    setCurrentPage(page);
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

  const openTakeoffLanding = () => {
    setSelectedTakeoffQuoteId(null);
    setSelectedTakeoffQuoteDraft(null);
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
      savedContractors,
      scheduleContractorPreferences
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

  const saveDraftScheduleSnapshot = (scheduleSnapshot = []) => {
    const nextSchedule = normalizeScheduleItems(scheduleSnapshot);

    setSchedule(nextSchedule);
    setItems((previousItems) =>
      nextSchedule.reduce(
        (nextItems, task) => syncScheduleDurationToItems(nextItems, task),
        previousItems
      )
    );
    setStartDate(nextSchedule[0]?.startDate || startDate);
    showNotification("Schedule saved.");
  };

  const saveQuoteScheduleSnapshot = (quoteId, scheduleSnapshot = []) => {
    const nextSchedule = normalizeScheduleItems(scheduleSnapshot);

    setSavedQuotes((previous) =>
      previous.map((quote) => {
        if (quote.id !== quoteId) return quote;

        const nextItems = nextSchedule.reduce(
          (quoteItems, task) => syncScheduleDurationToItems(quoteItems, task),
          quote.items || []
        );

        return {
          ...quote,
          startDate: nextSchedule[0]?.startDate || quote.startDate,
          items: nextItems,
          schedule: nextSchedule
        };
      })
    );
    showNotification("Schedule saved.");
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

  const rememberScheduleContractorPreference = (task, contractorId) => {
    const preferenceKey = getScheduleContractorPreferenceKey(task);
    if (!preferenceKey || !contractorId) return;

    setScheduleContractorPreferences((previous) => ({
      ...previous,
      [preferenceKey]: contractorId
    }));
  };

  const assignDraftScheduleTaskContractor = (taskIndex, contractorId) => {
    const selectedContractor = savedContractors.find((contractor) => contractor.id === contractorId) || null;
    let taskTrade = "";
    let selectedTask = null;

    setSchedule((previous) =>
      normalizeScheduleItems(
        previous.map((task, index) => {
          if (index !== taskIndex) return task;
          selectedTask = task;
          taskTrade = task.suggestedTrade || getSuggestedTradeForTask(task);
          return getScheduleTaskWithContractor(task, selectedContractor);
        })
      )
    );

    rememberScheduleContractorPreference(selectedTask, contractorId);
    addTradeToContractorIfNeeded(contractorId, taskTrade);
  };

  const assignSavedQuoteScheduleTaskContractor = (quoteId, taskIndex, contractorId) => {
    const selectedContractor = savedContractors.find((contractor) => contractor.id === contractorId) || null;
    let taskTrade = "";
    let selectedTask = null;

    setSavedQuotes((previous) =>
      previous.map((quote) => {
        if (quote.id !== quoteId) return quote;

        return {
          ...quote,
          schedule: normalizeScheduleItems(
            (quote.schedule || []).map((task, index) => {
              if (index !== taskIndex) return task;
              selectedTask = task;
              taskTrade = task.suggestedTrade || getSuggestedTradeForTask(task);
              return getScheduleTaskWithContractor(task, selectedContractor);
            })
          )
        };
      })
    );

    rememberScheduleContractorPreference(selectedTask, contractorId);
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

  const startNewScope = () => {
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
    openQuoteBuilder("scope");
  };

  const saveTakeoffProductSettings = (materials = []) => {
    const nextProducts = materials
      .filter((material) => String(material.name || "").trim())
      .reduce((products, material) => {
        const key = String(material.name || "").trim().toLowerCase().replace(/\s+/g, "-");

        return {
          ...products,
          [key]: {
            name: String(material.name || "").trim(),
            baseUnit: material.baseUnit || "ft",
            productUnit: material.baseUnit === "each" ? "pieces" : material.productUnit || "pieces",
            productLength: material.productLength || "",
            productWidth: material.productWidth || "",
            productHeight: material.productHeight || "",
            wastePercent: material.wastePercent || "",
            pricePerUnit: material.pricePerUnit || ""
          }
        };
      }, {});

    if (!Object.keys(nextProducts).length) return;

    setSavedTakeoffProducts((previous) => ({
      ...previous,
      ...nextProducts
    }));
  };

  const saveTakeoffMaterialsToQuote = (materials = [], options: any = {}) => {
    const takeoffItems = materials
      .filter((material) => String(material.name || "").trim() && Number(material.quantity || 0) > 0)
      .map((material) =>
        createEmptyQuoteItem({
          name: String(material.name || "").trim(),
          roomName: material.roomName || "",
          quantity: Number(material.quantity || 0),
          unit: material.unit || "each",
          pricePerUnit: Number(material.pricePerUnit || 0),
          duration: Number(material.duration || 1),
          category: "Material"
        })
      );

    if (!takeoffItems.length) {
      showNotification("Add at least one material with a calculated quantity before saving.", "warning");
      return;
    }

    if (options.stayOnTakeoff) {
      if (selectedTakeoffQuoteId) {
        const appendTakeoffItems = (quoteLike: any = {}) => ({
          ...quoteLike,
          items: [...(quoteLike.items || []), ...takeoffItems]
        });

        setSavedQuotes((previous) =>
          previous.map((quote) =>
            quote.id === selectedTakeoffQuoteId
              ? appendTakeoffItems(quote)
              : quote
          )
        );
        setSelectedTakeoffQuoteDraft((previous) =>
          appendTakeoffItems(previous || selectedTakeoffQuote || { items: [] })
        );

        if (editingQuoteId === selectedTakeoffQuoteId) {
          setItems((previous) => [...previous, ...takeoffItems]);
        }
      } else {
        setItems((previous) => [...previous, ...takeoffItems]);
        setSelectedTakeoffQuoteDraft((previous) => ({
          ...(previous || {}),
          takeoffSource: previous?.takeoffSource || "Current quote draft",
          items: [...(previous?.items || items), ...takeoffItems]
        }));
      }

      setActiveQuoteItemIndex(null);
      showNotification(`${takeoffItems.length} material ${takeoffItems.length === 1 ? "line was" : "lines were"} added to the takeoff.`, "success");
      return;
    }

    if (options.createNewQuote) {
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
      setItems(takeoffItems);
      setSelectedTemplateId("");
      setShowTemplateBuilder(false);
      setTemplateFormValues({ ...DEFAULT_TEMPLATE_VALUES.bathroom });
      setShowExportModal(false);
      setExportFileName("");
      setActiveQuoteItemIndex(null);
      setDismissedSaveItemKeys([]);
      setShowDraftSchedulePreview(false);
    } else {
      setItems((previous) => {
        const hasExistingQuoteItems = previous.some((item) => String(item.name || "").trim());
        return hasExistingQuoteItems ? [...previous, ...takeoffItems] : takeoffItems;
      });
      setActiveQuoteItemIndex(null);
    }

    setSelectedTakeoffQuoteId(null);
    setSelectedTakeoffQuoteDraft(null);
    showNotification(`${takeoffItems.length} material ${takeoffItems.length === 1 ? "line was" : "lines were"} added to the quote.`, "success");
    openQuoteBuilder();
  };

  const getTakeoffMaterialKey = (item: any = {}) =>
    [
      getNormalizedText(item.name),
      getNormalizedText(item.unit),
      getNormalizedText(item.category || "Material")
    ].join("|");

  const applyTakeoffMaterialRowUpdate = (quoteLike: any = {}, row: any = {}, draft: any = {}) => {
    const nextName = String(draft.name || row.name || "").trim();
    const nextUnit = draft.unit || row.unit || "each";
    const nextQuantity = Number(draft.quantity || 0);
    const nextPricePerUnit = Number(draft.pricePerUnit || 0);
    const quoteItems = quoteLike.items || [];
    const matchingItems = quoteItems.filter((item) => getTakeoffMaterialKey(item) === row.key);
    const matchingQuantity = matchingItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    let matchedIndex = 0;
    let didUpdateExistingItem = false;

    if (!nextName || nextQuantity <= 0) return quoteLike;

    const updatedItems = quoteItems.map((item) => {
      if (getTakeoffMaterialKey(item) !== row.key) return item;

      const ratio = matchingQuantity > 0
        ? Number(item.quantity || 0) / matchingQuantity
        : matchedIndex === 0
          ? 1
          : 0;
      matchedIndex += 1;
      didUpdateExistingItem = true;

      return {
        ...item,
        name: nextName,
        quantity: Math.round(nextQuantity * ratio * 10000) / 10000,
        unit: nextUnit,
        pricePerUnit: nextPricePerUnit,
        category: "Material"
      };
    });

    if (!didUpdateExistingItem) {
      updatedItems.push(createEmptyQuoteItem({
        name: nextName,
        quantity: nextQuantity,
        unit: nextUnit,
        pricePerUnit: nextPricePerUnit,
        category: "Material"
      }));
    }

    return {
      ...quoteLike,
      items: updatedItems
    };
  };

  const applyTakeoffMaterialRowDelete = (quoteLike: any = {}, row: any = {}) => ({
    ...quoteLike,
    items: (quoteLike.items || []).filter((item) => getTakeoffMaterialKey(item) !== row.key)
  });

  const updateTakeoffMaterialRow = (row, draft) => {
    if (savedTakeoffQuote && isProjectLocked(savedTakeoffQuote)) {
      showNotification("Completed projects are locked and cannot be edited.", "warning");
      return;
    }

    const baseQuote = selectedTakeoffQuote || { items };
    const nextTakeoffQuote = applyTakeoffMaterialRowUpdate(baseQuote, row, draft);

    setSelectedTakeoffQuoteDraft(nextTakeoffQuote);

    if (selectedTakeoffQuoteId) {
      setSavedQuotes((previous) =>
        previous.map((quote) =>
          quote.id === selectedTakeoffQuoteId
            ? applyTakeoffMaterialRowUpdate(quote, row, draft)
            : quote
        )
      );
    }

    if (!selectedTakeoffQuoteId || editingQuoteId === selectedTakeoffQuoteId || selectedTakeoffQuoteDraft) {
      setItems((previous) => applyTakeoffMaterialRowUpdate({ items: previous }, row, draft).items);
    }

    showNotification("Material takeoff line updated.");
  };

  const deleteTakeoffMaterialRow = (row) => {
    if (savedTakeoffQuote && isProjectLocked(savedTakeoffQuote)) {
      showNotification("Completed projects are locked and cannot be edited.", "warning");
      return;
    }

    const baseQuote = selectedTakeoffQuote || { items };
    const nextTakeoffQuote = applyTakeoffMaterialRowDelete(baseQuote, row);

    setSelectedTakeoffQuoteDraft(nextTakeoffQuote);

    if (selectedTakeoffQuoteId) {
      setSavedQuotes((previous) =>
        previous.map((quote) =>
          quote.id === selectedTakeoffQuoteId
            ? applyTakeoffMaterialRowDelete(quote, row)
            : quote
        )
      );
    }

    if (!selectedTakeoffQuoteId || editingQuoteId === selectedTakeoffQuoteId || selectedTakeoffQuoteDraft) {
      setItems((previous) => applyTakeoffMaterialRowDelete({ items: previous }, row).items);
    }

    showNotification("Material takeoff line deleted.");
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
    scheduleContractorPreferences,
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
      savedContractors,
      scheduleContractorPreferences
    );

    if (newSchedule[0]?.startDate) {
      setStartDate(newSchedule[0].startDate);
    }

    setSchedule(newSchedule);
    openCurrentDraftSchedule();
  };

  const saveQuote = (options: any = {}) => {
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
      schedule: assignContractorsToSchedule(schedule, savedContractors, scheduleContractorPreferences)
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

  const loadQuote = (quote: any, options: any = {}) => {
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
    openQuoteBuilder(options.page || "quotes");
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
  const isScopeExperience = isPhoneExperience || currentPage === "scope";

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
      isPhoneExperience={isPhoneExperience}
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
      onOpenContractors={() => isPhoneExperience ? openQuotesLanding() : setCurrentPage("contractor")}
      onOpenCustomers={() => setCurrentPage("customer")}
      onOpenApprovedQuoteSchedule={openApprovedQuoteSchedule}
      onLoadQuote={loadQuote}
    />
  );

  const renderQuotes = () => (
    <QuoteBuilderPage
      dark={dark}
      isPhoneExperience={isScopeExperience}
      savedContractors={savedContractors}
      canAssignScopeWork={canAssignScopeWork}
      isCurrentQuoteLocked={isCurrentQuoteLocked}
      currentQuoteReference={currentQuoteReference}
      activeQuoteRecord={activeQuoteRecord}
      isCurrentQuoteApproved={isCurrentQuoteApproved}
      savedCustomers={savedCustomers}
      selectedQuoteCustomerId={selectedQuoteCustomerId}
      quoteCustomerProfile={quoteCustomerProfile}
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
      updateQuoteCustomerProfile={updateQuoteCustomerProfile}
      setProjectAddress={setProjectAddress}
      onUseCurrentLocation={useScopeCurrentLocation}
      isLocatingScopeAddress={scopeLocationLoading}
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
      canAssignContractors={canAssignScheduleContractors}
      onGenerateDraftSchedule={generateSchedule}
      onGenerateQuoteSchedule={(quote) => generateScheduleForSavedQuote(quote.id)}
      onUpdateDraftScheduleTask={updateDraftScheduleTask}
      onUpdateQuoteScheduleTask={(quote, taskIndex, field, value) => updateSavedQuoteScheduleTask(quote.id, taskIndex, field, value)}
      onSaveDraftSchedule={saveDraftScheduleSnapshot}
      onSaveQuoteSchedule={(quote, scheduleSnapshot) => saveQuoteScheduleSnapshot(quote.id, scheduleSnapshot)}
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
      onOpenMaterialTakeoff={(quote) => openMaterialTakeoff(quote.id)}
      onBackToLanding={openScheduleLanding}
    />
  );

  const renderTakeoff = () => (
    <MaterialTakeoffPage
      dark={dark}
      quote={selectedTakeoffQuote}
      savedQuote={savedTakeoffQuote}
      priceList={priceList}
      savedTakeoffProducts={savedTakeoffProducts}
      onBack={openQuotesLanding}
      onOpenQuote={loadQuote}
      onNewTakeoff={openTakeoffLanding}
      onSaveTakeoffProducts={saveTakeoffProductSettings}
      onSaveMaterialsToQuote={saveTakeoffMaterialsToQuote}
      onUpdateTakeoffMaterialRow={updateTakeoffMaterialRow}
      onDeleteTakeoffMaterialRow={deleteTakeoffMaterialRow}
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
      canManageAccess={canManageAccess}
      localUserAccounts={localUserAccounts}
      onCreateUserAccount={(account) => createUserAccount(account, { signIn: false })}
      onUpdateUserAccount={updateUserAccount}
      onDeleteUserAccount={deleteUserAccount}
    />
  );

  const closeNavigationOnSmallScreen = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1100px)").matches) {
      setNavigationOpen(false);
    }
  };
  const openNavigationPage = (pageId) => {
    if (!hasPageAccess(pageId)) {
      showNotification("Your account does not have access to that page.", "warning");
      return;
    }

    if (isPhoneExperience && phoneRestrictedPages.has(pageId)) {
      openQuotesLanding();
      return;
    }

    if (pageId === "quotes") {
      openQuotesLanding();
    } else if (pageId === "scope") {
      openScopeLanding();
    } else if (pageId === "schedule") {
      openScheduleLanding();
    } else if (pageId === "takeoff") {
      openTakeoffLanding();
    } else {
      setCurrentPage(pageId);
    }

    closeNavigationOnSmallScreen();
  };

  return (
    !currentUser ? (
      <LoginPage
        onLogin={loginUser}
        onCreateAccount={(account) =>
          createUserAccount({
            ...account,
            role: "administrator",
            allowedPageIds: getDefaultPageAccessForRole("administrator")
          })}
        allowInitialAccountSetup={localUserAccounts.length === 0}
      />
    ) : !firstAllowedPageId ? (
      <main style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: dark ? "#0f172a" : "#f3f4f6",
        color: dark ? "#f9fafb" : "#111827"
      }}>
        <section style={{
          width: "min(100%, 420px)",
          padding: 24,
          borderRadius: 8,
          background: dark ? "#111827" : "#ffffff",
          border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`
        }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.35rem" }}>No Access Assigned</h1>
          <p style={{ margin: "0 0 18px", color: dark ? "#9ca3af" : "#6b7280", lineHeight: 1.45 }}>
            Your account does not currently have access to any app sections. Ask an administrator to turn on the pages you need.
          </p>
          <button
            type="button"
            onClick={logoutUser}
            style={{
              minHeight: 42,
              width: "100%",
              border: 0,
              borderRadius: 8,
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Sign Out
          </button>
        </section>
      </main>
    ) : (
    <AppShell
      dark={dark}
      currentPage={currentPage}
      isPhoneExperience={isPhoneExperience}
      showScopeNavigation={isNativeTabletExperience}
      allowedPageIds={currentUserAllowedPageIds}
      navigationOpen={navigationOpen}
      setNavigationOpen={setNavigationOpen}
      openNavigationPage={openNavigationPage}
      currentUser={currentUser}
      onLogout={logoutUser}
      notification={notification}
      onDismissNotification={() => setNotification(null)}
    >
      {currentPage === "dashboard" && renderDashboard()}
      {currentPage === "analysis" && renderAnalysis()}
      {currentPage === "contractor" && renderContractor()}
      {currentPage === "customer" && renderCustomer()}
      {(currentPage === "quotes" || currentPage === "scope") && quotesView === "landing" && (
        <QuotesLandingPage
          key={`${quotesCustomerFilter?.id || quotesCustomerFilter?.label || "all"}:${quotesInitialProjectList || "approved"}`}
          dark={dark}
          isPhoneExperience={isScopeExperience}
          savedQuotes={savedQuotes}
          customerFilter={quotesCustomerFilter}
          initialProjectList={quotesInitialProjectList}
          onClearCustomerFilter={() => {
            setQuotesCustomerFilter(null);
            setQuotesInitialProjectList("");
          }}
          onNewQuote={isScopeExperience ? startNewScope : startNewQuote}
          onOpenQuote={(quote, options) => loadQuote(quote, { ...options, page: isScopeExperience ? "scope" : "quotes" })}
          onOpenQuoteSchedule={(quote) => openApprovedQuoteSchedule(quote.id)}
          onOpenMaterialTakeoff={(quote) => openMaterialTakeoff(quote.id)}
          onToggleQuoteApproval={toggleQuoteApproval}
          onDeleteQuote={deleteUnapprovedQuote}
          onIncrementQuoteInvoicePart={incrementQuoteInvoicePart}
          onSetQuoteProjectStatus={setQuoteProjectStatus}
        />
      )}
      {(currentPage === "quotes" || currentPage === "scope") && quotesView === "builder" && renderQuotes()}
      {currentPage === "schedule" && renderSchedule()}
      {currentPage === "takeoff" && renderTakeoff()}
      {currentPage === "pricelist" && renderPriceList()}
      {currentPage === "server" && renderServer()}
      {currentPage === "settings" && renderSettings()}

    </AppShell>
    )
  );
}
