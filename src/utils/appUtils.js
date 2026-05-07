export const roundToTwo = (value) => Math.round(Number(value || 0) * 100) / 100;

export const sanitizeNumericInput = (value, options = {}) => {
  const { allowDecimal = true } = options;
  const rawValue = String(value ?? "").replace(/,/g, ".");

  if (!allowDecimal) {
    return rawValue.replace(/\D/g, "");
  }

  const cleanedValue = rawValue.replace(/[^0-9.]/g, "");
  const [wholePart = "", ...decimalParts] = cleanedValue.split(".");

  if (!decimalParts.length) {
    return cleanedValue;
  }

  const normalizedWholePart = wholePart === "" ? "0" : wholePart;

  return `${normalizedWholePart}.${decimalParts.join("")}`;
};

export const getNumericInputValue = (value, options = {}) => {
  const { hideZero = false } = options;

  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (hideZero && (value === 0 || value === "0")) {
    return "";
  }

  return String(value);
};

export const formatDateForInput = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const toDateInputValue = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return formatDateForInput(parsedDate);
};

const isWeekendDate = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const getNextBusinessDate = (value) => {
  const normalizedDate = toDateInputValue(value);
  if (!normalizedDate) return "";

  const nextDate = new Date(`${normalizedDate}T00:00:00`);

  while (isWeekendDate(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return formatDateForInput(nextDate);
};

export const addDaysToDate = (startDate, dayOffset = 0) => {
  const normalizedStartDate = getNextBusinessDate(startDate);
  if (!normalizedStartDate) return "";

  const nextDate = new Date(`${normalizedStartDate}T00:00:00`);
  const safeOffset = Number(dayOffset || 0);
  const direction = safeOffset >= 0 ? 1 : -1;
  let remainingDays = Math.abs(safeOffset);

  while (remainingDays > 0) {
    nextDate.setDate(nextDate.getDate() + direction);

    if (isWeekendDate(nextDate)) {
      continue;
    }

    remainingDays -= 1;
  }

  return formatDateForInput(nextDate);
};

export const getScheduleEndDate = (startDate, duration = 1) => {
  const normalizedStartDate = getNextBusinessDate(startDate);
  if (!normalizedStartDate) return "";

  const safeDuration = Math.max(1, Number(duration || 1));
  return addDaysToDate(normalizedStartDate, safeDuration);
};

export const createTemplateItems = (templateId, values) => {
  if (templateId === "bathroom") {
    const floorArea = roundToTwo(values.roomLength * values.roomWidth);
    const wallArea = roundToTwo(2 * (values.roomLength + values.roomWidth) * values.wallHeight);

    return [
      { name: "Bathroom Demolition", quantity: 1, unit: "each", pricePerUnit: 1200, duration: 2, category: "Labor" },
      { name: "Bathroom Floor Tile Installation", quantity: floorArea, unit: "sf", pricePerUnit: 18, duration: Math.max(1, Math.ceil(floorArea / 40)), category: "Labor" },
      { name: "Bathroom Wall Prep and Paint", quantity: wallArea, unit: "sf", pricePerUnit: 4.5, duration: Math.max(1, Math.ceil(wallArea / 120)), category: "Labor" },
      { name: "Baseboard Installation", quantity: roundToTwo(2 * (values.roomLength + values.roomWidth)), unit: "lf", pricePerUnit: 6, duration: 1, category: "Material" },
      { name: "Vanity Installation", quantity: values.vanityCount, unit: "each", pricePerUnit: 650, duration: Math.max(1, values.vanityCount), category: "Labor" },
      { name: "Toilet Installation", quantity: values.toiletCount, unit: "each", pricePerUnit: 350, duration: Math.max(1, values.toiletCount), category: "Labor" },
      { name: "Shower Installation", quantity: values.showerCount, unit: "each", pricePerUnit: 1800, duration: Math.max(1, values.showerCount * 2), category: "Labor" },
      { name: "Bathtub Installation", quantity: values.bathtubCount, unit: "each", pricePerUnit: 1500, duration: Math.max(0, values.bathtubCount * 2), category: "Labor" },
      { name: "Interior Door Installation", quantity: values.doorCount, unit: "each", pricePerUnit: 275, duration: Math.max(1, values.doorCount), category: "Labor" }
    ].filter((item) => item.quantity > 0);
  }

  if (templateId === "kitchen") {
    const floorArea = roundToTwo(values.roomLength * values.roomWidth);
    const wallArea = roundToTwo(2 * (values.roomLength + values.roomWidth) * values.wallHeight);

    return [
      { name: "Kitchen Demolition", quantity: 1, unit: "each", pricePerUnit: 2200, duration: 3, category: "Labor" },
      { name: "Kitchen Flooring Installation", quantity: floorArea, unit: "sf", pricePerUnit: 12, duration: Math.max(1, Math.ceil(floorArea / 70)), category: "Labor" },
      { name: "Kitchen Paint", quantity: wallArea, unit: "sf", pricePerUnit: 4, duration: Math.max(1, Math.ceil(wallArea / 180)), category: "Labor" },
      { name: "Cabinet Installation", quantity: values.cabinetLength, unit: "lf", pricePerUnit: 140, duration: Math.max(1, Math.ceil(values.cabinetLength / 8)), category: "Material" },
      { name: "Appliance Installation", quantity: values.applianceCount, unit: "each", pricePerUnit: 225, duration: Math.max(1, Math.ceil(values.applianceCount / 2)), category: "Labor" },
      { name: "Sink Installation", quantity: values.sinkCount, unit: "each", pricePerUnit: 400, duration: Math.max(1, values.sinkCount), category: "Labor" },
      { name: "Backsplash Installation", quantity: values.backsplashArea, unit: "sf", pricePerUnit: 22, duration: Math.max(1, Math.ceil(values.backsplashArea / 30)), category: "Labor" }
    ].filter((item) => item.quantity > 0);
  }

  return [];
};

export const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export const getQuoteProjectNumberValue = (quote = {}) => {
  const projectNumber = Number(quote?.projectNumber || 0);
  return Number.isFinite(projectNumber) && projectNumber > 0
    ? Math.floor(projectNumber)
    : 0;
};

export const getQuoteInvoicePartValue = (quote = {}) => {
  const invoicePartNumber = Number(quote?.invoicePartNumber || 1);
  return Number.isFinite(invoicePartNumber) && invoicePartNumber > 0
    ? Math.floor(invoicePartNumber)
    : 1;
};

export const formatProjectReferenceNumber = (projectNumber) => {
  const normalizedProjectNumber = Number(projectNumber || 0);

  if (!Number.isFinite(normalizedProjectNumber) || normalizedProjectNumber <= 0) {
    return "";
  }

  return String(Math.floor(normalizedProjectNumber)).padStart(5, "0");
};

export const formatQuoteReferenceNumber = (quote = {}) => {
  const projectNumber = getQuoteProjectNumberValue(quote);
  const baseNumber = projectNumber ? formatProjectReferenceNumber(projectNumber) : "";

  if (quote?.status === "invoiced") {
    const invoicePartNumber = getQuoteInvoicePartValue(quote);
    if (!baseNumber) {
      return invoicePartNumber > 1 ? `INV-${invoicePartNumber}` : "INV";
    }

    return invoicePartNumber > 1
      ? `${baseNumber}-INV-${invoicePartNumber}`
      : `${baseNumber}-INV`;
  }

  if (quote?.status && quote.status !== "open") {
    return baseNumber;
  }

  return baseNumber ? `Q${baseNumber}` : "Q";
};

export const getNextQuoteProjectNumber = (savedQuotes = []) =>
  savedQuotes.reduce(
    (highestNumber, quote) => Math.max(highestNumber, getQuoteProjectNumberValue(quote)),
    0
  ) + 1;

export const normalizeSavedQuoteReferences = (savedQuotes = []) => {
  const normalizedQuotes = savedQuotes.map((quote) => ({
    ...quote,
    status: quote?.status || "open",
    projectNumber: getQuoteProjectNumberValue(quote),
    invoicePartNumber: getQuoteInvoicePartValue(quote)
  }));

  let nextProjectNumber = normalizedQuotes.reduce(
    (highestNumber, quote) => Math.max(highestNumber, Number(quote.projectNumber || 0)),
    0
  ) + 1;

  const assignedProjectNumbers = new Map();

  normalizedQuotes
    .map((quote, index) => ({ quote, index }))
    .filter(({ quote }) => !quote.projectNumber)
    .sort((left, right) => Number(left.quote.id || 0) - Number(right.quote.id || 0))
    .forEach(({ index }) => {
      assignedProjectNumbers.set(index, nextProjectNumber);
      nextProjectNumber += 1;
    });

  return normalizedQuotes.map((quote, index) => ({
    ...quote,
    projectNumber: quote.projectNumber || assignedProjectNumbers.get(index) || 0,
    invoicePartNumber:
      quote.status === "invoiced"
        ? getQuoteInvoicePartValue(quote)
        : 1
  }));
};

export const getItemBaseTotal = (item) =>
  Number(item?.quantity || 0) * Number(item?.pricePerUnit || 0);

export const getItemMarkupAmount = (item) =>
  getItemBaseTotal(item) * (Number(item?.markupRate || 0) / 100);

export const getItemTotal = (item) =>
  getItemBaseTotal(item) + getItemMarkupAmount(item);

export const mergeTemplateItemsWithPriceList = (templateItems, priceList) => {
  return templateItems.map((templateItem) => {
    const priceMatch = priceList.find(
      (priceItem) => priceItem.name.trim().toLowerCase() === templateItem.name.trim().toLowerCase()
    );

    if (!priceMatch) return templateItem;

    return {
      ...templateItem,
      unit: priceMatch.unit || templateItem.unit,
      pricePerUnit: Number(priceMatch.pricePerUnit || templateItem.pricePerUnit || 0),
      duration: Number(priceMatch.duration || templateItem.duration || 1),
      category: priceMatch.category || templateItem.category
    };
  });
};
