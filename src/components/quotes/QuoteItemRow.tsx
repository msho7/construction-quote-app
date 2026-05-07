import React, { Dispatch, SetStateAction } from "react";
import { Input, Select, Button } from "../ui";
import { PriceListItem, QuoteItem } from "../../types/appTypes";
import { UNIT_OPTIONS } from "../../constants/appConstants";
import { formatMoney, getItemTotal, getNumericInputValue } from "../../utils/appUtils";

type QuoteItemRowProps = {
  item: QuoteItem;
  index: number;
  priceList: PriceListItem[];
  onUpdateItem: (index: number, field: keyof QuoteItem, value: string) => void;
  onSelectPriceItem: (index: number, selectedName: string) => void;
  isSavedPriceListItem: (name: string) => boolean;
  activeQuoteItemIndex: number | null;
  onSetActiveQuoteItemIndex: Dispatch<SetStateAction<number | null>>;
  onSaveToPriceList: (item: QuoteItem) => void;
  onRemoveItem: (index: number) => void;
};

export default function QuoteItemRow({
  item,
  index,
  priceList,
  onUpdateItem,
  onSelectPriceItem,
  isSavedPriceListItem,
  activeQuoteItemIndex,
  onSetActiveQuoteItemIndex,
  onSaveToPriceList,
  onRemoveItem
}: QuoteItemRowProps) {
  return (
    <div className="quote-row advanced">
      <div className="item-picker">
        <Input
          list={`price-list-options-${index}`}
          placeholder="Select saved item or type a new one"
          value={item.name}
          onFocus={() => onSetActiveQuoteItemIndex(index)}
          onBlur={() => {
            onSetActiveQuoteItemIndex((previous) => (previous === index ? null : previous));
          }}
          onChange={(e) => {
            const nextName = e.target.value;
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
        onChange={(e) => onUpdateItem(index, "quantity", e.target.value)}
      />

      <Select
        value={item.unit}
        onChange={(e) => onUpdateItem(index, "unit", e.target.value)}
      >
        {UNIT_OPTIONS.map((unitOption) => (
          <option key={unitOption.value} value={unitOption.value}>
            {unitOption.label}
          </option>
        ))}
      </Select>

      <Select
        value={item.category}
        onChange={(e) => onUpdateItem(index, "category", e.target.value)}
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
        onChange={(e) => onUpdateItem(index, "pricePerUnit", e.target.value)}
      />

      <Input
        type="text"
        inputMode="decimal"
        placeholder="Markup %"
        value={getNumericInputValue(item.markupRate)}
        onChange={(e) => onUpdateItem(index, "markupRate", e.target.value)}
      />

      <div className="money-cell">{formatMoney(getItemTotal(item))}</div>

      <div className="button-stack compact">
        {!isSavedPriceListItem(item.name) && item.name.trim() && activeQuoteItemIndex !== index ? (
          <Button variant="secondary" onClick={() => onSaveToPriceList(item)}>Save Item</Button>
        ) : null}
        <Button variant="danger" onClick={() => onRemoveItem(index)}>Delete</Button>
      </div>
    </div>
  );
}
