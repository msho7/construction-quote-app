import { DEFAULT_TEMPLATE_VALUES, PROJECT_TEMPLATES } from "../../constants/appConstants";
import { formatMoney, getItemTotal, getNumericInputValue, sanitizeNumericInput } from "../../utils/appUtils";
import { getCustomerDisplayName } from "../../utils/profileUtils";
import { Button, Card, Input, Select } from "../ui";
import QuoteItemsTable from "./QuoteItemsTable";

export default function QuoteBuilderPage({
  dark,
  isCurrentQuoteLocked,
  currentQuoteReference,
  activeQuoteRecord,
  isCurrentQuoteApproved,
  savedCustomers,
  selectedQuoteCustomerId,
  clientName,
  projectTitle,
  projectAddress,
  quoteDate,
  taxRate,
  startDate,
  showTemplateBuilder,
  selectedTemplateId,
  templateFormValues,
  items,
  priceList,
  activeQuoteItemIndex,
  savedRoomTemplates,
  totals,
  showExportModal,
  exportFileName,
  exportFormat,
  openQuotesLanding,
  openApprovedQuoteSchedule,
  openMaterialTakeoff,
  getCurrentQuoteTakeoffPayload,
  markQuoteApproved,
  deleteUnapprovedQuote,
  setProjectTitle,
  selectQuoteCustomer,
  setProjectAddress,
  setQuoteDate,
  setTaxRate,
  setStartDate,
  setShowTemplateBuilder,
  updateTemplateField,
  applyTemplateToQuote,
  addItem,
  addRoom,
  openTemplateBuilder,
  generateSchedule,
  saveQuote,
  openExportModal,
  updateItem,
  selectPriceItem,
  isSavedPriceListItem,
  setActiveQuoteItemIndex,
  saveToPriceList,
  shouldShowSaveItemButton,
  dismissSaveItemPrompt,
  saveRoomTemplate,
  removeItem,
  applySavedRoomTemplate,
  closeExportModal,
  setExportFileName,
  setExportFormat,
  submitExport
}: any) {
  return (
    <>
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>{isCurrentQuoteLocked ? "Project Details" : "Project Info"}</h3>
            <p className="row-subtitle">
              {isCurrentQuoteLocked
                ? "This project is complete, so it is locked for editing."
                : "Use a template for repeat jobs like bathrooms, then add custom items if needed."}
            </p>
            {currentQuoteReference ? (
              <div className="quote-reference-line">
                Quote Reference: <strong>{currentQuoteReference}</strong>
              </div>
            ) : null}
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={openQuotesLanding}>
              Back To Quotes
            </Button>
            {isCurrentQuoteLocked && activeQuoteRecord ? (
              <Button variant="secondary" onClick={() => openApprovedQuoteSchedule(activeQuoteRecord.id)}>
                View Schedule
              </Button>
            ) : null}
            {isCurrentQuoteApproved && activeQuoteRecord ? (
              <Button variant="secondary" onClick={() => openMaterialTakeoff(activeQuoteRecord.id, getCurrentQuoteTakeoffPayload())}>
                Material Takeoff
              </Button>
            ) : null}
            {!isCurrentQuoteApproved && !isCurrentQuoteLocked ? (
              <>
                <Button variant="secondary" onClick={markQuoteApproved}>✅ Mark Approved</Button>
                {activeQuoteRecord && (activeQuoteRecord.status || "open") === "open" ? (
                  <Button variant="danger" onClick={() => deleteUnapprovedQuote(activeQuoteRecord)}>
                    Delete Quote
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="grid three-col">
          <label>
            Project Title
            <Input
              placeholder="Project Title"
              value={projectTitle}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </label>
          <label>
            Customer
            <Select
              value={selectedQuoteCustomerId}
              onChange={(e) => selectQuoteCustomer(e.target.value)}
              disabled={isCurrentQuoteLocked || (!savedCustomers.length && !selectedQuoteCustomerId)}
            >
              <option value="">
                {savedCustomers.length ? "Select saved customer" : "No saved customers yet"}
              </option>
              {selectedQuoteCustomerId && !savedCustomers.some((customer) => customer.id === selectedQuoteCustomerId) && clientName ? (
                <option value={selectedQuoteCustomerId}>{clientName} (Saved On Quote)</option>
              ) : null}
              {savedCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {getCustomerDisplayName(customer)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Project Address
            <Input
              placeholder="Project Address"
              value={projectAddress}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setProjectAddress(e.target.value)}
            />
          </label>
          <label>
            Quote Date
            <Input
              type="date"
              value={quoteDate}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setQuoteDate(e.target.value)}
            />
          </label>
          <label>
            Tax:
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Tax %"
              value={getNumericInputValue(taxRate)}
              disabled={isCurrentQuoteLocked}
              onChange={(e) => setTaxRate(sanitizeNumericInput(e.target.value))}
            />
          </label>
          <label>
            Start Date
            <Input
            type="date"
            value={startDate}
            disabled={isCurrentQuoteLocked}
            onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          
        </div>
      </Card>

      {showTemplateBuilder && !isCurrentQuoteLocked && (
        <Card dark={dark} className="template-builder-card">
          <div className="section-header">
            <div>
              <h3>{PROJECT_TEMPLATES.find((template) => template.id === selectedTemplateId)?.label} Template Builder</h3>
              <p className="row-subtitle">Enter the project sizes below and the quote items will be generated automatically.</p>
            </div>
            <Button variant="danger" onClick={() => setShowTemplateBuilder(false)}>Close</Button>
          </div>

          {selectedTemplateId === "bathroom" && (
            <div className="grid template-grid">
              <Input type="text" inputMode="decimal" placeholder="Room length" value={getNumericInputValue(templateFormValues.roomLength)} onChange={(e) => updateTemplateField("roomLength", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Room width" value={getNumericInputValue(templateFormValues.roomWidth)} onChange={(e) => updateTemplateField("roomWidth", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Wall height" value={getNumericInputValue(templateFormValues.wallHeight)} onChange={(e) => updateTemplateField("wallHeight", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Vanity count" value={getNumericInputValue(templateFormValues.vanityCount)} onChange={(e) => updateTemplateField("vanityCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Toilet count" value={getNumericInputValue(templateFormValues.toiletCount)} onChange={(e) => updateTemplateField("toiletCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Shower count" value={getNumericInputValue(templateFormValues.showerCount)} onChange={(e) => updateTemplateField("showerCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Bathtub count" value={getNumericInputValue(templateFormValues.bathtubCount)} onChange={(e) => updateTemplateField("bathtubCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Door count" value={getNumericInputValue(templateFormValues.doorCount)} onChange={(e) => updateTemplateField("doorCount", e.target.value)} />
            </div>
          )}

          {selectedTemplateId === "kitchen" && (
            <div className="grid template-grid">
              <Input type="text" inputMode="decimal" placeholder="Room length" value={getNumericInputValue(templateFormValues.roomLength)} onChange={(e) => updateTemplateField("roomLength", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Room width" value={getNumericInputValue(templateFormValues.roomWidth)} onChange={(e) => updateTemplateField("roomWidth", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Wall height" value={getNumericInputValue(templateFormValues.wallHeight)} onChange={(e) => updateTemplateField("wallHeight", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Cabinet length" value={getNumericInputValue(templateFormValues.cabinetLength)} onChange={(e) => updateTemplateField("cabinetLength", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Appliance count" value={getNumericInputValue(templateFormValues.applianceCount)} onChange={(e) => updateTemplateField("applianceCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Sink count" value={getNumericInputValue(templateFormValues.sinkCount)} onChange={(e) => updateTemplateField("sinkCount", e.target.value)} />
              <Input type="text" inputMode="decimal" placeholder="Backsplash area" value={getNumericInputValue(templateFormValues.backsplashArea)} onChange={(e) => updateTemplateField("backsplashArea", e.target.value)} />
            </div>
          )}

          <div className="button-row template-actions">
            <Button onClick={applyTemplateToQuote}>Add Template Items</Button>
            <Button variant="secondary" onClick={() => setShowTemplateBuilder(false)}>Keep Editing Manually</Button>
          </div>
        </Card>
      )}

      {isCurrentQuoteLocked ? (
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Project Items</h3>
              <p className="row-subtitle">Completed projects are read-only.</p>
            </div>
          </div>

          <div className="list-table">
            {items.filter((item) => item.name?.trim()).map((item, index) => (
              <div key={`${item.itemId || item.name}-${index}`} className="list-row">
                <div>
                  <div className="row-title">{item.name}</div>
                  <div className="row-subtitle">
                    {item.roomName || "No room"} • {item.quantity} {item.unit} • {item.category} • Markup {Number(item.markupRate || 0)}%
                  </div>
                </div>
                <div>{formatMoney(getItemTotal(item))}</div>
              </div>
            ))}
          </div>

          {items.filter((item) => item.name?.trim()).length === 0 ? (
            <p className="row-subtitle">No project items were saved.</p>
          ) : null}
        </Card>
      ) : (
        <>
          <QuoteItemsTable
            dark={dark}
            items={items}
            priceList={priceList}
            projectTemplates={[]}
            onAddItem={addItem}
            onAddRoom={addRoom}
            onOpenTemplateBuilder={openTemplateBuilder}
            onGenerateSchedule={generateSchedule}
            onSaveQuote={saveQuote}
            onExportQuote={openExportModal}
            onUpdateItem={updateItem}
            onSelectPriceItem={selectPriceItem}
            isSavedPriceListItem={isSavedPriceListItem}
            activeQuoteItemIndex={activeQuoteItemIndex}
            onSetActiveQuoteItemIndex={setActiveQuoteItemIndex}
            onSaveToPriceList={saveToPriceList}
            shouldShowSaveItemButton={shouldShowSaveItemButton}
            onDismissSaveItemPrompt={dismissSaveItemPrompt}
            onSaveRoomTemplate={saveRoomTemplate}
            onRemoveItem={removeItem}
          />

          <Card dark={dark}>
            <div className="section-header">
              <div>
                <h3>Room Templates</h3>
                <p className="row-subtitle">Use the built-in templates or any saved room templates below to autofill the current quote.</p>
              </div>
            </div>

            <div className="template-button-grid">
              {savedRoomTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-button-card${dark ? " dark" : ""}`}
                  onClick={() => applySavedRoomTemplate(template.id)}
                >
                  <span className="template-button-title">{template.name}</span>
                </button>
              ))}
            </div>

            {savedRoomTemplates.length === 0 ? (
              <p className="row-subtitle room-template-empty-note">Save a room above and it will appear here as a reusable template button.</p>
            ) : null}
          </Card>
        </>
      )}

      <Card dark={dark}>
        <h3>Quote Totals</h3>
        <div className="totals-list">
          <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
          <div><span>Markup</span><strong>{formatMoney(totals.markup)}</strong></div>
          <div><span>Tax</span><strong>{formatMoney(totals.tax)}</strong></div>
          <div className="grand-total"><span>Total</span><strong>{formatMoney(totals.total)}</strong></div>
        </div>
      </Card>

      <Card dark={dark} className="quote-actions-card">
        <div className="section-header quote-actions-header">
          <div>
            <h3>Ready To Save Or Export?</h3>
            <p className="row-subtitle">
              {isCurrentQuoteLocked
                ? "This completed project can be exported, but it cannot be edited."
                : "Save this quote to keep it in the app, or export it as a file to share with your customer."}
            </p>
          </div>
          <div className="button-row">
            {!isCurrentQuoteLocked ? (
              <Button variant="secondary" onClick={saveQuote}>💾 Save Quote</Button>
            ) : null}
            {activeQuoteRecord && (activeQuoteRecord.status || "open") === "open" ? (
              <Button variant="danger" onClick={() => deleteUnapprovedQuote(activeQuoteRecord)}>
                Delete Quote
              </Button>
            ) : null}
            <Button variant="secondary" onClick={openExportModal}>📤 Export Quote</Button>
          </div>
        </div>
      </Card>

      {showExportModal && (
        <div className="modal-backdrop" onClick={closeExportModal}>
          <div
            className={dark ? "modal-card dark" : "modal-card"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="section-header modal-header">
              <div>
                <h3>Export Quote</h3>
                <p className="row-subtitle">Choose the file type and name for this quote export.</p>
              </div>
              <Button variant="danger" onClick={closeExportModal}>Close</Button>
            </div>

            <div className="grid export-modal-grid">
              <label>
                File Name
                <Input
                  placeholder="Enter file name"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                />
              </label>

              <label>
                Format
                <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </Select>
              </label>
            </div>

            <div className="button-row modal-actions">
              <Button onClick={submitExport}>Create File</Button>
              <Button variant="secondary" onClick={closeExportModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
