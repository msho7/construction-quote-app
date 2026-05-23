// @ts-nocheck
export const createRoomId = () => `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const createItemId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const createRoomTemplateId = () => `room-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const createContractorId = () => `contractor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const createCustomerId = () => `customer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const createQuoteId = () => Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
