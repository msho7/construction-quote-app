import React, { useEffect, useState } from "react";
import { Card, Button, Input } from "../ui";
import BusinessDatePicker from "./BusinessDatePicker";
import {
  addDaysToDate,
  formatQuoteReferenceNumber,
  formatMoney,
  getNextBusinessDate,
  getScheduleEndDate,
  sanitizeNumericInput,
  toDateInputValue
} from "../../utils/appUtils";
import { SavedQuote, ScheduleItem } from "../../types/appTypes";

type SchedulePageProps = {
  dark: boolean;
  schedule?: ScheduleItem[];
  approvedQuotes?: SavedQuote[];
  selectedQuoteSchedule?: SavedQuote | null;
  currentDraftSchedule?: ScheduleItem[];
  currentDraftTitle?: string;
  currentDraftSubtitle?: string;
  currentDraftStartDate?: string;
  currentDraftQuoteDate?: string;
  currentDraftProjectAddress?: string;
  currentDraftTotal?: number;
  isViewingDraftSchedule?: boolean;
  onGenerateDraftSchedule?: () => void;
  onGenerateQuoteSchedule?: (quote: SavedQuote) => void;
  onUpdateDraftScheduleTask?: (taskIndex: number, field: "startDate" | "duration", value: string) => void;
  onUpdateQuoteScheduleTask?: (quote: SavedQuote, taskIndex: number, field: "startDate" | "duration", value: string) => void;
  onUpdateDraftScheduleStartDate?: (value: string, scheduleSnapshot: ScheduleItem[]) => void;
  onUpdateQuoteScheduleStartDate?: (quote: SavedQuote, value: string, scheduleSnapshot: ScheduleItem[]) => void;
  onReorderDraftScheduleTasks?: (fromIndex: number, toIndex: number, scheduleSnapshot: ScheduleItem[]) => void;
  onReorderQuoteScheduleTasks?: (quote: SavedQuote, fromIndex: number, toIndex: number, scheduleSnapshot: ScheduleItem[]) => void;
  onOpenQuoteSchedule?: (quote: SavedQuote) => void;
  onSetQuoteProjectStatus?: (quoteId: number, status: "open" | "approved" | "ongoing" | "completed" | "invoiced") => void;
  onBackToLanding?: () => void;
};

const getScheduleCountLabel = (scheduleItems: ScheduleItem[] = []) =>
  `${scheduleItems.length} task${scheduleItems.length === 1 ? "" : "s"}`;

type PendingTaskEdit = {
  startDate?: string;
  duration?: string;
};

type TimelineInteractionState = {
  mode: "move" | "resize";
  taskIndex: number;
  startX: number;
  baseStartDate: string;
  baseDuration: number;
  containerWidth: number;
  rangeDays: number;
};

