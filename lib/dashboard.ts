import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type Unit = "m" | "pcs";

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

type Named = { name: string };

type BatchRow = {
  number: string;
  stage: string;
  due_on: string | null;
  expected_units: number | string | null;
  output: { items: Named | Named[] | null } | { items: Named | Named[] | null }[] | null;
};

type InvoiceRow = {
  number: string;
  amount: number | string | null;
  due_on: string | null;
  status: string;
  shops: Named | Named[] | null;
};

type DispatchRow = {
  number: string;
  status: string;
  delivery_on: string | null;
  shops: Named | Named[] | null;
};

export type StockLine = {
  itemId: string;
  name: string;
  remainingLabel: string;
  share: number;
};

export type DashboardData = {
  fullName: string;
  roleLabel: string;
  clothOnHand: string;
  piecesOnHand: string;
  unpaidTotal: string;
  openBatchCount: string;
  stock: StockLine[];
  lowStock: { itemId: string; name: string; remainingLabel: string }[];
  batches: { number: string; itemName: string; stage: string; due: string; expected: string }[];
  invoices: { number: string; shop: string; amount: string; status: string; due: string }[];
  dispatches: { number: string; shop: string; status: string; delivery: string }[];
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  store_manager: "Store manager",
  accountant: "Accountant",
  shop: "Shop",
  customer: "Customer",
};

const stageLabels: Record<string, string> = {
  cutting: "Cutting",
  stitching: "Stitching",
  finished: "Finished",
};

const invoiceLabels: Record<string, string> = {
  open: "Open",
  overdue: "Overdue",
  paid: "Paid",
};

const dispatchLabels: Record<string, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
};

const emptyDashboard: DashboardData = {
  fullName: "Signed in",
  roleLabel: "Member",
  clothOnHand: "0 m",
  piecesOnHand: "0 pcs",
  unpaidTotal: "Rs 0",
  openBatchCount: "0",
  stock: [],
  lowStock: [],
  batches: [],
  invoices: [],
  dispatches: [],
};

const readQuantity = (value: number | string | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readName = (value: Named | Named[] | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const named = Array.isArray(value) ? value[0] : value;
  return named?.name || fallback;
};

const formatCount = (value: number) => {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
};

const formatQuantity = (value: number, unit: Unit) => {
  const suffix = unit === "m" ? "m" : "pcs";
  return `${formatCount(value)} ${suffix}`;
};

const formatRupees = (amount: number) => {
  const shown = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  return `Rs ${shown}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "No date";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const labelFor = (labels: Record<string, string>, value: string) => {
  return labels[value] ?? value;
};

export const getDashboard = async (): Promise<DashboardData> => {
  const user = await getCurrentUser();
  if (!user) return emptyDashboard;

  const supabase = await createClient();
  const [profileResult, balanceResult, itemResult, batchResult, invoiceResult, dispatchResult] =
    await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
      supabase.from("inventory_balances").select("item_id, item_name, unit, remaining"),
      supabase.from("items").select("id, low_stock_threshold"),
      supabase
        .from("production_batches")
        .select("number, stage, due_on, expected_units, output:item_variants!output_variant_id(items(name))")
        .neq("stage", "finished")
        .order("due_on", { ascending: true }),
      supabase
        .from("invoices")
        .select("number, amount, due_on, status, shops(name)")
        .in("status", ["open", "overdue"])
        .order("due_on", { ascending: true }),
      supabase
        .from("dispatches")
        .select("number, status, delivery_on, shops(name)")
        .order("delivery_on", { ascending: false })
        .limit(4),
    ]);

  const profile = profileResult.data;
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

  const stockRows = [...grouped.entries()]
    .map(([itemId, row]) => ({ itemId, ...row }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const widest = stockRows.reduce((highest, row) => Math.max(highest, row.remaining), 0);
  const cloth = stockRows
    .filter((row) => row.unit === "m")
    .reduce((total, row) => total + row.remaining, 0);
  const pieces = stockRows
    .filter((row) => row.unit === "pcs")
    .reduce((total, row) => total + row.remaining, 0);

  const lowStock = stockRows
    .filter((row) => row.remaining <= (thresholds.get(row.itemId) ?? 0))
    .sort((left, right) => left.remaining - right.remaining || left.name.localeCompare(right.name));

  const invoices = invoiceResult.error ? [] : ((invoiceResult.data ?? []) as InvoiceRow[]);
  const unpaid = invoices.reduce((total, invoice) => total + readQuantity(invoice.amount), 0);
  const batches = batchResult.error ? [] : ((batchResult.data ?? []) as BatchRow[]);
  const dispatches = dispatchResult.error ? [] : ((dispatchResult.data ?? []) as DispatchRow[]);

  return {
    fullName: profile?.full_name || "Signed in",
    roleLabel: labelFor(roleLabels, profile?.role ?? ""),
    clothOnHand: formatQuantity(cloth, "m"),
    piecesOnHand: formatQuantity(pieces, "pcs"),
    unpaidTotal: formatRupees(unpaid),
    openBatchCount: String(batches.length),
    stock: stockRows.map((row) => ({
      itemId: row.itemId,
      name: row.name,
      remainingLabel: formatQuantity(row.remaining, row.unit),
      share: widest > 0 ? Math.round((row.remaining / widest) * 100) : 0,
    })),
    lowStock: lowStock.map((row) => ({
      itemId: row.itemId,
      name: row.name,
      remainingLabel: formatQuantity(row.remaining, row.unit),
    })),
    batches: batches.map((batch) => {
      const output = Array.isArray(batch.output) ? batch.output[0] : batch.output;
      return {
        number: batch.number,
        itemName: readName(output?.items, "Item"),
        stage: labelFor(stageLabels, batch.stage),
        due: formatDate(batch.due_on),
        expected: `${formatCount(readQuantity(batch.expected_units))} expected`,
      };
    }),
    invoices: invoices.map((invoice) => ({
      number: invoice.number,
      shop: readName(invoice.shops, "Shop"),
      amount: formatRupees(readQuantity(invoice.amount)),
      status: labelFor(invoiceLabels, invoice.status),
      due: formatDate(invoice.due_on),
    })),
    dispatches: dispatches.map((dispatch) => ({
      number: dispatch.number,
      shop: readName(dispatch.shops, "Shop"),
      status: labelFor(dispatchLabels, dispatch.status),
      delivery: formatDate(dispatch.delivery_on),
    })),
  };
};
