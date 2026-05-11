import React from "react";
import { Card, Button, Input, Select } from "../ui";

const getContractorDisplayName = (profile = {}) =>
  String(profile?.companyName || "").trim() ||
  String(profile?.contactName || "").trim() ||
  "Contractor";

const getProfileAddressDisplay = (profile = {}) => {
  const unitNumber = String(profile?.unitNumber || "").trim();
  const streetAddress = String(profile?.address || "").trim();
  const city = String(profile?.city || "").trim();
  const province = String(profile?.province || "").trim();
  const postalCode = String(profile?.postalCode || "").trim();

  return [
    unitNumber ? `${streetAddress} Unit ${unitNumber}` : streetAddress,
    city,
    province,
    postalCode
  ].filter(Boolean).join(", ");
};

const getContractorExpiryLabel = (settings = {}) => {
  const amount = Number(settings.amount || 0);
  const unit = settings.unit === "years" ? "years" : "months";
  const unitLabel = amount === 1 ? unit.replace(/s$/, "") : unit;

  return amount ? `${amount} ${unitLabel}` : "Off";
};

const addMonthsToDateInput = (value, months) => {
  if (!value) return "";

  const nextDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(nextDate.getTime())) return "";

  nextDate.setMonth(nextDate.getMonth() + Number(months || 0));
  return nextDate.toISOString().slice(0, 10);
};

const getContractorInactiveAfterDate = (profile = {}, settings = {}) => {
  if (!settings.enabled) return "";

  const months = settings.unit === "years"
    ? Number(settings.amount || 0) * 12
    : Number(settings.amount || 0);

  return addMonthsToDateInput(profile.lastAssignedJobDate, months);
};

const getRateTypeLabel = (rateType = "hour") => {
  if (rateType === "project") return "Project";
  if (rateType === "day") return "Day";
  return "Hour";
};

const getContractorRateDisplay = (contractor = {}) => {
  const rate = String(contractor.rate || "").trim();
  if (!rate) return "Not set";

  return `$${rate} / ${getRateTypeLabel(contractor.rateType).toLowerCase()}`;
};

