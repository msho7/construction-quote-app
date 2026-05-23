// @ts-nocheck
import { Button, Card, Select } from "../ui";
import {
  COMPANY_TYPE_OPTIONS,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_CONTRACTOR_EXPIRY_SETTINGS,
  EMPTY_CUSTOMER_PROFILE,
  getCompanySettings,
  getContractorExpirySettings,
  normalizeContractorProfile
} from "../../utils/profileUtils";

export default function SettingsPage({
  dark,
  themeMode,
  companySettings,
  contractorExpirySettings,
  onSetThemeMode,
  onSetCompanySettings,
  onUpdateContractorExpirySettings,
  onSetContractorExpirySettings,
  onSetContractorProfile,
  onSetSavedContractors,
  onSetContractorDraft,
  onSetSelectedContractorId,
  onSetIsEditingContractor,
  onSetSavedCustomers,
  onSetCustomerProfile,
  onSetCustomerDraft,
  onSetSelectedCustomerId,
  onSetIsEditingCustomer,
  onSetShowCustomerNotes,
  onSetPriceList,
  onSetSavedRoomTemplates,
  onSetEditingRoomTemplateId,
  onSetRoomTemplateDraft,
  onSetSavedQuotes,
  onSetEditingQuoteId,
  onSetQuotesView
}) {
  const clearSavedData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("contractorProfile");
      localStorage.removeItem("savedContractors");
      localStorage.removeItem("customerProfile");
      localStorage.removeItem("savedCustomers");
      localStorage.removeItem("priceList");
      localStorage.removeItem("savedRoomTemplates");
      localStorage.removeItem("savedQuotes");
      localStorage.removeItem("contractorExpirySettings");
      localStorage.removeItem("companySettings");
    }

    const defaultContractorExpirySettings = { ...DEFAULT_CONTRACTOR_EXPIRY_SETTINGS };
    onSetCompanySettings({ ...DEFAULT_COMPANY_SETTINGS });
    onSetContractorExpirySettings(defaultContractorExpirySettings);
    onSetContractorProfile(normalizeContractorProfile({}, defaultContractorExpirySettings));
    onSetSavedContractors([]);
    onSetContractorDraft(normalizeContractorProfile({}, defaultContractorExpirySettings));
    onSetSelectedContractorId(null);
    onSetIsEditingContractor(false);
    onSetSavedCustomers([]);
    onSetCustomerProfile({ ...EMPTY_CUSTOMER_PROFILE });
    onSetCustomerDraft({ ...EMPTY_CUSTOMER_PROFILE });
    onSetSelectedCustomerId(null);
    onSetIsEditingCustomer(true);
    onSetShowCustomerNotes(false);
    onSetPriceList([]);
    onSetSavedRoomTemplates([]);
    onSetEditingRoomTemplateId(null);
    onSetRoomTemplateDraft(null);
    onSetSavedQuotes([]);
    onSetEditingQuoteId(null);
    onSetQuotesView("landing");
  };

  return (
    <Card dark={dark}>
      <h3>Settings</h3>
      <div className="settings-group">
        <label>Theme Mode</label>
        <div className="button-row">
          <Button variant={themeMode === "light" ? "primary" : "secondary"} onClick={() => onSetThemeMode("light")}>Light</Button>
          <Button variant={themeMode === "dark" ? "primary" : "secondary"} onClick={() => onSetThemeMode("dark")}>Dark</Button>
          <Button variant={themeMode === "system" ? "primary" : "secondary"} onClick={() => onSetThemeMode("system")}>System</Button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-expiry-row">
          <div className="settings-row-label">Company Type</div>
          <div className="settings-expiry-controls">
            <label className="settings-company-field">
              Trade list
              <Select
                value={companySettings.companyType}
                onChange={(event) =>
                  onSetCompanySettings(getCompanySettings({
                    ...companySettings,
                    companyType: event.target.value
                  }))}
              >
                {COMPANY_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </Select>
            </label>
          </div>
        </div>

        <p className="row-subtitle">
          This controls which trade options appear when adding or editing contractors.
        </p>
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
                  onUpdateContractorExpirySettings((previous) =>
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
                      onUpdateContractorExpirySettings((previous) =>
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
                      onUpdateContractorExpirySettings((previous) =>
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
          <Button variant="danger" onClick={clearSavedData}>
            Clear Saved Data
          </Button>
        </div>
      </div>
    </Card>
  );
}
