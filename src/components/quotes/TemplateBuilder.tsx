import React from "react";
import { Card, Button, Input } from "../ui";
import { TemplateFormValues, TemplateOption } from "../../types/appTypes";
import { getNumericInputValue, sanitizeNumericInput } from "../../utils/appUtils";

type TemplateBuilderProps = {
  dark: boolean;
  selectedTemplateId: string;
  templateFormValues: TemplateFormValues;
  projectTemplates: TemplateOption[];
  onUpdateTemplateField: (field: string, value: string) => void;
  onApplyTemplate: () => void;
  onClose: () => void;
};

const TEMPLATE_FIELDS: Record<string, { key: string; placeholder: string }[]> = {
  bathroom: [
    { key: "roomLength", placeholder: "Room length" },
    { key: "roomWidth", placeholder: "Room width" },
    { key: "wallHeight", placeholder: "Wall height" },
    { key: "vanityCount", placeholder: "Vanity count" },
    { key: "toiletCount", placeholder: "Toilet count" },
    { key: "showerCount", placeholder: "Shower count" },
    { key: "bathtubCount", placeholder: "Bathtub count" },
    { key: "doorCount", placeholder: "Door count" }
  ],
  kitchen: [
    { key: "roomLength", placeholder: "Room length" },
    { key: "roomWidth", placeholder: "Room width" },
    { key: "wallHeight", placeholder: "Wall height" },
    { key: "cabinetLength", placeholder: "Cabinet length" },
    { key: "applianceCount", placeholder: "Appliance count" },
    { key: "sinkCount", placeholder: "Sink count" },
    { key: "backsplashArea", placeholder: "Backsplash area" }
  ]
};

export default function TemplateBuilder({
  dark,
  selectedTemplateId,
  templateFormValues,
  projectTemplates,
  onUpdateTemplateField,
  onApplyTemplate,
  onClose
}: TemplateBuilderProps) {
  const selectedTemplate = projectTemplates.find((template) => template.id === selectedTemplateId);
  const fields = TEMPLATE_FIELDS[selectedTemplateId] || [];

  if (!selectedTemplateId) return null;

  return (
    <Card dark={dark} className="template-builder-card">
      <div className="section-header">
        <div>
          <h3>{selectedTemplate?.label || "Template"} Template Builder</h3>
          <p className="row-subtitle">
            Enter the project sizes below and the quote items will be generated automatically.
          </p>
        </div>
        <Button variant="danger" onClick={onClose}>Close</Button>
      </div>

      <div className="grid template-grid">
        {fields.map((field) => (
          <Input
            key={field.key}
            type="text"
            inputMode="decimal"
            placeholder={field.placeholder}
            value={getNumericInputValue(templateFormValues[field.key])}
            onChange={(e) => onUpdateTemplateField(field.key, sanitizeNumericInput(e.target.value))}
          />
        ))}
      </div>

      <div className="button-row template-actions">
        <Button onClick={onApplyTemplate}>Add Template Items</Button>
        <Button variant="secondary" onClick={onClose}>Keep Editing Manually</Button>
      </div>
    </Card>
  );
}
