import React, { Dispatch, SetStateAction } from "react";
import { Camera } from "lucide-react";
import { Input, Select, Button } from "../ui";
import { PriceListItem, QuoteItem } from "../../types/appTypes";
import { UNIT_OPTIONS } from "../../constants/appConstants";
import { formatMoney, getItemTotal, getNumericInputValue } from "../../utils/appUtils";

type QuoteItemRowProps = {
  item: QuoteItem;
  index: number;
  priceList: PriceListItem[];
  isPhoneExperience?: boolean;
  onUpdateItem: (index: number, field: keyof QuoteItem, value: string) => void;
  onSelectPriceItem: (index: number, selectedName: string) => void;
  isSavedPriceListItem: (name: string) => boolean;
  activeQuoteItemIndex: number | null;
  onSetActiveQuoteItemIndex: Dispatch<SetStateAction<number | null>>;
  onSaveToPriceList: (item: QuoteItem) => void;
  onRemoveItem: (index: number) => void;
  shouldShowSaveItemButton?: (item: QuoteItem, index: number) => boolean;
  onDismissSaveItemPrompt?: (item: QuoteItem) => void;
  isRoomLead?: boolean;
};

export default function QuoteItemRow({
  item,
  index,
  priceList,
  isPhoneExperience = false,
  onUpdateItem,
  onSelectPriceItem,
  isSavedPriceListItem,
  activeQuoteItemIndex,
  onSetActiveQuoteItemIndex,
  onSaveToPriceList,
  onRemoveItem,
  shouldShowSaveItemButton,
  onDismissSaveItemPrompt,
  isRoomLead = false
}: QuoteItemRowProps) {
  const showSaveItemButton = shouldShowSaveItemButton
    ? shouldShowSaveItemButton(item, index)
    : !isSavedPriceListItem(item.name) && item.name.trim() && activeQuoteItemIndex !== index;
  const handleTextFieldChange =
    (field: keyof QuoteItem) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateItem(index, field, event.target.value);
    };
  const handleSelectFieldChange =
    (field: keyof QuoteItem) =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateItem(index, field, event.target.value);
    };
  const updateScopePhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onUpdateItem(index, "scopePhotoCount", String(files.length));
    onUpdateItem(index, "scopePhotoNames", files.map((file) => file.name).join(", "));
  };
  const normalizedScopeSearch = String(item.name || "").trim().toLowerCase();
  const scopeSavedItemSuggestions = priceList
    .filter((priceItem) => {
      const itemName = String(priceItem.name || "");
      if (!itemName.trim()) return false;
      return !normalizedScopeSearch || itemName.toLowerCase().includes(normalizedScopeSearch);
    })
    .slice(0, 8);
  const showScopeSuggestions = activeQuoteItemIndex === index && scopeSavedItemSuggestions.length > 0;

  if (isPhoneExperience) {
    return (
      <div className={`quote-row scope${isRoomLead ? " room-start" : ""}`}>
        <div className="scope-line-main">
          <label className="scope-work-needed-field">
            Work Needed
            <Input
              placeholder="Type work needed or pick a suggestion"
              value={item.name}
              onFocus={() => onSetActiveQuoteItemIndex(index)}
              onBlur={() => {
                onSetActiveQuoteItemIndex((previous) => (previous === index ? null : previous));
              }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const nextName = event.target.value;
                onUpdateItem(index, "name", nextName);
                if (isSavedPriceListItem(nextName)) {
                  onSelectPriceItem(index, nextName);
                }
              }}
            />
            {showScopeSuggestions ? (
              <div className="scope-suggestion-menu" role="listbox">
                {scopeSavedItemSuggestions.map((priceItem, priceIndex) => (
                  <button
                    key={`${priceItem.name}-${priceIndex}`}
                    type="button"
                    role="option"
                    className="scope-suggestion-option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onUpdateItem(index, "name", priceItem.name);
                      onSelectPriceItem(index, priceItem.name);
                      onSetActiveQuoteItemIndex(null);
                    }}
                  >
                    <span>{priceItem.name}</span>
                    <small>{priceItem.unit || "unit"}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </label>

          <label>
            Size
            <Input
              type="text"
              inputMode="decimal"
              value={getNumericInputValue(item.quantity)}
              onChange={handleTextFieldChange("quantity")}
            />
          </label>

          <label>
            Measurable Units
            <Select value={item.unit} onChange={handleSelectFieldChange("unit")}>
              {UNIT_OPTIONS.map((unitOption) => (
                <option key={unitOption.value} value={unitOption.value}>
                  {unitOption.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="scope-line-secondary">
          <label className="scope-photo-picker">
            <span><Camera size={16} aria-hidden="true" /> Photos</span>
            <input type="file" accept="image/*" capture="environment" multiple onChange={updateScopePhotos} />
            <span className="row-subtitle">
              {Number(item.scopePhotoCount || 0) > 0
                ? `${item.scopePhotoCount} selected`
                : "Take or select photos"}
            </span>
          </label>

          <Button variant="danger" onClick={() => onRemoveItem(index)}>Delete</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`quote-row advanced${isRoomLead ? " room-start" : ""}`}>
      <div className="item-picker">
        <Input
          list={`price-list-options-${index}`}
          placeholder="Select saved item or type a new one"
          value={item.name}
          onFocus={() => {
            if (showSaveItemButton) {
              onDismissSaveItemPrompt?.(item);
            }
            onSetActiveQuoteItemIndex(index);
          }}
          onBlur={() => {
            onSetActiveQuoteItemIndex((previous) => (previous === index ? null : previous));
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const nextName = event.target.value;
            onUpdateItem(index, "name", nextName);
            if (isSavedPriceListItem(nextName)) {
              onSelectPriceItem(index, nextName);
            }
          }}
        />
        <datalist id={`price-list-options-${index}`}>
          {priceList.map((priceItem, priceIndex) => (
            <option key={`${priceItem.name}-${priceIndex}`} value={priceItem.name}>
              {priceItem.name}
            </option>
          ))}
        </datalist>
      </div>

      <Input
        type="text"
        inputMode="decimal"
        value={getNumericInputValue(item.quantity)}
        onChange={handleTextFieldChange("quantity")}
      />

      <Select
        value={item.unit}
        onChange={handleSelectFieldChange("unit")}
      >
        {UNIT_OPTIONS.map((unitOption) => (
          <option key={unitOption.value} value={unitOption.value}>
            {unitOption.label}
          </option>
        ))}
      </Select>

      <Select
        value={item.category}
        onChange={handleSelectFieldChange("category")}
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
        onChange={handleTextFieldChange("pricePerUnit")}
      />

      <Input
        type="text"
        inputMode="decimal"
        placeholder="Markup %"
        value={getNumericInputValue(item.markupRate)}
        onChange={handleTextFieldChange("markupRate")}
      />

      <div className="money-cell">{formatMoney(getItemTotal(item))}</div>

      <div className="button-stack compact">
        {showSaveItemButton ? (
          <Button variant="secondary" onClick={() => onSaveToPriceList(item)}>Save Item</Button>
        ) : null}
        <Button variant="danger" onClick={() => onRemoveItem(index)}>Delete</Button>
      </div>
    </div>
  );
}
