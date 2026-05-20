export const APP_STYLES = `
  * { box-sizing: border-box; }
  html {
    background: #f3f4f6;
  }
  body {
    margin: 0;
    font-family: Inter, Arial, sans-serif;
    min-height: 100vh;
    min-height: 100dvh;
    background: #f3f4f6;
  }
  #root {
    min-height: 100vh;
    min-height: 100dvh;
  }

  .app-shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: 260px 1fr;
    background: #f3f4f6;
    color: #111827;
  }
  .app-shell.navigation-closed {
    grid-template-columns: 72px 1fr;
  }
  .app-shell.dark {
    background: #0f172a;
    color: #e5e7eb;
  }
  html:has(.app-shell.dark),
  body:has(.app-shell.dark) {
    background: #0f172a;
  }
  .app-notification {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 1100;
    width: min(420px, calc(100vw - 36px));
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e3a8a;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
    font-size: 0.95rem;
    line-height: 1.4;
  }
  .app-notification.success {
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #166534;
  }
  .app-notification.warning {
    border-color: #fde68a;
    background: #fffbeb;
    color: #92400e;
  }
  .app-notification.error {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }
  .app-notification-close {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.08);
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  .app-shell.dark + .app-notification {
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  }

  .sidebar {
    padding: 24px 0;
    border-right: 1px solid #d1d5db;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .app-shell.navigation-closed .sidebar {
    align-items: center;
    padding: 20px 0;
  }
  .app-shell.dark .sidebar {
    background: #111827;
    border-right-color: #374151;
  }
  .sidebar-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 0 24px;
  }
  .app-shell.navigation-closed .sidebar-header {
    justify-content: center;
    width: 100%;
    padding: 0 12px;
  }
  .sidebar-title { margin: 0; font-size: 1.5rem; }
  .sidebar-subtitle { margin: 8px 0 0; color: #6b7280; line-height: 1.4; }
  .app-shell.dark .sidebar-subtitle { color: #9ca3af; }
  .sidebar-toggle {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    background: #ffffff;
    color: #111827;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
  }
  .sidebar-toggle:hover {
    border-color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
  }
  .app-shell.dark .sidebar-toggle {
    border-color: #4b5563;
    background: #0f172a;
    color: #e5e7eb;
  }

  .nav-list { display: flex; flex-direction: column; gap: 4px; padding: 0 12px; }
  .nav-item {
    width: 100%; text-align: left; padding: 10px 16px; border-radius: 8px;
    border: 1px solid transparent; background: transparent; color: inherit;
    cursor: pointer; font-size: 0.95rem;
  }
  .nav-item:hover { background: rgba(37, 99, 235, 0.08); }
  .nav-item.active { background: #2563eb; color: white; }

  .main-content { padding: 24px; }
  .page-header { margin-bottom: 24px; }
  .page-header h1 { margin: 0 0 6px; font-size: 2rem; }
  .page-header p { margin: 0; color: #6b7280; }
  .app-shell.dark .page-header p { color: #9ca3af; }

  .card {
    background: white; border: 1px solid #e5e7eb; border-radius: 16px;
    padding: 20px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05); margin-bottom: 20px;
  }
  .card.dark { background: #111827; border-color: #374151; box-shadow: none; }
  .card h3 { margin-top: 0; margin-bottom: 16px; }

  .grid { display: grid; gap: 12px; }
  .grid.three-col { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid.price-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .grid.template-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .grid.customer-address-row { grid-template-columns: minmax(0, 2fr) minmax(140px, 0.8fr); }
  .grid.contractor-rate-row { grid-template-columns: minmax(0, 1fr) minmax(140px, 0.6fr); }
  .span-two { grid-column: span 1; }
  
 .contractor-trade-onboarding {
  border: none;
  background: transparent;
  padding: 0;
}

.app-shell.dark .contractor-trade-onboarding {
  border: none;
  background: transparent;
}

.contractor-trade-field-label {
  margin-bottom: 4px;
  font-weight: 700;
}

.contractor-trade-dropdown {
  position: relative;
}

.contractor-trade-dropdown summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.95rem;
  list-style: none;
}

.contractor-trade-dropdown summary::-webkit-details-marker {
  display: none;
}

.app-shell.dark .contractor-trade-dropdown summary {
  border-color: #4b5563;
  background: #0f172a;
  color: #e5e7eb;
}

.contractor-trade-dropdown[open] {
  z-index: 40;
}

.contractor-trade-dropdown[open] summary {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16);
}

.contractor-trade-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 360px;
  overflow: auto;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.app-shell.dark .contractor-trade-menu {
  border-color: #374151;
  background: #111827;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.contractor-trade-actions {
  padding: 12px;
  margin-bottom: 0;
  border-bottom: 1px solid #e5e7eb;
}

.app-shell.dark .contractor-trade-actions {
  border-bottom-color: #374151;
}

.contractor-trade-group {
  padding: 12px;
  margin-top: 0;
}

.contractor-trade-group + .contractor-trade-group {
  border-top: 1px solid #e5e7eb;
}

.app-shell.dark .contractor-trade-group + .contractor-trade-group {
  border-top-color: #374151;
}

.contractor-trade-group-title {
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #6b7280;
}

.app-shell.dark .contractor-trade-group-title {
  color: #9ca3af;
}

.contractor-trade-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contractor-trade-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
}

.app-shell.dark .contractor-trade-list-row {
  border-color: #374151;
  background: #111827;
}

.contractor-trade-list-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.contractor-trade-list-option input {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  flex-shrink: 0;
}

.contractor-trade-list-option span {
  overflow-wrap: anywhere;
}

.contractor-trade-only {
  border: none;
  border-radius: 999px;
  background: #e5e7eb;
  color: #111827;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 8px;
  flex-shrink: 0;
}

.contractor-trade-only:hover {
  background: #d1d5db;
}

.app-shell.dark .contractor-trade-only {
  background: #374151;
  color: #f9fafb;
}

.app-shell.dark .contractor-trade-only:hover {
  background: #4b5563;
}

.contractor-trade-helper {
  padding: 0 12px 12px;
  margin: 0;
}

  .stats-grid {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px;
  }
  .stat-label { font-size: 0.9rem; color: #6b7280; margin-bottom: 8px; }
  .app-shell.dark .stat-label { color: #9ca3af; }
  .stat-value { font-size: 1.6rem; font-weight: 700; }
  .analysis-metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .analysis-metric-card,
  .analysis-status-item,
  .analysis-insight {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    padding: 12px;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .analysis-metric-card {
    min-height: 86px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }
  .analysis-metric-card span,
  .analysis-status-item span {
    color: #6b7280;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.35;
  }
  .analysis-metric-card strong {
    font-size: 1.2rem;
    line-height: 1.2;
  }
  .analysis-clickable-tile,
  .analysis-row-button,
  .analysis-table-button {
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }
  .analysis-clickable-tile:hover,
  .analysis-row-button:hover,
  .analysis-table-button:hover {
    border-color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);
  }
  .analysis-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .analysis-detail-primary {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .analysis-detail-primary span {
    color: #6b7280;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .analysis-detail-primary strong {
    line-height: 1.35;
  }
  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  .analysis-list,
  .analysis-insight-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .analysis-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f3f4f6;
    background: transparent;
    color: inherit;
    font: inherit;
    width: 100%;
  }
  .analysis-row span {
    color: #4b5563;
  }
  .analysis-row strong {
    text-align: right;
  }
  .analysis-table {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .analysis-table-row {
    display: grid;
    grid-template-columns: 1.3fr repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
    background: transparent;
    color: inherit;
    font: inherit;
    width: 100%;
    text-align: left;
  }
  .analysis-table-header {
    color: #6b7280;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .analysis-status-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .analysis-status-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .analysis-insight {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .app-shell.dark .analysis-metric-card,
  .app-shell.dark .analysis-status-item,
  .app-shell.dark .analysis-insight,
  .app-shell.dark .analysis-detail-primary {
    border-color: #374151;
    background: #0f172a;
  }
  .app-shell.dark .analysis-metric-card span,
  .app-shell.dark .analysis-status-item span,
  .app-shell.dark .analysis-table-header {
    color: #9ca3af;
  }
  .app-shell.dark .analysis-row,
  .app-shell.dark .analysis-table-row {
    border-bottom-color: #1f2937;
  }
  .app-shell.dark .analysis-row span {
    color: #d1d5db;
  }
  .app-shell.dark .analysis-detail-primary span {
    color: #9ca3af;
  }
  .app-shell.dark .analysis-clickable-tile:hover,
  .app-shell.dark .analysis-row-button:hover,
  .app-shell.dark .analysis-table-button:hover {
    border-color: #60a5fa;
    background: rgba(37, 99, 235, 0.18);
  }

  .two-col-layout {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px;
  }
  .details-list, .totals-list, .settings-group, .button-stack, .schedule-list,
  .timeline-list, .list-table { display: flex; flex-direction: column; gap: 12px; }
  .button-stack.compact { gap: 8px; }
  .button-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .landing-action-bar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .landing-action-bar .button {
    min-height: 48px;
    width: 100%;
    font-weight: 700;
  }
  .dashboard-metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .dashboard-metric-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 62px;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #f8fafc;
    color: #111827;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }
  .dashboard-metric-button:hover {
    border-color: #2563eb;
    background: #eff6ff;
    transform: translateY(-1px);
  }
  .dashboard-metric-button span {
    font-size: 0.9rem;
    font-weight: 700;
    color: #4b5563;
  }
  .dashboard-metric-button strong {
    font-size: 1.8rem;
    line-height: 1;
  }
  .dashboard-job-list,
  .dashboard-detail-panel {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #e5e7eb;
  }
  .dashboard-job-list h4,
  .dashboard-detail-panel h4 {
    margin: 0;
  }
  .app-shell.dark .dashboard-metric-button {
    border-color: #374151;
    background: #0f172a;
    color: #f9fafb;
  }
  .app-shell.dark .dashboard-metric-button:hover {
    border-color: #60a5fa;
    background: rgba(37, 99, 235, 0.18);
  }
  .app-shell.dark .dashboard-metric-button span {
    color: #d1d5db;
  }
  .app-shell.dark .dashboard-job-list,
  .app-shell.dark .dashboard-detail-panel {
    border-top-color: #374151;
  }
  .section-header {
    display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 16px;
  }
  .customer-notes-section {
    margin-top: 16px;
  }
  .customer-notes-label {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .customer-notes-input {
    min-height: 140px;
    resize: vertical;
    font: inherit;
  }
  .customer-directory-row.active,
  .contractor-directory-row.active {
    border-color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
  }
  .customer-notes-display {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
  .customer-notes-display h4 {
    margin: 0 0 8px;
  }
  .customer-notes-display p {
    margin: 0;
    line-height: 1.5;
  }
  .app-shell.dark .customer-notes-display {
    border-top-color: #374151;
  }
  .app-shell.dark .customer-directory-expanded,
  .app-shell.dark .contractor-directory-expanded {
    border-top-color: #374151;
  }
  .customer-action-row {
    margin-top: 16px;
  }
  .customer-card-work-summary {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .customer-card-work-item {
    min-height: 64px;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: inherit;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    text-align: left;
  }
  .customer-card-work-item span {
    color: #6b7280;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .customer-card-work-item strong {
    font-size: 1.25rem;
  }
  .customer-card-work-toggle {
    cursor: pointer;
  }
  .customer-card-work-toggle:hover {
    border-color: #2563eb;
    background: rgba(37, 99, 235, 0.08);
  }
  .customer-job-slider {
    min-height: 64px;
    padding: 4px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
  }
  .customer-job-slider-option {
    border: none;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    text-align: left;
  }
  .customer-job-slider-option span {
    color: #6b7280;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .customer-job-slider-option strong {
    font-size: 1.1rem;
  }
  .customer-job-slider-option.ongoing:hover,
  .customer-job-slider-option.ongoing.active {
    background: rgba(34, 197, 94, 0.18);
  }
  .customer-job-slider-option.previous:hover,
  .customer-job-slider-option.previous.active {
    background: rgba(245, 158, 11, 0.2);
  }
  .customer-card-job-sections {
    margin-top: 18px;
    display: grid;
    gap: 18px;
  }
  .customer-card-job-sections h4 {
    margin: 0;
  }
  .customer-card-job-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .customer-card-job-row {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    color: inherit;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    text-align: left;
  }
  .customer-card-job-row:hover {
    border-color: #2563eb;
  }
  .customer-card-job-row > span:first-child {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
  }
  .customer-card-job-row > span:first-child span {
    color: #6b7280;
    font-size: 0.84rem;
  }
  .customer-card-job-row > span:last-child {
    white-space: nowrap;
    font-weight: 700;
  }
  .app-shell.dark .customer-card-work-item {
    border-color: #374151;
    background: #0f172a;
  }
  .app-shell.dark .customer-job-slider {
    border-color: #374151;
    background: #0f172a;
  }
  .app-shell.dark .customer-card-work-item span,
  .app-shell.dark .customer-job-slider-option span,
  .app-shell.dark .customer-card-job-row > span:first-child span {
    color: #9ca3af;
  }
  .app-shell.dark .customer-card-work-toggle:hover {
    border-color: #60a5fa;
    background: rgba(37, 99, 235, 0.18);
  }
  .app-shell.dark .customer-card-job-row {
    border-color: #374151;
    background: #111827;
  }
  .app-shell.dark .customer-card-job-row:hover {
    border-color: #60a5fa;
  }

  .input, .select {
    width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #d1d5db;
    background: white; color: #111827; font-size: 0.95rem;
  }
  .app-shell.dark .input, .app-shell.dark .select {
    background: #0f172a; border-color: #4b5563; color: #e5e7eb;
  }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .input:focus, .select:focus {
    outline: 2px solid rgba(37, 99, 235, 0.25); border-color: #2563eb;
  }

  .button {
    border: none; border-radius: 10px; padding: 10px 14px; font-size: 0.95rem;
    cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .button:hover { transform: translateY(-1px); }
  .button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .button:disabled:hover {
    transform: none;
  }
  .button.primary { background: #2563eb; color: white; }
  .button.secondary { background: #e5e7eb; color: #111827; }
  .app-shell.dark .button.secondary { background: #374151; color: #f9fafb; }
  .button.danger { background: #dc2626; color: white; }

  .quote-header-row, .quote-row.advanced {
    display: grid; grid-template-columns: 2.2fr 0.8fr 1fr 1fr 1fr 0.9fr 1fr auto;
    gap: 12px; align-items: start;
  }
  .quote-header-row {
    font-size: 0.85rem; font-weight: 700; color: #6b7280; padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb; margin-bottom: 12px;
  }
  .app-shell.dark .quote-header-row { color: #9ca3af; border-bottom-color: #374151; }
  .quote-row.advanced { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
  .app-shell.dark .quote-row.advanced { border-bottom-color: #1f2937; }
  .room-name-row {
    display: grid;
    grid-template-columns: 2.2fr 0.8fr 1fr 1fr 1fr 0.9fr 1fr auto;
    gap: 12px;
    padding: 12px 0 0;
  }
  .room-name-actions {
    grid-column: 8;
    display: flex;
    justify-content: flex-end;
  }
  .room-section-header {
    margin-top: 12px;
  }
  .room-name-input {
    grid-column: 1;
    max-width: none;
  }
  .room-template-editor {
    margin-top: 16px;
  }
  .room-template-list-row.editing {
    align-items: stretch;
    padding: 20px 0;
  }
  .room-template-inline-editor {
    width: 100%;
  }
  .room-template-inline-header {
    margin-bottom: 14px;
  }
  .room-template-inline-header h4 {
    margin: 0;
    font-size: 1rem;
  }
  .room-template-editor-header,
  .room-template-editor-row {
    display: grid;
    grid-template-columns: 2fr 0.75fr 1fr 1fr 1fr 0.9fr 0.8fr auto;
    gap: 12px;
    align-items: start;
  }
  .room-template-editor-header {
    font-size: 0.85rem;
    font-weight: 700;
    color: #6b7280;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }
  .app-shell.dark .room-template-editor-header {
    color: #9ca3af;
    border-bottom-color: #374151;
  }
  .room-template-editor-row {
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .app-shell.dark .room-template-editor-row {
    border-bottom-color: #1f2937;
  }
  .saved-room-templates-table {
    margin-top: 12px;
  }
  .saved-room-templates-header,
  .saved-room-templates-row {
    display: grid;
    grid-template-columns: 2fr 0.7fr 1fr;
    gap: 12px;
    align-items: center;
  }
  .saved-room-templates-header {
    font-size: 0.85rem;
    font-weight: 700;
    color: #6b7280;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }
  .app-shell.dark .saved-room-templates-header {
    color: #9ca3af;
    border-bottom-color: #374151;
  }
  .saved-room-templates-row {
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .app-shell.dark .saved-room-templates-row {
    border-bottom-color: #1f2937;
  }
  .template-button-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
  }
  .template-button-card {
    border: 1px solid #d1d5db;
    border-radius: 10px;
    background: #ffffff;
    color: #111827;
    padding: 10px 12px;
    text-align: left;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .template-button-card:hover {
    transform: translateY(-1px);
    border-color: #2563eb;
    background: #eff6ff;
  }
  .template-button-card.dark {
    background: #111827;
    color: #f9fafb;
    border-color: #374151;
  }
  .template-button-card.dark:hover {
    background: #172554;
    border-color: #60a5fa;
  }
  .template-button-title {
    font-weight: 700;
    font-size: 0.92rem;
    line-height: 1.25;
  }
  .room-template-empty-note {
    margin-top: 12px;
  }
  .item-picker { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .money-cell { padding: 10px 0; font-weight: 600; }
  .quote-items-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
  .app-shell.dark .quote-items-footer { border-top-color: #374151; }
  .quote-template-actions {
    align-items: stretch;
    min-width: 190px;
  }
  .quotes-empty-state {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
  }
  .quote-overview-row {
    align-items: center;
  }
  .quote-overview-main,
  .quote-overview-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .quote-overview-side {
    align-items: flex-end;
  }
  .quote-overview-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .quote-overview-total {
    font-weight: 700;
  }
  .quote-overview-actions {
    justify-content: flex-end;
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
  }
  .status-pill.open {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .status-pill.ongoing {
    background: #fef3c7;
    color: #b45309;
  }
  .status-pill.waiting {
    background: #ffedd5;
    color: #c2410c;
  }
  .status-pill.on-time {
    background: #dcfce7;
    color: #166534;
  }
  .status-pill.early {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .status-pill.delayed {
    background: #fee2e2;
    color: #b91c1c;
  }
  .status-pill.approved {
    background: #dcfce7;
    color: #166534;
  }
  .status-pill.completed {
    background: #ede9fe;
    color: #6d28d9;
  }
  .status-pill.invoiced {
    background: #e0f2fe;
    color: #0369a1;
  }
  .status-pill.active {
    background: #dcfce7;
    color: #166534;
  }
  .status-pill.inactive {
    background: #e5e7eb;
    color: #374151;
  }
  .app-shell.dark .status-pill.open {
    background: rgba(37, 99, 235, 0.2);
    color: #93c5fd;
  }
  .app-shell.dark .status-pill.ongoing {
    background: rgba(245, 158, 11, 0.2);
    color: #fcd34d;
  }
  .app-shell.dark .status-pill.waiting {
    background: rgba(249, 115, 22, 0.2);
    color: #fdba74;
  }
  .app-shell.dark .status-pill.on-time {
    background: rgba(34, 197, 94, 0.2);
    color: #86efac;
  }
  .app-shell.dark .status-pill.early {
    background: rgba(37, 99, 235, 0.2);
    color: #93c5fd;
  }
  .app-shell.dark .status-pill.delayed {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }
  .app-shell.dark .status-pill.approved {
    background: rgba(34, 197, 94, 0.2);
    color: #86efac;
  }
  .app-shell.dark .status-pill.completed {
    background: rgba(124, 58, 237, 0.2);
    color: #c4b5fd;
  }
  .app-shell.dark .status-pill.invoiced {
    background: rgba(14, 165, 233, 0.2);
    color: #7dd3fc;
  }
  .app-shell.dark .status-pill.active {
    background: rgba(34, 197, 94, 0.2);
    color: #86efac;
  }
  .app-shell.dark .status-pill.inactive {
    background: rgba(107, 114, 128, 0.25);
    color: #d1d5db;
  }
  .directory-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .totals-list > div, .schedule-card, .list-row, .timeline-row {
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
  }
  .customer-directory-row,
  .contractor-directory-row {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  }
  .customer-directory-summary,
  .contractor-directory-summary {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 12px;
    width: 100%;
  }
  .customer-directory-trigger,
  .contractor-directory-trigger {
    border: none;
    background: transparent;
    color: inherit;
    padding: 0;
    text-align: left;
    cursor: pointer;
    width: 100%;
    align-self: stretch;
  }
  .quote-title-button,
  .inline-link-button {
    border: none;
    background: transparent;
    color: inherit;
    padding: 0;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }
  .quote-title-button {
    font-weight: 700;
  }
  .inline-link-button {
    color: #2563eb;
    font-weight: 700;
  }
  .quote-title-button:hover,
  .inline-link-button:hover {
    text-decoration: underline;
  }
  .app-shell.dark .inline-link-button {
    color: #93c5fd;
  }
  .schedule-title-link {
    display: block;
    margin: 0 0 6px;
    font-size: 1.17rem;
    line-height: 1.2;
  }
  .schedule-quote-title-link {
    width: auto;
  }
  .customer-directory-expanded,
  .contractor-directory-expanded {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    width: 100%;
  }
  .grand-total {
    margin-top: 8px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 1.1rem;
  }
  .app-shell.dark .grand-total { border-top-color: #374151; }
  .list-row { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
  .app-shell.dark .list-row { border-bottom-color: #1f2937; }
  .list-row.clickable { cursor: pointer; }
  .list-row.clickable:hover { opacity: 0.85; }
  .row-title { font-weight: 700; }
  .row-subtitle { margin-top: 4px; font-size: 0.88rem; color: #6b7280; }
  .app-shell.dark .row-subtitle { color: #9ca3af; }
  .project-list-filter {
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #6b7280;
  }
  .app-shell.dark .project-list-filter {
    color: #9ca3af;
  }
  .quotes-customer-search {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #6b7280;
  }
  .app-shell.dark .quotes-customer-search {
    color: #9ca3af;
  }
  .quote-reference-line {
    margin-top: 10px;
    font-size: 0.95rem;
    color: #374151;
  }
  .app-shell.dark .quote-reference-line {
    color: #d1d5db;
  }

  .schedule-card { padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .app-shell.dark .schedule-card { border-color: #374151; }
  .schedule-card.drag-over {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16);
  }
  .schedule-card.is-dragging {
    opacity: 0.72;
  }
  .schedule-card-main,
  .schedule-card-side {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .schedule-card-main.draggable {
    cursor: grab;
  }
  .schedule-card-main.draggable:active {
    cursor: grabbing;
  }
  .schedule-start-date-editor {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 380px;
  }
  .schedule-date-picker {
    position: relative;
    width: 100%;
  }
  .schedule-date-picker-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    cursor: pointer;
  }
  .schedule-date-picker-trigger.is-placeholder {
    color: #6b7280;
  }
  .app-shell.dark .schedule-date-picker-trigger.is-placeholder {
    color: #9ca3af;
  }
  .schedule-date-picker-icon {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    margin-left: 12px;
    flex-shrink: 0;
  }
  .app-shell.dark .schedule-date-picker-icon {
    color: #9ca3af;
  }
  .schedule-date-picker-popover {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 20;
    width: min(380px, calc(100vw - 32px));
    padding: 16px;
    border-radius: 14px;
    border: 1px solid #d1d5db;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  }
  .schedule-date-picker-popover.dark {
    background: #111827;
    border-color: #374151;
    box-shadow: none;
  }
  .schedule-date-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .schedule-date-picker-month {
    font-weight: 700;
  }
  .schedule-date-picker-nav {
    padding: 8px 10px;
  }
  .schedule-date-picker-weekdays,
  .schedule-date-picker-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }
  .schedule-date-picker-weekdays {
    margin-bottom: 8px;
  }
  .schedule-date-picker-weekday {
    text-align: center;
    font-size: 0.74rem;
    font-weight: 600;
    color: #6b7280;
  }
  .schedule-date-picker-weekday.weekend {
    font-weight: 400;
  }
  .app-shell.dark .schedule-date-picker-weekday {
    color: #9ca3af;
  }
  .schedule-date-picker-day {
    border: none;
    border-radius: 10px;
    padding: 10px 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-weight: 500;
  }
  .schedule-date-picker-day:hover:not(.disabled) {
    background: rgba(37, 99, 235, 0.08);
  }
  .schedule-date-picker-day.weekend {
    font-weight: 400;
    color: #6b7280;
  }
  .schedule-date-picker-day.outside-month {
    opacity: 0.45;
  }
  .schedule-date-picker-day.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  .schedule-date-picker-day.selected {
    background: #2563eb;
    color: #ffffff;
    font-weight: 700;
    opacity: 1;
  }
  .schedule-date-picker-note {
    margin-top: 10px;
    font-size: 0.78rem;
    color: #6b7280;
  }
  .app-shell.dark .schedule-date-picker-note,
  .app-shell.dark .schedule-date-picker-day.weekend {
    color: #9ca3af;
  }
  .schedule-detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .schedule-card-side {
    min-width: 320px;
    align-items: flex-end;
  }
  .schedule-start-date-actions {
    justify-content: flex-start;
  }
  .schedule-drag-hint {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #2563eb;
  }
  .app-shell.dark .schedule-drag-hint {
    color: #93c5fd;
  }
  .schedule-task-meta {
    margin-top: 0;
  }
  .schedule-contractor-trigger {
    display: inline;
  }
  .schedule-contractor-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(100%, 520px);
    padding: 10px;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    background: #eff6ff;
  }
  .app-shell.dark .schedule-contractor-picker {
    border-color: #1d4ed8;
    background: #172554;
  }
  .schedule-contractor-picker-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #1d4ed8;
  }
  .app-shell.dark .schedule-contractor-picker-title {
    color: #bfdbfe;
  }
  .schedule-contractor-option-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .schedule-contractor-option {
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    background: #ffffff;
    color: #1e3a8a;
    padding: 7px 9px;
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    text-align: left;
  }
  .schedule-contractor-option:hover {
    border-color: #2563eb;
    background: #dbeafe;
  }
  .app-shell.dark .schedule-contractor-option {
    border-color: #1e40af;
    background: #111827;
    color: #dbeafe;
  }
  .schedule-edit-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
  }
  .schedule-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    font-size: 0.82rem;
    color: #6b7280;
  }
  .app-shell.dark .schedule-field {
    color: #9ca3af;
  }
  .schedule-row-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  .schedule-dates { text-align: right; font-size: 0.92rem; }

  .timeline-row { gap: 16px; padding: 8px 10px; border-radius: 12px; }
  .timeline-row.drag-over {
    background: rgba(37, 99, 235, 0.08);
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.24);
  }
  .timeline-row.is-dragging {
    opacity: 0.72;
  }
  .timeline-label {
    width: 180px;
    font-weight: 600;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .timeline-label.draggable {
    cursor: grab;
  }
  .timeline-label.draggable:active {
    cursor: grabbing;
  }
  .timeline-bar-wrap {
    position: relative;
    flex: 1;
    background: #e5e7eb;
    border-radius: 14px;
    min-height: 52px;
    overflow: hidden;
  }
  .app-shell.dark .timeline-bar-wrap { background: #1f2937; }
  .timeline-bar {
    position: absolute;
    top: 8px;
    height: 16px;
    background: linear-gradient(90deg, #2563eb, #60a5fa);
    border-radius: 999px;
    cursor: grab;
    touch-action: none;
    transition: left 0.12s ease, width 0.12s ease, box-shadow 0.12s ease;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-width: 18px;
  }
  .timeline-bar:hover {
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
  .timeline-bar.is-dragging {
    cursor: grabbing;
    transition: none;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.28);
  }
  .timeline-bar.is-resizing {
    cursor: ew-resize;
  }
  .timeline-resize-handle {
    width: 10px;
    height: 100%;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    border: 2px solid rgba(37, 99, 235, 0.8);
    cursor: ew-resize;
    flex-shrink: 0;
    margin-right: -1px;
  }

  .price-list-actions { display: flex; align-items: center; gap: 12px; }
  .price-list-row {
    padding: 18px 0;
    align-items: center;
  }
  .price-list-row.editing {
    align-items: stretch;
    padding: 20px 0;
  }
  .price-field-label,
  .price-action-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #6b7280;
  }
  .app-shell.dark .price-field-label,
  .app-shell.dark .price-action-column {
    color: #9ca3af;
  }
  .price-action-column {
    align-self: end;
  }
  .price-edit-action-column {
    align-items: flex-end;
  }
  .price-action-column .button {
    width: auto;
    white-space: nowrap;
  }
  .price-list-edit-row {
    display: grid;
    grid-template-columns: minmax(180px, 1.4fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(130px, 1fr) minmax(100px, 0.8fr) minmax(330px, auto);
    gap: 12px;
    align-items: end;
    width: 100%;
  }
  .price-edit-action-column { min-width: 330px; }
  .price-list-edit-actions {
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
  }
  .settings-group label { font-weight: 700; }
  .server-actions {
    margin-top: 18px;
  }
  .server-error-message {
    padding: 12px;
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fef2f2;
    color: #991b1b;
    font-weight: 700;
    line-height: 1.4;
  }
  .app-shell.dark .server-error-message {
    border-color: rgba(248, 113, 113, 0.35);
    background: rgba(127, 29, 29, 0.25);
    color: #fca5a5;
  }
  .settings-row-label {
    font-weight: 700;
    line-height: 1.2;
  }
  .settings-expiry-row {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    align-items: center;
    column-gap: 18px;
    row-gap: 12px;
  }
  .settings-expiry-controls {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .settings-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    min-height: 42px;
    font-size: 0.95rem;
    font-weight: 600;
  }
  .settings-toggle input {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
  }
  .settings-expiry-field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .settings-expiry-field .select {
    width: auto;
    min-width: 110px;
  }
  .settings-company-field {
    display: grid;
    gap: 6px;
    width: min(100%, 460px);
  }
  .template-builder-card { border: 1px solid #93c5fd; }
  .app-shell.dark .template-builder-card { border-color: #2563eb; }
  .custom-area-card { border: 1px solid #bfdbfe; }
  .app-shell.dark .custom-area-card { border-color: #2563eb; }
  .template-actions { margin-top: 16px; }
  .quote-actions-card { border: 1px solid #bfdbfe; }
  .app-shell.dark .quote-actions-card { border-color: #1d4ed8; }
  .quote-actions-header { margin-bottom: 0; }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
  }
  .modal-card {
    width: min(100%, 520px);
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
  }
  .modal-card.dark {
    background: #111827;
    border-color: #374151;
    box-shadow: none;
  }
  .modal-header { margin-bottom: 12px; }
  .export-modal-grid { grid-template-columns: 1.5fr 1fr; margin-bottom: 16px; }
  .modal-actions { justify-content: flex-end; }

  @media (max-width: 1100px) {
    .app-shell,
    .app-shell.navigation-closed { grid-template-columns: 1fr; }
    .sidebar {
      border-right: none;
      border-bottom: 1px solid #d1d5db;
      padding-top: max(16px, env(safe-area-inset-top));
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
    .app-shell.navigation-closed .sidebar {
      align-items: flex-end;
      gap: 0;
      padding-top: max(8px, env(safe-area-inset-top));
      padding-right: max(8px, env(safe-area-inset-right));
      padding-bottom: 8px;
      padding-left: max(16px, env(safe-area-inset-left));
    }
    .app-shell.dark .sidebar { border-bottom-color: #374151; }
    .app-shell.navigation-closed .sidebar-header {
      justify-content: flex-end;
    }
    .nav-list { flex-direction: row; flex-wrap: wrap; }
    .stats-grid, .analysis-metric-grid, .analysis-status-grid, .analysis-detail-grid, .two-col-layout, .grid.three-col, .grid.price-grid, .grid.template-grid, .export-modal-grid {
      grid-template-columns: 1fr 1fr;
    }
    .analysis-grid { grid-template-columns: 1fr; }
    .grid.customer-address-row { grid-template-columns: minmax(0, 2fr) minmax(140px, 0.8fr); }
    .grid.contractor-rate-row { grid-template-columns: minmax(0, 1fr) minmax(140px, 0.6fr); }
    .span-two { grid-column: auto; }
  }

  @media (max-width: 760px) {
    .main-content {
      padding: 16px max(16px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
    }
    .sidebar {
      padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 16px max(16px, env(safe-area-inset-left));
    }
    .app-shell.navigation-closed .sidebar {
      padding-top: max(8px, env(safe-area-inset-top));
      padding-right: max(8px, env(safe-area-inset-right));
      padding-bottom: 8px;
      padding-left: max(16px, env(safe-area-inset-left));
    }
    .app-shell.navigation-closed .sidebar-toggle {
      width: 40px;
      height: 40px;
    }
    .sidebar-header {
      align-items: center;
    }
    .stats-grid, .analysis-metric-grid, .analysis-status-grid, .analysis-detail-grid, .analysis-table-row, .two-col-layout, .grid.three-col, .grid.price-grid, .grid.template-grid,
    .export-modal-grid, .room-name-row, .grid.customer-address-row, .grid.contractor-rate-row,
    .quote-header-row, .quote-row.advanced, .item-picker,
    .room-template-editor-header, .room-template-editor-row, .landing-action-bar, .dashboard-metric-grid,
    .saved-room-templates-header, .saved-room-templates-row { grid-template-columns: 1fr; }
    .settings-expiry-row { grid-template-columns: 1fr; }
    .settings-expiry-controls { align-items: flex-start; flex-direction: column; }
    .settings-expiry-field { justify-content: space-between; width: 100%; }
    .settings-expiry-field .select { width: 100%; max-width: 220px; }
    .settings-company-field { width: 100%; }
    .template-button-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .quote-header-row { display: none; }
    .room-template-editor-header { display: none; }
    .saved-room-templates-header { display: none; }
    .room-name-actions { grid-column: auto; }
    .quote-items-footer { flex-direction: column; align-items: stretch; }
    .quote-overview-row,
    .quote-overview-side { align-items: flex-start; }
    .quote-overview-actions { justify-content: flex-start; }
    .price-list-edit-row { grid-template-columns: 1fr; }
    .price-list-edit-actions { justify-content: flex-start; }
    .customer-card-work-summary { grid-template-columns: 1fr; }
    .customer-card-job-row { flex-direction: column; }
    .timeline-row, .schedule-card, .list-row { align-items: flex-start; flex-direction: column; }
    .schedule-card-side { min-width: 0; width: 100%; align-items: stretch; }
    .schedule-edit-grid { grid-template-columns: 1fr; }
    .schedule-row-actions { justify-content: flex-start; }
    .schedule-dates { text-align: left; }
    .timeline-label { width: auto; }
  }
`;
