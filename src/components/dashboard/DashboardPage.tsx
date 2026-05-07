import React from "react";
import { Card, Button } from "../ui";
import { SavedQuote, StatCard } from "../../types/appTypes";
import { formatMoney, formatQuoteReferenceNumber } from "../../utils/appUtils";

type DashboardPageProps = {
  dark: boolean;
  statCards: StatCard[];
  projectTitle: string;
  clientName: string;
  projectAddress: string;
  startDate: string;
  savedQuotes: SavedQuote[];
  onOpenQuotes: () => void;
  onOpenPriceList: () => void;
  onOpenSchedules: () => void;
  onSaveQuote: () => void;
  onLoadQuote: (quote: SavedQuote) => void;
};

export default function DashboardPage({
  dark,
  statCards,
  projectTitle,
  clientName,
  projectAddress,
  startDate,
  savedQuotes,
  onOpenQuotes,
  onOpenPriceList,
  onOpenSchedules,
  onSaveQuote,
  onLoadQuote
}: DashboardPageProps) {
  return (
    <>
      <div className="stats-grid">
        {statCards.map((stat) => (
          <Card key={stat.label} dark={dark}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="two-col-layout">
        <Card dark={dark}>
          <h3>Current Project Snapshot</h3>
          <div className="details-list">
            <div><strong>Project:</strong> {projectTitle || "Not set"}</div>
            <div><strong>Client:</strong> {clientName || "Not set"}</div>
            <div><strong>Address:</strong> {projectAddress || "Not set"}</div>
            <div><strong>Start Date:</strong> {startDate || "Not set"}</div>
          </div>
        </Card>

        <Card dark={dark}>
          <h3>Quick Actions</h3>
          <div className="button-stack">
            <Button onClick={onOpenQuotes}>Open Quote Builder</Button>
            <Button variant="secondary" onClick={onOpenPriceList}>Manage Price List</Button>
            <Button variant="secondary" onClick={onOpenSchedules}>View Schedules</Button>
            <Button variant="secondary" onClick={onSaveQuote}>Save Quote</Button>
          </div>
        </Card>
      </div>

      <Card dark={dark}>
        <h3>Recent Quotes</h3>
        {savedQuotes.length === 0 ? (
          <p>No saved quotes yet.</p>
        ) : (
          <div className="list-table">
            {savedQuotes.slice(0, 5).map((quote) => (
              <div
                key={quote.id}
                className="list-row clickable"
                onClick={() => onLoadQuote(quote)}
              >
                <div>
                  <div className="row-title">{quote.projectTitle}</div>
                  <div className="row-subtitle">
                    {formatQuoteReferenceNumber(quote)} • {quote.clientName || "No client name"}
                  </div>
                </div>
                <div>{formatMoney(quote.totals?.total || 0)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
