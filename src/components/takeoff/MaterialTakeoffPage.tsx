import { useMemo, useState } from "react";
import { Button, Card } from "../ui";
import { formatMoney, formatQuoteReferenceNumber, getItemTotal, roundToTwo, sanitizeNumericInput } from "../../utils/appUtils";
import { inferMaterialTakeoffItems } from "../../utils/materialTakeoffRules";

const MATERIAL_PRESETS = [
  { name: "Drywall", baseUnit: "ft", productUnit: "sheet", productLength: "4", productWidth: "8", productHeight: "" },
  { name: "Flooring", baseUnit: "ft", productUnit: "sq ft", productLength: "", productWidth: "", productHeight: "" },
  { name: "Baseboard", baseUnit: "ft", productUnit: "stick", productLength: "8", productWidth: "", productHeight: "" },
  { name: "Paint", baseUnit: "ft", productUnit: "bundle coverage", productLength: "", productWidth: "", productHeight: "" }
];

const MEASUREMENT_UNIT_OPTIONS = [
  { value: "in", label: "Inches", linear: "in", square: "sq in", cubic: "cu in" },
  { value: "ft", label: "Feet", linear: "ft", square: "sq ft", cubic: "cu ft" },
  { value: "cm", label: "Centimeters", linear: "cm", square: "sq cm", cubic: "cu cm" },
  { value: "m", label: "Meters", linear: "m", square: "sq m", cubic: "cu m" },
  { value: "km", label: "Kilometers", linear: "km", square: "sq km", cubic: "cu km" },
  { value: "each", label: "Each", linear: "pieces" }
];

const PRODUCT_UNIT_OPTIONS = [
  { value: "sheet", label: "Sheet" },
  { value: "panel", label: "Panel" },
  { value: "board", label: "Board" },
  { value: "foot", label: "Foot" },
  { value: "meter", label: "Meter" },
  { value: "length", label: "Length" },
  { value: "stick", label: "Stick" },
  { value: "sq ft", label: "Square foot" },
  { value: "sq m", label: "Square meter" },
  { value: "bundle coverage", label: "Bundle coverage" },
  { value: "cubic yard", label: "Cubic yard" },
  { value: "bag", label: "Bag" },
  { value: "load", label: "Load" },
  { value: "meter cubed", label: "m³" },
  { value: "cubic volume", label: "Cubic volume" }
];

const AREA_PRODUCT_UNITS = new Set(["sheet", "panel", "board", "sq ft", "sq m", "bundle coverage"]);
const LINEAR_PRODUCT_UNITS = new Set(["foot", "meter", "length", "stick"]);
const COVERAGE_PRODUCT_UNITS = new Set(["cubic yard", "cubic meter", "bag", "load", "meter cubed", "cubic volume"]);

const getProductDimensionMode = (productUnit: string) => {
  if (AREA_PRODUCT_UNITS.has(productUnit)) return "area";
  if (LINEAR_PRODUCT_UNITS.has(productUnit)) return "linear";
  if (COVERAGE_PRODUCT_UNITS.has(productUnit)) return "coverage";
  return "area";
};

const getDefaultProductUnitForBaseUnit = (baseUnit: string) =>
  baseUnit === "m" ? "sq m" : "sq ft";

const shouldAutoUpdateSquareProductUnit = (productUnit: string) =>
  !productUnit || productUnit === "sq ft" || productUnit === "sq m";

const getSavedProductKey = (name: string) => String(name || "").trim().toLowerCase().replace(/\s+/g, "-");

const getMaterialDisplayName = (material: any = {}) => String(material.name || "").trim();

