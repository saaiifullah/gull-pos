import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatRupees, readQuantity } from "@/lib/quantities";

type Named = { name: string; number?: string };

type InvoiceShape = {
  id: string;
  number: string;
  amount: number | string | null;
  due_on: string | null;
  status: string;
  shops: Named | Named[] | null;
};

type PaymentShape = {
  id: string;
  direction: string;
  amount: number | string | null;
  memo: string;
  occurred_on: string;
  shops: Named | Named[] | null;
  invoices: Named | Named[] | null;
};

export type AccountInvoice = {
  id: string;
  number: string;
  shop: string;
  amount: string;
  status: string;
  open: boolean;
  due: string;
};

export type AccountPayment = {
  id: string;
  direction: string;
  outgoing: boolean;
  amount: string;
  memo: string;
  shop: string;
  invoice: string;
  date: string;
};

export type AccountsData = {
  moneyIn: string;
  moneyOut: string;
  unpaid: string;
  invoices: AccountInvoice[];
  payments: AccountPayment[];
};

const emptyAccounts: AccountsData = {
  moneyIn: "Rs 0",
  moneyOut: "Rs 0",
  unpaid: "Rs 0",
  invoices: [],
  payments: [],
};

const invoiceLabels: Record<string, string> = {
  open: "Open",
  overdue: "Overdue",
  paid: "Paid",
};

const directionLabels: Record<string, string> = {
  in: "In",
  out: "Out",
};

const readName = (value: Named | Named[] | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const named = Array.isArray(value) ? value[0] : value;
  return named?.name || named?.number || fallback;
};

export const getAccounts = async (): Promise<AccountsData> => {
  const user = await getCurrentUser();
  if (!user) return emptyAccounts;

  const supabase = await createClient();
  const [invoiceResult, paymentResult] = await Promise.all([
    supabase.from("invoices").select("id, number, amount, due_on, status, shops(name)").order("due_on"),
    supabase
      .from("payments")
      .select("id, direction, amount, memo, occurred_on, shops(name), invoices(number)")
      .order("occurred_on", { ascending: false }),
  ]);

  if (invoiceResult.error && paymentResult.error) return emptyAccounts;

  const invoiceRows = invoiceResult.error ? [] : ((invoiceResult.data ?? []) as InvoiceShape[]);
  const paymentRows = paymentResult.error ? [] : ((paymentResult.data ?? []) as PaymentShape[]);

  const invoices = invoiceRows
    .slice()
    .sort((left, right) => {
      const leftOpen = left.status === "paid" ? 1 : 0;
      const rightOpen = right.status === "paid" ? 1 : 0;
      if (leftOpen !== rightOpen) return leftOpen - rightOpen;
      return (left.due_on ?? "").localeCompare(right.due_on ?? "");
    })
    .map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      shop: readName(invoice.shops, "Shop"),
      amount: formatRupees(readQuantity(invoice.amount)),
      status: invoiceLabels[invoice.status] ?? invoice.status,
      open: invoice.status !== "paid",
      due: formatDate(invoice.due_on),
    }));

  let moneyIn = 0;
  let moneyOut = 0;
  const payments = paymentRows.map((payment) => {
    const amount = readQuantity(payment.amount);
    const outgoing = payment.direction === "out";
    if (outgoing) moneyOut += amount;
    else moneyIn += amount;
    return {
      id: payment.id,
      direction: directionLabels[payment.direction] ?? payment.direction,
      outgoing,
      amount: formatRupees(amount),
      memo: payment.memo,
      shop: readName(payment.shops, "—"),
      invoice: readName(payment.invoices, "—"),
      date: formatDate(payment.occurred_on),
    };
  });

  const unpaid = invoiceRows
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + readQuantity(invoice.amount), 0);

  return {
    moneyIn: formatRupees(moneyIn),
    moneyOut: formatRupees(moneyOut),
    unpaid: formatRupees(unpaid),
    invoices,
    payments,
  };
};
