// @ts-nocheck
import { formatMoney, formatQuoteReferenceNumber, getItemTotal } from "./appUtils";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const createFilename = (projectTitle, extension) => {
  const baseName = (projectTitle || "construction-quote")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "construction-quote"}.${extension}`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const toCurrencyNumber = (value) => Number(Number(value || 0).toFixed(2));

const combineParts = (parts) => parts.filter(Boolean).join(" • ");
const getProfileAddressDisplay = (profile = {}) => {
  const unitNumber = String(profile?.unitNumber || "").trim();
  const streetAddress = String(profile?.address || "").trim();
  const city = String(profile?.city || "").trim();
  const province = String(profile?.province || "").trim();
  const postalCode = String(profile?.postalCode || "").trim();
  const addressLine = unitNumber && streetAddress
    ? `${unitNumber}-${streetAddress}`
    : streetAddress || (unitNumber ? `Unit ${unitNumber}` : "");
  const localityLine = [city, province, postalCode].filter(Boolean).join(", ");
  return [addressLine, localityLine].filter(Boolean).join(", ");
};

const getEffectiveUnitPrice = (item) => {
  const quantity = Number(item.quantity || 0);
  const total = getItemTotal(item);

  if (!quantity) {
    return total || Number(item.pricePerUnit || 0);
  }

  return total / quantity;
};

const getItemDescription = (item) => {
  return item.name;
};

const getQuoteDisplayRows = (quoteItems) => {
  const rows = [];
  let previousRoomKey = null;

  quoteItems.forEach((item, index) => {
    const roomName = String(item.roomName || "").trim();
    const roomKey = roomName ? item.roomId || roomName.toLowerCase() : `ungrouped-${index}`;

    if (roomName && roomKey !== previousRoomKey) {
      rows.push({
        type: "room",
        roomName
      });
    }

    rows.push({
      type: "item",
      item
    });

    previousRoomKey = roomKey;
  });

  return rows;
};

const getQuoteTerms = (quote) => `Tax Rate: ${quote.taxRate}%`;

const getQuoteExportModel = (quote) => {
  const contractor = quote.contractorProfile || {};
  const customer = quote.customerProfile || {};
  const quoteItems = quote.items.filter((item) => item.name?.trim());
  const quoteNumber = formatQuoteReferenceNumber(quote);
  const validForDays = Number(quote.validForDays || 14);
  const quoteTerms = getQuoteTerms(quote);
  const companySecondaryLine = combineParts([contractor.trade, contractor.contactName, contractor.email]);
  const customerDetails = combineParts([customer.phone, customer.email]);
  const contractorAddress = getProfileAddressDisplay(contractor);
  const customerAddress = getProfileAddressDisplay(customer);
  const displayRows = getQuoteDisplayRows(quoteItems);
  const itemSubtotal = quoteItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  const discount = 0;
  const shipping = 0;
  const subtotalLessDiscount = itemSubtotal - discount;
  const totalTax = Number(quote.totals.tax || 0);
  const grandTotal = subtotalLessDiscount + totalTax + shipping;

  return {
    contractor,
    customer,
    quoteItems,
    quoteNumber,
    validForDays,
    quoteTerms,
    companySecondaryLine,
    contractorAddress,
    customerDetails,
    customerAddress,
    displayRows,
    itemSubtotal,
    discount,
    shipping,
    subtotalLessDiscount,
    totalTax,
    grandTotal
  };
};

const createExcelCell = ({
  value = "",
  type = "String",
  styleId = "Default",
  index,
  mergeAcross = 0
}) => {
  const indexAttribute = index ? ` ss:Index="${index}"` : "";
  const mergeAttribute = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : "";

  if (type === "Number" && Number.isFinite(Number(value))) {
    return `<Cell${indexAttribute}${mergeAttribute} ss:StyleID="${styleId}"><Data ss:Type="Number">${Number(value)}</Data></Cell>`;
  }

  return `<Cell${indexAttribute}${mergeAttribute} ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
};

