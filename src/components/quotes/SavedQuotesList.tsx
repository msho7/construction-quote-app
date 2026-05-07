import React from "react";
import { Card } from "../ui";
import { SavedQuote } from "../../types/appTypes";
import { formatMoney, formatQuoteReferenceNumber } from "../../utils/appUtils";

type SavedQuotesListProps = {
  dark: boolean;
  savedQuotes: SavedQuote[];
  onLoadQuote: (quote: SavedQuote) => void;
};

export default function SavedQuotesList({
  dark,
  savedQuotes,
  onLoadQuote
}: SavedQuotesListProps) {
  return (
    <Card dark={dark}>
      <h3>Saved Quotes</h3>
      {savedQuotes.length === 0 ? (
        <p>No quotes saved yet.</p>
      ) : (
        <div className="list-table">
          {savedQuotes.map((quote) => (
            <div
              key={quote.id}
              className="list-row clickable"
              onClick={() => onLoadQuote(quote)}
            >
              <div>
                <div className="row-title">{quote.projectTitle}</div>
                <div className="row-subtitle">
                  {formatQuoteReferenceNumber(quote)} • {quote.createdAt}
                </div>
              </div>
              <div>{formatMoney(quote.totals?.total || 0)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
