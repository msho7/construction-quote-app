// @ts-nocheck
import { Button, Card } from "../ui";
import { formatMoney, formatQuoteReferenceNumber } from "../../utils/appUtils";

export default function DashboardHomePage({
  dark,
  savedQuotes,
  ongoingJobRecords,
  onTimeJobRecords,
  delayedJobRecords,
  openQuoteRecords,
  activeDashboardDetail,
  getQuoteLocation,
  getQuoteScheduleStatus,
  onSetDashboardDetailView,
  onStartNewQuote,
  onOpenScheduleLanding,
  onOpenQuotesLanding,
  onOpenPriceList,
  onOpenContractors,
  onOpenCustomers,
  onOpenApprovedQuoteSchedule,
  onLoadQuote
}) {
  return (
    <>
      <Card dark={dark}>
        <div className="button-row landing-action-bar">
          <Button onClick={onStartNewQuote}>New Quote</Button>
          <Button variant="secondary" onClick={onOpenScheduleLanding}>View Schedules</Button>
          <Button variant="secondary" onClick={onOpenQuotesLanding}>View Quotes</Button>
        </div>
      </Card>

      <div className="two-row-layout">
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Job Tracker</h3>
              <p className="row-subtitle">Active jobs, schedule risk, and quotes waiting for approval.</p>
            </div>
          </div>

          <div className="dashboard-metric-grid">
            <button type="button" className="dashboard-metric-button" onClick={() => onSetDashboardDetailView("ongoing")}>
              <span>Ongoing Jobs</span>
              <strong>{ongoingJobRecords.length}</strong>
            </button>
            <button type="button" className="dashboard-metric-button" onClick={() => onSetDashboardDetailView("onTime")}>
              <span>Jobs On Time</span>
              <strong>{onTimeJobRecords.length}</strong>
            </button>
            <button type="button" className="dashboard-metric-button" onClick={() => onSetDashboardDetailView("delayed")}>
              <span>Jobs Delayed</span>
              <strong>{delayedJobRecords.length}</strong>
            </button>
            <button type="button" className="dashboard-metric-button" onClick={() => onSetDashboardDetailView("openQuotes")}>
              <span>Open Quotes</span>
              <strong>{openQuoteRecords.length}</strong>
            </button>
          </div>

          <div className="dashboard-job-list">
            <h4>Ongoing Jobs</h4>
            {ongoingJobRecords.length === 0 ? (
              <p className="row-subtitle">No ongoing jobs yet.</p>
            ) : (
              <div className="list-table">
                {ongoingJobRecords.slice(0, 4).map((quote) => (
                  <div key={quote.id} className="list-row">
                    <div>
                      <button type="button" className="quote-title-button" onClick={() => onOpenApprovedQuoteSchedule(quote.id)}>
                        {formatQuoteReferenceNumber(quote)}
                      </button>
                      <div className="row-subtitle">{getQuoteLocation(quote)}</div>
                    </div>
                    <span className={`status-pill ${getQuoteScheduleStatus(quote)}`}>
                      {getQuoteScheduleStatus(quote) === "delayed" ? "Delayed" : "On Time"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeDashboardDetail ? (
            <div className="dashboard-detail-panel">
              <div className="section-header">
                <div>
                  <h4>{activeDashboardDetail.title}</h4>
                </div>
                <Button variant="secondary" onClick={() => onSetDashboardDetailView("")}>Close</Button>
              </div>
              {activeDashboardDetail.records.length === 0 ? (
                <p className="row-subtitle">{activeDashboardDetail.empty}</p>
              ) : (
                <div className="list-table">
                  {activeDashboardDetail.records.map((quote) => (
                    <div key={quote.id} className="list-row clickable" onClick={() => (quote.status || "open") === "open" ? onLoadQuote(quote) : onOpenApprovedQuoteSchedule(quote.id)}>
                      <div>
                        <div className="row-title">{formatQuoteReferenceNumber(quote)} - {quote.projectTitle || "Untitled job"}</div>
                        <div className="row-subtitle">{getQuoteLocation(quote)}</div>
                      </div>
                      <span className={`status-pill ${(quote.status || "open") === "open" ? "open" : getQuoteScheduleStatus(quote)}`}>
                        {(quote.status || "open") === "open" ? "Open" : getQuoteScheduleStatus(quote) === "delayed" ? "Delayed" : "On Time"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </Card>

        <Card dark={dark}>
          <h3>Quick Actions</h3>
          <div className="button-stack">
            <Button variant="secondary" onClick={onOpenPriceList}>Manage Price List</Button>
            <Button variant="secondary" onClick={onOpenContractors}>Manage Contractors</Button>
            <Button variant="secondary" onClick={onOpenCustomers}>Manage Customers</Button>
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
              <div key={quote.id} className="list-row clickable" onClick={() => onLoadQuote(quote)}>
                <div>
                  <div className="row-title">{quote.projectTitle}</div>
                  <div className="row-subtitle">
                    {formatQuoteReferenceNumber(quote)} • {quote.clientName || "No client name"}
                  </div>
                </div>
                <div>{formatMoney(quote.totals?.total)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