const createExcelRow = (cells, height) => {
  const heightAttribute = height ? ` ss:AutoFitHeight="0" ss:Height="${height}"` : "";
  return `<Row${heightAttribute}>${cells.join("")}</Row>`;
};

const buildExcelWorkbook = (quote) => {
  const {
    contractor,
    customer,
    quoteNumber,
    validForDays,
    quoteTerms,
    companySecondaryLine,
    contractorAddress,
    customerDetails,
    customerAddress,
    displayRows,
    itemSubtotal,
    discount,
    shipping,
    subtotalLessDiscount,
    totalTax,
    grandTotal
  } = getQuoteExportModel(quote);
  const itemRowCount = Math.max(displayRows.length, 6);
  const rows = [];

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 5,
          styleId: "Blank",
          value: ""
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "CompanyName",
          value: contractor.companyName || "Construction Quote"
        }),
        createExcelCell({
          index: 5,
          mergeAcross: 1,
          styleId: "QuoteTitle",
          value: "QUOTE"
        })
      ],
      30
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "CompanyDetail",
          value: contractorAddress || ""
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "CompanyDetail",
          value: companySecondaryLine
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "CompanyDetail",
          value: contractor.phone || ""
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 5,
          styleId: "Blank",
          value: ""
        })
      ],
      12
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 2, mergeAcross: 1, styleId: "SectionLabel", value: "BILL TO" }),
        createExcelCell({ index: 4, mergeAcross: 1, styleId: "SectionLabel", value: "SHIP TO" }),
        createExcelCell({ index: 6, styleId: "MetaLabel", value: "Quote No:" }),
        createExcelCell({ styleId: "MetaValue", value: quoteNumber })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: quote.clientName || customer.customerName || customer.companyName || ""
        }),
        createExcelCell({
          index: 4,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: quote.projectTitle || "Project Site"
        }),
        createExcelCell({ index: 6, styleId: "MetaLabel", value: "Date:" }),
        createExcelCell({ styleId: "MetaValue", value: quote.quoteDate || "" })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: customer.companyName || ""
        }),
        createExcelCell({
          index: 4,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: quote.projectAddress || ""
        }),
        createExcelCell({ index: 6, styleId: "MetaLabel", value: "Valid For:" }),
        createExcelCell({ styleId: "MetaValue", value: `${validForDays} days` })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: customerAddress || quote.projectAddress || ""
        }),
        createExcelCell({
          index: 4,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: ""
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: customerDetails
        }),
        createExcelCell({
          index: 4,
          mergeAcross: 1,
          styleId: "SectionValue",
          value: ""
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 5,
          styleId: "Blank",
          value: ""
        })
      ],
      10
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 2, mergeAcross: 1, styleId: "TableHeaderLeft", value: "DESCRIPTION" }),
        createExcelCell({ styleId: "TableHeaderCenter", value: "QTY" }),
        createExcelCell({ styleId: "TableHeaderCenter", value: "UNIT PRICE" }),
        createExcelCell({ styleId: "TableHeaderCenter", value: "TOTAL" })
      ],
      20
    )
  );

  let itemDisplayIndex = 0;

  for (let index = 0; index < itemRowCount; index += 1) {
    const displayRow = displayRows[index];

    if (!displayRow) {
      rows.push(
        createExcelRow(
          [
            createExcelCell({
              index: 2,
              mergeAcross: 1,
              styleId: "TableText",
              value: ""
            }),
            createExcelCell({
              styleId: "TableNumber",
              value: ""
            }),
            createExcelCell({
              styleId: "TableMoney",
              value: ""
            }),
            createExcelCell({
              styleId: "TableMoney",
              value: ""
            })
          ],
          20
        )
      );
      continue;
    }

    if (displayRow.type === "room") {
      rows.push(
        createExcelRow(
          [
            createExcelCell({
              index: 2,
              mergeAcross: 4,
              styleId: "RoomHeader",
              value: displayRow.roomName
            })
          ],
          20
        )
      );
      continue;
    }

    const { item } = displayRow;
    const isAlt = itemDisplayIndex % 2 === 1;
    const textStyle = isAlt ? "TableTextAlt" : "TableText";
    const numberStyle = isAlt ? "TableNumberAlt" : "TableNumber";
    const moneyStyle = isAlt ? "TableMoneyAlt" : "TableMoney";

    rows.push(
      createExcelRow(
        [
          createExcelCell({
            index: 2,
            mergeAcross: 1,
            styleId: textStyle,
            value: item ? getItemDescription(item) : ""
          }),
          createExcelCell({
            styleId: numberStyle,
            type: item ? "Number" : "String",
            value: item ? Number(item.quantity || 0) : ""
          }),
          createExcelCell({
            styleId: moneyStyle,
            type: item ? "Number" : "String",
            value: item ? toCurrencyNumber(getEffectiveUnitPrice(item)) : ""
          }),
          createExcelCell({
            styleId: moneyStyle,
            type: item ? "Number" : "String",
            value: item ? toCurrencyNumber(getItemTotal(item)) : ""
          })
        ],
        20
      )
    );

    itemDisplayIndex += 1;
  }

  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "TotalsLabel", value: "SUBTOTAL" }),
        createExcelCell({ styleId: "TotalsValue", type: "Number", value: toCurrencyNumber(itemSubtotal) })
      ],
      20
    )
  );
  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "TotalsLabel", value: "DISCOUNT" }),
        createExcelCell({ styleId: "TotalsValue", type: "Number", value: toCurrencyNumber(discount) })
      ],
      20
    )
  );
  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "TotalsLabel", value: "SUBTOTAL LESS DISCOUNT" }),
        createExcelCell({ styleId: "TotalsValue", type: "Number", value: toCurrencyNumber(subtotalLessDiscount) })
      ],
      20
    )
  );
  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "TotalsLabel", value: "TAX RATE" }),
        createExcelCell({ styleId: "TotalsTextValue", value: `${quote.taxRate}%` })
      ],
      20
    )
  );
  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "TotalsLabel", value: "TOTAL TAX" }),
        createExcelCell({ styleId: "TotalsValue", type: "Number", value: toCurrencyNumber(totalTax) })
      ],
      20
    )
  );
  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "TotalsLabel", value: "SHIPPING/HANDLING" }),
        createExcelCell({ styleId: "TotalsValue", type: "Number", value: toCurrencyNumber(shipping) })
      ],
      20
    )
  );
  rows.push(
    createExcelRow(
      [
        createExcelCell({ index: 5, styleId: "GrandTotalLabel", value: "Quote Total" }),
        createExcelCell({ styleId: "GrandTotalValue", type: "Number", value: toCurrencyNumber(grandTotal) })
      ],
      28
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 4,
          styleId: "Blank",
          value: ""
        })
      ],
      12
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 4,
          styleId: "NotesHeader",
          value: "Terms"
        })
      ],
      18
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 4,
          styleId: "NotesText",
          value: quoteTerms
        })
      ],
      48
    )
  );

  rows.push(
    createExcelRow(
      [
        createExcelCell({
          index: 2,
          mergeAcross: 5,
          styleId: "ThankYou",
          value: "Thank you for your business!"
        })
      ],
      24
    )
  );

  const styles = `
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
    </Style>
    <Style ss:ID="Blank">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
    </Style>
    <Style ss:ID="CompanyName">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="20" ss:Bold="1" ss:Color="#333F4F"/>
    </Style>
    <Style ss:ID="QuoteTitle">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="22" ss:Bold="1" ss:Color="#4472C4"/>
    </Style>
    <Style ss:ID="CompanyDetail">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#434343"/>
    </Style>
    <Style ss:ID="SectionLabel">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#1F3864"/>
    </Style>
    <Style ss:ID="SectionValue">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
    </Style>
    <Style ss:ID="MetaLabel">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#434343"/>
    </Style>
    <Style ss:ID="MetaValue">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
    </Style>
    <Style ss:ID="TableHeaderLeft">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#1F3864"/>
      <Interior ss:Color="#F3F3F3" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TableHeaderCenter">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#1F3864"/>
      <Interior ss:Color="#F3F3F3" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="RoomHeader">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#333F4F"/>
      <Interior ss:Color="#EAF1FB" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7C8E6"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7C8E6"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7C8E6"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7C8E6"/>
      </Borders>
    </Style>
    <Style ss:ID="TableText">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TableTextAlt">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Interior ss:Color="#F8F8F8" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TableNumber">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TableNumberAlt">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Interior ss:Color="#F8F8F8" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TableMoney">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="Currency"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TableMoneyAlt">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="Currency"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Interior ss:Color="#F8F8F8" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TotalsLabel">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TotalsValue">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="Currency"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="TotalsTextValue">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="GrandTotalLabel">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#999999"/>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
      </Borders>
    </Style>
    <Style ss:ID="GrandTotalValue">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="Currency"/>
      <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#999999"/>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
      </Borders>
    </Style>
    <Style ss:ID="NotesHeader">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#333F4F"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFBFBF"/>
      </Borders>
    </Style>
    <Style ss:ID="NotesText">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#333F4F"/>
    </Style>
    <Style ss:ID="ThankYou">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#4472C4"/>
    </Style>
  </Styles>`;

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 ${styles}
 <Worksheet ss:Name="Quote">
  <Table ss:ExpandedColumnCount="7" ss:ExpandedRowCount="${rows.length}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Index="1" ss:Width="18"/>
   <Column ss:Index="2" ss:Width="220"/>
   <Column ss:Index="3" ss:Width="110"/>
   <Column ss:Index="4" ss:Width="65"/>
   <Column ss:Index="5" ss:Width="110"/>
   <Column ss:Index="6" ss:Width="115"/>
   <Column ss:Index="7" ss:Width="90"/>
   ${rows.join("")}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <DoNotDisplayGridlines/>
   <Panes>
    <Pane>
      <Number>3</Number>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
};

