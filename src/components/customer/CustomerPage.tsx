// @ts-nocheck
import React from "react";
import { Card, Button, Input } from "../ui";
import { formatMoney, formatQuoteReferenceNumber } from "../../utils/appUtils";

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

const getNormalizedText = (value) => String(value || "").trim().toLowerCase();
const getCustomerDisplayName = (profile = {}) =>
  String(profile?.customerName || "").trim() ||
  String(profile?.companyName || "").trim() ||
  "Customer";
const hasCustomerProfileData = (profile = {}) =>
  CUSTOMER_PROFILE_FIELDS.some((field) => String(profile?.[field] || "").trim());
const getSavedQuoteStatus = (quote = {}) => quote.status || "open";
const isQuoteApprovedOrLater = (quote = {}) =>
  ["approved", "ongoing", "completed", "invoiced"].includes(getSavedQuoteStatus(quote));

export default function CustomerPage({
  dark,
  savedCustomers,
  savedQuotes,
  customerDraft,
  selectedCustomerId,
  isEditingCustomer,
  showCustomerNotes,
  customerJobViews,
  onUpdateCustomerProfile,
  onSaveCustomer,
  onCancelCustomerEditing,
  onSelectCustomer,
  onToggleCustomerJobView,
  onStartNewCustomer,
  onStartEditingCustomer,
  onToggleCustomerNotes,
  onOpenQuotes,
  onOpenCustomerQuotes,
  onLoadQuote
}) {
  const getQuoteMatchedCustomer = (quote) =>
    savedCustomers.find((customer) => {
      if (quote.customerId && customer.id === quote.customerId) return true;
      if (quote.customerProfile?.id && customer.id === quote.customerProfile.id) return true;

      const customerName = getNormalizedText(getCustomerDisplayName(customer));
      const quoteClientName = getNormalizedText(quote.clientName);
      const quoteProfileName = hasCustomerProfileData(quote.customerProfile)
        ? getNormalizedText(getCustomerDisplayName(quote.customerProfile))
        : "";
      const customerEmail = getNormalizedText(customer.email);
      const quoteEmail = getNormalizedText(quote.customerProfile?.email);

      if (customerName && (quoteClientName === customerName || quoteProfileName === customerName)) return true;
      return Boolean(customerEmail && quoteEmail && customerEmail === quoteEmail);
    });

  const customerQuoteRecords = savedQuotes
    .map((quote) => ({
      quote,
      customer: getQuoteMatchedCustomer(quote)
    }))
    .filter(({ quote, customer }) =>
      customer ||
      hasCustomerProfileData(quote.customerProfile) ||
      String(quote.clientName || "").trim()
    );

  const getCustomerQuoteBuckets = (customerId) => {
    const matchedRecords = customerQuoteRecords.filter(({ customer }) => customer?.id === customerId);

    return {
      open: matchedRecords.filter(({ quote }) => !isQuoteApprovedOrLater(quote)),
      ongoing: matchedRecords.filter(({ quote }) => ["approved", "ongoing"].includes(getSavedQuoteStatus(quote))),
      previous: matchedRecords.filter(({ quote }) => ["completed", "invoiced"].includes(getSavedQuoteStatus(quote)))
    };
  };

  const renderCompactCustomerQuoteRow = ({ quote }) => (
    <button
      key={quote.id}
      type="button"
      className="customer-card-job-row"
      onClick={() => onLoadQuote(quote)}
    >
      <span>
        <strong>{quote.projectTitle || "Untitled Quote"}</strong>
        <span>{formatQuoteReferenceNumber(quote)} • {quote.quoteDate || "No quote date"}</span>
      </span>
      <span>{formatMoney(quote.totals?.total || 0)}</span>
    </button>
  );

  const customerEditor = isEditingCustomer ? (
    <Card dark={dark}>
      <div className="section-header">
        <div>
          <h3>{customerDraft.id ? `Edit ${getCustomerDisplayName(customerDraft)}` : "New Customer"}</h3>
          <p className="row-subtitle">
            Update the customer details, then save the record to keep it in your customer directory.
          </p>
        </div>
        <div className="button-row">
          <Button variant="secondary" onClick={onToggleCustomerNotes}>
            {showCustomerNotes ? "Hide Notes" : "Notes"}
          </Button>
        </div>
      </div>

      <div className="grid three-col">
        <label>
          Customer Name
          <Input
            placeholder="Customer Name"
            value={customerDraft.customerName}
            onChange={(e) => onUpdateCustomerProfile("customerName", e.target.value)}
          />
        </label>
        <label>
          Company Name
          <Input
            placeholder="Company Name"
            value={customerDraft.companyName}
            onChange={(e) => onUpdateCustomerProfile("companyName", e.target.value)}
          />
        </label>
        <label>
          Phone
          <Input
            placeholder="Phone"
            value={customerDraft.phone}
            onChange={(e) => onUpdateCustomerProfile("phone", e.target.value)}
          />
        </label>
        <label>
          Email
          <Input
            placeholder="Email"
            value={customerDraft.email}
            onChange={(e) => onUpdateCustomerProfile("email", e.target.value)}
          />
        </label>
        <div className="grid span-two customer-address-row">
          <label>
            Address
            <Input
              placeholder="Customer Address"
              value={customerDraft.address}
              onChange={(e) => onUpdateCustomerProfile("address", e.target.value)}
            />
          </label>
          <label>
            Unit Number
            <Input
              placeholder="Unit Number"
              value={customerDraft.unitNumber}
              onChange={(e) => onUpdateCustomerProfile("unitNumber", e.target.value)}
            />
          </label>
        </div>
        <label>
          City
          <Input
            placeholder="City"
            value={customerDraft.city}
            onChange={(e) => onUpdateCustomerProfile("city", e.target.value)}
          />
        </label>
        <label>
          Province
          <Input
            placeholder="Province"
            value={customerDraft.province}
            onChange={(e) => onUpdateCustomerProfile("province", e.target.value)}
          />
        </label>
        <label>
          Post Code
          <Input
            placeholder="Post Code"
            value={customerDraft.postalCode}
            onChange={(e) => onUpdateCustomerProfile("postalCode", e.target.value)}
          />
        </label>
      </div>

      {showCustomerNotes ? (
        <div className="customer-notes-section">
          <label className="customer-notes-label">
            Customer Notes
            <textarea
              className="input customer-notes-input"
              placeholder="Add customer notes"
              value={customerDraft.notes}
              onChange={(e) => onUpdateCustomerProfile("notes", e.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div className="button-row customer-action-row">
        <Button onClick={onSaveCustomer}>Save Customer</Button>
        <Button variant="secondary" onClick={onCancelCustomerEditing}>Cancel</Button>
      </div>
    </Card>
  ) : null;

  return (
    <>
      {customerEditor}

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Customer CRM</h3>
            <p className="row-subtitle">
              Keep a list of saved customers, open any record to review it, and add new customers as your directory grows.
            </p>
          </div>
          <div className="button-row">
            <Button onClick={onStartNewCustomer}>New Customer</Button>
            <Button variant="secondary" onClick={onOpenQuotes}>Go To Quotes</Button>
          </div>
        </div>

        {savedCustomers.length === 0 ? (
          <div className="quotes-empty-state">
            <p>No saved customers yet.</p>
            <Button onClick={onStartNewCustomer}>Add First Customer</Button>
          </div>
        ) : (
          <div className="list-table">
            {savedCustomers.map((customer) => {
              const customerQuoteBuckets = getCustomerQuoteBuckets(customer.id);
              const activeJobView = customerJobViews[customer.id] || "ongoing";
              const activeJobQuotes = customerQuoteBuckets[activeJobView];
              const activeJobLabel = activeJobView === "previous" ? "Previous Jobs" : "Ongoing Jobs";

              return (
                <div
                  key={customer.id}
                  className={[
                    "list-row",
                    "customer-directory-row",
                    selectedCustomerId === customer.id && !isEditingCustomer ? "active" : ""
                  ].filter(Boolean).join(" ")}
                >
                  <div className="customer-directory-summary">
                    <button
                      type="button"
                      className="customer-directory-trigger"
                      onClick={() => onSelectCustomer(customer)}
                    >
                      <div className="row-title">{customer.customerName || "Unnamed Customer"}</div>
                      <div className="row-subtitle">
                        {customer.companyName || "No company name"} • {customer.email || customer.phone || "No contact info"}
                      </div>
                    </button>
                    <div className="button-row">
                      <Button
                        variant="secondary"
                        onClick={() => onStartEditingCustomer(customer)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="customer-card-work-summary">
                      <button
                        type="button"
                        className="customer-card-work-item customer-card-work-toggle"
                        onClick={() => onOpenCustomerQuotes(customer)}
                      >
                        <span>Open Quotes</span>
                        <strong>{customerQuoteBuckets.open.length}</strong>
                      </button>
                      <div className="customer-job-slider" role="group" aria-label="Customer jobs">
                        <button
                          type="button"
                          className={[
                            "customer-job-slider-option",
                            "ongoing",
                            activeJobView === "ongoing" ? "active" : ""
                          ].filter(Boolean).join(" ")}
                          onClick={() => onOpenCustomerQuotes(customer, "ongoing")}
                        >
                          <span>Ongoing Jobs</span>
                          <strong>{customerQuoteBuckets.ongoing.length}</strong>
                        </button>
                        <button
                          type="button"
                          className={[
                            "customer-job-slider-option",
                            "previous",
                            activeJobView === "previous" ? "active" : ""
                          ].filter(Boolean).join(" ")}
                          onClick={() => onOpenCustomerQuotes(customer, "completed")}
                        >
                          <span>Previous Jobs</span>
                          <strong>{customerQuoteBuckets.previous.length}</strong>
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedCustomerId === customer.id && !isEditingCustomer ? (
                    <div className="customer-directory-expanded">
                      <div className="details-list">
                        <div><strong>Name:</strong> {customer.customerName || "Not set"}</div>
                        <div><strong>Company:</strong> {customer.companyName || "Not set"}</div>
                        <div><strong>Phone:</strong> {customer.phone || "Not set"}</div>
                        <div><strong>Email:</strong> {customer.email || "Not set"}</div>
                        <div><strong>Address:</strong> {customer.address || "Not set"}</div>
                        <div><strong>Unit Number:</strong> {customer.unitNumber || "Not set"}</div>
                        <div><strong>City:</strong> {customer.city || "Not set"}</div>
                        <div><strong>Province:</strong> {customer.province || "Not set"}</div>
                        <div><strong>Post Code:</strong> {customer.postalCode || "Not set"}</div>
                      </div>

                      <div className="button-row customer-action-row">
                        <Button variant="secondary" onClick={onToggleCustomerNotes}>
                          {showCustomerNotes ? "Hide Notes" : "Notes"}
                        </Button>
                        <Button variant="secondary" onClick={() => onStartEditingCustomer(customer)}>
                          Edit {getCustomerDisplayName(customer)}
                        </Button>
                      </div>

                      {showCustomerNotes ? (
                        <div className="customer-notes-display">
                          <h4>Customer Notes</h4>
                          <p>{customer.notes?.trim() || "No notes saved yet."}</p>
                        </div>
                      ) : null}

                      <div className="customer-card-job-sections">
                        <section>
                          <div className="section-header">
                            <div>
                              <h4>Open Quotes</h4>
                              <p className="row-subtitle">Quotes still waiting for approval.</p>
                            </div>
                          </div>
                          {customerQuoteBuckets.open.length ? (
                            <div className="customer-card-job-list">
                              {customerQuoteBuckets.open.map(renderCompactCustomerQuoteRow)}
                            </div>
                          ) : (
                            <p className="row-subtitle">No open quotes for this customer.</p>
                          )}
                        </section>

                        <section>
                          <div className="section-header">
                            <div>
                              <h4>{activeJobLabel}</h4>
                              <p className="row-subtitle">
                                {activeJobView === "previous"
                                  ? "Completed and invoiced work for this customer."
                                  : "Approved and active work for this customer."}
                              </p>
                            </div>
                            <Button variant="secondary" onClick={() => onToggleCustomerJobView(customer.id)}>
                              {activeJobView === "previous" ? "Show Ongoing Jobs" : "Show Previous Jobs"}
                            </Button>
                          </div>
                          {activeJobQuotes.length ? (
                            <div className="customer-card-job-list">
                              {activeJobQuotes.map(renderCompactCustomerQuoteRow)}
                            </div>
                          ) : (
                            <p className="row-subtitle">No {activeJobLabel.toLowerCase()} for this customer.</p>
                          )}
                        </section>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
