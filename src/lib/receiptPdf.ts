import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export interface ReceiptLine {
  name: string;
  qty: number;
  note?: string;
  lineTotal: number | null; // dam na thakle null
}

export interface ReceiptData {
  restaurantName: string;
  orderNumber: string;
  dateText: string;
  typeLabel: string;
  address?: string | null;
  paymentLabel: string;
  currency: string;
  lines: ReceiptLine[];
  subtotal: number | null;
  extra: number; // subtotal er opor onno charge
  total: number;
  hasPrices: boolean;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

export function buildReceiptHtml(d: ReceiptData): string {
  const money = (n: number) => `${esc(d.currency)}${round2(n)}`;

  const rows = d.lines
    .map(
      (l) => `
      <tr>
        <td class="item">
          <div class="name">${l.qty}× ${esc(l.name)}</div>
          ${l.note ? `<div class="note">${esc(l.note)}</div>` : ""}
        </td>
        <td class="price">${l.lineTotal !== null ? money(l.lineTotal) : ""}</td>
      </tr>`,
    )
    .join("");

  const extraRows =
    d.subtotal !== null && d.extra > 0.009
      ? `
      <tr><td class="label">Subtotal</td><td class="price">${money(d.subtotal)}</td></tr>
      <tr><td class="label">Other charges</td><td class="price">${money(d.extra)}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
  }
  .card { max-width: 420px; margin: 0 auto; }
  .header {
    background: #ea580c;
    color: #fff;
    border-radius: 18px;
    padding: 22px 20px;
    text-align: center;
  }
  .header .title { font-size: 22px; font-weight: 800; }
  .header .sub { margin-top: 4px; font-size: 13px; opacity: 0.85; }
  .section { padding: 16px 4px; border-bottom: 1px dashed #d1d5db; }
  .meta { width: 100%; border-collapse: collapse; }
  .meta td { padding: 4px 0; font-size: 13px; vertical-align: top; }
  .meta .k { color: #6b7280; }
  .meta .v { text-align: right; font-weight: 600; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items td { padding: 6px 0; font-size: 14px; vertical-align: top; }
  .item .name { font-weight: 600; }
  .item .note { font-size: 12px; color: #9ca3af; font-style: italic; margin-top: 2px; }
  .price { text-align: right; font-weight: 600; white-space: nowrap; padding-left: 12px; }
  .label { color: #6b7280; font-size: 13px; }
  .total td { padding-top: 12px; font-size: 18px; font-weight: 800; }
  .total .price { color: #ea580c; font-size: 22px; }
  .pay {
    margin-top: 16px;
    background: #fff7ed;
    color: #ea580c;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 700;
  }
  .foot { margin-top: 22px; text-align: center; font-size: 13px; color: #6b7280; }
  .warn { margin-top: 10px; text-align: center; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">${esc(d.restaurantName)}</div>
      <div class="sub">Receipt</div>
    </div>

    <div class="section">
      <table class="meta">
        <tr><td class="k">Order no.</td><td class="v">#${esc(d.orderNumber)}</td></tr>
        <tr><td class="k">Date</td><td class="v">${esc(d.dateText)}</td></tr>
        <tr><td class="k">Order type</td><td class="v">${esc(d.typeLabel)}</td></tr>
        ${d.address ? `<tr><td class="k">Address</td><td class="v">${esc(d.address)}</td></tr>` : ""}
      </table>
    </div>

    <div class="section">
      <table class="items">${rows}</table>
    </div>

    <div class="section" style="border-bottom: none;">
      <table class="items">
        ${extraRows}
        <tr class="total"><td>Total</td><td class="price">${money(d.total)}</td></tr>
      </table>
      <div class="pay">${esc(d.paymentLabel)}</div>
      ${
        d.hasPrices
          ? ""
          : `<div class="warn">Item prices aren't available for this order. The total comes from the restaurant.</div>`
      }
    </div>

    <div class="foot">Thank you for ordering with us!</div>
  </div>
</body>
</html>`;
}

/** PDF banay, tarpor phone er share sheet khole (WhatsApp, Drive, Files ityadi) */
/** PDF banay, tarpor phone er share sheet khole (WhatsApp, Drive, Files ityadi) */
export async function shareReceiptPdf(
  d: ReceiptData,
): Promise<"shared" | "unavailable"> {
  // 1. PDF banai, ar data ta base64 hishebe memory te nei
  let base64: string;
  try {
    const result = await Print.printToFileAsync({
      html: buildReceiptHtml(d),
      base64: true,
    });
    if (!result.base64) throw new Error("PDF data empty");
    base64 = result.base64;
  } catch (e) {
    throw new Error(
      `[1: PDF banate] ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // 2. App er nijer cache e shundor naam diye likhi
  // (Expo Go te print er original file share korte dey na)
  let uri: string;
  try {
    const safeName = d.orderNumber.replace(/[^A-Za-z0-9_-]/g, "");
    const target = new File(Paths.cache, `Receipt-${safeName}.pdf`);
    target.create({ overwrite: true });
    target.write(base64, { encoding: "base64" });
    uri = target.uri;
  } catch (e) {
    throw new Error(
      `[2: File likhte] ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // 3. Share sheet
  try {
    if (!(await Sharing.isAvailableAsync())) return "unavailable";
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: `Receipt #${d.orderNumber}`,
    });
  } catch (e) {
    throw new Error(
      `[3: Share korte] ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return "shared";
}
