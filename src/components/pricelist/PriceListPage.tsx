// @ts-nocheck
import { UNIT_OPTIONS } from "../../constants/appConstants";
import { formatMoney, getNumericInputValue, sanitizeNumericInput } from "../../utils/appUtils";
import { Button, Card, Input, Select } from "../ui";

export default function PriceListPage({
  dark,
  newPriceItem,
  setNewPriceItem,
  addManualPriceListItem,
  priceList,
  editingPriceItemName,
  priceItemDraft,
  updatePriceItemDraft,
  savePriceListItemEdits,
  cancelEditingPriceListItem,
  deletePriceListItem,
  startEditingPriceListItem,
  savedRoomTemplates,
  editingRoomTemplateId,
  roomTemplateDraft,
  openRoomTemplateEditor,
  closeRoomTemplateEditor,
  saveRoomTemplateEdits,
  updateRoomTemplateDraft,
  updateRoomTemplateDraftItem,
  removeRoomTemplateDraftItem,
  addRoomTemplateDraftItem,
  deleteRoomTemplate
}) {
  const renderRoomTemplateEditor = () => {
    if (!roomTemplateDraft) return null;

    return (
      <div className="room-template-inline-editor">
        <div className="section-header room-template-inline-header">
          <div>
            <h4>Edit Room Template</h4>
            <p className="row-subtitle">Update the room name and item defaults, then save the template.</p>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={saveRoomTemplateEdits}>Save Template</Button>
            <Button variant="secondary" onClick={closeRoomTemplateEditor}>Done</Button>
          </div>
        </div>

        <div className="grid three-col">
          <label>
            Template Name
            <Input
              placeholder="Template name"
              value={roomTemplateDraft.name}
              onChange={(e) => updateRoomTemplateDraft("name", e.target.value)}
            />
          </label>
        </div>

        <div className="room-template-editor">
          <div className="room-template-editor-header">
            <div>Item</div>
            <div>Qty</div>
            <div>Unit</div>
            <div>Category</div>
            <div>Price</div>
            <div>Markup</div>
            <div>Days</div>
            <div>Actions</div>
          </div>

          {roomTemplateDraft.items.map((item, index) => (
            <div key={item.itemId || `room-template-item-${index}`} className="room-template-editor-row">
              <Input
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateRoomTemplateDraftItem(index, "name", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                value={getNumericInputValue(item.quantity)}
                onChange={(e) => updateRoomTemplateDraftItem(index, "quantity", e.target.value)}
              />
              <Select
                value={item.unit}
                onChange={(e) => updateRoomTemplateDraftItem(index, "unit", e.target.value)}
              >
                {UNIT_OPTIONS.map((unitOption) => (
                  <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>
                ))}
              </Select>
              <Select
                value={item.category}
                onChange={(e) => updateRoomTemplateDraftItem(index, "category", e.target.value)}
              >
                <option value="Labor">Labor</option>
                <option value="Material">Material</option>
                <option value="Equipment">Equipment</option>
              </Select>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="$0.00"
                value={getNumericInputValue(item.pricePerUnit, { hideZero: true })}
                onChange={(e) => updateRoomTemplateDraftItem(index, "pricePerUnit", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Markup %"
                value={getNumericInputValue(item.markupRate)}
                onChange={(e) => updateRoomTemplateDraftItem(index, "markupRate", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Days"
                value={getNumericInputValue(item.duration)}
                onChange={(e) => updateRoomTemplateDraftItem(index, "duration", e.target.value)}
              />
              <Button variant="danger" onClick={() => removeRoomTemplateDraftItem(index)}>Delete</Button>
            </div>
          ))}
        </div>

        <div className="button-row template-actions">
          <Button onClick={addRoomTemplateDraftItem}>Add Template Item</Button>
          <Button variant="secondary" onClick={saveRoomTemplateEdits}>Save Template</Button>
        </div>
      </div>
    );
  };

  const renderPriceList = () => (
    <>
      <Card dark={dark}>
        <h3>Add Price List Item</h3>
        <div className="grid price-grid">
          <label className="price-field-label">
            Item
            <Input placeholder="Item name" value={newPriceItem.name} onChange={(e) => setNewPriceItem((previous) => ({ ...previous, name: e.target.value }))} />
          </label>
          <label className="price-field-label">
            Unit
            <Select value={newPriceItem.unit} onChange={(e) => setNewPriceItem((previous) => ({ ...previous, unit: e.target.value }))}>
              {UNIT_OPTIONS.map((unitOption) => (
                <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>
              ))}
            </Select>
          </label>
          <label className="price-field-label">
            Category
            <Select value={newPriceItem.category} onChange={(e) => setNewPriceItem((previous) => ({ ...previous, category: e.target.value }))}>
              <option value="Labor">Labor</option>
              <option value="Material">Material</option>
              <option value="Equipment">Equipment</option>
            </Select>
          </label>
          <label className="price-field-label">
            Price
            <Input
              type="text"
              inputMode="decimal"
              placeholder="$0.00"
              value={getNumericInputValue(newPriceItem.pricePerUnit, { hideZero: true })}
              onChange={(e) => setNewPriceItem((previous) => ({ ...previous, pricePerUnit: sanitizeNumericInput(e.target.value) }))}
            />
          </label>
          <label className="price-field-label">
            Days
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Days"
              value={getNumericInputValue(newPriceItem.duration)}
              onChange={(e) => setNewPriceItem((previous) => ({ ...previous, duration: sanitizeNumericInput(e.target.value) }))}
            />
          </label>
          <div className="price-action-column">
            <span>Actions</span>
            <div className="button-row price-list-edit-actions">
              <Button onClick={addManualPriceListItem}>Add Item</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card dark={dark}>
        <h3>Stored Price List</h3>
        {priceList.length === 0 ? (
          <p>No items in the price list yet.</p>
        ) : (
          <div className="list-table">
            {priceList.map((item) => {
              const isEditingPriceItem = editingPriceItemName === item.name;

              return (
                <div key={item.name} className={`list-row price-list-row${isEditingPriceItem ? " editing" : ""}`}>
                  {isEditingPriceItem ? (
                    <div className="price-list-edit-row">
                      <label className="price-field-label">
                        Item
                        <Input
                          placeholder="Item name"
                          value={priceItemDraft.name}
                          onChange={(e) => updatePriceItemDraft("name", e.target.value)}
                        />
                      </label>
                      <label className="price-field-label">
                        Unit
                        <Select
                          value={priceItemDraft.unit}
                          onChange={(e) => updatePriceItemDraft("unit", e.target.value)}
                        >
                          {UNIT_OPTIONS.map((unitOption) => (
                            <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="price-field-label">
                        Category
                        <Select
                          value={priceItemDraft.category}
                          onChange={(e) => updatePriceItemDraft("category", e.target.value)}
                        >
                          <option value="Labor">Labor</option>
                          <option value="Material">Material</option>
                          <option value="Equipment">Equipment</option>
                        </Select>
                      </label>
                      <label className="price-field-label">
                        Price
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="$0.00"
                          value={getNumericInputValue(priceItemDraft.pricePerUnit, { hideZero: true })}
                          onChange={(e) => updatePriceItemDraft("pricePerUnit", e.target.value)}
                        />
                      </label>
                      <label className="price-field-label">
                        Days
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Days"
                          value={getNumericInputValue(priceItemDraft.duration)}
                          onChange={(e) => updatePriceItemDraft("duration", e.target.value)}
                        />
                      </label>
                      <div className="price-action-column price-edit-action-column">
                        <span>Actions</span>
                        <div className="button-row price-list-edit-actions">
                          <Button variant="secondary" onClick={savePriceListItemEdits}>Save</Button>
                          <Button variant="secondary" onClick={cancelEditingPriceListItem}>Cancel</Button>
                          <Button variant="danger" onClick={() => deletePriceListItem(item.name)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="row-title">{item.name}</div>
                        <div className="row-subtitle">
                          {item.category} • {item.duration} day(s) • {UNIT_OPTIONS.find((unitOption) => unitOption.value === item.unit)?.label || item.unit}
                        </div>
                      </div>
                      <div className="price-list-actions">
                        <span>{formatMoney(item.pricePerUnit)}</span>
                        <Button variant="secondary" onClick={() => startEditingPriceListItem(item)}>Edit</Button>
                        <Button variant="danger" onClick={() => deletePriceListItem(item.name)}>Delete</Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Saved Room Templates</h3>
            <p className="row-subtitle">Save rooms from the quote page, then review and update those templates here.</p>
          </div>
        </div>

        {savedRoomTemplates.length === 0 ? (
          <p>No saved room templates yet.</p>
        ) : (
          <div className="list-table">
            {savedRoomTemplates.map((template) => {
              const isEditingTemplate = editingRoomTemplateId === template.id && roomTemplateDraft;

              return (
                <div key={template.id} className={`list-row room-template-list-row${isEditingTemplate ? " editing" : ""}`}>
                  {isEditingTemplate ? (
                    renderRoomTemplateEditor()
                  ) : (
                    <>
                      <div>
                        <div className="directory-title-row">
                          <div className="row-title">{template.name}</div>
                          {template.builtIn ? (
                            <span className="status-pill approved">Preinstalled</span>
                          ) : null}
                        </div>
                        <div className="row-subtitle">
                          {(template.items || []).length} item(s) • Updated {template.updatedAt || "Recently"}
                        </div>
                      </div>
                      <div className="button-row">
                        <Button variant="secondary" onClick={() => openRoomTemplateEditor(template.id)}>Edit Template</Button>
                        {!template.builtIn ? (
                          <Button variant="danger" onClick={() => deleteRoomTemplate(template.id)}>Delete</Button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );

  return renderPriceList();
}