const getDateDifferenceInDays = (startDate: string, endDate: string) => {
  const normalizedStartDate = getNextBusinessDate(startDate);
  const normalizedEndDate = getNextBusinessDate(endDate);

  if (!normalizedStartDate || !normalizedEndDate) {
    return 0;
  }

  const start = new Date(`${normalizedStartDate}T00:00:00`);
  const end = new Date(`${normalizedEndDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const direction = start <= end ? 1 : -1;
  let difference = 0;
  const cursor = new Date(start);

  while ((direction > 0 && cursor < end) || (direction < 0 && cursor > end)) {
    cursor.setDate(cursor.getDate() + direction);

    if (cursor.getDay() === 0 || cursor.getDay() === 6) {
      continue;
    }

    difference += direction;
  }

  return Math.abs(difference);
};

const getLatestScheduleEndDate = (quote: SavedQuote) =>
  (quote.schedule || []).reduce((latestDate, task) => {
    const endDate = toDateInputValue(task.endDate);
    if (!endDate) return latestDate;
    return !latestDate || endDate > latestDate ? endDate : latestDate;
  }, "");

const getProjectHasStarted = (quote: SavedQuote) => {
  const startDate = toDateInputValue(quote.startDate) || toDateInputValue(quote.schedule?.[0]?.startDate);
  const today = toDateInputValue(new Date().toISOString().slice(0, 10));

  return Boolean(startDate && today && startDate <= today);
};

const getScheduleStatus = (quote: SavedQuote) => {
  const today = toDateInputValue(new Date().toISOString().slice(0, 10));
  const startDate = toDateInputValue(quote.startDate) || toDateInputValue(quote.schedule?.[0]?.startDate);
  const latestEndDate = getLatestScheduleEndDate(quote);

  if (!startDate || (today && startDate > today)) {
    return { className: "waiting", label: "Waiting To Start" };
  }

  if (today && latestEndDate && latestEndDate < today) {
    return { className: "delayed", label: "Delayed" };
  }

  return { className: "on-time", label: "On Time" };
};

export default function SchedulePage({
  dark,
  schedule = [],
  approvedQuotes = [],
  selectedQuoteSchedule = null,
  currentDraftSchedule = [],
  currentDraftTitle = "Current Quote Schedule",
  currentDraftSubtitle = "Draft schedule preview",
  currentDraftStartDate = "",
  currentDraftQuoteDate = "",
  currentDraftProjectAddress = "",
  currentDraftTotal = 0,
  isViewingDraftSchedule = false,
  onGenerateDraftSchedule,
  onGenerateQuoteSchedule,
  onUpdateDraftScheduleTask,
  onUpdateQuoteScheduleTask,
  onUpdateDraftScheduleStartDate,
  onUpdateQuoteScheduleStartDate,
  onReorderDraftScheduleTasks,
  onReorderQuoteScheduleTasks,
  onOpenQuoteSchedule,
  onSetQuoteProjectStatus,
  onBackToLanding
}: SchedulePageProps) {
  const [pendingTaskEdits, setPendingTaskEdits] = useState<Record<number, PendingTaskEdit>>({});
  const [timelineInteractionState, setTimelineInteractionState] = useState<TimelineInteractionState | null>(null);
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
  const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);
  const [isEditingScheduleStartDate, setIsEditingScheduleStartDate] = useState(false);
  const [pendingScheduleStartDate, setPendingScheduleStartDate] = useState("");
  const activeDraftSchedule = currentDraftSchedule.length ? currentDraftSchedule : schedule;
  const shouldShowDraftDetail =
    isViewingDraftSchedule || (!approvedQuotes.length && !selectedQuoteSchedule && activeDraftSchedule.length > 0);

  const scheduleItems = shouldShowDraftDetail
    ? activeDraftSchedule
    : selectedQuoteSchedule?.schedule || [];

  const detailTitle = shouldShowDraftDetail
    ? currentDraftTitle
    : selectedQuoteSchedule?.projectTitle || "Project Schedule";

  const detailSubtitle = shouldShowDraftDetail
    ? currentDraftSubtitle
    : selectedQuoteSchedule?.clientName || "No client name";

  const minimumScheduleStartDate = getNextBusinessDate(
    shouldShowDraftDetail ? currentDraftStartDate : selectedQuoteSchedule?.startDate
  );
  const currentScheduleStartDate = getNextBusinessDate(scheduleItems[0]?.startDate) || minimumScheduleStartDate || "";
  const detailQuoteDate = shouldShowDraftDetail
    ? currentDraftQuoteDate
    : selectedQuoteSchedule?.quoteDate || "";
  const detailProjectAddress = shouldShowDraftDetail
    ? currentDraftProjectAddress
    : selectedQuoteSchedule?.projectAddress || "";
  const detailQuoteTotal = shouldShowDraftDetail
    ? Number(currentDraftTotal || 0)
    : Number(selectedQuoteSchedule?.totals?.total || 0);

  const clampStartDate = (value: string) => {
    const normalizedValue = getNextBusinessDate(value);
    if (!normalizedValue) return "";
    if (!minimumScheduleStartDate) return normalizedValue;
    return normalizedValue < minimumScheduleStartDate ? minimumScheduleStartDate : normalizedValue;
  };

  const editableScheduleItems = scheduleItems.map((task, index) => {
    const pendingEdit = pendingTaskEdits[index] || {};
    const startDate = clampStartDate(pendingEdit.startDate ?? toDateInputValue(task.startDate));
    const duration = Math.max(1, Number(pendingEdit.duration ?? (task.duration || 1)));
    const endDate = getScheduleEndDate(startDate, duration);

    return {
      ...task,
      startDate,
      duration,
      endDate
    };
  });

  const timelineTasks = editableScheduleItems
    .map((task, index) => {
      if (!task.startDate || !task.endDate) return null;

      return {
        task,
        index,
        startDate: task.startDate,
        endDate: task.endDate,
        duration: task.duration
      };
    })
    .filter((task): task is NonNullable<typeof task> => Boolean(task));

  const timelineStartDate = timelineTasks.length
    ? timelineTasks.reduce(
        (earliest, entry) => (entry.startDate < earliest ? entry.startDate : earliest),
        timelineTasks[0].startDate
      )
    : "";

  const timelineEndDate = timelineTasks.length
    ? timelineTasks.reduce(
        (latest, entry) => (entry.endDate > latest ? entry.endDate : latest),
        timelineTasks[0].endDate
      )
    : "";

  const timelineRangeDays = timelineStartDate && timelineEndDate
    ? Math.max(1, getDateDifferenceInDays(timelineStartDate, timelineEndDate))
    : 1;

  useEffect(() => {
    setPendingTaskEdits({});
  }, [shouldShowDraftDetail, selectedQuoteSchedule?.id, scheduleItems]);

  useEffect(() => {
    setDraggedTaskIndex(null);
    setDragOverTaskIndex(null);
  }, [shouldShowDraftDetail, selectedQuoteSchedule?.id, scheduleItems]);

  useEffect(() => {
    setIsEditingScheduleStartDate(false);
    setPendingScheduleStartDate(currentScheduleStartDate);
  }, [shouldShowDraftDetail, selectedQuoteSchedule?.id, currentScheduleStartDate]);

  useEffect(() => {
    if (!timelineInteractionState) return;

    const handlePointerMove = (event: PointerEvent) => {
      const pixelsPerDay = timelineInteractionState.containerWidth / timelineInteractionState.rangeDays;
      if (!Number.isFinite(pixelsPerDay) || pixelsPerDay <= 0) return;

      const deltaDays = Math.round((event.clientX - timelineInteractionState.startX) / pixelsPerDay);

      setPendingTaskEdits((previous) => {
        const existingRow = previous[timelineInteractionState.taskIndex] || {};

        if (timelineInteractionState.mode === "move") {
          const nextStartDate = clampStartDate(addDaysToDate(timelineInteractionState.baseStartDate, deltaDays));
          if (existingRow.startDate === nextStartDate) return previous;

          return {
            ...previous,
            [timelineInteractionState.taskIndex]: {
              ...existingRow,
              startDate: nextStartDate
            }
          };
        }

        const nextDuration = String(Math.max(1, timelineInteractionState.baseDuration + deltaDays));
        if (existingRow.duration === nextDuration) return previous;

        return {
          ...previous,
          [timelineInteractionState.taskIndex]: {
            ...existingRow,
            duration: nextDuration
          }
        };
      });
    };

    const clearDragState = () => setTimelineInteractionState(null);
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = timelineInteractionState.mode === "resize" ? "ew-resize" : "grabbing";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", clearDragState);
    window.addEventListener("pointercancel", clearDragState);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", clearDragState);
      window.removeEventListener("pointercancel", clearDragState);
    };
  }, [timelineInteractionState]);

  const updatePendingTaskEdit = (taskIndex: number, field: "startDate" | "duration", value: string) => {
    setPendingTaskEdits((previous) => {
      const existingRow = previous[taskIndex] || {};
      const nextValue = field === "duration"
        ? sanitizeNumericInput(value, { allowDecimal: false })
        : clampStartDate(value);

      return {
        ...previous,
        [taskIndex]: {
          ...existingRow,
          [field]: nextValue
        }
      };
    });
  };

  const startTimelineInteraction = (
    event: React.PointerEvent<HTMLDivElement>,
    mode: "move" | "resize",
    taskIndex: number,
    startDate: string,
    duration: number
  ) => {
    if (!startDate) return;

    const timelineContainer = event.currentTarget.closest(".timeline-bar-wrap");
    const containerWidth = timelineContainer?.getBoundingClientRect().width || 0;
    if (!containerWidth) return;

    event.preventDefault();
    event.stopPropagation();

    setTimelineInteractionState({
      mode,
      taskIndex,
      startX: event.clientX,
      baseStartDate: startDate,
      baseDuration: Math.max(1, Number(duration || 1)),
      containerWidth,
      rangeDays: Math.max(1, timelineRangeDays)
    });
  };

  const clearPendingTaskEdit = (taskIndex: number) => {
    setPendingTaskEdits((previous) => {
      const next = { ...previous };
      delete next[taskIndex];
      return next;
    });
  };

  const handleTaskDragStart = (event: React.DragEvent<HTMLDivElement>, taskIndex: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskIndex));
    setDraggedTaskIndex(taskIndex);
    setDragOverTaskIndex(taskIndex);
  };

  const handleTaskDragOver = (event: React.DragEvent<HTMLDivElement>, taskIndex: number) => {
    event.preventDefault();

    if (dragOverTaskIndex !== taskIndex) {
      setDragOverTaskIndex(taskIndex);
    }
  };

  const handleTaskDrop = (taskIndex: number) => {
    if (draggedTaskIndex === null || draggedTaskIndex === taskIndex) {
      setDraggedTaskIndex(null);
      setDragOverTaskIndex(null);
      return;
    }

    if (shouldShowDraftDetail) {
      onReorderDraftScheduleTasks?.(draggedTaskIndex, taskIndex, editableScheduleItems);
    } else if (selectedQuoteSchedule) {
      onReorderQuoteScheduleTasks?.(selectedQuoteSchedule, draggedTaskIndex, taskIndex, editableScheduleItems);
    }

    setPendingTaskEdits({});
    setDraggedTaskIndex(null);
    setDragOverTaskIndex(null);
  };

  const clearTaskDragState = () => {
    setDraggedTaskIndex(null);
    setDragOverTaskIndex(null);
  };

  const applyTaskUpdate = (taskIndex: number, task: ScheduleItem) => {
    const pendingEdit = pendingTaskEdits[taskIndex];
    if (!pendingEdit) return;

    const originalStartDate = getNextBusinessDate(task.startDate);
    const originalDuration = String(Number(task.duration || 1));
    const nextStartDate = clampStartDate(pendingEdit.startDate ?? originalStartDate);
    const nextDuration = pendingEdit.duration ?? originalDuration;
    const hasStartDateChange = nextStartDate !== originalStartDate;
    const hasDurationChange = nextDuration !== originalDuration;

    if (shouldShowDraftDetail) {
      if (hasStartDateChange) {
        onUpdateDraftScheduleTask?.(taskIndex, "startDate", nextStartDate);
      }
      if (hasDurationChange) {
        onUpdateDraftScheduleTask?.(taskIndex, "duration", nextDuration);
      }
    } else if (selectedQuoteSchedule) {
      if (hasStartDateChange) {
        onUpdateQuoteScheduleTask?.(selectedQuoteSchedule, taskIndex, "startDate", nextStartDate);
      }
      if (hasDurationChange) {
        onUpdateQuoteScheduleTask?.(selectedQuoteSchedule, taskIndex, "duration", nextDuration);
      }
    }

    clearPendingTaskEdit(taskIndex);
  };

  const applyScheduleStartDateUpdate = () => {
    const nextStartDate = getNextBusinessDate(pendingScheduleStartDate);
    if (!nextStartDate || !editableScheduleItems.length) return;

    if (shouldShowDraftDetail) {
      onUpdateDraftScheduleStartDate?.(nextStartDate, editableScheduleItems);
    } else if (selectedQuoteSchedule) {
      onUpdateQuoteScheduleStartDate?.(selectedQuoteSchedule, nextStartDate, editableScheduleItems);
    }

    setPendingTaskEdits({});
    setIsEditingScheduleStartDate(false);
  };

  const selectedQuoteScheduleStatus = selectedQuoteSchedule ? getScheduleStatus(selectedQuoteSchedule) : null;
  const selectedQuoteHasStarted = Boolean(selectedQuoteSchedule && getProjectHasStarted(selectedQuoteSchedule));
  const canShowSelectedCompleteAction =
    Boolean(selectedQuoteSchedule) && !["completed", "invoiced"].includes(selectedQuoteSchedule?.status || "");

  if (selectedQuoteSchedule || shouldShowDraftDetail) {
    return (
      <>
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>{detailTitle}</h3>
              <p className="row-subtitle">{detailSubtitle}</p>
            </div>
            <div className="button-row">
              {shouldShowDraftDetail && onGenerateDraftSchedule ? (
                <Button variant="secondary" onClick={onGenerateDraftSchedule}>
                  Regenerate Schedule
                </Button>
              ) : null}
              {!shouldShowDraftDetail && selectedQuoteSchedule && onGenerateQuoteSchedule ? (
                <Button variant="secondary" onClick={() => onGenerateQuoteSchedule(selectedQuoteSchedule)}>
                  Generate Schedule
                </Button>
              ) : null}
              {onBackToLanding ? (
                <Button variant="secondary" onClick={onBackToLanding}>
                  Back To Approved Quotes
                </Button>
              ) : null}
            </div>
          </div>

          {detailQuoteDate || currentScheduleStartDate || detailProjectAddress || scheduleItems.length ? (
            <div className="details-list">
              <div><strong>Quote Date:</strong> {detailQuoteDate || "Not set"}</div>
              {selectedQuoteScheduleStatus ? (
                <div>
                  <strong>Schedule Status:</strong>{" "}
                  <span className={`status-pill ${selectedQuoteScheduleStatus.className}`}>
                    {selectedQuoteScheduleStatus.label}
                  </span>
                </div>
              ) : null}
              <div className="schedule-detail-row">
                <div><strong>Start Date:</strong> {currentScheduleStartDate || "Not set"}</div>
                {scheduleItems.length ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setPendingScheduleStartDate(currentScheduleStartDate);
                      setIsEditingScheduleStartDate((previous) => !previous);
                    }}
                  >
                    Edit Start Date
                  </Button>
                ) : null}
              </div>
              {isEditingScheduleStartDate ? (
                <div className="schedule-start-date-editor">
                  <label className="schedule-field">
                    <span>Schedule Start Date</span>
                    <BusinessDatePicker
                      dark={dark}
                      value={pendingScheduleStartDate}
                      min={minimumScheduleStartDate || undefined}
                      autoOpenOnMount
                      onChange={setPendingScheduleStartDate}
                    />
                  </label>
                  <div className="button-row schedule-start-date-actions">
                    <Button variant="secondary" onClick={applyScheduleStartDateUpdate}>
                      Update Start Date
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPendingScheduleStartDate(currentScheduleStartDate);
                        setIsEditingScheduleStartDate(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              <div><strong>Project Address:</strong> {detailProjectAddress || "Not set"}</div>
              <div><strong>Quote Total:</strong> {formatMoney(detailQuoteTotal)}</div>
            </div>
          ) : null}
        </Card>

        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Schedule Tasks</h3>
              <div className="row-subtitle">
                {getScheduleCountLabel(scheduleItems)} • Drag a task title up or down to reorder the schedule.
              </div>
            </div>
            {!shouldShowDraftDetail && selectedQuoteSchedule && canShowSelectedCompleteAction ? (
              <Button
                disabled={!selectedQuoteHasStarted}
                title={selectedQuoteHasStarted ? "Mark this project completed" : "Project has not started yet"}
                onClick={() => onSetQuoteProjectStatus?.(selectedQuoteSchedule.id, "completed")}
              >
                Mark Completed
              </Button>
            ) : null}
          </div>

          {scheduleItems.length === 0 ? (
            <p>No schedule has been generated for this quote yet.</p>
          ) : (
            <div className="schedule-list">
              {scheduleItems.map((task, index) => {
                const originalStartDate = getNextBusinessDate(task.startDate);
                const originalDuration = String(Number(task.duration || 1));
                const editableTask = editableScheduleItems[index];
                const nextStartDate = editableTask?.startDate || originalStartDate;
                const nextDuration = String(Number(editableTask?.duration || originalDuration));
                const hasRowChanges =
                  nextStartDate !== originalStartDate || nextDuration !== originalDuration;
                const previewEndDate = editableTask?.endDate || getScheduleEndDate(nextStartDate, nextDuration || task.duration);

                return (
                  <div
                    key={`${task.name}-${index}`}
                    className={[
                      "schedule-card",
                      dragOverTaskIndex === index && draggedTaskIndex !== index ? "drag-over" : "",
                      draggedTaskIndex === index ? "is-dragging" : ""
                    ].filter(Boolean).join(" ")}
                    onDragOver={(event) => handleTaskDragOver(event, index)}
                    onDrop={() => handleTaskDrop(index)}
                  >
                    <div
                      className="schedule-card-main draggable"
                      draggable
                      onDragStart={(event) => handleTaskDragStart(event, index)}
                      onDragEnd={clearTaskDragState}
                    >
                      <div className="schedule-drag-hint">Drag To Reorder</div>
                      <div className="row-title">{task.name}</div>
                      <div className="row-subtitle schedule-task-meta">{task.category} • {nextDuration} day(s)</div>
                    </div>
                    <div className="schedule-card-side">
                      <div className="schedule-edit-grid">
                        <label className="schedule-field">
                          <span>Start Date</span>
                          <BusinessDatePicker
                            dark={dark}
                            value={nextStartDate}
                            min={minimumScheduleStartDate || undefined}
                            onChange={(value) => updatePendingTaskEdit(index, "startDate", value)}
                          />
                        </label>

                        <label className="schedule-field">
                          <span>Days</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={nextDuration}
                            onChange={(event) => updatePendingTaskEdit(index, "duration", event.target.value)}
                          />
                        </label>
                      </div>

                      <div className="schedule-dates">
                        <div><strong>Start:</strong> {nextStartDate || "Not set"}</div>
                        <div><strong>End:</strong> {previewEndDate || "Not set"}</div>
                      </div>

                      {hasRowChanges ? (
                        <div className="schedule-row-actions">
                          <Button variant="secondary" onClick={() => applyTaskUpdate(index, task)}>
                            Update
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Timeline</h3>
              <p className="row-subtitle">
                Drag the task name up or down to reorder. Drag a bar to move it, or drag the right edge to make it longer or shorter.
              </p>
            </div>
          </div>
          {scheduleItems.length === 0 ? (
            <p>No tasks to display.</p>
          ) : (
            <div className="timeline-list">
              {timelineTasks.map((entry) => {
                const startOffsetDays = getDateDifferenceInDays(timelineStartDate, entry.startDate);
                const durationDays = Math.max(1, getDateDifferenceInDays(entry.startDate, entry.endDate));
                const leftPercent = (startOffsetDays / timelineRangeDays) * 100;
                const widthPercent = Math.max((durationDays / timelineRangeDays) * 100, 4);

                return (
                  <div
                    key={`${entry.task.name}-timeline-${entry.index}`}
                    className={[
                      "timeline-row",
                      dragOverTaskIndex === entry.index && draggedTaskIndex !== entry.index ? "drag-over" : "",
                      draggedTaskIndex === entry.index ? "is-dragging" : ""
                    ].filter(Boolean).join(" ")}
                    onDragOver={(event) => handleTaskDragOver(event, entry.index)}
                    onDrop={() => handleTaskDrop(entry.index)}
                  >
                    <div
                      className="timeline-label draggable"
                      draggable
                      onDragStart={(event) => handleTaskDragStart(event, entry.index)}
                      onDragEnd={clearTaskDragState}
                    >
                      <div className="schedule-drag-hint">Drag To Reorder</div>
                      <div>{entry.task.name}</div>
                    </div>
                    <div className="timeline-bar-wrap">
                      <div
                        className={[
                          "timeline-bar",
                          timelineInteractionState?.taskIndex === entry.index ? "is-dragging" : "",
                          timelineInteractionState?.taskIndex === entry.index && timelineInteractionState?.mode === "resize"
                            ? "is-resizing"
                            : ""
                        ].filter(Boolean).join(" ")}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.min(widthPercent, 100 - leftPercent)}%`
                        }}
                        onPointerDown={(event) =>
                          startTimelineInteraction(event, "move", entry.index, entry.startDate, entry.duration)
                        }
                        title="Drag to move this task"
                      >
                        <div
                          className="timeline-resize-handle"
                          onPointerDown={(event) =>
                            startTimelineInteraction(event, "resize", entry.index, entry.startDate, entry.duration)
                          }
                          title="Drag to change duration"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Schedule Overview</h3>
            <p className="row-subtitle">
              Review approved quotes with confirmed start dates, then open a quote to view its full schedule.
            </p>
          </div>
          {onGenerateDraftSchedule ? (
            <Button variant="secondary" onClick={onGenerateDraftSchedule}>
              Generate Schedule
            </Button>
          ) : null}
        </div>
      </Card>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Active Quote Schedules</h3>
            <p className="row-subtitle">
              Each active quote below shows its planned start date, schedule status, and completion action once the project has started.
            </p>
          </div>
        </div>

        {approvedQuotes.length === 0 ? (
          <div className="quotes-empty-state">
            <p>No active quote schedules yet.</p>
          </div>
        ) : (
          <div className="list-table">
            {approvedQuotes.map((quote) => {
              const scheduleStatus = getScheduleStatus(quote);
              return (
                <div key={quote.id} className="list-row quote-overview-row">
                  <div className="quote-overview-main">
                    <div className="quote-overview-heading">
                      <div className="row-title">{quote.projectTitle}</div>
                      <span className={`status-pill ${scheduleStatus.className}`}>{scheduleStatus.label}</span>
                    </div>
                    <div className="row-subtitle">
                      {formatQuoteReferenceNumber(quote)} • {quote.clientName || "No client name"} • {quote.startDate ? `Start Date: ${quote.startDate}` : "No start date"}
                    </div>
                  </div>

                  <div className="quote-overview-side">
                    <div className="quote-overview-total">
                      {quote.schedule?.length ? getScheduleCountLabel(quote.schedule) : "No schedule yet"}
                    </div>
                    <div className="button-row quote-overview-actions">
                      {onGenerateQuoteSchedule ? (
                        <Button
                          variant="secondary"
                          onClick={() => onGenerateQuoteSchedule(quote)}
                        >
                          Generate Schedule
                        </Button>
                      ) : null}
                      <Button
                        variant="secondary"
                        onClick={() => onOpenQuoteSchedule?.(quote)}
                      >
                        View Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