const createTakeoffMaterial = (overrides: any = {}) => ({
  id: `takeoff-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: "Drywall",
  baseUnit: "ft",
  length: "",
  width: "",
  height: "",
  productUnit: "sheets",
  productLength: "4",
  productWidth: "8",
  productHeight: "",
  wastePercent: "",
  pricePerUnit: "",
  ...overrides
});

const getNumber = (value: any) => Number(value || 0);

const getMeasurementUnit = (baseUnit: string) =>
  MEASUREMENT_UNIT_OPTIONS.find((unit) => unit.value === baseUnit) || MEASUREMENT_UNIT_OPTIONS[1];

const getFilledDimensions = (material: any = {}) =>
  [material.length, material.width, material.height]
    .map(getNumber)
    .filter((value) => value > 0);

const getCalculatedMaterialUnit = (material: any = {}) => {
  if (material.baseUnit === "each") return "pieces";

  const unit = getMeasurementUnit(material.baseUnit);
  const dimensionCount = getFilledDimensions(material).length;

  if (dimensionCount >= 3) return unit.cubic;
  if (dimensionCount === 2) return unit.square;
  return unit.linear;
};

const calculateMaterialQuantity = (material: any = {}) => {
  if (material.baseUnit === "each") return roundToTwo(getNumber(material.length));

  const dimensions = getFilledDimensions(material);

  if (!dimensions.length) return 0;
  return roundToTwo(dimensions.reduce((total, value) => total * value, 1));
};

const getFilledProductDimensions = (material: any = {}) =>
  [material.productLength, material.productWidth, material.productHeight]
    .map(getNumber)
    .filter((value) => value > 0);

const getProductCoverage = (material: any = {}) => {
  if (material.baseUnit === "each") return 1;

  const dimensions = getFilledProductDimensions(material);

  if (!dimensions.length) return 0;
  return roundToTwo(dimensions.reduce((total, value) => total * value, 1));
};

const getPurchaseQuantity = (measuredQuantity: number, material: any = {}) => {
  const productCoverage = getProductCoverage(material);
  const quantityWithWaste = measuredQuantity * (1 + Math.max(0, getNumber(material.wastePercent)) / 100);

  if (!productCoverage) return roundToTwo(quantityWithWaste);
  return Math.ceil(quantityWithWaste / productCoverage);
};

const getCalculatedMaterials = (materials: any[] = []) =>
  materials.map((material) => {
    const measuredQuantity = calculateMaterialQuantity(material);
    const measuredUnit = getCalculatedMaterialUnit(material);
    const productCoverage = getProductCoverage(material);
    const quantity = getPurchaseQuantity(measuredQuantity, material);
    const unit = material.baseUnit === "each" ? "pieces" : material.productUnit || "pieces";

    return {
      ...material,
      measuredQuantity,
      measuredUnit,
      productCoverage,
      unit,
      quantity,
      total: roundToTwo(quantity * getNumber(material.pricePerUnit))
    };
  });

const getNormalizedText = (value: any) => String(value || "").trim().toLowerCase();

const getMaterialKey = (item: any = {}) =>
  [
    getNormalizedText(item.name),
    getNormalizedText(item.unit),
    getNormalizedText(item.category)
  ].join("|");

const getMaterialSource = (item: any = {}, priceList: any[] = []) => {
  if (item.takeoffSource) return item.takeoffSource;

  const itemName = getNormalizedText(item.name);
  if (!itemName) return "Quote item";

  const matchedPriceItem = priceList.find((priceItem) => getNormalizedText(priceItem.name) === itemName);
  return matchedPriceItem ? "Price list" : "Quote item";
};

const buildSavedMaterialQuantities = (savedQuote: any = {}) => {
  const sourceQuote = savedQuote || {};
  const quantitiesByKey = new Map();

  (sourceQuote.items || [])
    .filter((item) => getNormalizedText(item.category) === "material")
    .filter((item) => getNormalizedText(item.name))
    .forEach((item) => {
      const key = getMaterialKey(item);
      quantitiesByKey.set(key, Number(quantitiesByKey.get(key) || 0) + Number(item.quantity || 0));
    });

  return quantitiesByKey;
};

const buildTakeoffRows = (quote: any = {}, priceList: any[] = [], savedQuote: any = null) => {
  const sourceQuote = quote || {};
  const rowsByKey = new Map();
  const savedQuantitiesByKey = buildSavedMaterialQuantities(savedQuote || sourceQuote);
  const isComparingDraftToSavedQuote = Boolean(savedQuote && sourceQuote?.takeoffSource === "Current quote draft");
  const quoteItems = sourceQuote.items || [];
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
        key,
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
  savedTakeoffProducts = {},
  onBack,
  onOpenQuote,
  onNewTakeoff,
  onSaveTakeoffProducts,
  onSaveMaterialsToQuote,
  onUpdateTakeoffMaterialRow
}: any) {
  const getSavedTakeoffProduct = (materialName: string) =>
    savedTakeoffProducts[getSavedProductKey(materialName)] || null;
  const materialOptions = useMemo(() => {
    const materialsByKey = new Map();

    MATERIAL_PRESETS.forEach((preset) => {
      materialsByKey.set(getSavedProductKey(preset.name), preset);
    });

    Object.values(savedTakeoffProducts || {}).forEach((product: any) => {
      const productName = getMaterialDisplayName(product);
      if (!productName) return;
      materialsByKey.set(getSavedProductKey(productName), product);
    });

    return Array.from(materialsByKey.values()).sort((left: any, right: any) =>
      getMaterialDisplayName(left).localeCompare(getMaterialDisplayName(right))
    );
  }, [savedTakeoffProducts]);
  const getMaterialOptionByName = (materialName: string) =>
    materialOptions.find((option: any) => getSavedProductKey(option.name) === getSavedProductKey(materialName));
  const createMaterialFromPreset = (materialName = "Drywall", overrides: any = {}) => {
    const preset = MATERIAL_PRESETS.find((entry) => entry.name === materialName) || MATERIAL_PRESETS[0];
    const savedProduct = getSavedTakeoffProduct(preset.name);

    return createTakeoffMaterial({
      name: preset.name,
      baseUnit: savedProduct?.baseUnit || preset.baseUnit,
      productUnit: savedProduct?.baseUnit === "each" ? "pieces" : savedProduct?.productUnit || preset.productUnit,
      productLength: savedProduct?.productLength ?? preset.productLength,
      productWidth: savedProduct?.productWidth ?? preset.productWidth,
      productHeight: savedProduct?.productHeight ?? preset.productHeight,
      wastePercent: savedProduct?.wastePercent ?? "",
      pricePerUnit: savedProduct?.pricePerUnit ?? "",
      ...overrides
    });
  };
  const [takeoffMaterials, setTakeoffMaterials] = useState(() => [createMaterialFromPreset()]);
  const [editingMaterialRowKey, setEditingMaterialRowKey] = useState("");
  const [editingMaterialDraft, setEditingMaterialDraft] = useState<any>({});
  const calculatedTakeoffMaterials = useMemo(() => getCalculatedMaterials(takeoffMaterials), [takeoffMaterials]);
  const takeoffMaterialTotal = calculatedTakeoffMaterials.reduce((sum, material) => sum + Number(material.total || 0), 0);
  const readyTakeoffMaterialCount = calculatedTakeoffMaterials.filter((material) => material.name.trim() && material.quantity > 0).length;
  const isDraftTakeoff = quote?.takeoffSource === "Current quote draft";
  const takeoffRows = buildTakeoffRows(quote, priceList, savedQuote);
  const materialTotal = takeoffRows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const materialCount = takeoffRows.length;
  const missingPriceCount = takeoffRows.filter((row) => !row.pricePerUnit).length;
  const unsavedMaterialCount = takeoffRows.filter((row) => row.hasUnsavedQuantity).length;
  const inferredMaterialCount = takeoffRows.filter((row) => row.inferenceReasons.length).length;

  const updateTakeoffMaterial = (id, field, value) => {
    setTakeoffMaterials((previous) =>
      previous.map((material) => {
        if (material.id !== id) return material;

        if (field === "preset") {
          const preset = MATERIAL_PRESETS.find((entry) => entry.name === value);
          if (!preset) return material;
          const savedProduct = getSavedTakeoffProduct(preset.name);

          return {
            ...material,
            name: preset.name,
            baseUnit: savedProduct?.baseUnit || preset.baseUnit,
            productUnit: savedProduct?.baseUnit === "each" ? "pieces" : savedProduct?.productUnit || preset.productUnit,
            productLength: savedProduct?.productLength ?? preset.productLength,
            productWidth: savedProduct?.productWidth ?? preset.productWidth,
            productHeight: savedProduct?.productHeight ?? preset.productHeight,
            wastePercent: savedProduct?.wastePercent ?? "",
            pricePerUnit: savedProduct?.pricePerUnit ?? ""
          };
        }

        if (field === "name") {
          const materialOption: any = getMaterialOptionByName(value);

          if (materialOption) {
            return {
              ...material,
              name: materialOption.name,
              baseUnit: materialOption.baseUnit || material.baseUnit || "ft",
              productUnit: materialOption.baseUnit === "each" ? "pieces" : materialOption.productUnit || material.productUnit || "pieces",
              productLength: materialOption.productLength ?? material.productLength ?? "",
              productWidth: materialOption.productWidth ?? material.productWidth ?? "",
              productHeight: materialOption.productHeight ?? material.productHeight ?? "",
              wastePercent: materialOption.wastePercent ?? material.wastePercent ?? "",
              pricePerUnit: materialOption.pricePerUnit ?? material.pricePerUnit ?? ""
            };
          }

          return {
            ...material,
            name: value
          };
        }

        const numericFields = [
          "length",
          "width",
          "height",
          "productLength",
          "productWidth",
          "productHeight",
          "wastePercent",
          "pricePerUnit"
        ];

        if (field === "baseUnit" && value === "each") {
          return {
            ...material,
            baseUnit: value,
            width: "",
            height: "",
            productUnit: "pieces",
            productLength: "",
            productWidth: "",
            productHeight: ""
          };
        }

        if (field === "baseUnit") {
          return {
            ...material,
            baseUnit: value,
            productUnit: shouldAutoUpdateSquareProductUnit(material.productUnit)
              ? getDefaultProductUnitForBaseUnit(value)
              : material.productUnit
          };
        }

        if (field === "productUnit") {
          const productDimensionMode = getProductDimensionMode(value);

          return {
            ...material,
            productUnit: value,
            productWidth: productDimensionMode === "area" ? material.productWidth : "",
            productHeight: ""
          };
        }

        return {
          ...material,
          [field]: numericFields.includes(field) ? sanitizeNumericInput(value) : value
        };
      })
    );
  };

  const addTakeoffMaterial = () => {
    setTakeoffMaterials((previous) => [...previous, createMaterialFromPreset()]);
  };

  const removeTakeoffMaterial = (id) => {
    setTakeoffMaterials((previous) => previous.filter((material) => material.id !== id));
  };

  const saveTakeoffMaterials = (createNewQuote = false) => {
    onSaveTakeoffProducts?.(calculatedTakeoffMaterials);
    onSaveMaterialsToQuote?.(calculatedTakeoffMaterials, { createNewQuote });
  };

  const saveSingleTakeoffMaterial = (material) => {
    onSaveTakeoffProducts?.([material]);
  };

  const getMaterialWithAppliedField = (material, field, value) => {
    if (field === "name") {
      const materialOption: any = getMaterialOptionByName(value);

      if (materialOption) {
        return {
          ...material,
          name: materialOption.name,
          baseUnit: materialOption.baseUnit || material.baseUnit || "ft",
          productUnit: materialOption.baseUnit === "each" ? "pieces" : materialOption.productUnit || material.productUnit || "pieces",
          productLength: materialOption.productLength ?? material.productLength ?? "",
          productWidth: materialOption.productWidth ?? material.productWidth ?? "",
          productHeight: materialOption.productHeight ?? material.productHeight ?? "",
          wastePercent: materialOption.wastePercent ?? material.wastePercent ?? "",
          pricePerUnit: materialOption.pricePerUnit ?? material.pricePerUnit ?? ""
        };
      }

      return {
        ...material,
        name: value
      };
    }

    if (field === "baseUnit" && value === "each") {
      return {
        ...material,
        baseUnit: value,
        width: "",
        height: "",
        productUnit: "pieces",
        productLength: "",
        productWidth: "",
        productHeight: ""
      };
    }

    if (field === "baseUnit") {
      return {
        ...material,
        baseUnit: value,
        productUnit: shouldAutoUpdateSquareProductUnit(material.productUnit)
          ? getDefaultProductUnitForBaseUnit(value)
          : material.productUnit
      };
    }

    if (field === "productUnit") {
      const productDimensionMode = getProductDimensionMode(value);

      return {
        ...material,
        productUnit: value,
        productWidth: productDimensionMode === "area" ? material.productWidth : "",
        productHeight: ""
      };
    }

    const numericFields = [
      "length",
      "width",
      "height",
      "productLength",
      "productWidth",
      "productHeight",
      "wastePercent",
      "pricePerUnit"
    ];

    return {
      ...material,
      [field]: numericFields.includes(field) ? sanitizeNumericInput(value) : value
    };
  };

  const startEditingMaterialRow = (row) => {
    const savedProduct = getSavedTakeoffProduct(row.name);
    const productCoverage = getProductCoverage(savedProduct || {});
    const baseUnit = savedProduct?.baseUnit || (row.unit === "pieces" ? "each" : "ft");
    const length = savedProduct && baseUnit !== "each" && productCoverage
      ? String(roundToTwo(Number(row.quantity || 0) * productCoverage))
      : String(row.quantity || "");

    setEditingMaterialRowKey(row.key);
    setEditingMaterialDraft(createTakeoffMaterial({
      ...(savedProduct || {}),
      id: `edit-${row.key}`,
      name: row.name || savedProduct?.name || "",
      baseUnit,
      productUnit: baseUnit === "each" ? "pieces" : savedProduct?.productUnit || row.unit || "pieces",
      length,
      width: "",
      height: "",
      pricePerUnit: String(row.pricePerUnit || savedProduct?.pricePerUnit || "")
    }));
  };

  const updateEditingMaterialDraft = (field, value) => {
    setEditingMaterialDraft((previous) => getMaterialWithAppliedField(previous, field, value));
  };

  const cancelEditingMaterialRow = () => {
    setEditingMaterialRowKey("");
    setEditingMaterialDraft({});
  };

  const saveEditingMaterialRow = (row) => {
    const calculatedMaterial = getCalculatedMaterials([editingMaterialDraft])[0];

    onSaveTakeoffProducts?.([calculatedMaterial]);
    onUpdateTakeoffMaterialRow?.(row, {
      name: calculatedMaterial.name,
      quantity: calculatedMaterial.quantity,
      unit: calculatedMaterial.unit,
      pricePerUnit: calculatedMaterial.pricePerUnit
    });
    cancelEditingMaterialRow();
  };

  if (!quote) {
    return (
      <>
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>New Takeoff</h3>
              <p className="row-subtitle">Add materials, pick a unit, enter dimensions, then save them into a quote.</p>
            </div>
            <div className="button-row">
              <Button variant="secondary" onClick={onBack}>Back To Quotes</Button>
            </div>
          </div>
          <div className="takeoff-summary-strip">
            <div>
              <span className="stat-label">Ready Lines</span>
              <strong>{readyTakeoffMaterialCount}</strong>
            </div>
            <div>
              <span className="stat-label">Material Total</span>
              <strong>{formatMoney(takeoffMaterialTotal)}</strong>
            </div>
          </div>
        </Card>

        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Add Materials</h3>
              <p className="row-subtitle">One dimension calculates linear quantity, two calculate square units, and three calculate cubic units.</p>
            </div>
            <Button onClick={addTakeoffMaterial}>Add Material</Button>
          </div>

          <div className="takeoff-editor-list">
            {calculatedTakeoffMaterials.map((material) => {
              const isEachMaterial = material.baseUnit === "each";
              const materialName = getMaterialDisplayName(material);
              const savedMaterial = materialName ? getSavedTakeoffProduct(materialName) : null;
              const isSavedMaterial = Boolean(savedMaterial);
              const productDimensionMode = getProductDimensionMode(material.productUnit);

              return (
              <div key={material.id} className="takeoff-editor-row">
                <label>
                  Material
                  <input
                    list={`takeoff-material-options-${material.id}`}
                    value={material.name}
                    placeholder="Type or select material"
                    onChange={(event) => updateTakeoffMaterial(material.id, "name", event.target.value)}
                  />
                  <datalist id={`takeoff-material-options-${material.id}`}>
                    {materialOptions.map((option: any) => (
                      <option key={getSavedProductKey(option.name)} value={option.name} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Unit
                  <select value={material.baseUnit} onChange={(event) => updateTakeoffMaterial(material.id, "baseUnit", event.target.value)}>
                    {MEASUREMENT_UNIT_OPTIONS.map((unit) => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </label>
                {isEachMaterial ? (
                  <label>
                    Pieces
                    <input value={material.length} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "length", event.target.value)} />
                  </label>
                ) : (
                  <div className="takeoff-dimension-grid">
                    <label>
                      L
                      <input value={material.length} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "length", event.target.value)} />
                    </label>
                    <label>
                      W
                      <input value={material.width} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "width", event.target.value)} />
                    </label>
                    <label>
                      H
                      <input value={material.height} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "height", event.target.value)} />
                    </label>
                  </div>
                )}
                <label>
                  Sold By
                  {isEachMaterial ? (
                    <input value="Pieces" readOnly />
                  ) : (
                    <select value={material.productUnit} onChange={(event) => updateTakeoffMaterial(material.id, "productUnit", event.target.value)}>
                      {PRODUCT_UNIT_OPTIONS.map((unit) => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  )}
                </label>
                {!isEachMaterial && productDimensionMode === "coverage" ? (
                  <label>
                    Coverage
                    <input value={material.productLength} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "productLength", event.target.value)} />
                  </label>
                ) : null}
                {!isEachMaterial && productDimensionMode !== "coverage" ? (
                  <div className="takeoff-dimension-grid">
                    <label>
                      Product L
                      <input value={material.productLength} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "productLength", event.target.value)} />
                    </label>
                    {productDimensionMode === "area" ? (
                      <label>
                        Product W
                        <input value={material.productWidth} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "productWidth", event.target.value)} />
                      </label>
                    ) : null}
                  </div>
                ) : null}
                <label>
                  Waste %
                  <input value={material.wastePercent} inputMode="decimal" placeholder="0" onChange={(event) => updateTakeoffMaterial(material.id, "wastePercent", event.target.value)} />
                </label>
                <label>
                  Price Per {isEachMaterial ? "Pieces" : material.productUnit || "Unit"}
                  <input value={material.pricePerUnit} inputMode="decimal" placeholder="0.00" onChange={(event) => updateTakeoffMaterial(material.id, "pricePerUnit", event.target.value)} />
                </label>
                <div className="takeoff-calculated-cell">
                  <span className="stat-label">Measured</span>
                  <strong>{material.measuredQuantity || 0} {material.measuredUnit}</strong>
                  <span className="row-subtitle">
                    {isEachMaterial
                      ? "Sold individually"
                      : material.productCoverage
                      ? `${material.productCoverage} ${material.measuredUnit} per ${String(material.productUnit || "unit").replace(/s$/, "")}`
                      : "No product size set"}
                  </span>
                </div>
                <div className="takeoff-calculated-cell">
                  <span className="stat-label">Order Qty</span>
                  <strong>{material.quantity || 0} {material.unit}</strong>
                  <span className="row-subtitle">{formatMoney(material.total)}</span>
                </div>
                <div className="button-row">
                  {materialName ? (
                    <Button variant="secondary" onClick={() => saveSingleTakeoffMaterial(material)}>
                      {isSavedMaterial ? "Update Material" : "Save Item"}
                    </Button>
                  ) : null}
                  <Button variant="danger" onClick={() => removeTakeoffMaterial(material.id)}>Remove</Button>
                </div>
              </div>
              );
            })}
          </div>

          <div className="takeoff-save-actions">
            <Button onClick={() => saveTakeoffMaterials(false)}>Save And Add To Quote</Button>
            <Button variant="secondary" onClick={() => saveTakeoffMaterials(true)}>Save And Create New Quote</Button>
          </div>
        </Card>
      </>
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
            <Button variant="secondary" onClick={onNewTakeoff}>New Takeoff</Button>
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
              <div>Actions</div>
            </div>
            {takeoffRows.map((row) => {
              const isEditingRow = editingMaterialRowKey === row.key;
              const editingMaterial = isEditingRow
                ? getCalculatedMaterials([editingMaterialDraft])[0]
                : null;
              const isEachMaterial = editingMaterial?.baseUnit === "each";
              const productDimensionMode = getProductDimensionMode(editingMaterial?.productUnit);

              if (isEditingRow && editingMaterial) {
                return (
                  <div key={`${row.name}-${row.unit}-${row.category}-editor`} className="takeoff-generated-editor">
                    <div className="takeoff-editor-row">
                      <label>
                        Material
                        <input
                          list={`takeoff-material-options-edit-${row.key}`}
                          value={editingMaterial.name}
                          placeholder="Type or select material"
                          disabled
                          readOnly
                        />
                        <datalist id={`takeoff-material-options-edit-${row.key}`}>
                          {materialOptions.map((option: any) => (
                            <option key={getSavedProductKey(option.name)} value={option.name} />
                          ))}
                        </datalist>
                      </label>
                      <label>
                        Unit
                        <select value={editingMaterial.baseUnit} onChange={(event) => updateEditingMaterialDraft("baseUnit", event.target.value)}>
                          {MEASUREMENT_UNIT_OPTIONS.map((unit) => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </label>
                      {isEachMaterial ? (
                        <label>
                          Pieces
                          <input value={editingMaterial.length} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("length", event.target.value)} />
                        </label>
                      ) : (
                        <div className="takeoff-dimension-grid">
                          <label>
                            L
                            <input value={editingMaterial.length} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("length", event.target.value)} />
                          </label>
                          <label>
                            W
                            <input value={editingMaterial.width} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("width", event.target.value)} />
                          </label>
                          <label>
                            H
                            <input value={editingMaterial.height} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("height", event.target.value)} />
                          </label>
                        </div>
                      )}
                      <label>
                        Sold By
                        {isEachMaterial ? (
                          <input value="Pieces" readOnly />
                        ) : (
                          <select value={editingMaterial.productUnit} onChange={(event) => updateEditingMaterialDraft("productUnit", event.target.value)}>
                            {PRODUCT_UNIT_OPTIONS.map((unit) => (
                              <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                          </select>
                        )}
                      </label>
                      {!isEachMaterial && productDimensionMode === "coverage" ? (
                        <label>
                          Coverage
                          <input value={editingMaterial.productLength} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("productLength", event.target.value)} />
                        </label>
                      ) : null}
                      {!isEachMaterial && productDimensionMode !== "coverage" ? (
                        <div className="takeoff-dimension-grid">
                          <label>
                            Product L
                            <input value={editingMaterial.productLength} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("productLength", event.target.value)} />
                          </label>
                          {productDimensionMode === "area" ? (
                            <label>
                              Product W
                              <input value={editingMaterial.productWidth} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("productWidth", event.target.value)} />
                            </label>
                          ) : null}
                        </div>
                      ) : null}
                      <label>
                        Waste %
                        <input value={editingMaterial.wastePercent} inputMode="decimal" placeholder="0" onChange={(event) => updateEditingMaterialDraft("wastePercent", event.target.value)} />
                      </label>
                      <label>
                        Price Per {isEachMaterial ? "Pieces" : editingMaterial.productUnit || "Unit"}
                        <input value={editingMaterial.pricePerUnit} inputMode="decimal" placeholder="0.00" onChange={(event) => updateEditingMaterialDraft("pricePerUnit", event.target.value)} />
                      </label>
                      <div className="takeoff-calculated-cell">
                        <span className="stat-label">Measured</span>
                        <strong>{editingMaterial.measuredQuantity || 0} {editingMaterial.measuredUnit}</strong>
                        <span className="row-subtitle">
                          {isEachMaterial
                            ? "Sold individually"
                            : editingMaterial.productCoverage
                              ? `${editingMaterial.productCoverage} ${editingMaterial.measuredUnit} per ${String(editingMaterial.productUnit || "unit").replace(/s$/, "")}`
                              : "No product size set"}
                        </span>
                      </div>
                      <div className="takeoff-calculated-cell">
                        <span className="stat-label">Order Qty</span>
                        <strong>{editingMaterial.quantity || 0} {editingMaterial.unit}</strong>
                        <span className="row-subtitle">{formatMoney(editingMaterial.total)}</span>
                      </div>
                      <div className="button-row">
                        <Button variant="secondary" onClick={() => saveEditingMaterialRow(row)}>Save</Button>
                        <Button variant="secondary" onClick={cancelEditingMaterialRow}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
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
                  <div className="button-row">
                    <Button variant="secondary" onClick={() => startEditingMaterialRow(row)}>Edit</Button>
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
