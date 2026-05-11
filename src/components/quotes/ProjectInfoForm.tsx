import React from "react";
import { Button, Card, Input, Select } from "../ui";
import { getNumericInputValue, sanitizeNumericInput } from "../../utils/appUtils";
import { CustomerProfile } from "../../types/appTypes";

type ProjectInfoFormProps = {
  dark: boolean;
  projectTitle: string;
  clientName: string;
  selectedQuoteCustomerId: string;
  savedCustomers: CustomerProfile[];
  projectAddress: string;
  quoteDate: string;
  taxRate: number;
  startDate: string;
  onMarkApproved?: () => void;
  isQuoteApproved?: boolean;
  onSelectQuoteCustomer: (value: string) => void;
  onSetProjectTitle: (value: string) => void;
  onSetProjectAddress: (value: string) => void;
  onSetQuoteDate: (value: string) => void;
  onSetTaxRate: (value: number) => void;
  onSetStartDate: (value: string) => void;
};

export default function ProjectInfoForm({
  dark,
  projectTitle,
  clientName,
  selectedQuoteCustomerId,
  savedCustomers,
  projectAddress,
  quoteDate,
  taxRate,
  startDate,
  onMarkApproved,
  isQuoteApproved = false,
  onSelectQuoteCustomer,
  onSetProjectTitle,
  onSetProjectAddress,
  onSetQuoteDate,
  onSetTaxRate,
  onSetStartDate
}: ProjectInfoFormProps) {
  const getCustomerDisplayName = (customer: CustomerProfile) =>
    customer.customerName || customer.companyName || "Customer";
  const handleInputChange =
    (setter: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
    };
  const handleCustomerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectQuoteCustomer(event.target.value);
  };
  const handleTaxRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSetTaxRate(Number(sanitizeNumericInput(event.target.value) || 0));
  };

  return (
    <Card dark={dark}>
      <div className="section-header">
        <div>
          <h3>Project Info</h3>
          <p className="row-subtitle">
            Use a template for repeat jobs like bathrooms, then add custom items if needed.
          </p>
        </div>
        {!isQuoteApproved && onMarkApproved ? (
          <div className="button-row">
            <Button variant="secondary" onClick={onMarkApproved}>✅ Mark Approved</Button>
          </div>
        ) : null}
      </div>

      <div className="grid three-col">
        <label>
          Project Title
          <Input
            placeholder="Project Title"
            value={projectTitle}
            onChange={handleInputChange(onSetProjectTitle)}
          />
        </label>

        <label>
          Customer
          <Select
            value={selectedQuoteCustomerId}
            onChange={handleCustomerChange}
            disabled={!savedCustomers.length && !selectedQuoteCustomerId}
          >
            <option value="">
              {savedCustomers.length ? "Select saved customer" : "No saved customers yet"}
            </option>
            {selectedQuoteCustomerId && !savedCustomers.some((customer) => customer.id === selectedQuoteCustomerId) && clientName ? (
              <option value={selectedQuoteCustomerId}>{clientName} (Saved On Quote)</option>
            ) : null}
            {savedCustomers.map((customer) => (
              <option key={customer.id || getCustomerDisplayName(customer)} value={customer.id}>
                {getCustomerDisplayName(customer)}
              </option>
            ))}
          </Select>
        </label>

        <label>
          Project Address
          <Input
            placeholder="Project Address"
            value={projectAddress}
            onChange={handleInputChange(onSetProjectAddress)}
          />
        </label>

        <label>
          Quote Date
          <Input
            type="date"
            value={quoteDate}
            onChange={handleInputChange(onSetQuoteDate)}
          />
        </label>

        <label>
          Tax:
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Tax %"
            value={getNumericInputValue(taxRate)}
            onChange={handleTaxRateChange}
          />
        </label>

        <label>
          Start Date
          <Input
            type="date"
            value={startDate}
            onChange={handleInputChange(onSetStartDate)}
          />
        </label>
      </div>
    </Card>
  );
}
