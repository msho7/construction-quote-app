import React from "react";
import { Card, Button, Input, Select } from "../ui";

const CONTRACTOR_TRADE_PROFILES = [
  {
    id: "general-renovation",
    label: "General Contractor / Renovation Company",
    defaultTrades: [
      "Demolition", "Framing", "Drywall", "Taping", "Painting", "Flooring", "Tile", "Finish carpentry",
      "Trim/baseboards", "Doors", "Windows", "Cabinetry", "Plumbing", "Electrical", "HVAC"
    ],
    optionalTrades: [
      "Roofing", "Concrete", "Landscaping", "Masonry", "Insulation", "Waterproofing",
      "Permits/inspection", "Waste removal", "Cleaning"
    ]
  },
  {
    id: "plumbing",
    label: "Plumbing Company",
    defaultTrades: [
      "Plumbing rough-in", "Plumbing finishing", "Fixture installation", "Drain cleaning", "Pipe repair",
      "Leak repair", "Water heater installation", "Sump pump installation", "Toilet installation",
      "Faucet installation", "Shower/tub installation", "Shutoff valve replacement"
    ],
    optionalTrades: [
      "Gas fitting", "Backflow prevention", "Sewer line repair", "Camera inspection", "Hydronic heating",
      "Water softeners", "Emergency service"
    ]
  },
  {
    id: "electrical",
    label: "Electrical Company",
    defaultTrades: [
      "Rough-in electrical", "Finish electrical", "Panel upgrades", "Lighting installation",
      "Outlet/switch installation", "Breaker replacement", "Troubleshooting", "EV charger installation",
      "Smoke/CO detector installation"
    ],
    optionalTrades: [
      "Low voltage", "Security cameras", "Smart home wiring", "Solar wiring", "Generator hookup",
      "Data/network cabling", "Fire alarm systems"
    ]
  },
  {
    id: "hvac",
    label: "HVAC Company",
    defaultTrades: [
      "Furnace installation", "Furnace repair", "AC installation", "AC repair", "Ductwork",
      "Thermostat installation", "Ventilation", "Maintenance/service calls"
    ],
    optionalTrades: [
      "Heat pumps", "Boilers", "Radiant heating", "Gas lines", "HRV/ERV systems",
      "Commercial rooftop units", "Refrigeration"
    ]
  },
  {
    id: "roofing",
    label: "Roofing Company",
    defaultTrades: [
      "Roof inspection", "Shingle roofing", "Flat roofing", "Roof repair", "Flashing", "Underlayment",
      "Ice/water shield", "Gutters", "Downspouts", "Soffit/fascia"
    ],
    optionalTrades: ["Skylights", "Chimney flashing", "Metal roofing", "Roof ventilation", "Emergency tarping", "Siding"]
  },
  {
    id: "drywall-taping",
    label: "Drywall / Taping Company",
    defaultTrades: ["Drywall installation", "Drywall repair", "Boarding", "Taping", "Mudding", "Sanding", "Corner bead", "Ceiling repair"],
    optionalTrades: ["Texture removal", "Popcorn ceiling removal", "Soundproofing", "Fire-rated drywall", "Painting"]
  },
  {
    id: "painting",
    label: "Painting Company",
    defaultTrades: ["Interior painting", "Exterior painting", "Primer", "Wall repair", "Trim painting", "Door painting", "Ceiling painting", "Staining"],
    optionalTrades: ["Cabinet painting", "Wallpaper removal", "Spray painting", "Deck staining", "Epoxy coatings"]
  },
  {
    id: "flooring",
    label: "Flooring Company",
    defaultTrades: [
      "Flooring removal", "Subfloor prep", "Laminate flooring", "Vinyl plank", "Hardwood",
      "Engineered hardwood", "Carpet", "Baseboard removal/reinstall"
    ],
    optionalTrades: ["Tile flooring", "Stairs", "Floor leveling", "Heated floors", "Epoxy floors"]
  },
  {
    id: "tile",
    label: "Tile Company",
    defaultTrades: ["Tile removal", "Floor tile", "Wall tile", "Shower tile", "Backsplash", "Grout", "Waterproofing", "Schluter/edge trim"],
    optionalTrades: ["Heated floors", "Shower niches", "Stone tile", "Large-format tile", "Tile repair"]
  },
  {
    id: "framing-carpentry",
    label: "Framing / Carpentry Company",
    defaultTrades: ["Rough framing", "Wall framing", "Basement framing", "Door framing", "Window framing", "Blocking", "Structural repairs"],
    optionalTrades: ["Deck framing", "Stairs", "Roof framing", "Finish carpentry", "Trim", "Custom woodwork"]
  },
  {
    id: "finish-carpentry",
    label: "Finish Carpentry Company",
    defaultTrades: ["Baseboards", "Casing", "Crown moulding", "Interior doors", "Door hardware", "Shelving", "Closet systems", "Wainscoting"],
    optionalTrades: ["Built-ins", "Custom cabinets", "Stair railings", "Fireplace mantels", "Accent walls"]
  },
  {
    id: "concrete",
    label: "Concrete Company",
    defaultTrades: ["Concrete forming", "Concrete pouring", "Concrete finishing", "Slabs", "Driveways", "Walkways", "Patios", "Garage floors"],
    optionalTrades: ["Stamped concrete", "Concrete cutting", "Concrete repair", "Foundation work", "Waterproofing", "Epoxy coatings"]
  },
  {
    id: "landscaping",
    label: "Landscaping Company",
    defaultTrades: ["Sod installation", "Grading", "Soil/mulch", "Planting", "Lawn maintenance", "Garden beds", "Tree/shrub planting"],
    optionalTrades: ["Interlock", "Retaining walls", "Irrigation", "Drainage", "Fence/deck work", "Snow removal", "Outdoor lighting"]
  },
  {
    id: "masonry",
    label: "Masonry Company",
    defaultTrades: ["Brick repair", "Block work", "Stone work", "Tuckpointing", "Chimney repair", "Foundation parging"],
    optionalTrades: ["Retaining walls", "Concrete work", "Fireplace stone", "Cultured stone", "Waterproofing"]
  },
  {
    id: "excavation-sitework",
    label: "Excavation / Sitework Company",
    defaultTrades: ["Excavation", "Trenching", "Grading", "Backfilling", "Soil removal", "Gravel base", "Drainage prep"],
    optionalTrades: ["Septic", "Sewer/water service", "Demolition", "Foundation excavation", "Utility trenching", "Landscaping prep"]
  },
  {
    id: "demolition",
    label: "Demolition Company",
    defaultTrades: ["Interior demolition", "Full demolition", "Flooring removal", "Cabinet removal", "Drywall removal", "Debris removal", "Bin loading"],
    optionalTrades: ["Asbestos coordination", "Concrete breaking", "Selective demolition", "Site cleanup", "Salvage"]
  },
  {
    id: "window-door",
    label: "Window / Door Company",
    defaultTrades: [
      "Window removal", "Window installation", "Door removal", "Exterior door installation", "Interior door installation",
      "Flashing", "Caulking", "Trim repair"
    ],
    optionalTrades: ["Garage doors", "Patio doors", "Skylights", "Custom openings", "Framing repairs"]
  },
  {
    id: "cabinet-kitchen",
    label: "Cabinet / Kitchen Company",
    defaultTrades: ["Cabinet installation", "Cabinet removal", "Countertop coordination", "Hardware installation", "Crown/valance", "Pantry installation"],
    optionalTrades: ["Custom cabinets", "Cabinet refacing", "Backsplash", "Plumbing coordination", "Electrical coordination", "Appliance install"]
  },
  {
    id: "insulation",
    label: "Insulation Company",
    defaultTrades: ["Batt insulation", "Blown-in insulation", "Spray foam", "Vapour barrier", "Attic insulation", "Basement insulation"],
    optionalTrades: ["Soundproofing", "Firestopping", "Air sealing", "Removal of old insulation"]
  },
  {
    id: "handy-person",
    label: "Handy Person / Property Maintenance",
    defaultTrades: [
      "Small repairs", "Fixture replacement", "Painting touch-ups", "Drywall patching", "Caulking",
      "Door repair", "Furniture assembly", "Minor plumbing", "Minor electrical"
    ],
    optionalTrades: ["Flooring repair", "Fence repair", "Deck repair", "Appliance installation", "Seasonal maintenance"]
  },
  {
    id: "cleaning",
    label: "Cleaning / Post-Construction Cleaning",
    defaultTrades: ["Rough clean", "Final clean", "Dust removal", "Window cleaning", "Floor cleaning", "Garbage removal", "Bathroom cleaning", "Kitchen cleaning"],
    optionalTrades: ["Pressure washing", "Carpet cleaning", "Move-in/move-out cleaning", "Exterior cleanup"]
  }
];

