import React, { useState } from "react";
import { Card, Button, Input, Select } from "../ui";
import {
  formatDateForInput,
  formatMoney,
  formatQuoteReferenceNumber,
  getScheduleEndDate,
  toDateInputValue
} from "../../utils/appUtils";

const hasStartDate = (quote) => Boolean(String(quote.startDate || "").trim());
const getTodayDate = () => formatDateForInput(new Date());
const getQuoteStartDate = (quote) => toDateInputValue(quote.startDate);
const getNormalizedText = (value) => String(value || "").trim().toLowerCase();
const getQuoteCustomerName = (quote) =>
  String(quote.customerProfile?.customerName || "").trim() ||
  String(quote.customerProfile?.companyName || "").trim() ||
  String(quote.clientName || "").trim();
const getQuoteCustomerSearchText = (quote) =>
  [
    getQuoteCustomerName(quote),
    quote.clientName,
    quote.customerProfile?.customerName,
    quote.customerProfile?.companyName,
    quote.customerProfile?.email,
    quote.customerProfile?.phone
  ].map(getNormalizedText).filter(Boolean).join(" ");

const getLatestScheduleEndDate = (quote) =>
  (quote.schedule || []).reduce((latestEndDate, task) => {
    const taskEndDate =
      toDateInputValue(task.endDate) ||
      getScheduleEndDate(task.startDate, task.duration);

    if (!taskEndDate) return latestEndDate;
    if (!latestEndDate || taskEndDate > latestEndDate) return taskEndDate;

    return latestEndDate;
  }, "");

const isOngoingSchedulePastDue = (quote) => {
  const latestScheduleEndDate = getLatestScheduleEndDate(quote);
  return Boolean(latestScheduleEndDate && latestScheduleEndDate < getTodayDate());
};

const hasProjectStarted = (quote) => {
  const startDate = getQuoteStartDate(quote);
  return Boolean(startDate && startDate <= getTodayDate());
};

const getQuoteWorkflowState = (quote) => {
  if (quote.status === "invoiced") return "invoiced";
  if (quote.status === "completed") return "completed";
  if (quote.status === "ongoing" && isOngoingSchedulePastDue(quote)) return "completed";
  if ((quote.status === "approved" || quote.status === "ongoing") && isOngoingSchedulePastDue(quote)) return "completed";
  if ((quote.status === "approved" || quote.status === "ongoing") && hasProjectStarted(quote)) return "ongoing";
  if ((quote.status === "approved" || quote.status === "ongoing") && hasStartDate(quote)) return "waiting";
  if (quote.status === "ongoing") return "ongoing";
  if (quote.status === "approved") return "approved";
  return "open";
};

const getStatusLabel = (status) => {
  if (status === "invoiced") return "Invoiced";
  if (status === "completed") return "Completed";
  if (status === "ongoing") return "Ongoing";
  if (status === "waiting") return "Waiting To Start";
  if (status === "approved") return "Approved";
  return "Open";
};

const PROJECT_LIST_OPTIONS = [
  {
    value: "all",
    label: "All Quotes",
    title: "All Active Quotes",
    emptyText: "No active quotes yet."
  },
  {
    value: "approved",
    label: "Approved",
    title: "Approved Projects",
    emptyText: "No approved projects without a start date yet."
  },
  {
    value: "waiting",
    label: "Waiting To Start",
    title: "Waiting To Start",
    emptyText: "No future approved projects waiting to start yet."
  },
  {
    value: "ongoing",
    label: "Ongoing Projects",
    title: "Ongoing Projects",
    emptyText: "No ongoing projects yet."
  },
  {
    value: "completed",
    label: "Completed Jobs",
    title: "Completed Jobs",
    emptyText: "No completed jobs yet."
  }
];

