// @ts-nocheck
import { safeJsonParse, toDateInputValue } from "./appUtils";
import { getTodayDate } from "./dateUtils";
import { createContractorId, createCustomerId } from "./idUtils";

export const DEFAULT_CONTRACTOR_EXPIRY_SETTINGS = {
  enabled: true,
  amount: 6,
  unit: "months"
};
export const COMPANY_TYPE_OPTIONS = [
  { id: "general-renovation", label: "General Contractor / Renovation Company" },
  { id: "plumbing", label: "Plumbing Company" },
  { id: "electrical", label: "Electrical Company" },
  { id: "hvac", label: "HVAC Company" },
  { id: "roofing", label: "Roofing Company" },
  { id: "drywall-taping", label: "Drywall / Taping Company" },
  { id: "painting", label: "Painting Company" },
  { id: "flooring", label: "Flooring Company" },
  { id: "tile", label: "Tile Company" },
  { id: "framing-carpentry", label: "Framing / Carpentry Company" },
  { id: "finish-carpentry", label: "Finish Carpentry Company" },
  { id: "concrete", label: "Concrete Company" },
  { id: "landscaping", label: "Landscaping Company" },
  { id: "masonry", label: "Masonry Company" },
  { id: "excavation-sitework", label: "Excavation / Sitework Company" },
  { id: "demolition", label: "Demolition Company" },
  { id: "window-door", label: "Window / Door Company" },
  { id: "cabinet-kitchen", label: "Cabinet / Kitchen Company" },
  { id: "insulation", label: "Insulation Company" },
  { id: "handy-person", label: "Handy Person / Property Maintenance" },
  { id: "cleaning", label: "Cleaning / Post-Construction Cleaning" }
];
export const DEFAULT_COMPANY_SETTINGS = {
  companyType: COMPANY_TYPE_OPTIONS[0].id
};
export const EMPTY_CONTRACTOR_PROFILE = {
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
export const EMPTY_CUSTOMER_PROFILE = {
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
export const CONTRACTOR_PROFILE_FIELDS = [
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
export const CUSTOMER_PROFILE_FIELDS = [
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
export const getContractorExpirySettings = (settings = {}) => {
  const amount = Number(settings.amount ?? DEFAULT_CONTRACTOR_EXPIRY_SETTINGS.amount);

  return {
    enabled: settings.enabled !== false,
    amount: Number.isFinite(amount)
      ? Math.min(12, Math.max(1, Math.floor(amount)))
      : DEFAULT_CONTRACTOR_EXPIRY_SETTINGS.amount,
    unit: settings.unit === "years" ? "years" : "months"
  };
};
export const getCompanySettings = (settings = {}) => ({
  companyType: COMPANY_TYPE_OPTIONS.some((option) => option.id === settings.companyType)
    ? settings.companyType
    : DEFAULT_COMPANY_SETTINGS.companyType
});
export const getContractorExpiryMonths = (settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
  const expirySettings = getContractorExpirySettings(settings);
  return expirySettings.unit === "years"
    ? expirySettings.amount * 12
    : expirySettings.amount;
};
export const addMonthsToDateInput = (value, months) => {
  const normalizedDate = toDateInputValue(value);
  if (!normalizedDate) return "";

  const nextDate = new Date(`${normalizedDate}T00:00:00`);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));

  return nextDate.toISOString().slice(0, 10);
};
export const getContractorInactiveAfterDate = (profile = {}, settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
  const expirySettings = getContractorExpirySettings(settings);
  if (!expirySettings.enabled) return "";

  return addMonthsToDateInput(profile.lastAssignedJobDate, getContractorExpiryMonths(expirySettings));
};
export const getContractorActivityStatus = (profile = {}, settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
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
export const normalizeCustomerRecord = (profile = {}) => ({
  id: profile.id || "",
  createdAt: profile.createdAt || "",
  updatedAt: profile.updatedAt || "",
  ...EMPTY_CUSTOMER_PROFILE,
  ...profile
});
export const normalizeContractorProfile = (profile = {}, settings = DEFAULT_CONTRACTOR_EXPIRY_SETTINGS) => {
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
export const hasContractorProfileData = (profile = EMPTY_CONTRACTOR_PROFILE) =>
  CONTRACTOR_PROFILE_FIELDS.some((field) => String(profile?.[field] || "").trim());
export const hasCustomerProfileData = (profile = EMPTY_CUSTOMER_PROFILE) =>
  CUSTOMER_PROFILE_FIELDS.some((field) => String(profile?.[field] || "").trim());
export const getCustomerDisplayName = (profile = EMPTY_CUSTOMER_PROFILE) =>
  String(profile?.customerName || "").trim() ||
  String(profile?.companyName || "").trim() ||
  "Customer";
export const isProjectLocked = (quote = {}) => ["completed", "invoiced"].includes(quote?.status);
export const getContractorDisplayName = (profile = EMPTY_CONTRACTOR_PROFILE) =>
  String(profile?.companyName || "").trim() ||
  String(profile?.contactName || "").trim() ||
  "Contractor";

export const getProfileAddressDisplay = (profile = {}) => {
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
export const getLegacyCustomerProfile = () => {
  if (typeof window === "undefined") {
    return normalizeCustomerRecord();
  }

  return normalizeCustomerRecord(safeJsonParse(localStorage.getItem("customerProfile"), EMPTY_CUSTOMER_PROFILE));
};
export const getLegacyContractorProfile = () => {
  if (typeof window === "undefined") {
    return normalizeContractorProfile();
  }

  return normalizeContractorProfile(safeJsonParse(localStorage.getItem("contractorProfile"), EMPTY_CONTRACTOR_PROFILE));
};
export const createSavedContractorRecord = (profile = {}) => {
  const timestamp = new Date().toISOString();

  return normalizeContractorProfile({
    ...profile,
    id: profile.id || createContractorId(),
    createdAt: profile.createdAt || timestamp,
    updatedAt: timestamp
  });
};
export const getInitialSavedContractors = () => {
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
export const getInitialContractorProfile = () => {
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
export const createSavedCustomerRecord = (profile = {}) => {
  const timestamp = new Date().toISOString();

  return normalizeCustomerRecord({
    ...profile,
    id: profile.id || createCustomerId(),
    createdAt: profile.createdAt || timestamp,
    updatedAt: timestamp
  });
};
export const getInitialSavedCustomers = () => {
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
export const getInitialCustomerProfile = () => {
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

