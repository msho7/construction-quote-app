import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  Database,
  HardHat,
  Home,
  Menu,
  ReceiptText,
  Ruler,
  Settings,
  UserRound,
  Users
} from "lucide-react";
import { PAGE_OPTIONS } from "../../constants/appConstants";
import { APP_STYLES } from "../../styles";

const MotionDiv = motion.div;

const PAGE_META = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Track jobs, quotes, schedules, and client activity from one workspace.",
    icon: Home
  },
  analysis: {
    title: "Analysis",
    subtitle: "Review performance, quote value, schedule health, and project trends.",
    icon: BarChart3
  },
  quotes: {
    title: "Quotes",
    subtitle: "Build, approve, invoice, and revisit construction estimates.",
    icon: ReceiptText
  },
  scope: {
    title: "Scope",
    subtitle: "Capture work lines, photos, and field assignments without showing pricing.",
    icon: ClipboardList
  },
  schedule: {
    title: "Schedule",
    subtitle: "Plan project work, assign contractors, and monitor timing.",
    icon: CalendarDays
  },
  takeoff: {
    title: "Material Takeoff",
    subtitle: "Generate material quantities and totals from approved quotes.",
    icon: Ruler
  },
  pricelist: {
    title: "Price List",
    subtitle: "Maintain your reusable labor, material, and service pricing.",
    icon: ClipboardList
  },
  contractor: {
    title: "Contractors",
    subtitle: "Keep trade contacts, rates, documents, and assignments organized.",
    icon: UserRound
  },
  customer: {
    title: "Customers",
    subtitle: "Manage client profiles and the jobs connected to them.",
    icon: Users
  },
  server: {
    title: "Server",
    subtitle: "Check API health and MongoDB sync status.",
    icon: Database
  },
  settings: {
    title: "Settings",
    subtitle: "Tune company defaults, appearance, and app data behavior.",
    icon: Settings
  }
};

export default function AppShell({
  dark,
  currentPage,
  isPhoneExperience = false,
  showScopeNavigation = false,
  allowedPageIds,
  navigationOpen,
  setNavigationOpen,
  openNavigationPage,
  currentUser,
  onLogout,
  notification,
  onDismissNotification,
  children
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const effectiveAllowedPageIds =
    isPhoneExperience && allowedPageIds?.includes("scope") && !allowedPageIds.includes("quotes")
      ? [...allowedPageIds, "quotes"]
      : allowedPageIds;
  const allowedPageSet = effectiveAllowedPageIds?.length ? new Set(effectiveAllowedPageIds) : null;
  const basePageOptions = PAGE_OPTIONS
    .filter((page) => page.id !== "scope" || showScopeNavigation)
    .filter((page) => !allowedPageSet || allowedPageSet.has(page.id));
  const visiblePageOptions = isPhoneExperience
    ? basePageOptions
        .filter((page) => !["analysis", "takeoff", "contractor"].includes(page.id))
        .map((page) => page.id === "quotes" ? { ...page, label: "Scope" } : page)
    : basePageOptions;
  const pageMeta = {
    ...(PAGE_META[currentPage] || PAGE_META.dashboard),
    ...(isPhoneExperience && currentPage === "quotes"
      ? {
          title: "Scope",
          subtitle: "Capture work lines, photos, and field assignments without showing pricing."
        }
      : {})
  };
  const HeaderIcon = pageMeta.icon;
  const userDisplayName = currentUser?.name || currentUser?.email || "User";
  const userInitial = String(userDisplayName).trim().charAt(0).toUpperCase() || "U";
  const userPhotoUrl = currentUser?.photoUrl || currentUser?.photo || "";

  const openSettingsFromUserMenu = () => {
    setUserMenuOpen(false);
    openNavigationPage("settings");
  };

  const signOutFromUserMenu = () => {
    setUserMenuOpen(false);
    onLogout?.();
  };

  const expandCollapsedNavigation = () => {
    if (navigationOpen) return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1100px)").matches) return;
    setNavigationOpen(true);
  };

  const isDesktopCollapsedNavigation = () =>
    !navigationOpen &&
    (typeof window === "undefined" || !window.matchMedia("(max-width: 1100px)").matches);

  const handleUserAvatarClick = () => {
    if (isDesktopCollapsedNavigation()) {
      setNavigationOpen(true);
      setUserMenuOpen(true);
      return;
    }

    setUserMenuOpen((open) => !open);
  };

  return (
    <>
      <style>{APP_STYLES}</style>
      <div
        className={[
          "app-shell",
          dark ? "dark" : "",
          isPhoneExperience ? "phone-experience" : "",
          navigationOpen ? "navigation-open" : "navigation-closed"
        ].filter(Boolean).join(" ")}
      >
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand" aria-label="Construction Quote App">
              <button
                className="sidebar-brand-mark"
                type="button"
                onClick={() => openNavigationPage("dashboard")}
                aria-label="Go to dashboard"
                title="Dashboard"
              >
                <HardHat size={20} strokeWidth={2.4} />
              </button>
              {navigationOpen ? (
                <span className="sidebar-brand-copy">
                  <span className="sidebar-title">BuildQuote</span>
                  <span className="sidebar-subtitle">Construction command center</span>
                </span>
              ) : null}
            </div>
            <button
              className="sidebar-toggle"
              type="button"
              onClick={() => setNavigationOpen((open) => !open)}
              aria-label={navigationOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navigationOpen}
            >
              {navigationOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            {currentUser ? (
              <div className="sidebar-user-menu">
                <button
                  className="sidebar-user-avatar"
                  type="button"
                  onClick={handleUserAvatarClick}
                  aria-label="Open user menu"
                  aria-expanded={userMenuOpen}
                  title={userDisplayName}
                >
                  {userPhotoUrl ? (
                    <img src={userPhotoUrl} alt="" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </button>
                {userMenuOpen ? (
                  <div className="sidebar-user-popover">
                    <div className="sidebar-user-popover-header">
                      <strong>{userDisplayName}</strong>
                      <span>{currentUser.email}</span>
                    </div>
                    <button type="button" onClick={openSettingsFromUserMenu}>
                      Settings
                    </button>
                    <button type="button" onClick={signOutFromUserMenu}>
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <nav className="nav-list" aria-label="Primary navigation">
            {visiblePageOptions.map((page) => {
              const Icon = PAGE_META[page.id]?.icon || ClipboardList;
              const isActive = currentPage === page.id;

              return (
                <button
                  key={page.id}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  type="button"
                  onClick={() => openNavigationPage(page.id)}
                  aria-label={page.label}
                  aria-current={isActive ? "page" : undefined}
                  title={navigationOpen ? undefined : page.label}
                >
                  <Icon className="nav-item-icon" size={18} aria-hidden="true" />
                  {navigationOpen ? <span className="nav-item-label">{page.label}</span> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="main-content">
          <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="page-header">
              <div className="page-header-icon" aria-hidden="true">
                <HeaderIcon size={24} strokeWidth={2.3} />
              </div>
              <div>
                <p className="page-kicker">Construction Quote App</p>
                <h1>{pageMeta.title}</h1>
                <p>{pageMeta.subtitle}</p>
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
            x
          </button>
        </div>
      ) : null}
    </>
  );
}
