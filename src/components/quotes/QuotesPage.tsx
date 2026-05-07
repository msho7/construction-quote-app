import React, { Dispatch, SetStateAction } from "react";
import {
  CustomerProfile,
  PriceListItem,
  QuoteItem,
  QuoteTotals as QuoteTotalsData,
  SavedQuote,
  TemplateFormValues,
  TemplateOption
} from "../../types/appTypes";
import ProjectInfoForm from "./ProjectInfoForm";
import TemplateBuilder from "./TemplateBuilder";
import QuoteItemsTable from "./QuoteItemsTable";
import QuoteTotals from "./QuoteTotals";

type QuotesPageProps = {
  dark: boolean;
  projectTitle: string;
  clientName: string;
  selectedQuoteCustomerId: string;
  savedCustomers: CustomerProfile[];
  projectAddress: string;
  quoteDate: string;
  taxRate: number;
  startDate: string;
  projectTemplates: TemplateOption[];
  showTemplateBuilder: boolean;
  selectedTemplateId: string;
  templateFormValues: TemplateFormValues;
  items: QuoteItem[];
  priceList: PriceListItem[];
  savedQuotes: SavedQuote[];
  totals: QuoteTotalsData;
  onSetProjectTitle: (value: string) => void;
  onSelectQuoteCustomer: (value: string) => void;
  onSetProjectAddress: (value: string) => void;
  onSetQuoteDate: (value: string) => void;
  onSetTaxRate: (value: number) => void;
  onSetStartDate: (value: string) => void;
  onOpenTemplateBuilder: (templateId: string) => void;
  onUpdateTemplateField: (field: string, value: string) => void;
  onApplyTemplateToQuote: () => void;
  onCloseTemplateBuilder: () => void;
  onAddItem: () => void;
  onAddRoom: () => void;
  onGenerateSchedule: () => void;
  onSaveQuote: () => void;
  onMarkApproved?: () => void;
  isQuoteApproved?: boolean;
  onUpdateItem: (index: number, field: keyof QuoteItem, value: string) => void;
  onSelectPriceItem: (index: number, selectedName: string) => void;
  isSavedPriceListItem: (name: string) => boolean;
  activeQuoteItemIndex: number | null;
  onSetActiveQuoteItemIndex: Dispatch<SetStateAction<number | null>>;
  onSaveToPriceList: (item: QuoteItem) => void;
  onRemoveItem: (index: number) => void;
  onLoadQuote: (quote: SavedQuote) => void;
};

export default function QuotesPage({
  dark,
  projectTitle,
  clientName,
  selectedQuoteCustomerId,
  savedCustomers,
  projectAddress,
  quoteDate,
  taxRate,
  startDate,
  projectTemplates,
  showTemplateBuilder,
  selectedTemplateId,
  templateFormValues,
  items,
  priceList,
  savedQuotes,
  totals,
  onSetProjectTitle,
  onSelectQuoteCustomer,
  onSetProjectAddress,
  onSetQuoteDate,
  onSetTaxRate,
  onSetStartDate,
  onOpenTemplateBuilder,
  onUpdateTemplateField,
  onApplyTemplateToQuote,
  onCloseTemplateBuilder,
  onAddItem,
  onAddRoom,
  onGenerateSchedule,
  onSaveQuote,
  onMarkApproved,
  isQuoteApproved = false,
  onUpdateItem,
  onSelectPriceItem,
  isSavedPriceListItem,
  activeQuoteItemIndex,
  onSetActiveQuoteItemIndex,
  onSaveToPriceList,
  onRemoveItem,
  onLoadQuote
}: QuotesPageProps) {
  return (
    <>
      <ProjectInfoForm
        dark={dark}
        projectTitle={projectTitle}
        clientName={clientName}
        selectedQuoteCustomerId={selectedQuoteCustomerId}
        savedCustomers={savedCustomers}
        projectAddress={projectAddress}
        quoteDate={quoteDate}
        taxRate={taxRate}
        startDate={startDate}
        onSelectQuoteCustomer={onSelectQuoteCustomer}
        onSetProjectTitle={onSetProjectTitle}
        onSetProjectAddress={onSetProjectAddress}
        onSetQuoteDate={onSetQuoteDate}
        onSetTaxRate={onSetTaxRate}
        onSetStartDate={onSetStartDate}
        onMarkApproved={onMarkApproved}
        isQuoteApproved={isQuoteApproved}
      />

      {showTemplateBuilder && (
        <TemplateBuilder
          dark={dark}
          selectedTemplateId={selectedTemplateId}
          templateFormValues={templateFormValues}
          projectTemplates={projectTemplates}
          onUpdateTemplateField={onUpdateTemplateField}
          onApplyTemplate={onApplyTemplateToQuote}
          onClose={onCloseTemplateBuilder}
        />
      )}

      <QuoteItemsTable
        dark={dark}
        items={items}
        priceList={priceList}
        projectTemplates={projectTemplates}
        onAddItem={onAddItem}
        onAddRoom={onAddRoom}
        onOpenTemplateBuilder={onOpenTemplateBuilder}
        onGenerateSchedule={onGenerateSchedule}
        onSaveQuote={onSaveQuote}
        onUpdateItem={onUpdateItem}
        onSelectPriceItem={onSelectPriceItem}
        isSavedPriceListItem={isSavedPriceListItem}
        activeQuoteItemIndex={activeQuoteItemIndex}
        onSetActiveQuoteItemIndex={onSetActiveQuoteItemIndex}
        onSaveToPriceList={onSaveToPriceList}
        onRemoveItem={onRemoveItem}
      />

      <QuoteTotals dark={dark} totals={totals} />
    </>
  );
}
