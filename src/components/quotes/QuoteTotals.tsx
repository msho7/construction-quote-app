import React from "react";
import { Card } from "../ui";
import { QuoteTotals as QuoteTotalsType } from "../../types/appTypes";
import { formatMoney } from "../../utils/appUtils";

type QuoteTotalsProps = {
  dark: boolean;
  totals: QuoteTotalsType;
};

export default function QuoteTotals({ dark, totals }: QuoteTotalsProps) {
  return (
    <Card dark={dark}>
      <h3>Quote Totals</h3>
      <div className="totals-list">
        <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
        <div><span>Markup</span><strong>{formatMoney(totals.markup)}</strong></div>
        <div><span>Tax</span><strong>{formatMoney(totals.tax)}</strong></div>
        <div className="grand-total"><span>Total</span><strong>{formatMoney(totals.total)}</strong></div>
      </div>
    </Card>
  );
}