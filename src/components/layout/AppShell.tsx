// @ts-nocheck
import { motion } from "framer-motion";
import { PAGE_OPTIONS } from "../../constants/appConstants";
import { APP_STYLES } from "../../styles";

const MotionDiv = motion.div;

export default function AppShell({
  dark,
  currentPage,
  navigationOpen,
  setNavigationOpen,
  openNavigationPage,
  notification,
  onDismissNotification,
  children
}) {
  return (
    <>
      <style>{APP_STYLES}</style>
      <div
        className={[
          "app-shell",
          dark ? "dark" : "",
          navigationOpen ? "navigation-open" : "navigation-closed"
        ].filter(Boolean).join(" ")}
      >
        <aside className="sidebar">
          <div className="sidebar-header">
            {navigationOpen ? (
              <div>
                <h2 className="sidebar-title">🏗️</h2>
                <p className="sidebar-subtitle">Construction quoting and scheduling</p>
              </div>
            ) : null}
            <button
              className="sidebar-toggle"
              type="button"
              onClick={() => setNavigationOpen((open) => !open)}
              aria-label={navigationOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navigationOpen}
            >
              {navigationOpen ? "‹" : "☰"}
            </button>
          </div>

          {navigationOpen ? (
            <nav className="nav-list">
              {PAGE_OPTIONS.map((page) => (
                <button
                  key={page.id}
                  className={`nav-item ${currentPage === page.id ? "active" : ""}`}
                  type="button"
                  onClick={() => openNavigationPage(page.id)}
                >
                  {page.label}
                </button>
              ))}
            </nav>
          ) : null}
        </aside>

        <main className="main-content">
          <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <div>
                <h1>🏗️ Construction Quote Generator</h1>
                <p>Build quotes, manage pricing, and generate project schedules.</p>
              </div>
            </div>

            {children}
          </MotionDiv>
        </main>
      </div>
      {notification ? (
        <div className={`app-notification ${notification.variant}`} role="status" aria-live="polite">
          <span>{notification.message}</span>
          <button
            type="button"
            className="app-notification-close"
            aria-label="Dismiss notification"
            onClick={onDismissNotification}
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