export default function QuotesLandingPage({
  dark,
  savedQuotes,
  customerFilter,
  initialProjectList,
  onClearCustomerFilter,
  onNewQuote,
  onOpenQuote,
  onOpenQuoteSchedule,
  onOpenMaterialTakeoff,
  onToggleQuoteApproval,
  onDeleteQuote,
  onIncrementQuoteInvoicePart,
  onSetQuoteProjectStatus
}) {
  const [selectedProjectList, setSelectedProjectList] = useState(() => initialProjectList || "approved");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const customerScopedQuotes = customerFilter
    ? savedQuotes.filter((quote) => {
        if (customerFilter.id && (quote.customerId === customerFilter.id || quote.customerProfile?.id === customerFilter.id)) {
          return true;
        }

        const filterName = getNormalizedText(customerFilter.customerName || customerFilter.companyName || customerFilter.label);
        const quoteName = getNormalizedText(getQuoteCustomerName(quote));
        const filterEmail = getNormalizedText(customerFilter.email);
        const quoteEmail = getNormalizedText(quote.customerProfile?.email);

        return Boolean(
          (filterName && quoteName && filterName === quoteName) ||
          (filterEmail && quoteEmail && filterEmail === quoteEmail)
        );
      })
    : savedQuotes;
  const normalizedCustomerSearchTerm = getNormalizedText(customerSearchTerm);
  const filteredQuotes = normalizedCustomerSearchTerm
    ? customerScopedQuotes.filter((quote) =>
        getQuoteCustomerSearchText(quote).includes(normalizedCustomerSearchTerm)
      )
    : customerScopedQuotes;

  const quotesInProgress = filteredQuotes.filter((quote) => getQuoteWorkflowState(quote) === "open");
  const approvedProjects = filteredQuotes.filter((quote) => getQuoteWorkflowState(quote) === "approved");
  const waitingProjects = filteredQuotes.filter((quote) => getQuoteWorkflowState(quote) === "waiting");
  const ongoingProjects = filteredQuotes.filter((quote) => getQuoteWorkflowState(quote) === "ongoing");
  const completedProjects = filteredQuotes.filter((quote) => {
    const status = getQuoteWorkflowState(quote);
    return status === "completed" || status === "invoiced";
  });
  const activeQuotes = filteredQuotes.filter((quote) => {
    const status = getQuoteWorkflowState(quote);
    return status !== "completed" && status !== "invoiced";
  });
  const quoteTotal = filteredQuotes.reduce((sum, quote) => sum + Number(quote.totals?.total || 0), 0);
  const quoteAverage = filteredQuotes.length ? quoteTotal / filteredQuotes.length : 0;

  const projectLists = {
    all: activeQuotes,
    approved: approvedProjects,
    waiting: waitingProjects,
    ongoing: ongoingProjects,
    completed: completedProjects
  };
  const selectedListConfig =
    PROJECT_LIST_OPTIONS.find((option) => option.value === selectedProjectList) ||
    PROJECT_LIST_OPTIONS[0];
  const selectedProjectQuotes = projectLists[selectedListConfig.value] || [];

  const renderProjectActions = (quote, status) => {
    if (status === "waiting") {
      return (
        <>
          <Button variant="secondary" onClick={() => onOpenQuote(quote)}>
            Edit Quote
          </Button>
          <Button variant="secondary" onClick={() => onOpenMaterialTakeoff?.(quote)}>
            Material Takeoff
          </Button>
          <Button variant="secondary" onClick={() => onToggleQuoteApproval(quote.id)}>
            Mark In Progress
          </Button>
        </>
      );
    }

    if (status === "approved") {
      return (
        <>
          <Button variant="secondary" onClick={() => onOpenQuote(quote)}>
            Edit Quote
          </Button>
          <Button variant="secondary" onClick={() => onOpenMaterialTakeoff?.(quote)}>
            Material Takeoff
          </Button>
          <Button variant="secondary" onClick={() => onToggleQuoteApproval(quote.id)}>
            Mark In Progress
          </Button>
        </>
      );
    }

    if (status === "ongoing") {
      return (
        <>
          <Button variant="secondary" onClick={() => onOpenQuote(quote)}>
            Edit Quote
          </Button>
          <Button variant="secondary" onClick={() => onSetQuoteProjectStatus?.(quote.id, "completed")}>
            Mark Completed
          </Button>
          <Button variant="secondary" onClick={() => onSetQuoteProjectStatus?.(quote.id, "approved")}>
            Move To Waiting
          </Button>
        </>
      );
    }

    if (status === "completed" || status === "invoiced") {
      return (
        <>
          <Button variant="secondary" onClick={() => onOpenQuote(quote, { readOnly: true })}>
            View Project
          </Button>
          <Button variant="secondary" onClick={() => onOpenQuoteSchedule?.(quote)}>
            View Schedule
          </Button>
          {status === "invoiced" ? (
            <Button variant="secondary" onClick={() => onIncrementQuoteInvoicePart(quote.id)}>
              Add Payment Part
            </Button>
          ) : null}
        </>
      );
    }

    return (
      <>
        <Button variant="secondary" onClick={() => onOpenQuote(quote)}>
          Edit Quote
        </Button>
        <Button variant="secondary" onClick={() => onToggleQuoteApproval(quote.id)}>
          Mark In Progress
        </Button>
      </>
    );
  };

  const renderProjectRow = (quote) => {
    const status = getQuoteWorkflowState(quote);
    const openQuoteFromTitle = () => {
      onOpenQuote(quote, { readOnly: status === "completed" || status === "invoiced" });
    };

    return (
      <div key={quote.id} className="list-row quote-overview-row">
        <div className="quote-overview-main">
          <div className="quote-overview-heading">
            <button type="button" className="quote-title-button" onClick={openQuoteFromTitle}>
              {quote.projectTitle}
            </button>
            <span className={`status-pill ${status}`}>{getStatusLabel(status)}</span>
          </div>
          <div className="row-subtitle">
            {formatQuoteReferenceNumber(quote)} • {quote.clientName || "No client name"} • {quote.startDate ? `Start Date: ${quote.startDate}` : "No start date"}
          </div>
        </div>

        <div className="quote-overview-side">
          <div className="quote-overview-total">
            {formatMoney(quote.totals?.total || 0)}
          </div>
          <div className="button-row quote-overview-actions">
            {renderProjectActions(quote, status)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Quotes Overview</h3>
            <p className="row-subtitle">
              {customerFilter?.label
                ? `Showing quotes for ${customerFilter.label}.`
                : "Review quote activity, monitor totals, and jump into a new quote when you are ready."}
            </p>
          </div>
          <div className="button-row">
            {customerFilter?.id ? (
              <Button variant="secondary" onClick={onClearCustomerFilter}>
                Show All Quotes
              </Button>
            ) : null}
            <Button onClick={onNewQuote}>+ New Quote</Button>
          </div>
        </div>

        <label className="quotes-customer-search">
          Search Customer
          <Input
            placeholder="Search by customer name, company, email, or phone"
            value={customerSearchTerm}
            onChange={(event) => setCustomerSearchTerm(event.target.value)}
          />
        </label>
      </Card>

      <div className="stats-grid">
        <Card dark={dark}>
          <div className="stat-label">Quotes In Progress</div>
          <div className="stat-value">{quotesInProgress.length}</div>
        </Card>

        <Card dark={dark}>
          <div className="stat-label">Waiting To Start</div>
          <div className="stat-value">{waitingProjects.length}</div>
        </Card>

        <Card dark={dark}>
          <div className="stat-label">Quote Total</div>
          <div className="stat-value">{formatMoney(quoteTotal)}</div>
        </Card>

        <Card dark={dark}>
          <div className="stat-label">Quote Average</div>
          <div className="stat-value">{formatMoney(quoteAverage)}</div>
        </Card>
      </div>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Quotes In Progress</h3>
            <p className="row-subtitle">
              Review saved quotes that are still being worked on, then continue editing or mark them approved.
            </p>
          </div>
        </div>

        {quotesInProgress.length === 0 ? (
          <div className="quotes-empty-state">
            <p>{normalizedCustomerSearchTerm ? "No in-progress quotes match that customer search." : "No quotes in progress yet."}</p>
            <Button onClick={onNewQuote}>New Quote</Button>
          </div>
        ) : (
          <div className="list-table">
            {quotesInProgress.map((quote) => (
              <div key={quote.id} className="list-row quote-overview-row">
                <div className="quote-overview-main">
                  <div className="quote-overview-heading">
                    <button type="button" className="quote-title-button" onClick={() => onOpenQuote(quote)}>
                      {quote.projectTitle}
                    </button>
                    <span className="status-pill open">Open</span>
                  </div>
                  <div className="row-subtitle">
                    {formatQuoteReferenceNumber(quote)} • {quote.clientName || "No client name"} • {quote.quoteDate || "No quote date"}
                  </div>
                </div>

                <div className="quote-overview-side">
                  <div className="quote-overview-total">
                    {formatMoney(quote.totals?.total || 0)}
                  </div>
                  <div className="button-row quote-overview-actions">
                    <Button variant="secondary" onClick={() => onOpenQuote(quote)}>
                      Continue Quote
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onToggleQuoteApproval(quote.id)}
                    >
                      Mark Approved
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => onDeleteQuote?.(quote)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>{selectedListConfig.title}</h3>
            <p className="row-subtitle">
              Select a project stage to review the matching project list.
            </p>
          </div>
          <label className="project-list-filter">
            View
            <Select
              value={selectedProjectList}
              onChange={(event) => setSelectedProjectList(event.target.value)}
            >
              {PROJECT_LIST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {selectedProjectQuotes.length === 0 ? (
          <div className="quotes-empty-state">
            <p>{normalizedCustomerSearchTerm ? "No projects match that customer search." : selectedListConfig.emptyText}</p>
          </div>
        ) : (
          <div className="list-table">
            {selectedProjectQuotes.map(renderProjectRow)}
          </div>
        )}
      </Card>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Completed Jobs</h3>
            <p className="row-subtitle">
              Review completed and invoiced jobs that were created from saved quotes.
            </p>
          </div>
        </div>

        {completedProjects.length === 0 ? (
          <div className="quotes-empty-state">
            <p>{normalizedCustomerSearchTerm ? "No completed jobs match that customer search." : "No completed jobs yet."}</p>
          </div>
        ) : (
          <div className="list-table">
            {completedProjects.map(renderProjectRow)}
          </div>
        )}
      </Card>
    </>
  );
}
