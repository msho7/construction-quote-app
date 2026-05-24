import { DEFAULT_ITEM_MARKUP_RATE, EMPTY_ITEM } from "../constants/appConstants";
import { createItemId, createRoomId } from "./idUtils";

export const createEmptyQuoteItem = (overrides: any = {}) => {
  const roomId = overrides.roomId || createRoomId();
  const itemId = overrides.itemId || createItemId();
  const markupRate = overrides.markupRate === undefined || overrides.markupRate === null || overrides.markupRate === ""
    ? EMPTY_ITEM.markupRate
    : Number(overrides.markupRate || 0);

  return {
    ...EMPTY_ITEM,
    ...overrides,
    itemId,
    roomId,
    roomName: overrides.roomName || "",
    quantity: Number(overrides.quantity ?? EMPTY_ITEM.quantity),
    pricePerUnit: Number(overrides.pricePerUnit ?? EMPTY_ITEM.pricePerUnit),
    duration: Number(overrides.duration ?? EMPTY_ITEM.duration),
    markupRate
  };
};

export const normalizeQuoteItems = (quoteItems = [], fallbackMarkupRate = DEFAULT_ITEM_MARKUP_RATE) => {
  if (!quoteItems.length) return [createEmptyQuoteItem()];

  let currentRoomId = null;
  let previousRoomName = null;

  return quoteItems.map((item) => {
    const normalizedRoomName = item.roomName || "";

    if (item.roomId) {
      currentRoomId = item.roomId;
      previousRoomName = normalizedRoomName || null;
      return createEmptyQuoteItem({
        ...item,
        roomId: item.roomId,
        roomName: normalizedRoomName,
        markupRate: item.markupRate ?? fallbackMarkupRate
      });
    }

    if (!normalizedRoomName || normalizedRoomName !== previousRoomName || !currentRoomId) {
      currentRoomId = createRoomId();
    }

    previousRoomName = normalizedRoomName || null;

    return createEmptyQuoteItem({
      ...item,
      roomId: currentRoomId,
      roomName: normalizedRoomName,
      markupRate: item.markupRate ?? fallbackMarkupRate
    });
  });
};

