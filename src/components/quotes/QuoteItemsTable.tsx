import React, { Dispatch, SetStateAction } from "react";
import { Button, Card, Input } from "../ui";
import { PriceListItem, QuoteItem, TemplateOption } from "../../types/appTypes";
import QuoteItemRow from "./QuoteItemRow";

type QuoteItemsTableProps = {
  dark: boolean;
  items: QuoteItem[];
  priceList: PriceListItem[];
  projectTemplates: TemplateOption[];
  onAddItem: () => void;
  onAddRoom: () => void;
  onOpenTemplateBuilder: (templateId: string) => void;
  onGenerateSchedule: () => void;
  onSaveQuote: () => void;
  onExportQuote?: () => void;
  onUpdateItem: (index: number, field: keyof QuoteItem, value: string) => void;
  onSelectPriceItem: (index: number, selectedName: string) => void;
  isSavedPriceListItem: (name: string) => boolean;
  activeQuoteItemIndex: number | null;
  onSetActiveQuoteItemIndex: Dispatch<SetStateAction<number | null>>;
  onSaveToPriceList: (item: QuoteItem) => void;
  shouldShowSaveItemButton?: (item: QuoteItem, index: number) => boolean;
  onDismissSaveItemPrompt?: (item: QuoteItem) => void;
  onSaveRoomTemplate?: (roomId?: string) => void;
  onRemoveItem: (index: number) => void;
};

export default function QuoteItemsTable({
  dark,
  items,
  priceList,
  projectTemplates,
  onAddItem,
  onAddRoom,
  onOpenTemplateBuilder,
  onGenerateSchedule,
  onSaveQuote,
  onExportQuote,
  onUpdateItem,
  onSelectPriceItem,
  isSavedPriceListItem,
  activeQuoteItemIndex,
  onSetActiveQuoteItemIndex,
  onSaveToPriceList,
  shouldShowSaveItemButton,
  onDismissSaveItemPrompt,
  onSaveRoomTemplate,
  onRemoveItem
}: QuoteItemsTableProps) {
  const handleRoomNameChange =
    (index: number) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateItem(index, "roomName", event.target.value);
    };

  return (
    <Card dark={dark}>
      <div className="section-header">
        <h3>Quote Items</h3>
        <div className="button-row">
          <Button onClick={onAddItem}>Add Item</Button>
          <Button variant="secondary" onClick={onGenerateSchedule}>📅 Generate Schedule</Button>
          <Button variant="secondary" onClick={onSaveQuote}>💾 Save Quote</Button>
          {onExportQuote ? (
            <Button variant="secondary" onClick={onExportQuote}>📤 Export Quote</Button>
          ) : null}
        </div>
      </div>

      {items.map((item, index) => (
        <React.Fragment key={`${item.roomId || "room"}-${index}`}>
          {index === 0 || item.roomId !== items[index - 1]?.roomId ? (
            <>
              <div className="room-name-row">
                <Input
                  className="room-name-input"
                  placeholder="Room name"
                  value={item.roomName || ""}
                  onChange={handleRoomNameChange(index)}
                />
                {onSaveRoomTemplate ? (
                  <div className="room-name-actions">
                    <Button variant="secondary" onClick={() => onSaveRoomTemplate(item.roomId)}>
                      Save Room
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="quote-header-row room-section-header">
                <div>Item</div>
                <div>Qty</div>
                <div>Unit</div>
                <div>Category</div>
                <div>Price</div>
                <div>Markup</div>
                <div>Total</div>
                <div>Actions</div>
              </div>
            </>
          ) : null}

          <QuoteItemRow
            item={item}
            index={index}
            priceList={priceList}
            onUpdateItem={onUpdateItem}
            onSelectPriceItem={onSelectPriceItem}
            isSavedPriceListItem={isSavedPriceListItem}
            activeQuoteItemIndex={activeQuoteItemIndex}
            onSetActiveQuoteItemIndex={onSetActiveQuoteItemIndex}
            onSaveToPriceList={onSaveToPriceList}
            shouldShowSaveItemButton={shouldShowSaveItemButton}
            onDismissSaveItemPrompt={onDismissSaveItemPrompt}
            isRoomLead={index === 0 || item.roomId !== items[index - 1]?.roomId}
            onRemoveItem={onRemoveItem}
          />
        </React.Fragment>
      ))}

      <div className="quote-items-footer">
        <div className="button-row">
          <Button onClick={onAddItem}>Add Item</Button>
          <Button variant="secondary" onClick={onAddRoom}>Add Another Room</Button>
        </div>
        <div className="button-stack compact quote-template-actions">
          <Button variant="secondary" onClick={onSaveQuote}>💾 Save Quote</Button>
          {projectTemplates.map((template) => (
            <Button
              key={template.id}
              variant="secondary"
              onClick={() => onOpenTemplateBuilder(template.id)}
            >
              {template.label} Template
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
