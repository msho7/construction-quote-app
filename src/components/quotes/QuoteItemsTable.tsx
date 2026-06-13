import React, { Dispatch, SetStateAction } from "react";
import { Button, Card, Input } from "../ui";
import { PriceListItem, QuoteItem, TemplateOption } from "../../types/appTypes";
import QuoteItemRow from "./QuoteItemRow";

type QuoteItemsTableProps = {
  dark: boolean;
  isPhoneExperience?: boolean;
  items: QuoteItem[];
  priceList: PriceListItem[];
  savedContractors?: any[];
  canAssignScopeWork?: boolean;
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
  isPhoneExperience = false,
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
        <div>
          <h3>{isPhoneExperience ? "Scope Lines" : "Quote Items"}</h3>
          {isPhoneExperience ? (
            <p className="row-subtitle">Add work needed, attach photos, and save scope details without showing prices.</p>
          ) : null}
        </div>
        <div className="button-row">
          <Button onClick={onAddItem}>{isPhoneExperience ? "New Line" : "Add Item"}</Button>
          {!isPhoneExperience ? (
            <Button variant="secondary" onClick={onGenerateSchedule}>📅 Generate Schedule</Button>
          ) : null}
          <Button variant="secondary" onClick={onSaveQuote}>{isPhoneExperience ? "Save Scope" : "💾 Save Quote"}</Button>
          {onExportQuote && !isPhoneExperience ? (
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

              {!isPhoneExperience ? (
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
              ) : null}
            </>
          ) : null}

          <QuoteItemRow
            item={item}
            index={index}
            priceList={priceList}
            isPhoneExperience={isPhoneExperience}
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
          <Button onClick={onAddItem}>{isPhoneExperience ? "New Line" : "Add Item"}</Button>
          {!isPhoneExperience ? (
            <Button variant="secondary" onClick={onAddRoom}>Add Another Room</Button>
          ) : null}
        </div>
        {!isPhoneExperience ? (
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
        ) : null}
      </div>
    </Card>
  );
}