export const exportQuoteToExcel = (quote, filename) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const workbook = buildExcelWorkbook(quote);

  downloadBlob(
    new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    createFilename(filename || quote.projectTitle, "xls")
  );
};

const buildPdfDocument = (quote, documentTitle) => {
  const {
    contractor,
    customer,
    quoteNumber,
    validForDays,
    quoteTerms,
    companySecondaryLine,
    contractorAddress,
    customerDetails,
    customerAddress,
    displayRows,
    itemSubtotal,
    discount,
    shipping,
    subtotalLessDiscount,
    totalTax,
    grandTotal
  } = getQuoteExportModel(quote);

  const itemsMarkup = displayRows.length
    ? (() => {
        let itemDisplayIndex = 0;

        return displayRows
          .map((displayRow) => {
            if (displayRow.type === "room") {
              return `
                <tr class="room-row">
                  <td colspan="4">${escapeHtml(displayRow.roomName)}</td>
                </tr>
              `;
            }

            const { item } = displayRow;
            const rowClass = itemDisplayIndex % 2 === 1 ? "alt-row" : "";
            itemDisplayIndex += 1;

            return `
              <tr class="${rowClass}">
                <td>${escapeHtml(getItemDescription(item))}</td>
                <td class="number-cell">${Number(item.quantity || 0)}</td>
                <td class="money-cell">${formatMoney(getEffectiveUnitPrice(item))}</td>
                <td class="money-cell">${formatMoney(getItemTotal(item))}</td>
              </tr>
            `;
          })
          .join("");
      })()
    : `
        <tr>
          <td colspan="4" class="empty-row">No quote items added.</td>
        </tr>
      `;

  const termsMarkup = escapeHtml(quoteTerms).replace(/\n/g, "<br />");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(documentTitle)}</title>
    <style>
      @page {
        size: letter;
        margin: 0.55in;
      }
      body {
        font-family: Arial, sans-serif;
        color: #333f4f;
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
      }
      .sheet {
        width: 100%;
      }
      .top-grid {
        display: grid;
        grid-template-columns: 1.25fr 0.75fr;
        gap: 24px;
        align-items: start;
        margin-bottom: 22px;
      }
      .company-name {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 10px;
        color: #333f4f;
      }
      .company-detail {
        margin: 4px 0;
        color: #434343;
      }
      .quote-title {
        text-align: right;
        font-size: 34px;
        font-weight: 700;
        color: #4472c4;
        letter-spacing: 0.04em;
        margin: 0;
      }
      .bill-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 230px;
        gap: 18px;
        margin-bottom: 22px;
      }
      .bill-heading {
        font-size: 11px;
        font-weight: 700;
        color: #1f3864;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }
      .bill-block {
        min-height: 96px;
      }
      .bill-line {
        margin: 4px 0;
        white-space: pre-wrap;
      }
      .meta-table {
        width: 100%;
        border-collapse: collapse;
      }
      .meta-table td {
        padding: 6px 0;
        vertical-align: top;
      }
      .meta-label {
        text-align: right;
        font-weight: 700;
        color: #434343;
        width: 110px;
        padding-right: 10px;
      }
      .meta-value {
        text-align: left;
        color: #333f4f;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 18px;
      }
      .items-table th,
      .items-table td {
        border: 1px solid #bfbfbf;
        padding: 10px 12px;
        vertical-align: top;
      }
      .items-table th {
        background: #f3f3f3;
        color: #1f3864;
        font-size: 11px;
        text-align: left;
      }
      .items-table th.number-cell,
      .items-table th.money-cell,
      .items-table td.number-cell,
      .items-table td.money-cell {
        text-align: right;
        white-space: nowrap;
      }
      .alt-row td {
        background: #f8f8f8;
      }
      .room-row td {
        background: #eaf1fb;
        color: #333f4f;
        font-weight: 700;
        border-color: #b7c8e6;
      }
      .empty-row {
        text-align: center;
        color: #6b7280;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 24px;
        align-items: start;
        margin-bottom: 18px;
      }
      .notes-title {
        margin: 0 0 10px;
        font-size: 14px;
        font-weight: 700;
        color: #333f4f;
      }
      .notes-box {
        border-top: 1px solid #bfbfbf;
        padding-top: 12px;
        min-height: 120px;
        white-space: normal;
      }
      .totals-table {
        width: 100%;
        border-collapse: collapse;
      }
      .totals-table td {
        padding: 8px 0;
        border-top: 1px solid #bfbfbf;
      }
      .totals-label {
        text-align: right;
        font-size: 11px;
        font-weight: 700;
        color: #333f4f;
        padding-right: 14px;
      }
      .totals-value {
        text-align: right;
        white-space: nowrap;
      }
      .grand-total td {
        border-top: 2px solid #999999;
        border-bottom: 1px solid #999999;
        padding-top: 12px;
        padding-bottom: 12px;
        font-size: 16px;
        font-weight: 700;
      }
      .thank-you {
        margin-top: 20px;
        text-align: center;
        font-size: 18px;
        font-weight: 700;
        color: #4472c4;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="top-grid">
        <div>
          <h1 class="company-name">${escapeHtml(contractor.companyName || "Construction Quote")}</h1>
          <p class="company-detail">${escapeHtml(contractorAddress || "")}</p>
          <p class="company-detail">${escapeHtml(companySecondaryLine || "")}</p>
          <p class="company-detail">${escapeHtml(contractor.phone || "")}</p>
        </div>
        <div>
          <p class="quote-title">QUOTE</p>
        </div>
      </div>

      <div class="bill-grid">
        <div class="bill-block">
          <div class="bill-heading">BILL TO</div>
          <p class="bill-line">${escapeHtml(quote.clientName || customer.customerName || customer.companyName || "")}</p>
          <p class="bill-line">${escapeHtml(customer.companyName || "")}</p>
          <p class="bill-line">${escapeHtml(customerAddress || quote.projectAddress || "")}</p>
          <p class="bill-line">${escapeHtml(customerDetails || "")}</p>
        </div>

        <div class="bill-block">
          <div class="bill-heading">SHIP TO</div>
          <p class="bill-line">${escapeHtml(quote.projectTitle || "Project Site")}</p>
          <p class="bill-line">${escapeHtml(quote.projectAddress || "")}</p>
        </div>

        <div>
          <table class="meta-table">
            <tr>
              <td class="meta-label">Quote No:</td>
              <td class="meta-value">${escapeHtml(quoteNumber)}</td>
            </tr>
            <tr>
              <td class="meta-label">Date:</td>
              <td class="meta-value">${escapeHtml(quote.quoteDate || "")}</td>
            </tr>
            <tr>
              <td class="meta-label">Valid For:</td>
              <td class="meta-value">${escapeHtml(`${validForDays} days`)}</td>
            </tr>
          </table>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>DESCRIPTION</th>
            <th class="number-cell">QTY</th>
            <th class="money-cell">UNIT PRICE</th>
            <th class="money-cell">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemsMarkup}</tbody>
      </table>

      <div class="summary-grid">
        <div>
          <h2 class="notes-title">Terms</h2>
          <div class="notes-box">${termsMarkup}</div>
        </div>

        <div>
          <table class="totals-table">
            <tr>
              <td class="totals-label">SUBTOTAL</td>
              <td class="totals-value">${formatMoney(itemSubtotal)}</td>
            </tr>
            <tr>
              <td class="totals-label">DISCOUNT</td>
              <td class="totals-value">${formatMoney(discount)}</td>
            </tr>
            <tr>
              <td class="totals-label">SUBTOTAL LESS DISCOUNT</td>
              <td class="totals-value">${formatMoney(subtotalLessDiscount)}</td>
            </tr>
            <tr>
              <td class="totals-label">TAX RATE</td>
              <td class="totals-value">${escapeHtml(`${quote.taxRate}%`)}</td>
            </tr>
            <tr>
              <td class="totals-label">TOTAL TAX</td>
              <td class="totals-value">${formatMoney(totalTax)}</td>
            </tr>
            <tr>
              <td class="totals-label">SHIPPING/HANDLING</td>
              <td class="totals-value">${formatMoney(shipping)}</td>
            </tr>
            <tr class="grand-total">
              <td class="totals-label">Quote Total</td>
              <td class="totals-value">${formatMoney(grandTotal)}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="thank-you">Thank you for your business!</div>
    </div>
  </body>
</html>`;
};

export const exportQuoteToPdf = (quote, filename) => {
  if (typeof window === "undefined") return false;

  const documentTitle = filename || quote.projectTitle || "Construction Quote";
  const printableHtml = buildPdfDocument(quote, documentTitle);
  const printableBlob = new Blob([printableHtml], { type: "text/html;charset=utf-8;" });
  const printableUrl = URL.createObjectURL(printableBlob);
  const printWindow = window.open(printableUrl, "_blank", "width=960,height=720");
  if (!printWindow) {
    URL.revokeObjectURL(printableUrl);
    return false;
  }

  let hasTriggeredPrint = false;
  const triggerPrint = () => {
    if (hasTriggeredPrint) return;
    hasTriggeredPrint = true;

    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(printableUrl), 60000);
      }
    }, 250);
  };

  printWindow.onload = triggerPrint;

  const readyStatePoll = window.setInterval(() => {
    try {
      if (printWindow.closed) {
        window.clearInterval(readyStatePoll);
        URL.revokeObjectURL(printableUrl);
        return;
      }

      if (printWindow.document?.readyState === "complete") {
        window.clearInterval(readyStatePoll);
        triggerPrint();
      }
    } catch {
      // The blob document may not be ready on the first poll; keep waiting.
    }
  }, 200);

  return true;
};
