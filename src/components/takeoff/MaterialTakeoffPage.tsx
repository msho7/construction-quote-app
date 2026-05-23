// @ts-nocheck
import { Button, Card } from "../ui";
import { formatMoney, formatQuoteReferenceNumber, getItemTotal } from "../../utils/appUtils";
import { inferMaterialTakeoffItems } from "../../utils/materialTakeoffRules";

const getNormalizedText = (value) => String(value || "").trim().toLowerCase();

const getMaterialKey = (item = {}) =>
  [
    getNormalizedText(item.name),
    getNormalizedText(item.unit),
    getNormalizedText(item.category)
  ].join("|");

const getMaterialSource = (item = {}, priceList = []) => {
  if (item.takeoffSource) return item.takeoffSource;

  const itemName = getNormalizedText(item.name);
  if (!itemName) return "Quote item";

  const matchedPriceItem = priceList.find((priceItem) => getNormalizedText(priceItem.name) === itemName);
  return matchedPriceItem ? "Price list" : "Quote item";
};

const buildSavedMaterialQuantities = (savedQuote = {}) => {
  const quantitiesByKey = new Map();

  (savedQuote.items || [])
    .filter((item) => getNormalizedText(item.category) === "material")
    .filter((item) => getNormalizedText(item.name))
    .forEach((item) => {
      const key = getMaterialKey(item);
      quantitiesByKey.set(key, Number(quantitiesByKey.get(key) || 0) + Number(item.quantity || 0));
    });

  return quantitiesByKey;
};

const buildTakeoffRows = (quote = {}, priceList = [], savedQuote = null) => {
  const rowsByKey = new Map();
  const savedQuantitiesByKey = buildSavedMaterialQuantities(savedQuote || quote);
  const isComparingDraftToSavedQuote = Boolean(savedQuote && quote?.takeoffSource === "Current quote draft");
  const quoteItems = quote.items || [];
  const materialItems = [
    ...quoteItems,
    ...inferMaterialTakeoffItems(quoteItems, priceList)
  ];

  materialItems
    .filter((item) => getNormalizedText(item.category) === "material")
    .filter((item) => getNormalizedText(item.name))
    .forEach((item) => {
      const key = getMaterialKey(item);
      const existing = rowsByKey.get(key);
      const quantity = Number(item.quantity || 0);
      const total = getItemTotal(item);

      if (existing) {
        rowsByKey.set(key, {
          ...existing,
          quantity: existing.quantity + quantity,
          total: existing.total + total,
          rooms: Array.from(new Set([...existing.rooms, item.roomName || "No room"])),
          inferenceReasons: Array.from(new Set([
            ...existing.inferenceReasons,
            item.inferenceReason
          ].filter(Boolean)))
        });
        return;
      }

      rowsByKey.set(key, {
        name: item.name,
        unit: item.unit || "each",
        category: item.category || "Material",
        quantity,
        pricePerUnit: Number(item.pricePerUnit || 0),
        total,
        source: getMaterialSource(item, priceList),
        rooms: [item.roomName || "No room"],
        inferenceReasons: [item.inferenceReason].filter(Boolean)
      });
    });

  return Array.from(rowsByKey.entries())
    .map(([key, row]) => {
      const savedQuantity = Number(savedQuantitiesByKey.get(key) || 0);
      const unsavedQuantity = isComparingDraftToSavedQuote
        ? Math.max(0, Number(row.quantity || 0) - savedQuantity)
        : 0;

      return {
        ...row,
        savedQuantity,
        unsavedQuantity,
        hasUnsavedQuantity: unsavedQuantity > 0
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
};

export default function MaterialTakeoffPage({
  dark,
  quote,
  savedQuote,
  priceList = [],
  onBack,
  onOpenQuote
}) {
  const isDraftTakeoff = quote?.takeoffSource === "Current quote draft";
  const takeoffRows = buildTakeoffRows(quote, priceList, savedQuote);
  const materialTotal = takeoffRows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const materialCount = takeoffRows.length;
  const missingPriceCount = takeoffRows.filter((row) => !row.pricePerUnit).length;
  const unsavedMaterialCount = takeoffRows.filter((row) => row.hasUnsavedQuantity).length;
  const inferredMaterialCount = takeoffRows.filter((row) => row.inferenceReasons.length).length;

  if (!quote) {
    return (
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Material Takeoff</h3>
            <p className="row-subtitle">Select an approved quote to generate a material takeoff.</p>
          </div>
          <Button variant="secondary" onClick={onBack}>Back To Quotes</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Material Takeoff</h3>
            <p className="row-subtitle">
              {formatQuoteReferenceNumber(quote)} • {quote.projectTitle || "Untitled project"} • {quote.projectAddress || "No location saved"}
            </p>
          </div>
          <div className="button-row">
            <Button variant="secondary" onClick={() => onOpenQuote?.(quote, { readOnly: !isDraftTakeoff })}>View Quote</Button>
            <Button variant="secondary" onClick={onBack}>Back To Quotes</Button>
          </div>
        </div>
        {isDraftTakeoff ? (
          <p className="row-subtitle">
            This takeoff is reading the current quote draft, including material items added before saving.
          </p>
        ) : null}
      </Card>

      <div className="stats-grid">
        <Card dark={dark}>
          <div className="stat-label">Material Lines</div>
          <div className="stat-value">{materialCount}</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">Material Total</div>
          <div className="stat-value">{formatMoney(materialTotal)}</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">Missing Prices</div>
          <div className="stat-value">{missingPriceCount}</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">Unsaved Lines</div>
          <div className="stat-value">{unsavedMaterialCount}</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">Auto-Added</div>
          <div className="stat-value">{inferredMaterialCount}</div>
        </Card>
      </div>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>Generated Materials</h3>
            <p className="row-subtitle">Automatically grouped from material lines in the approved quote and current quote draft.</p>
          </div>
        </div>

        {takeoffRows.length === 0 ? (
          <p className="row-subtitle">No material items were found on this quote.</p>
        ) : (
          <div className="takeoff-table">
            <div className="takeoff-table-row takeoff-table-header">
              <div>Material</div>
              <div>Qty</div>
              <div>Unit</div>
              <div>Rooms</div>
              <div>Source</div>
              <div>Total</div>
            </div>
            {takeoffRows.map((row) => (
              <div key={`${row.name}-${row.unit}-${row.category}`} className="takeoff-table-row">
                <div>
                  <div className="row-title">{row.name}</div>
                  {row.hasUnsavedQuantity ? (
                    <div className="row-subtitle">
                      Includes {Number(row.unsavedQuantity || 0).toFixed(2).replace(/\.00$/, "")} unsaved {row.unit}.
                    </div>
                  ) : null}
                  {row.inferenceReasons.map((reason) => (
                    <div key={reason} className="row-subtitle">{reason}</div>
                  ))}
                  {!row.pricePerUnit ? <div className="row-subtitle">Add this item to the price list to automate pricing.</div> : null}
                </div>
                <div>{Number(row.quantity || 0).toFixed(2).replace(/\.00$/, "")}</div>
                <div>{row.unit}</div>
                <div>{row.rooms.join(", ")}</div>
                <div>{row.source}</div>
                <div>{formatMoney(row.total)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
