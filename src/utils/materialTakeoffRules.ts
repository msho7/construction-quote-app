// @ts-nocheck
const getNormalizedText = (value) => String(value || "").trim().toLowerCase();

const MATERIAL_INFERENCE_RULES = [
  {
    materialName: "Sink",
    laborKeywords: ["sink installation", "install sink"],
    materialKeywords: ["sink"]
  },
  {
    materialName: "Faucet",
    laborKeywords: ["faucet installation", "install faucet"],
    materialKeywords: ["faucet"]
  },
  {
    materialName: "Toilet",
    laborKeywords: ["toilet installation", "install toilet"],
    materialKeywords: ["toilet"]
  },
  {
    materialName: "Vanity",
    laborKeywords: ["vanity installation", "install vanity"],
    materialKeywords: ["vanity"]
  },
  {
    materialName: "Shower Kit",
    laborKeywords: ["shower installation", "install shower"],
    materialKeywords: ["shower kit", "shower"]
  },
  {
    materialName: "Bathtub",
    laborKeywords: ["bathtub installation", "install bathtub", "tub installation", "install tub"],
    materialKeywords: ["bathtub", "tub"]
  },
  {
    materialName: "Appliance",
    laborKeywords: ["appliance installation", "install appliance"],
    materialKeywords: ["appliance"]
  },
  {
    materialName: "Flooring Material",
    laborKeywords: ["flooring installation", "floor installation"],
    materialKeywords: ["flooring", "floor tile", "vinyl", "laminate", "hardwood"]
  },
  {
    materialName: "Backsplash Tile",
    laborKeywords: ["backsplash installation", "install backsplash"],
    materialKeywords: ["backsplash", "tile"]
  },
  {
    materialName: "Paint",
    laborKeywords: ["paint", "wall prep and paint"],
    materialKeywords: ["paint"]
  }
];

const getMatchingRule = (itemName) => {
  const normalizedName = getNormalizedText(itemName);
  return MATERIAL_INFERENCE_RULES.find((rule) =>
    rule.laborKeywords.some((keyword) => normalizedName.includes(keyword))
  );
};

const findPriceListMaterial = (rule, priceList = []) => {
  const materialItems = priceList.filter((item) => getNormalizedText(item.category) === "material");
  const exactMatch = materialItems.find(
    (item) => getNormalizedText(item.name) === getNormalizedText(rule.materialName)
  );

  if (exactMatch) return exactMatch;

  return materialItems.find((item) => {
    const itemName = getNormalizedText(item.name);
    return rule.materialKeywords.some((keyword) => itemName.includes(keyword));
  });
};

const hasMaterialForRule = (rule, items = []) =>
  items.some((item) => {
    if (getNormalizedText(item.category) !== "material") return false;

    const itemName = getNormalizedText(item.name);
    return rule.materialKeywords.some((keyword) => itemName.includes(keyword));
  });

export const inferMaterialTakeoffItems = (items = [], priceList = []) => {
  const inferredItemsByRule = new Map();

  items
    .filter((item) => getNormalizedText(item.category) !== "material")
    .forEach((item) => {
      const rule = getMatchingRule(item.name);
      if (!rule || hasMaterialForRule(rule, items)) return;

      const priceMatch = findPriceListMaterial(rule, priceList);
      const key = rule.materialName;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const existingItem = inferredItemsByRule.get(key);

      inferredItemsByRule.set(key, {
        itemId: `inferred-${getNormalizedText(rule.materialName).replace(/\s+/g, "-")}`,
        name: priceMatch?.name || rule.materialName,
        quantity: Number(existingItem?.quantity || 0) + quantity,
        unit: priceMatch?.unit || item.unit || "each",
        pricePerUnit: Number(priceMatch?.pricePerUnit || 0),
        duration: Number(priceMatch?.duration || 0),
        category: "Material",
        markupRate: Number(item.markupRate || 0),
        roomId: item.roomId || "",
        roomName: item.roomName || "",
        takeoffSource: priceMatch ? "Auto-inferred from price list" : "Auto-inferred",
        inferenceReason: `Needed because quote includes ${item.name}.`
      });
    });

  return Array.from(inferredItemsByRule.values());
};
