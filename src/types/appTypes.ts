export type ThemeMode = "light" | "dark" | "system";
export type PageId = "dashboard" | "analysis" | "quotes" | "schedule" | "pricelist" | "contractor" | "customer" | "settings";

export interface QuoteItem {
  itemId?: string;
  name: string;
  roomId?: string;
  roomName?: string;
  roomTemplateId?: string;
  quantity: number;
  duration: number;
  unit: string;
  category: string;
  pricePerUnit: number;
  markupRate: number;
}

export interface CustomerProfile {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  unitNumber: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface ContractorProfile {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  companyType?: string;
  companyName: string;
  contactName: string;
  trade: string;
  status?: "active" | "inactive";
  lastAssignedJobDate?: string;
  phone: string;
  email: string;
  rate?: string;
  rateType?: "project" | "hour" | "day";
  address: string;
  unitNumber: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface PriceListItem {
  name: string;
  unit: string;
  pricePerUnit: number;
  duration: number;
  category: string;
}

export interface ScheduleItem extends QuoteItem {
  startDate: string;
  endDate: string;
  suggestedTrade?: string;
  assignedContractorId?: string;
  assignedContractorName?: string;
  assignedContractorTrade?: string;
  completed?: boolean;
  completedAt?: string;
  completionStatus?: "early" | "on-time" | "delayed";
}

export interface QuoteTotals {
  subtotal: number;
  markup: number;
  tax: number;
  total: number;
}

export interface SavedQuote {
  id: number;
  status?: "open" | "approved" | "ongoing" | "completed" | "invoiced";
  projectNumber?: number;
  invoicePartNumber?: number;
  projectTitle: string;
  clientName: string;
  customerId?: string;
  customerProfile?: CustomerProfile | null;
  contractorProfile?: ContractorProfile | null;
  projectAddress: string;
  quoteDate: string;
  startDate: string;
  createdAt: string;
  taxRate?: number;
  markupRate?: number;
  items: QuoteItem[];
  totals: QuoteTotals;
  schedule: ScheduleItem[];
}

export interface StatCard {
  label: string;
  value: string | number;
}

export interface PageOption {
  id: PageId;
  label: string;
}

export interface TemplateOption {
  id: string;
  label: string;
  defaults?: Record<string, number>;
}

export interface RoomTemplate {
  id: string;
  name: string;
  updatedAt: string;
  items: QuoteItem[];
}

export type TemplateFormValues = Record<string, number>;
