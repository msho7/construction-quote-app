export const UNIT_OPTIONS = [
  { value: "each", label: "Each" },
  { value: "sheet", label: "Sheet" },
  { value: "panel", label: "Panel" },
  { value: "board", label: "Board" },
  { value: "foot", label: "Foot" },
  { value: "meter", label: "Meter" },
  { value: "length", label: "Length" },
  { value: "stick", label: "Stick" },
  { value: "bundle coverage", label: "Bundle coverage" },
  { value: "cubic yard", label: "Cubic Yard" },
  { value: "bag", label: "Bag" },
  { value: "load", label: "Load" },
  { value: "meter cubed", label: "m³" },
  { value: "cubic volume", label: "Cubic Volume" },
  { value: "sheets", label: "Sheets" },
  { value: "boxes", label: "Boxes" },
  { value: "pieces", label: "Pieces" },
  { value: "rolls", label: "Rolls" },
  { value: "gallons", label: "Gallons" },
  { value: "in", label: "Inches" },
  { value: "sq in", label: "Square Inches" },
  { value: "cu in", label: "Cubic Inches" },
  { value: "ft", label: "Feet" },
  { value: "sq ft", label: "Square Feet" },
  { value: "cu ft", label: "Cubic Feet" },
  { value: "lf", label: "Linear Feet" },
  { value: "sf", label: "Square Feet" },
  { value: "cm", label: "Centimeter" },
  { value: "sq cm", label: "Square Centimeters" },
  { value: "cu cm", label: "Cubic Centimeters" },
  { value: "m", label: "Meter" },
  { value: "sq m", label: "Square Meters" },
  { value: "cu m", label: "Cubic Meters" },
  { value: "km", label: "Kilometers" },
  { value: "sq km", label: "Square Kilometers" },
  { value: "cu km", label: "Cubic Kilometers" }
];

export const PAGE_OPTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "analysis", label: "Analysis" },
  { id: "quotes", label: "Quotes" },
  { id: "schedule", label: "Schedule" },
  { id: "takeoff", label: "Material Takeoff" },
  { id: "pricelist", label: "Price List" },
  { id: "contractor", label: "Contractors" },
  { id: "customer", label: "Customers" },
  { id: "server", label: "Server" },
  { id: "settings", label: "Settings" }
];

export const PROJECT_TEMPLATES = [
  {
    id: "bathroom",
    label: "Bathroom",
    description: "Auto-build a bathroom quote from room dimensions and fixture counts.",
    defaults: {
      roomLength: 8,
      roomWidth: 5,
      wallHeight: 8,
      vanityCount: 1,
      toiletCount: 1,
      showerCount: 1,
      bathtubCount: 0,
      doorCount: 1
    }
  },
  {
    id: "kitchen",
    label: "Kitchen",
    description: "Create a kitchen renovation starter quote from room size.",
    defaults: {
      roomLength: 12,
      roomWidth: 10,
      wallHeight: 8,
      cabinetLength: 16,
      applianceCount: 4,
      sinkCount: 1,
      backsplashArea: 35
    }
  }
];

export const DEFAULT_ITEM_MARKUP_RATE = 10;

export const EMPTY_ITEM = {
  itemId: "",
  name: "",
  roomId: "",
  roomName: "",
  roomTemplateId: "",
  quantity: 0,
  unit: "each",
  pricePerUnit: 0,
  markupRate: DEFAULT_ITEM_MARKUP_RATE,
  duration: 1,
  category: "Labor"
};

export const EMPTY_PRICE_ITEM = {
  name: "",
  unit: "each",
  pricePerUnit: 0,
  duration: 1,
  category: "Labor"
};

export const DEFAULT_TEMPLATE_VALUES = {
  bathroom: {
    roomLength: 8,
    roomWidth: 5,
    wallHeight: 8,
    vanityCount: 1,
    toiletCount: 1,
    showerCount: 1,
    bathtubCount: 0,
    doorCount: 1
  },
  kitchen: {
    roomLength: 12,
    roomWidth: 10,
    wallHeight: 8,
    cabinetLength: 16,
    applianceCount: 4,
    sinkCount: 1,
    backsplashArea: 35
  }
};
