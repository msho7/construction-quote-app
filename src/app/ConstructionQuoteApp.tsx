import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { APP_STYLES } from "../styles/styles";
import { useDarkMode } from "../hooks/useDarkMode";
import {
  PAGE_OPTIONS,
  PROJECT_TEMPLATES,
  EMPTY_ITEM,
  EMPTY_PRICE_ITEM,
  DEFAULT_TEMPLATE_VALUES
} from "../constants/appConstants";
import {
  createTemplateItems,
  safeJsonParse,
  formatMoney,
  getItemBaseTotal,
  getItemMarkupAmount,
  mergeTemplateItemsWithPriceList
} from "../utils/appUtils";

import Sidebar from "../components/layout/Sidebar";
import PageHeader from "../components/layout/PageHeader";
import DashboardPage from "../components/dashboard/DashboardPage";
import QuotesPage from "../components/quotes/QuotesPage";
import SchedulePage from "../components/schedule/SchedulePage";
import PriceListPage from "../components/pricelist/PriceListPage";
import SettingsPage from "../components/settings/SettingsPage";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export default function ConstructionQuoteApp() {
  const systemDark = useDarkMode();
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("themeMode") as "light" | "dark" | "system") || "system";
  });

  const dark = themeMode === "system" ? systemDark : themeMode === "dark";
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [quoteDate, setQuoteDate] = useState(getTodayDate());
  const [taxRate, setTaxRate] = useState(13);
  const [startDate, setStartDate] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [savedQuotes, setSavedQuotes] = useState(() =>
    typeof window === "undefined" ? [] : safeJsonParse(localStorage.getItem("savedQuotes"), [])
  );
  const [priceList, setPriceList] = useState(() =>
    typeof window === "undefined" ? [] : safeJsonParse(localStorage.getItem("priceList"), [])
  );
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [newPriceItem, setNewPriceItem] = useState({ ...EMPTY_PRICE_ITEM });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [templateFormValues, setTemplateFormValues] = useState({
    ...DEFAULT_TEMPLATE_VALUES.bathroom
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("priceList", JSON.stringify(priceList));
    }
  }, [priceList]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
    }
  }, [savedQuotes]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("themeMode", themeMode);
    }
  }, [themeMode]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + getItemBaseTotal(item),
      0
    );
    const markup = items.reduce((sum, item) => sum + getItemMarkupAmount(item), 0);
    const tax = (subtotal + markup) * (Number(taxRate || 0) / 100);
    return { subtotal, markup, tax, total: subtotal + markup + tax };
  }, [items, taxRate]);

  const totalDuration = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.duration || 0), 0),
    [items]
  );

  const statCards = [
    { label: "Price List Items", value: priceList.length },
    { label: "Quote Items", value: items.filter((item) => item.name.trim()).length },
    { label: "Project Total", value: formatMoney(totals.total) },
    { label: "Schedule Days", value: totalDuration }
  ];

  const MotionDiv = motion.div;

  return (
    <>
      <style>{APP_STYLES}</style>
      <div className={dark ? "app-shell dark" : "app-shell"}>
        <Sidebar
          currentPage={currentPage}
          pages={PAGE_OPTIONS}
          onChangePage={setCurrentPage}
        />

        <main className="main-content">
          <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PageHeader
              title="🏗️ Construction Quote Generator"
              subtitle="Build quotes, manage pricing, and generate project schedules."
            />

            {currentPage === "dashboard" && (
              <DashboardPage
                dark={dark}
                statCards={statCards}
                projectTitle={projectTitle}
                clientName={clientName}
                projectAddress={projectAddress}
                startDate={startDate}
                savedQuotes={savedQuotes}
                onOpenQuotes={() => setCurrentPage("quotes")}
                onOpenPriceList={() => setCurrentPage("pricelist")}
                onOpenSchedules={() => setCurrentPage("schedule")}
              />
            )}

            {currentPage === "quotes" && (
              <QuotesPage
                dark={dark}
                projectTitle={projectTitle}
                clientName={clientName}
                projectAddress={projectAddress}
                quoteDate={quoteDate}
                taxRate={taxRate}
                startDate={startDate}
                items={items}
                priceList={priceList}
                totals={totals}
                savedQuotes={savedQuotes}
                selectedTemplateId={selectedTemplateId}
                showTemplateBuilder={showTemplateBuilder}
                templateFormValues={templateFormValues}
                onSetProjectTitle={setProjectTitle}
                onSetClientName={setClientName}
                onSetProjectAddress={setProjectAddress}
                onSetQuoteDate={setQuoteDate}
                onSetTaxRate={setTaxRate}
                onSetStartDate={setStartDate}
              />
            )}

            {currentPage === "schedule" && (
              <SchedulePage dark={dark} schedule={schedule} />
            )}

            {currentPage === "pricelist" && (
              <PriceListPage
                dark={dark}
                priceList={priceList}
                newPriceItem={newPriceItem}
                setNewPriceItem={setNewPriceItem}
              />
            )}

            {currentPage === "settings" && (
              <SettingsPage
                dark={dark}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
              />
            )}
          </MotionDiv>
        </main>
      </div>
    </>
  );
}
