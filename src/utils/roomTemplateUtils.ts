import { DEFAULT_ITEM_MARKUP_RATE, DEFAULT_TEMPLATE_VALUES, PROJECT_TEMPLATES } from "../constants/appConstants";
import { createTemplateItems } from "./appUtils";
import { createItemId, createRoomTemplateId } from "./idUtils";

export const createEmptyRoomTemplateItem = (overrides: any = {}) => {
  const markupRate = overrides.markupRate === undefined || overrides.markupRate === null || overrides.markupRate === ""
    ? DEFAULT_ITEM_MARKUP_RATE
    : Number(overrides.markupRate || 0);

  const nextItem = {
    itemId: overrides.itemId || createItemId(),
    name: "",
    quantity: 0,
    unit: "each",
    pricePerUnit: 0,
    markupRate: DEFAULT_ITEM_MARKUP_RATE,
    duration: 1,
    category: "Labor"
  };

  return {
    ...nextItem,
    ...overrides,
    quantity: Number(overrides.quantity ?? nextItem.quantity),
    pricePerUnit: Number(overrides.pricePerUnit ?? nextItem.pricePerUnit),
    markupRate,
    duration: Number(overrides.duration ?? nextItem.duration)
  };
};

export const normalizeRoomTemplateItems = (templateItems: any[] = []) => {
  if (!templateItems.length) return [createEmptyRoomTemplateItem()];

  return templateItems.map((item) =>
    createEmptyRoomTemplateItem({
      ...item,
      quantity: Number(item.quantity || 0),
      pricePerUnit: Number(item.pricePerUnit || 0),
      markupRate: Number(item.markupRate ?? DEFAULT_ITEM_MARKUP_RATE),
      duration: Number(item.duration || 1)
    })
  );
};

export const serializeRoomTemplateItems = (templateItems: any[] = []) =>
  templateItems
    .filter((item) => item.name.trim())
    .map((item) => ({
      itemId: item.itemId || createItemId(),
      name: item.name.trim(),
      quantity: Number(item.quantity || 0),
      unit: item.unit || "each",
      pricePerUnit: Number(item.pricePerUnit || 0),
      markupRate: Number(item.markupRate ?? DEFAULT_ITEM_MARKUP_RATE),
      duration: Number(item.duration || 1),
      category: item.category || "Labor"
    }));

export const isBuiltInRoomTemplateId = (templateId) =>
  PROJECT_TEMPLATES.some((template) => template.id === templateId);

export const createBuiltInRoomTemplates = () =>
  PROJECT_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.label,
    builtIn: true,
    updatedAt: "Preinstalled",
    items: serializeRoomTemplateItems(
      createTemplateItems(
        template.id,
        DEFAULT_TEMPLATE_VALUES[template.id] || template.defaults || {}
      )
    )
  }));

export const normalizeRoomTemplateRecord = (template: any = {}) => {
  const builtInTemplate = PROJECT_TEMPLATES.find((entry) => entry.id === template.id);

  return {
    id: template.id || createRoomTemplateId(),
    name: template.name || builtInTemplate?.label || "Room Template",
    builtIn: Boolean(template.builtIn || builtInTemplate),
    updatedAt: template.updatedAt || (builtInTemplate ? "Preinstalled" : ""),
    items: serializeRoomTemplateItems(template.items || [])
  };
};

export const mergeSavedRoomTemplatesWithBuiltIns = (templates: any[] = []) => {
  const normalizedTemplates = templates.map(normalizeRoomTemplateRecord);
  const existingTemplateIds = new Set(normalizedTemplates.map((template) => template.id));
  const missingBuiltIns = createBuiltInRoomTemplates().filter(
    (template) => !existingTemplateIds.has(template.id)
  );

  return [...missingBuiltIns, ...normalizedTemplates];
};

