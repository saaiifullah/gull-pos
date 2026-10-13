import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatQuantity, formatRupees, readQuantity, type Unit } from "@/lib/quantities";

type BalanceRow = {
  item_id: string;
  item_name: string;
  unit: Unit;
  remaining: number | string | null;
};

type ItemRow = {
  id: string;
  low_stock_threshold: number;
};

type ShopRow = {
  id: string;
  name: string;
  credit_limit: number | string | null;
};

type InvoiceRow = {
  shop_id: string | null;
  amount: number | string | null;
  status: string;
};

type PaymentRow = {
  direction: string;
  amount: number | string | null;
};

type OrderRow = {
  total: number | string | null;
  channel: string;
};

export type StockReportRow = {
  itemId: string;
  name: string;
  remainingLabel: string;
  low: boolean;
};

export type ShopBalanceRow = {
  id: string;
  name: string;
  creditLabel: string;
  owedLabel: string;
  roomLabel: string;
  over: boolean;
};

export type SalesLine = {
  label: string;
  value: string;
};

export type ReportsData = {
  itemCount: string;
  unpaid: string;
  shopCount: string;
  stock: StockReportRow[];
  sales: SalesLine[];
  shops: ShopBalanceRow[];
};

const emptyReports: ReportsData = {
  itemCount: "0",
  unpaid: "Rs 0",
  shopCount: "0",
  stock: [],
  sales: [],
  shops: [],
};

export const getReports = async (): Promise<ReportsData> => {
  const user = await getCurrentUser();
  if (!user) return emptyReports;

  const supabase = await createClient();
  const [balanceResult, itemResult, shopResult, invoiceResult, paymentResult, orderResult] =
    await Promise.all([
      supabase.from("inventory_balances").select("item_id, item_name, unit, remaining"),
      supabase.from("items").select("id, low_stock_threshold"),
      supabase.from("shops").select("id, name, credit_limit").order("name"),
      supabase.from("invoices").select("shop_id, amount, status"),
      supabase.from("payments").select("direction, amount"),
      supabase.from("orders").select("total, channel"),
    ]);

  const balances = balanceResult.error ? [] : ((balanceResult.data ?? []) as BalanceRow[]);
  const items = itemResult.error ? [] : ((itemResult.data ?? []) as ItemRow[]);
  const thresholds = new Map(items.map((item) => [item.id, item.low_stock_threshold]));
  const grouped = new Map<string, { name: string; unit: Unit; remaining: number }>();

  for (const row of balances) {
    const current = grouped.get(row.item_id) ?? {
      name: row.item_name,
      unit: row.unit,
      remaining: 0,
    };
    current.remaining += readQuantity(row.remaining);
    grouped.set(row.item_id, current);
  }

  const stock = [...grouped.entries()]
    .map(([itemId, row]) => ({
      itemId,
      name: row.name,
      remainingLabel: formatQuantity(row.remaining, row.unit),
      low: row.remaining <= (thresholds.get(itemId) ?? 0),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const invoices = invoiceResult.error ? [] : ((invoiceResult.data ?? []) as InvoiceRow[]);
  const payments = paymentResult.error ? [] : ((paymentResult.data ?? []) as PaymentRow[]);
  const orders = orderResult.error ? [] : ((orderResult.data ?? []) as OrderRow[]);
  const shops = shopResult.error ? [] : ((shopResult.data ?? []) as ShopRow[]);

  const owedByShop = new Map<string, number>();
  let invoiced = 0;
  let unpaid = 0;
  for (const invoice of invoices) {
    const amount = readQuantity(invoice.amount);
    invoiced += amount;
    if (invoice.status === "paid") continue;
    unpaid += amount;
    if (!invoice.shop_id) continue;
    owedByShop.set(invoice.shop_id, (owedByShop.get(invoice.shop_id) ?? 0) + amount);
  }

  let collected = 0;
  let spent = 0;
  for (const payment of payments) {
    const amount = readQuantity(payment.amount);
    if (payment.direction === "out") spent += amount;
    else collected += amount;
  }

  const retail = orders
    .filter((order) => order.channel === "retail")
    .reduce((sum, order) => sum + readQuantity(order.total), 0);

  const sales: SalesLine[] = [];
  if (!invoiceResult.error && invoices.length > 0) {
    sales.push({ label: "Wholesale invoiced", value: formatRupees(invoiced) });
    sales.push({ label: "Still unpaid", value: formatRupees(unpaid) });
  }
  if (!paymentResult.error && payments.length > 0) {
    sales.push({ label: "Collected", value: formatRupees(collected) });
    sales.push({ label: "Paid out", value: formatRupees(spent) });
  }
  if (!orderResult.error && orders.some((order) => order.channel === "retail")) {
    sales.push({ label: "Retail orders", value: formatRupees(retail) });
  }

  const shopBalances = shops.map((shop) => {
    const credit = readQuantity(shop.credit_limit);
    const owed = owedByShop.get(shop.id) ?? 0;
    const room = credit - owed;
    return {
      id: shop.id,
      name: shop.name,
      creditLabel: formatRupees(credit),
      owedLabel: formatRupees(owed),
      roomLabel: formatRupees(Math.abs(room)),
      over: room < 0,
    };
  });

  return {
    itemCount: String(stock.length),
    unpaid: formatRupees(unpaid),
    shopCount: String(shopBalances.length),
    stock,
    sales,
    shops: shopBalances,
  };
};