const getContractorDisplayName = (profile: any = {}) =>
  String(profile?.companyName || "").trim() ||
  String(profile?.contactName || "").trim() ||
  "Contractor";

const getProfileAddressDisplay = (profile: any = {}) => {
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

const getContractorExpiryLabel = (settings: any = {}) => {
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

const getContractorInactiveAfterDate = (profile: any = {}, settings: any = {}) => {
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

const getContractorRateDisplay = (contractor: any = {}) => {
  const rate = String(contractor.rate || "").trim();
  if (!rate) return "Not set";

  return `$${rate} / ${getRateTypeLabel(contractor.rateType).toLowerCase()}`;
};

const parseTradeList = (value = "") =>
  String(value || "")
    .split(",")
    .map((trade) => trade.trim())
    .filter(Boolean);

const getMergedTradeList = (currentTrades = "", nextTrades: any[] = []) => {
  const tradeMap = new Map();

  [...parseTradeList(currentTrades), ...nextTrades].forEach((trade) => {
    const normalizedTrade = trade.toLowerCase();
    if (!normalizedTrade) return;
    tradeMap.set(normalizedTrade, trade);
  });

  return Array.from(tradeMap.values());
};

export default function ContractorPage({
  dark,
  savedContractors,
  contractorDraft,
  selectedContractorId,
  isEditingContractor,
  showContractorNotes,
  companyType,
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
  const selectedTradeProfileId = companyType || CONTRACTOR_TRADE_PROFILES[0]?.id || "";
  const selectedTradeProfile =
    CONTRACTOR_TRADE_PROFILES.find((profile) => profile.id === selectedTradeProfileId) ||
    CONTRACTOR_TRADE_PROFILES[0];
  const selectedTradeNames = parseTradeList(contractorDraft.trade).map((trade) => trade.toLowerCase());
  const selectedTradeCount = selectedTradeNames.length;
  const selectedTradeLabel = selectedTradeCount
    ? `${selectedTradeCount} trade${selectedTradeCount === 1 ? "" : "s"} selected`
    : "Select one or more trades";
  const hasTradeSelected = (trade) => selectedTradeNames.includes(trade.toLowerCase());
  const updateTrades = (trades) => onUpdateContractorProfile("trade", trades.join(", "));
  const addTrades = (trades) => updateTrades(getMergedTradeList(contractorDraft.trade, trades));
  const toggleTrade = (trade) => {
    const currentTrades = parseTradeList(contractorDraft.trade);
    const hasTrade = currentTrades.some((currentTrade) => currentTrade.toLowerCase() === trade.toLowerCase());
    updateTrades(hasTrade ? currentTrades.filter((currentTrade) => currentTrade.toLowerCase() !== trade.toLowerCase()) : [...currentTrades, trade]);
  };
  const renderTradeChecklist = (title, trades: any[] = []) => (
    <div className="contractor-trade-group">
      <div className="contractor-trade-group-title">{title}</div>
      <div className="contractor-trade-list">
        {trades.map((trade) => (
          <div key={trade} className="contractor-trade-list-row">
            <label className="contractor-trade-list-option">
              <input
                type="checkbox"
                checked={hasTradeSelected(trade)}
                onChange={() => toggleTrade(trade)}
              />
              <span>{trade}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

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
        <div className="contractor-trade-onboarding span-two">
          <div className="contractor-trade-field-label">Trade</div>
          <details className="contractor-trade-dropdown">
            <summary>
              <span>{selectedTradeLabel}</span>
              <span>Trade ▾</span>
            </summary>

            <div className="contractor-trade-menu">
              <div className="button-row contractor-trade-actions">
                <Button
                  variant="secondary"
                  onClick={() => addTrades([...selectedTradeProfile.defaultTrades, ...selectedTradeProfile.optionalTrades])}
                >
                  Select All
                </Button>
                <Button variant="secondary" onClick={() => updateTrades([])}>
                  Clear
                </Button>
              </div>

              {renderTradeChecklist("Default", selectedTradeProfile.defaultTrades)}
              {renderTradeChecklist("Optional", selectedTradeProfile.optionalTrades)}
            </div>
          </details>
        </div>
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
      <Button onClick={onSaveContractor}>
        {contractorDraft.id ? "Update Changes" : "Save Contractor"}
      </Button>
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
                      {contractor.trade || contractor.contactName || "No trades"} • {contractor.email || contractor.phone || "No contact info"} • Last job: {contractor.lastAssignedJobDate || "None"}
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
                      <div><strong>Trades:</strong> {contractor.trade || "Not set"}</div>
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