export default function ContractorPage({
  dark,
  savedContractors,
  contractorDraft,
  selectedContractorId,
  isEditingContractor,
  showContractorNotes,
  contractorExpirySettings,
  onUpdateContractorProfile,
  onSaveContractor,
  onCancelContractorEditing,
  onSelectContractor,
  onStartNewContractor,
  onStartEditingContractor,
  onToggleContractorNotes,
  onOpenQuotes
}) {
  const contractorFormFields = (
    <>
      <div className="grid three-col">
        <label>
          Company Name
          <Input
            placeholder="Company Name"
            value={contractorDraft.companyName}
            onChange={(e) => onUpdateContractorProfile("companyName", e.target.value)}
          />
        </label>
        <label>
          Contact Name
          <Input
            placeholder="Contact Name"
            value={contractorDraft.contactName}
            onChange={(e) => onUpdateContractorProfile("contactName", e.target.value)}
          />
        </label>
        <label>
          Trade
          <Input
            placeholder="Trade"
            value={contractorDraft.trade}
            onChange={(e) => onUpdateContractorProfile("trade", e.target.value)}
          />
        </label>
        <label>
          Phone
          <Input
            placeholder="Phone"
            value={contractorDraft.phone}
            onChange={(e) => onUpdateContractorProfile("phone", e.target.value)}
          />
        </label>
        <label>
          Email
          <Input
            placeholder="Email"
            value={contractorDraft.email}
            onChange={(e) => onUpdateContractorProfile("email", e.target.value)}
          />
        </label>
        <div className="grid span-two contractor-rate-row">
          <label>
            Rate
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Rate"
              value={contractorDraft.rate || ""}
              onChange={(e) => onUpdateContractorProfile("rate", e.target.value)}
            />
          </label>
          <label>
            Rate Type
            <Select
              value={contractorDraft.rateType || "hour"}
              onChange={(e) => onUpdateContractorProfile("rateType", e.target.value)}
            >
              <option value="project">Project</option>
              <option value="hour">Hour</option>
              <option value="day">Day</option>
            </Select>
          </label>
        </div>
        <div className="grid span-two customer-address-row">
          <label>
            Address
            <Input
              placeholder="Business Address"
              value={contractorDraft.address}
              onChange={(e) => onUpdateContractorProfile("address", e.target.value)}
            />
          </label>
          <label>
            Unit Number
            <Input
              placeholder="Unit Number"
              value={contractorDraft.unitNumber}
              onChange={(e) => onUpdateContractorProfile("unitNumber", e.target.value)}
            />
          </label>
        </div>
        <label>
          City
          <Input
            placeholder="City"
            value={contractorDraft.city}
            onChange={(e) => onUpdateContractorProfile("city", e.target.value)}
          />
        </label>
        <label>
          Province
          <Input
            placeholder="Province"
            value={contractorDraft.province}
            onChange={(e) => onUpdateContractorProfile("province", e.target.value)}
          />
        </label>
        <label>
          Post Code
          <Input
            placeholder="Post Code"
            value={contractorDraft.postalCode}
            onChange={(e) => onUpdateContractorProfile("postalCode", e.target.value)}
          />
        </label>
      </div>

      {showContractorNotes ? (
        <div className="customer-notes-section">
          <label className="customer-notes-label">
            Contractor Notes
            <textarea
              className="input customer-notes-input"
              placeholder="Add contractor notes"
              value={contractorDraft.notes}
              onChange={(e) => onUpdateContractorProfile("notes", e.target.value)}
            />
          </label>
        </div>
      ) : null}
    </>
  );

  const contractorEditorActions = (
    <div className="button-row customer-action-row">
      <Button onClick={onSaveContractor}>Save Contractor</Button>
      <Button variant="secondary" onClick={onCancelContractorEditing}>Cancel</Button>
    </div>
  );

  const contractorEditor = isEditingContractor && !selectedContractorId ? (
    <Card dark={dark}>
      <div className="section-header">
        <div>
          <h3>{contractorDraft.id ? `Edit ${getContractorDisplayName(contractorDraft)}` : "New Contractor"}</h3>
          <p className="row-subtitle">
            Update the contractor details, then save the record to keep it in your contractor directory.
          </p>
        </div>
        <div className="button-row">
          <Button variant="secondary" onClick={onToggleContractorNotes}>
            {showContractorNotes ? "Hide Notes" : "Notes"}
          </Button>
        </div>
      </div>

      {contractorFormFields}
      {contractorEditorActions}
    </Card>
  ) : null;

  return (
    <>
      {contractorEditor}

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Contractor CRM</h3>
            <p className="row-subtitle">
              Keep a list of saved contractors, open any record to review it, and add new contractors as your directory grows.
            </p>
          </div>
          <div className="button-row">
            <Button onClick={onStartNewContractor}>New Contractor</Button>
            <Button variant="secondary" onClick={onOpenQuotes}>Go To Quotes</Button>
          </div>
        </div>

        {savedContractors.length === 0 ? (
          <div className="quotes-empty-state">
            <p>No saved contractors yet.</p>
            <Button onClick={onStartNewContractor}>Add First Contractor</Button>
          </div>
        ) : (
          <div className="list-table">
            {savedContractors.map((contractor) => (
              <div
                key={contractor.id}
                className={[
                  "list-row",
                  "contractor-directory-row",
                  selectedContractorId === contractor.id && !isEditingContractor ? "active" : ""
                ].filter(Boolean).join(" ")}
              >
                <div className="contractor-directory-summary">
                  <button
                    type="button"
                    className="contractor-directory-trigger"
                    onClick={() => onSelectContractor(contractor)}
                  >
                    <div className="directory-title-row">
                      <span className="row-title">{getContractorDisplayName(contractor)}</span>
                      <span className={`status-pill ${contractor.status === "inactive" ? "inactive" : "active"}`}>
                        {contractor.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <div className="row-subtitle">
                      {contractor.trade || contractor.contactName || "No trade"} • {contractor.email || contractor.phone || "No contact info"} • Last job: {contractor.lastAssignedJobDate || "None"}
                    </div>
                  </button>
                  <div className="button-row">
                    <Button
                      variant="secondary"
                      onClick={() => onStartEditingContractor(contractor)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                {selectedContractorId === contractor.id && isEditingContractor ? (
                  <div className="contractor-directory-expanded contractor-inline-editor">
                    <div className="section-header contractor-inline-editor-header">
                      <div>
                        <h3>{`Edit ${getContractorDisplayName(contractorDraft)}`}</h3>
                        <p className="row-subtitle">
                          Update the contractor details below and save when you're done.
                        </p>
                      </div>
                      <div className="button-row">
                        <Button variant="secondary" onClick={onToggleContractorNotes}>
                          {showContractorNotes ? "Hide Notes" : "Notes"}
                        </Button>
                      </div>
                    </div>
                    {contractorFormFields}
                    {contractorEditorActions}
                  </div>
                ) : null}

                {selectedContractorId === contractor.id && !isEditingContractor ? (
                  <div className="contractor-directory-expanded">
                    <div className="details-list">
                      <div><strong>Company:</strong> {contractor.companyName || "Not set"}</div>
                      <div><strong>Contact:</strong> {contractor.contactName || "Not set"}</div>
                      <div><strong>Trade:</strong> {contractor.trade || "Not set"}</div>
                      <div><strong>Status:</strong> {contractor.status === "inactive" ? "Inactive" : "Active"}</div>
                      <div><strong>Rate:</strong> {getContractorRateDisplay(contractor)}</div>
                      <div><strong>Auto-Expiry:</strong> {contractorExpirySettings.enabled ? getContractorExpiryLabel(contractorExpirySettings) : "Off"}</div>
                      <div><strong>Last Assigned Job:</strong> {contractor.lastAssignedJobDate || "Not set"}</div>
                      <div><strong>Inactive Date:</strong> {getContractorInactiveAfterDate(contractor, contractorExpirySettings) || "Not set"}</div>
                      <div><strong>Phone:</strong> {contractor.phone || "Not set"}</div>
                      <div><strong>Email:</strong> {contractor.email || "Not set"}</div>
                      <div><strong>Address:</strong> {getProfileAddressDisplay(contractor) || contractor.address || "Not set"}</div>
                      <div><strong>Unit Number:</strong> {contractor.unitNumber || "Not set"}</div>
                      <div><strong>City:</strong> {contractor.city || "Not set"}</div>
                      <div><strong>Province:</strong> {contractor.province || "Not set"}</div>
                      <div><strong>Post Code:</strong> {contractor.postalCode || "Not set"}</div>
                    </div>

                    <div className="button-row customer-action-row">
                      <Button variant="secondary" onClick={onToggleContractorNotes}>
                        {showContractorNotes ? "Hide Notes" : "Notes"}
                      </Button>
                      <Button variant="secondary" onClick={() => onStartEditingContractor(contractor)}>
                        Edit {getContractorDisplayName(contractor)}
                      </Button>
                    </div>

                    {showContractorNotes ? (
                      <div className="customer-notes-display">
                        <h4>Contractor Notes</h4>
                        <p>{contractor.notes?.trim() || "No notes saved yet."}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
