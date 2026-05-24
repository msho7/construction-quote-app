import {
  formatQuoteReferenceNumber,
  getNextQuoteProjectNumber
} from "./appUtils";
import {
  hasContractorProfileData,
  hasCustomerProfileData,
  normalizeContractorProfile,
  normalizeCustomerRecord
} from "./profileUtils";
import { assignContractorsToSchedule } from "./scheduleUtils";

export const getCurrentQuoteTakeoffPayload = ({
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
  schedule
}) => {
  const existingQuote = editingQuoteId
    ? savedQuotes.find((savedQuote) => savedQuote.id === editingQuoteId)
    : null;
  const normalizedQuoteCustomerProfile = hasCustomerProfileData(quoteCustomerProfile)
    ? normalizeCustomerRecord(quoteCustomerProfile)
    : null;
  const normalizedQuoteContractorProfile = hasContractorProfileData(contractorProfile)
    ? normalizeContractorProfile(contractorProfile, contractorExpirySettings)
    : null;
  const projectNumber = existingQuote?.projectNumber || getNextQuoteProjectNumber(savedQuotes);
  const quoteStatus = existingQuote?.status || "open";
  const invoicePartNumber = existingQuote?.invoicePartNumber || 1;

  return {
    ...(existingQuote || {}),
    id: editingQuoteId || existingQuote?.id || null,
    projectNumber,
    status: quoteStatus,
    invoicePartNumber,
    projectTitle: projectTitle || existingQuote?.projectTitle || `Quote ${savedQuotes.length + 1}`,
    clientName,
    customerId: selectedQuoteCustomerId || normalizedQuoteCustomerProfile?.id || "",
    customerProfile: normalizedQuoteCustomerProfile,
    contractorProfile: normalizedQuoteContractorProfile,
    projectAddress,
    quoteDate,
    startDate,
    taxRate: Number(taxRate || 0),
    items,
    totals,
    schedule,
    takeoffSource: "Current quote draft"
  };
};

export const getQuoteDocumentPayload = ({
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
}) => {
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
    schedule: assignContractorsToSchedule(
      schedule.filter((task) => task.name?.trim()),
      savedContractors
    )
  };
};

export const getDefaultExportFileName = ({ projectTitle, savedQuotes }) =>
  projectTitle.trim() || `Quote ${savedQuotes.length + 1}`;
