// @ts-nocheck
export const getNormalizedText = (value) => String(value || "").trim().toLowerCase();
export const getNormalizedItemName = (name) => getNormalizedText(name);
