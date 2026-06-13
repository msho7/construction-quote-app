import { useState } from "react";
import { Button, Card, Select } from "../ui";
import { ACCESS_PAGE_OPTIONS, ACCESS_ROLE_OPTIONS, DEFAULT_ROLE_ACCESS } from "../../constants/appConstants";
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
  onSetQuotesView,
  canManageAccess = false,
  localUserAccounts = [],
  onCreateUserAccount,
  onUpdateUserAccount,
  onDeleteUserAccount
}) {
  const [newUserDraft, setNewUserDraft] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    allowedPageIds: DEFAULT_ROLE_ACCESS.manager
  });
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [editingUserKey, setEditingUserKey] = useState("");
  const [editingUserDraft, setEditingUserDraft] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    allowedPageIds: DEFAULT_ROLE_ACCESS.manager
  });
  const [showEditingUserPassword, setShowEditingUserPassword] = useState(false);
  const [userAccountMessage, setUserAccountMessage] = useState("");

  const updateNewUserDraft = (field, value) => {
    setNewUserDraft((previous) => ({ ...previous, [field]: value }));
  };

  const resetNewUserDraft = () => {
    setNewUserDraft({
      name: "",
      email: "",
      password: "",
      role: "manager",
      allowedPageIds: DEFAULT_ROLE_ACCESS.manager
    });
  };

  const startCreatingUser = () => {
    resetNewUserDraft();
    setShowNewUserPassword(false);
    setShowNewUserForm(true);
    setUserAccountMessage("");
  };

  const cancelCreatingUser = () => {
    resetNewUserDraft();
    setShowNewUserPassword(false);
    setShowNewUserForm(false);
    setUserAccountMessage("");
  };

  const updateNewUserRole = (role) => {
    setNewUserDraft((previous) => ({
      ...previous,
      role,
      allowedPageIds: role === "administrator"
        ? DEFAULT_ROLE_ACCESS.administrator
        : DEFAULT_ROLE_ACCESS[role] || []
    }));
  };

  const updateNewUserPageAccess = (pageId, enabled) => {
    setNewUserDraft((previous) => {
      const nextAllowedPages = new Set(previous.allowedPageIds || []);

      if (enabled) {
        nextAllowedPages.add(pageId);
      } else {
        nextAllowedPages.delete(pageId);
      }

      return {
        ...previous,
        allowedPageIds: Array.from(nextAllowedPages)
      };
    });
  };

  const createNewUser = () => {
    const trimmedName = newUserDraft.name.trim();
    const trimmedEmail = newUserDraft.email.trim();
    const password = newUserDraft.password.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setUserAccountMessage("Enter a name, email, and password for the new user.");
      return;
    }

    if (password.length < 6) {
      setUserAccountMessage("Use at least 6 characters for the password.");
      return;
    }

    const result = onCreateUserAccount?.({
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: newUserDraft.role,
      allowedPageIds: newUserDraft.allowedPageIds
    });

    if (!result?.ok) {
      setUserAccountMessage(result?.message || "Could not create that user.");
      return;
    }

    resetNewUserDraft();
    setShowNewUserPassword(false);
    setShowNewUserForm(false);
    setUserAccountMessage("User account created.");
  };

  const startEditingUser = (account) => {
    setEditingUserKey(account.id || account.email);
    setEditingUserDraft({
      name: account.name || "",
      email: account.email || "",
      password: account.password || "",
      role: account.role || "manager",
      allowedPageIds: Array.isArray(account.allowedPageIds)
        ? account.allowedPageIds
        : DEFAULT_ROLE_ACCESS[account.role] || DEFAULT_ROLE_ACCESS.manager
    });
    setShowEditingUserPassword(false);
    setUserAccountMessage("");
  };

  const updateEditingUserDraft = (field, value) => {
    setEditingUserDraft((previous) => ({ ...previous, [field]: value }));
  };

  const cancelEditingUser = () => {
    setEditingUserKey("");
    setShowEditingUserPassword(false);
    setEditingUserDraft({
      name: "",
      email: "",
      password: "",
      role: "manager",
      allowedPageIds: DEFAULT_ROLE_ACCESS.manager
    });
    setUserAccountMessage("");
  };

  const updateEditingUserRole = (role) => {
    setEditingUserDraft((previous) => ({
      ...previous,
      role,
      allowedPageIds: role === "administrator"
        ? DEFAULT_ROLE_ACCESS.administrator
        : DEFAULT_ROLE_ACCESS[role] || []
    }));
  };

  const updateEditingUserPageAccess = (pageId, enabled) => {
    setEditingUserDraft((previous) => {
      const nextAllowedPages = new Set(previous.allowedPageIds || []);

      if (enabled) {
        nextAllowedPages.add(pageId);
      } else {
        nextAllowedPages.delete(pageId);
      }

      return {
        ...previous,
        allowedPageIds: Array.from(nextAllowedPages)
      };
    });
  };

  const saveEditingUser = () => {
    const result = onUpdateUserAccount?.(editingUserKey, editingUserDraft);

    if (!result?.ok) {
      setUserAccountMessage(result?.message || "Could not update that user.");
      return;
    }

    cancelEditingUser();
    setUserAccountMessage("User account updated.");
  };

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

      {canManageAccess ? (
        <>
          <div className="settings-group">
            <div>
              <div className="settings-row-label">User Accounts</div>
              <p className="row-subtitle">
                Create accounts for administrators, managers, and contractors. New users cannot sign themselves up.
              </p>
            </div>

            {!showNewUserForm ? (
              <div className="user-account-create-trigger">
                <Button onClick={startCreatingUser}>Create User</Button>
              </div>
            ) : (
              <div className="user-account-row user-account-row-editing user-account-create-panel">
                <div className="user-account-edit-grid">
                  <label>
                    Full Name
                    <input
                      className="input"
                      value={newUserDraft.name}
                      onChange={(event) => updateNewUserDraft("name", event.target.value)}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      className="input"
                      type="email"
                      value={newUserDraft.email}
                      onChange={(event) => updateNewUserDraft("email", event.target.value)}
                    />
                  </label>
                  <label>
                    Password
                    <span className="password-visibility-field">
                      <input
                        className="input"
                        type={showNewUserPassword ? "text" : "password"}
                        value={newUserDraft.password}
                        onChange={(event) => updateNewUserDraft("password", event.target.value)}
                      />
                      <button
                        className="password-visibility-toggle"
                        type="button"
                        onClick={() => setShowNewUserPassword((visible) => !visible)}
                      >
                        {showNewUserPassword ? "Hide" : "Show"}
                      </button>
                    </span>
                  </label>
                  <label>
                    Role
                    <Select
                      value={newUserDraft.role}
                      onChange={(event) => updateNewUserRole(event.target.value)}
                    >
                      {ACCESS_ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </Select>
                  </label>
                </div>
                <div className="user-account-access-panel">
                  <div>
                    <div className="settings-row-label">Account Access</div>
                    <p className="row-subtitle">
                      {newUserDraft.role === "administrator"
                        ? "Administrators receive full access to every page."
                        : "Turn pages on or off before creating this user."}
                    </p>
                  </div>
                  <div className="access-page-list">
                    {ACCESS_PAGE_OPTIONS.map((page) => {
                      const checked = Boolean((newUserDraft.allowedPageIds || []).includes(page.id));

                      return (
                        <label key={`new-user-${page.id}`} className="settings-toggle access-page-toggle">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={newUserDraft.role === "administrator"}
                            onChange={(event) => updateNewUserPageAccess(page.id, event.target.checked)}
                          />
                          {page.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="button-row user-account-row-actions">
                  <Button onClick={createNewUser}>Save User</Button>
                  <Button variant="secondary" onClick={cancelCreatingUser}>Cancel</Button>
                </div>
              </div>
            )}

            {userAccountMessage ? <p className="row-subtitle">{userAccountMessage}</p> : null}

            <div className="user-account-list">
              {localUserAccounts.map((account) => {
                const roleLabel = ACCESS_ROLE_OPTIONS.find((role) => role.id === account.role)?.label || account.role;
                const accountKey = account.id || account.email;
                const isEditingUser = editingUserKey === accountKey;

                if (isEditingUser) {
                  return (
                    <div key={accountKey} className="user-account-row user-account-row-editing">
                      <div className="user-account-edit-grid">
                        <label>
                          Full Name
                          <input
                            className="input"
                            value={editingUserDraft.name}
                            onChange={(event) => updateEditingUserDraft("name", event.target.value)}
                          />
                        </label>
                        <label>
                          Email
                          <input
                            className="input"
                            type="email"
                            value={editingUserDraft.email}
                            onChange={(event) => updateEditingUserDraft("email", event.target.value)}
                          />
                        </label>
                        <label>
                          Password
                          <span className="password-visibility-field">
                            <input
                              className="input"
                              type={showEditingUserPassword ? "text" : "password"}
                              value={editingUserDraft.password}
                              onChange={(event) => updateEditingUserDraft("password", event.target.value)}
                            />
                            <button
                              className="password-visibility-toggle"
                              type="button"
                              onClick={() => setShowEditingUserPassword((visible) => !visible)}
                            >
                              {showEditingUserPassword ? "Hide" : "Show"}
                            </button>
                          </span>
                        </label>
                        <label>
                          Role
                          <Select
                            value={editingUserDraft.role}
                            onChange={(event) => updateEditingUserRole(event.target.value)}
                          >
                            {ACCESS_ROLE_OPTIONS.map((role) => (
                              <option key={role.id} value={role.id}>{role.label}</option>
                            ))}
                          </Select>
                        </label>
                      </div>
                      {editingUserDraft.role !== "administrator" ? (
                        <div className="user-account-access-panel">
                          <div>
                            <div className="settings-row-label">Account Access</div>
                            <p className="row-subtitle">
                              Turn pages on or off for this user account.
                            </p>
                          </div>
                          <div className="access-page-list">
                            {ACCESS_PAGE_OPTIONS.map((page) => {
                              const checked = Boolean((editingUserDraft.allowedPageIds || []).includes(page.id));

                              return (
                                <label key={`${editingUserKey}-${page.id}`} className="settings-toggle access-page-toggle">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => updateEditingUserPageAccess(page.id, event.target.checked)}
                                  />
                                  {page.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      <div className="button-row user-account-row-actions">
                        <Button onClick={saveEditingUser}>Save</Button>
                        <Button variant="secondary" onClick={cancelEditingUser}>Cancel</Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={accountKey} className="user-account-row">
                    <div>
                      <div className="row-title">{account.name || account.email}</div>
                      <div className="row-subtitle">{account.email} • {roleLabel}</div>
                    </div>
                    <div className="button-row user-account-row-actions">
                      <Button variant="secondary" onClick={() => startEditingUser(account)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => onDeleteUserAccount?.(accountKey)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

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
