import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatDateForInput, getNextBusinessDate, toDateInputValue } from "../../utils/appUtils";

type BusinessDatePickerProps = {
  dark: boolean;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  autoOpenOnMount?: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isWeekendValue = (value: string) => {
  const normalizedValue = toDateInputValue(value);
  if (!normalizedValue) return false;

  const date = new Date(`${normalizedValue}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
};

const getMonthStartDate = (value: string) => {
  const normalizedValue = getNextBusinessDate(value) || toDateInputValue(value) || formatDateForInput(new Date());
  const monthStart = new Date(`${normalizedValue}T00:00:00`);
  monthStart.setDate(1);
  return monthStart;
};

const getMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(date);

const buildCalendarDays = (monthStartDate: Date) => {
  const gridStartDate = new Date(monthStartDate);
  gridStartDate.setDate(monthStartDate.getDate() - monthStartDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const dayDate = new Date(gridStartDate);
    dayDate.setDate(gridStartDate.getDate() + index);

    return {
      value: formatDateForInput(dayDate),
      label: dayDate.getDate(),
      isCurrentMonth: dayDate.getMonth() === monthStartDate.getMonth(),
      isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6
    };
  });
};

export default function BusinessDatePicker({
  dark,
  value,
  onChange,
  min = "",
  placeholder = "Select date",
  autoOpenOnMount = false
}: BusinessDatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const normalizedValue = getNextBusinessDate(value) || toDateInputValue(value);
  const normalizedMin = getNextBusinessDate(min) || toDateInputValue(min);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonthDate, setViewMonthDate] = useState(() => getMonthStartDate(normalizedValue || normalizedMin || ""));

  useEffect(() => {
    if (isOpen) return;
    setViewMonthDate(getMonthStartDate(normalizedValue || normalizedMin || ""));
  }, [isOpen, normalizedMin, normalizedValue]);

  useEffect(() => {
    if (!autoOpenOnMount) return;
    setIsOpen(true);
  }, [autoOpenOnMount]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const calendarDays = useMemo(() => buildCalendarDays(viewMonthDate), [viewMonthDate]);

  return (
    <div className="schedule-date-picker" ref={containerRef}>
      <button
        type="button"
        className={[
          "input",
          "schedule-date-picker-trigger",
          dark ? "dark" : "",
          normalizedValue ? "" : "is-placeholder"
        ].filter(Boolean).join(" ")}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span>{normalizedValue || placeholder}</span>
        <span className="schedule-date-picker-icon" aria-hidden="true">Calendar</span>
      </button>

      {isOpen ? (
        <div className={`schedule-date-picker-popover ${dark ? "dark" : ""}`.trim()}>
          <div className="schedule-date-picker-header">
            <button
              type="button"
              className="button secondary schedule-date-picker-nav"
              onClick={() => {
                const previousMonth = new Date(viewMonthDate);
                previousMonth.setMonth(previousMonth.getMonth() - 1);
                previousMonth.setDate(1);
                setViewMonthDate(previousMonth);
              }}
            >
              Prev
            </button>
            <div className="schedule-date-picker-month">{getMonthLabel(viewMonthDate)}</div>
            <button
              type="button"
              className="button secondary schedule-date-picker-nav"
              onClick={() => {
                const nextMonth = new Date(viewMonthDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                nextMonth.setDate(1);
                setViewMonthDate(nextMonth);
              }}
            >
              Next
            </button>
          </div>

          <div className="schedule-date-picker-weekdays">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={label}
                className={[
                  "schedule-date-picker-weekday",
                  index === 0 || index === 6 ? "weekend" : ""
                ].filter(Boolean).join(" ")}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="schedule-date-picker-grid">
            {calendarDays.map((day) => {
              const isDisabled = day.isWeekend || Boolean(normalizedMin && day.value < normalizedMin);
              const isSelected = normalizedValue === day.value;

              return (
                <button
                  key={day.value}
                  type="button"
                  className={[
                    "schedule-date-picker-day",
                    day.isCurrentMonth ? "" : "outside-month",
                    day.isWeekend ? "weekend" : "",
                    isSelected ? "selected" : "",
                    isDisabled ? "disabled" : ""
                  ].filter(Boolean).join(" ")}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(day.value);
                    setIsOpen(false);
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          <div className="schedule-date-picker-note">
            Weekend dates are unavailable.
          </div>
        </div>
      ) : null}
    </div>
  );
}
