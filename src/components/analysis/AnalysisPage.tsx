import React, { useState } from "react";
import { PROJECT_TEMPLATES } from "../../constants/appConstants";
import { formatMoney, getItemBaseTotal, getItemMarkupAmount, toDateInputValue } from "../../utils/appUtils";
import { Button, Card } from "../ui";

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const getNormalizedText = (value: any) => String(value || "").trim().toLowerCase();
const getSavedQuoteStatus = (quote: any = {}) => quote.status || "open";

export default function AnalysisPage({
  dark,
  savedQuotes,
  onOpenQuotes,
  onOpenSchedule,
  onOpenContractors
}: any) {
  const [activeAnalysisDetail, setActiveAnalysisDetail] = useState<any>(null);
  const today = getTodayDate();
  const completedStatuses = new Set(["completed", "invoiced"]);
  const acceptedStatuses = new Set(["approved", "ongoing", "completed", "invoiced"]);
  const activeProjects = savedQuotes.filter((quote) => !completedStatuses.has(getSavedQuoteStatus(quote)));
  const completedProjects = savedQuotes.filter((quote) => completedStatuses.has(getSavedQuoteStatus(quote)));
  const acceptedProjects = savedQuotes.filter((quote) => acceptedStatuses.has(getSavedQuoteStatus(quote)));
  const futureBookedProjects = acceptedProjects.filter((quote) => toDateInputValue(quote.startDate) > today);

  const getQuoteEstimatedCost = (quote: any) =>
    (quote.items || []).reduce((sum, item) => sum + getItemBaseTotal(item), 0);
  const getQuoteMarkup = (quote: any) =>
    Number(quote.totals?.markup || (quote.items || []).reduce((sum, item) => sum + getItemMarkupAmount(item), 0));
  const getQuoteRevenue = (quote: any) =>
    Number(quote.totals?.total || getQuoteEstimatedCost(quote) + getQuoteMarkup(quote));
  const getQuoteLengthDays = (quote: any) => {
    const scheduledDuration = (quote.schedule || []).reduce((sum, task) => sum + Number(task.duration || 0), 0);
    if (scheduledDuration) return scheduledDuration;
    return (quote.items || []).reduce((sum, item) => sum + Number(item.duration || 0), 0);
  };
  const getQuoteLatestScheduleEndDate = (quote: any) =>
    (quote.schedule || []).reduce((latestDate, task) => {
      const endDate = toDateInputValue(task.endDate);
      if (!endDate) return latestDate;
      return !latestDate || endDate > latestDate ? endDate : latestDate;
    }, "");
  const getDaysBetween = (start: any, end: any) => {
    const startDateValue = toDateInputValue(start);
    const endDateValue = toDateInputValue(end);
    if (!startDateValue || !endDateValue) return 0;

    const startDateObject = new Date(`${startDateValue}T00:00:00`);
    const endDateObject = new Date(`${endDateValue}T00:00:00`);
    return Math.max(0, Math.ceil((endDateObject.getTime() - startDateObject.getTime()) / 86400000));
  };
  const getProjectType = (quote: any) => {
    const searchText = [
      quote.projectTitle,
      ...(quote.items || []).flatMap((item) => [item.roomTemplateId, item.roomName, item.name])
    ].join(" ").toLowerCase();
    const matchedTemplate = PROJECT_TEMPLATES.find((template) => searchText.includes(template.id.toLowerCase()));
    if (matchedTemplate) return matchedTemplate.label;

    const roomName = (quote.items || []).find((item) => item.roomName)?.roomName;
    return roomName || "General";
  };
  const sumByCategory = (quotes: any[], categoryName: string) =>
    quotes.reduce((sum, quote) =>
      sum + (quote.items || []).reduce((itemSum, item) => {
        const normalizedCategory = getNormalizedText(item.category);
        return normalizedCategory === getNormalizedText(categoryName)
          ? itemSum + getItemBaseTotal(item)
          : itemSum;
      }, 0), 0);

  const quoteCount = savedQuotes.length || 1;
  const acceptedCount = acceptedProjects.length;
  const projectCostAverage = savedQuotes.reduce((sum, quote) => sum + getQuoteRevenue(quote), 0) / quoteCount;
  const projectLengthAverage = savedQuotes.reduce((sum, quote) => sum + getQuoteLengthDays(quote), 0) / quoteCount;
  const totalEstimatedCost = savedQuotes.reduce((sum, quote) => sum + getQuoteEstimatedCost(quote), 0);
  const totalRevenue = savedQuotes.reduce((sum, quote) => sum + getQuoteRevenue(quote), 0);
  const totalProfit = savedQuotes.reduce((sum, quote) => sum + getQuoteMarkup(quote), 0);
  const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;
  const totalScheduleItems = savedQuotes.reduce((sum, quote) => sum + (quote.schedule || []).length, 0);
  const completedScheduleItems = completedProjects.reduce((sum, quote) => sum + (quote.schedule || []).length, 0);
  const overdueTasks = activeProjects.flatMap((quote) =>
    (quote.schedule || [])
      .filter((task) => toDateInputValue(task.endDate) && toDateInputValue(task.endDate) < today)
      .map((task) => ({ quote, task }))
  );
  const projectsBehindSchedule = activeProjects.filter((quote) => {
    const latestEndDate = getQuoteLatestScheduleEndDate(quote);
    return latestEndDate && latestEndDate < today;
  });
  const totalDelayDays = projectsBehindSchedule.reduce(
    (sum, quote) => sum + getDaysBetween(getQuoteLatestScheduleEndDate(quote), today),
    0
  );
  const categoryBreakdown = [
    { label: "Materials", value: sumByCategory(savedQuotes, "Material") },
    { label: "Labour", value: sumByCategory(savedQuotes, "Labor") },
    { label: "Delivery", value: sumByCategory(savedQuotes, "Delivery") }
  ];
  const projectTypeRows = (Object.values(
    savedQuotes.reduce((groups: Record<string, any>, quote) => {
      const type = getProjectType(quote);
      const previous = groups[type] || { type, count: 0, revenue: 0, cost: 0, profit: 0, days: 0 };
      groups[type] = {
        ...previous,
        count: previous.count + 1,
        revenue: previous.revenue + getQuoteRevenue(quote),
        cost: previous.cost + getQuoteEstimatedCost(quote),
        profit: previous.profit + getQuoteMarkup(quote),
        days: previous.days + getQuoteLengthDays(quote)
      };
      return groups;
    }, {} as Record<string, any>)
  ) as any[]).sort((left, right) => right.profit - left.profit);
  const costPerTask = totalScheduleItems ? totalEstimatedCost / totalScheduleItems : 0;
  const squareFootItems = savedQuotes.flatMap((quote) => quote.items || []).filter((item) => item.unit === "sf");
  const squareFootQuantity = squareFootItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const costPerSquareFoot = squareFootQuantity
    ? squareFootItems.reduce((sum, item) => sum + getItemBaseTotal(item), 0) / squareFootQuantity
    : 0;
  const mostExpensivePhase = (Object.entries(
    savedQuotes.flatMap((quote) => quote.items || []).reduce((groups: Record<string, number>, item) => {
      const phase = item.roomName || item.name || "Unassigned";
      groups[phase] = (groups[phase] || 0) + getItemBaseTotal(item);
      return groups;
    }, {} as Record<string, number>)
  ) as [string, number][]).sort((left, right) => right[1] - left[1])[0];
  const revenueForecast = futureBookedProjects.reduce((sum, quote) => sum + getQuoteRevenue(quote), 0);
  const winRate = savedQuotes.length ? (acceptedCount / savedQuotes.length) * 100 : 0;
  const taskCompletionRate = totalScheduleItems ? (completedScheduleItems / totalScheduleItems) * 100 : 0;
  const highRiskProjects = projectsBehindSchedule.filter((quote) => getQuoteMarkup(quote) <= 0);
  const completedMonths = completedProjects.reduce((groups: Record<string, number>, quote) => {
    const month = toDateInputValue(getQuoteLatestScheduleEndDate(quote) || quote.quoteDate).slice(0, 7) || "Unscheduled";
    groups[month] = (groups[month] || 0) + 1;
    return groups;
  }, {} as Record<string, number>);
  const projectsCompletedPerMonth = Object.keys(completedMonths).length
    ? completedProjects.length / Object.keys(completedMonths).length
    : 0;
  const suggestedPricingRows = projectTypeRows
    .filter((row) => row.count)
    .map((row) => ({
      type: row.type,
      averageValue: row.revenue / row.count,
      averageDailyRate: row.days ? row.revenue / row.days : 0,
      margin: row.revenue ? (row.profit / row.revenue) * 100 : 0
    }));
  const trackedMetricRows = [
    { label: "Cost overrun tracking", value: "Needs actual cost fields", detail: "Add actual job cost fields to compare estimates with final spend." },
    { label: "Labour cost vs estimate", value: "Needs actual labour cost", detail: "Track actual labour cost per quote or task to calculate this." },
    { label: "Estimate vs actual comparison", value: "Needs actual job totals", detail: "Track final actual project totals alongside quote estimates." },
    { label: "Cost variance % by category", value: "Needs actual category spend", detail: "Track actual spend by labour/material/delivery category." },
    { label: "Labour variance", value: "Needs actual labour tracking", detail: "Track actual labour hours or cost per project." },
    { label: "Material variance", value: "Needs actual material tracking", detail: "Track quoted material versus actual material spend." },
    { label: "Historical estimate accuracy", value: "Needs completed actuals", detail: "Completed projects need actuals before accuracy trends can be calculated." },
    { label: "Projects over budget", value: "Needs budget/actual tracking", detail: "Track actual final costs to flag projects over budget." },
    { label: "Outstanding invoices", value: "Needs invoice/payment status", target: "quotes", detail: "Invoice status can be tied to completed or invoiced quotes." },
    { label: "Average time to payment", value: "Needs payment dates", target: "quotes", detail: "Add sent and paid dates for invoices to calculate payment speed." },
    { label: "Supplier cost comparison", value: "Needs supplier records", detail: "Add suppliers to material line items to compare pricing." },
    { label: "Supplier delays", value: "Needs supplier delivery dates", detail: "Track expected and actual supplier delivery dates." },
    { label: "Supplier average timelines", value: "Needs supplier timelines", detail: "Add supplier order and delivery dates to calculate averages." },
    { label: "Crew utilization", value: "Needs crew capacity", target: "contractor", detail: "Contractor/crew capacity and assignments are needed for utilization." },
    { label: "Revenue per crew", value: "Needs crew assignment", target: "contractor", detail: "Assign contractors or crews to accepted projects to calculate revenue by crew." },
    { label: "Crew productivity", value: "Needs crew/task completion", target: "contractor", detail: "Track task completion by contractor or crew." },
    { label: "Material usage vs waste", value: "Needs material ordered/used", detail: "Track material ordered, installed, and wasted." },
    { label: "Client profitability", value: "Needs actual profit by client", target: "quotes", detail: "Actual profit by customer requires final actual costs." },
    { label: "Change order impact on cost/time", value: "Needs change orders", detail: "Add change orders with cost and duration impact." },
    { label: "Time between projects", value: "Needs completed start/end dates by crew", target: "contractor", detail: "Crew downtime requires completed project dates and crew assignments." }
  ];
  const metricCards = [
    { label: "Open Projects", value: activeProjects.length, target: "quotes", detail: "Quotes that are not completed or invoiced yet." },
    { label: "Completed Projects", value: completedProjects.length, target: "quotes", detail: "Projects marked completed or invoiced." },
    { label: "Project Cost Average", value: formatMoney(projectCostAverage), target: "quotes", detail: "Average quote value across all saved projects." },
    { label: "Project Length Average", value: `${projectLengthAverage.toFixed(1)} days`, target: "schedule", detail: "Average scheduled or estimated task duration." },
    { label: "Scheduled Items Completed", value: `${completedScheduleItems}/${totalScheduleItems}`, target: "schedule", detail: "Schedule items attached to completed or invoiced projects." },
    { label: "Scheduled Items Overdue", value: overdueTasks.length, target: "schedule", detail: "Active-project schedule items with an end date before today." },
    { label: "Project Profit Margin", value: `${profitMargin.toFixed(1)}%`, target: "quotes", detail: "Estimated markup divided by total quoted revenue." },
    { label: "Revenue Vs Total Cost", value: `${formatMoney(totalRevenue)} / ${formatMoney(totalEstimatedCost)}`, target: "quotes", detail: "Quoted revenue compared with estimated item base cost." },
    { label: "Active Vs Completed", value: `${activeProjects.length} / ${completedProjects.length}`, target: "quotes", detail: "Open/approved/ongoing projects compared with completed/invoiced work." },
    { label: "Revenue Forecast", value: formatMoney(revenueForecast), target: "quotes", detail: "Accepted projects with future start dates." },
    { label: "Project Backlog", value: futureBookedProjects.length, target: "schedule", detail: "Accepted work booked for the future." },
    { label: "Quote Win Rate", value: `${winRate.toFixed(1)}%`, target: "quotes", detail: "Accepted quotes divided by all saved quotes." },
    { label: "Average Project Value", value: formatMoney(projectCostAverage), target: "quotes", detail: "Average saved quote total." },
    { label: "Projects Behind Schedule", value: projectsBehindSchedule.length, target: "schedule", detail: "Active projects whose latest schedule end date is in the past." },
    { label: "High-Risk Projects", value: highRiskProjects.length, target: "schedule", detail: "Projects that are delayed and have no estimated markup buffer." },
    { label: "Task Completion Rate", value: `${taskCompletionRate.toFixed(1)}%`, target: "schedule", detail: "Completed-project schedule items divided by all scheduled items." },
    { label: "Delay Tracking", value: `${totalDelayDays} days`, target: "schedule", detail: "Total days active projects are past their scheduled end date." },
    { label: "Cost Per Square Foot", value: costPerSquareFoot ? formatMoney(costPerSquareFoot) : "Needs SF items", detail: "Base cost divided by quantity for items measured in square feet." },
    { label: "Cost Per Task", value: costPerTask ? formatMoney(costPerTask) : "Needs schedules", target: "schedule", detail: "Estimated base cost divided by scheduled task count." },
    { label: "Projects Completed / Month", value: projectsCompletedPerMonth.toFixed(1), target: "quotes", detail: "Completed project count averaged across months with completions." },
    { label: "Average Job Size", value: `${squareFootQuantity.toFixed(0)} sf tracked`, detail: "Total square-foot item quantity currently tracked." },
    { label: "Daily Project Burn Rate", value: projectLengthAverage ? formatMoney(totalEstimatedCost / Math.max(1, savedQuotes.reduce((sum, quote) => sum + getQuoteLengthDays(quote), 0))) : "Needs schedules", target: "schedule", detail: "Estimated base cost divided by scheduled/estimated project days." }
  ];
  const recommendationRows = [
    { label: "Profitability", value: projectTypeRows[0] ? `Most profitable project type is ${projectTypeRows[0].type} at ${formatMoney(projectTypeRows[0].profit)} estimated profit.` : "Add completed quotes to identify profitable project types.", target: "quotes" },
    { label: "Schedule Review", value: overdueTasks.length ? `${overdueTasks.length} scheduled item(s) are past schedule and should be reviewed first.` : "No scheduled items are currently overdue.", target: "schedule" },
    { label: "Pricing Check", value: profitMargin < 15 && savedQuotes.length ? "Estimated profit margin is below 15%; review labour/material pricing before sending new quotes." : "Estimated profit margin is healthy based on quote markup.", target: "quotes" },
    { label: "Forecast", value: futureBookedProjects.length ? `${futureBookedProjects.length} future project(s) are booked, forecasting ${formatMoney(revenueForecast)} in revenue.` : "No future booked work found from approved quotes with future start dates.", target: "quotes" }
  ];

  const openAnalysisTile = (tile: any) => {
    setActiveAnalysisDetail(null);

    if (tile.target === "schedule") {
      onOpenSchedule();
      return;
    }

    if (tile.target === "quotes") {
      onOpenQuotes();
      return;
    }

    if (tile.target === "contractor") {
      onOpenContractors();
      return;
    }

    setActiveAnalysisDetail(tile);
  };

  return (
    <>
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Analysis</h3>
            <p className="row-subtitle">
              Review project performance, schedule risk, pricing trends, and the data gaps needed for deeper actual-cost reporting.
            </p>
          </div>
          <Button variant="secondary" onClick={onOpenQuotes}>Go To Quotes</Button>
        </div>

        <div className="analysis-metric-grid">
          {metricCards.map((metric) => (
            <button
              key={metric.label}
              type="button"
              className="analysis-metric-card analysis-clickable-tile"
              onClick={() => openAnalysisTile(metric)}
            >
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </button>
          ))}
        </div>
      </Card>

      {activeAnalysisDetail ? (
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>{activeAnalysisDetail.label}</h3>
              <p className="row-subtitle">
                {activeAnalysisDetail.detail || "Detailed analysis for this metric."}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setActiveAnalysisDetail(null)}>Back To Analysis</Button>
          </div>

          <div className="analysis-detail-grid">
            <div className="analysis-detail-primary">
              <span>Current Value</span>
              <strong>{activeAnalysisDetail.value}</strong>
            </div>
            <div className="analysis-detail-primary">
              <span>Source</span>
              <strong>{activeAnalysisDetail.source || "Saved quote and schedule data"}</strong>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="analysis-grid">
        <Card dark={dark}>
          <h3>Project Cost Breakdown</h3>
          <div className="analysis-list">
            {categoryBreakdown.map((entry) => (
              <button
                key={entry.label}
                type="button"
                className="analysis-row analysis-row-button"
                onClick={() => openAnalysisTile({
                  label: entry.label,
                  value: formatMoney(entry.value),
                  detail: `Estimated ${entry.label.toLowerCase()} cost from saved quote line-item categories.`
                })}
              >
                <span>{entry.label}</span>
                <strong>{formatMoney(entry.value)}</strong>
              </button>
            ))}
          </div>
        </Card>

        <Card dark={dark}>
          <h3>Profit Per Project Type</h3>
          <div className="analysis-list">
            {projectTypeRows.length ? projectTypeRows.map((row) => (
              <button
                key={row.type}
                type="button"
                className="analysis-row analysis-row-button"
                onClick={() => openAnalysisTile({
                  label: `${row.type} Profit`,
                  value: formatMoney(row.profit),
                  target: "quotes",
                  detail: `${row.count} saved ${row.type.toLowerCase()} project(s), ${formatMoney(row.revenue)} revenue, ${formatMoney(row.cost)} estimated cost.`
                })}
              >
                <span>{row.type} ({row.count})</span>
                <strong>{formatMoney(row.profit)}</strong>
              </button>
            )) : <p className="row-subtitle">No project types found yet.</p>}
          </div>
        </Card>
      </div>

      <div className="analysis-grid">
        <Card dark={dark}>
          <h3>Schedule And Delay Tracking</h3>
          <div className="analysis-list">
            {[
              { label: "Delay impact on total project duration", value: `${totalDelayDays} day(s)`, target: "schedule", detail: "Total days active projects are beyond their latest schedule end date." },
              { label: "Critical tasks", value: overdueTasks.length, target: "schedule", detail: "Overdue scheduled tasks that can delay active projects." },
              { label: "Recurring delays/issues", value: projectsBehindSchedule.length ? "Schedule overruns" : "None detected", target: "schedule", detail: "Looks for active projects with past schedule end dates." },
              { label: "Trends in delays", value: overdueTasks.length ? "Rising risk" : "Stable", target: "schedule", detail: "Simple current-risk signal based on overdue scheduled items." }
            ].map((row) => (
              <button key={row.label} type="button" className="analysis-row analysis-row-button" onClick={() => openAnalysisTile(row)}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </button>
            ))}
          </div>
        </Card>

        <Card dark={dark}>
          <h3>Cost Trends</h3>
          <div className="analysis-list">
            {[
              { label: "Trends in cost overruns", value: "Needs actuals", detail: "Actual job costs need to be captured before overrun trends can be calculated." },
              { label: "Underpriced job types", value: projectTypeRows.find((row) => row.profit <= 0)?.type || "None estimated", target: "quotes", detail: "Flags project types with zero or negative estimated markup." },
              { label: "Most profitable project types", value: projectTypeRows[0]?.type || "No data", target: "quotes", detail: "Ranks project types by estimated markup/profit." },
              { label: "Most expensive project phases", value: mostExpensivePhase ? `${mostExpensivePhase[0]} ${formatMoney(mostExpensivePhase[1])}` : "No phases", target: "quotes", detail: "Ranks phases by estimated base cost from item room/name groupings." }
            ].map((row) => (
              <button key={row.label} type="button" className="analysis-row analysis-row-button" onClick={() => openAnalysisTile(row)}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card dark={dark}>
        <h3>Suggested Pricing Based On Past Jobs</h3>
        {suggestedPricingRows.length ? (
          <div className="analysis-table">
            <div className="analysis-table-row analysis-table-header">
              <span>Project Type</span>
              <span>Avg Value</span>
              <span>Avg $/Day</span>
              <span>Margin</span>
            </div>
            {suggestedPricingRows.map((row) => (
              <button
                key={row.type}
                type="button"
                className="analysis-table-row analysis-table-button"
                onClick={() => openAnalysisTile({
                  label: `${row.type} Suggested Pricing`,
                  value: formatMoney(row.averageValue),
                  target: "quotes",
                  detail: `Average ${row.type.toLowerCase()} project value is ${formatMoney(row.averageValue)}, averaging ${formatMoney(row.averageDailyRate)} per scheduled day at ${row.margin.toFixed(1)}% estimated margin.`
                })}
              >
                <span>{row.type}</span>
                <span>{formatMoney(row.averageValue)}</span>
                <span>{formatMoney(row.averageDailyRate)}</span>
                <span>{row.margin.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="row-subtitle">Save quotes to generate pricing suggestions.</p>
        )}
      </Card>

      <Card dark={dark}>
        <h3>Performance Insights</h3>
        <div className="analysis-insight-list">
          {recommendationRows.map((recommendation) => (
            <button
              key={recommendation.label}
              type="button"
              className="analysis-insight analysis-clickable-tile"
              onClick={() => openAnalysisTile(recommendation)}
            >
              <span>{recommendation.label}</span>
              <strong>{recommendation.value}</strong>
            </button>
          ))}
        </div>
      </Card>

      <Card dark={dark}>
        <h3>Actuals, Supplier, Crew, Invoice And Change Order Tracking</h3>
        <div className="analysis-status-grid">
          {trackedMetricRows.map((row) => (
            <button
              key={row.label}
              type="button"
              className="analysis-status-item analysis-clickable-tile"
              onClick={() => openAnalysisTile(row)}
            >
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}
