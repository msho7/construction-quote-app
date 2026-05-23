// @ts-nocheck
import { normalizeSavedQuoteReferences } from "./appUtils";
import { hasContractorProfileData, hasCustomerProfileData, normalizeContractorProfile, normalizeCustomerRecord } from "./profileUtils";
import { normalizeScheduleItems } from "./scheduleUtils";

export const APP_STATE_KEYS = [
  "companySettings",
  "contractorExpirySettings",
  "contractorProfile",
  "customerProfile",
  "navigationOpen",
  "priceList",
  "savedContractors",
  "savedCustomers",
  "savedQuotes",
  "savedRoomTemplates",
  "themeMode"
];

export const persistAppStateToLocalStorage = (state = {}) => {
  if (typeof window === "undefined") return;

  APP_STATE_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(state, key)) return;

    const value = state[key];
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  });
};

export const normalizeRemoteSavedQuotes = (quotes = []) =>
  normalizeSavedQuoteReferences(Array.isArray(quotes) ? quotes : []).map((quote) => ({
    ...quote,
    schedule: normalizeScheduleItems(quote.schedule || [])
  }));

export const normalizeRemoteSavedContractors = (contractors = []) =>
  (Array.isArray(contractors) ? contractors : [])
    .map((profile) => normalizeContractorProfile(profile))
    .filter((profile) => hasContractorProfileData(profile));

export const normalizeRemoteSavedCustomers = (customers = []) =>
  (Array.isArray(customers) ? customers : [])
    .map((profile) => normalizeCustomerRecord(profile))
    .filter((profile) => hasCustomerProfileData(profile));

