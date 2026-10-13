import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatRupees, readQuantity } from "@/lib/quantities";

type Named = { name: string };

type VariantShape = {
  items: Named | Named[] | null;
};

type OrderItemShape = {
  id: string;
  quantity: number | string | null;
  item_variants: VariantShape | VariantShape[] | null;
};

type ShopShape = {
  id: string;
  name: string;
  city: string;
  credit_limit: number | string | null;
  price_tier: string;
};

type InvoiceShape = {
  shop_id: string | null;
  amount: number | string | null;
  status: string;
};

type ProfileShape = {
  id: string;
  full_name: string;
  role: string;
};

type OrderShape = {
  id: string;
  number: string;
  user_id: string | null;
  shop_id: string | null;
  status: string;
  total: number | string | null;
  order_items: OrderItemShape[] | null;
};

export type ShopOrder = {
  id: string;
  number: string;
  status: string;
  totalLabel: string;
  items: string;
};

export type ShopRecord = {
  id: string;
  name: string;
  city: string;
  tier: string;
  creditLabel: string;
  owedLabel: string;
  open: boolean;
  orders: ShopOrder[];
};

export type CustomerRecord = {
  id: string;
  name: string;
  orders: ShopOrder[];
};

export type ShopsData = {
  shopCount: string;
  customerCount: string;
  owedTotal: string;
  shops: ShopRecord[];
  customers: CustomerRecord[];
};

const emptyShops: ShopsData = {
  shopCount: "0",
  customerCount: "0",
  owedTotal: "Rs 0",
  shops: [],
  customers: [],
};

const tierLabels: Record<string, string> = {
  wholesale: "Wholesale",
  retail: "Retail",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const readItemName = (variant: VariantShape | VariantShape[] | null) => {
  const row = Array.isArray(variant) ? variant[0] : variant;
  const item = Array.isArray(row?.items) ? row.items[0] : row?.items;
  return item?.name || "Item";
};

const readOrder = (order: OrderShape): ShopOrder => {
  const items = (order.order_items ?? [])
    .map((line) => {
      const quantity = readQuantity(line.quantity);
      return `${readItemName(line.item_variants)} × ${quantity}`;
    })
    .join(", ");

  return {
    id: order.id,
    number: order.number,
    status: statusLabels[order.status] ?? order.status,
    totalLabel: formatRupees(readQuantity(order.total)),
    items,
  };
};

export const getShops = async (): Promise<ShopsData> => {
  const user = await getCurrentUser();
  if (!user) return emptyShops;

  const supabase = await createClient();
  const [shopResult, invoiceResult, profileResult, orderResult] = await Promise.all([
    supabase.from("shops").select("id, name, city, credit_limit, price_tier").order("name"),
    supabase.from("invoices").select("shop_id, amount, status"),
    supabase.from("profiles").select("id, full_name, role").eq("role", "customer").order("full_name"),
    supabase
      .from("orders")
      .select("id, number, user_id, shop_id, status, total, order_items(id, quantity, item_variants(items(name)))")
      .order("created_at", { ascending: false }),
  ]);

  const shopRows = shopResult.error ? [] : ((shopResult.data ?? []) as ShopShape[]);
  const invoices = invoiceResult.error ? [] : ((invoiceResult.data ?? []) as InvoiceShape[]);
  const profiles = profileResult.error ? [] : ((profileResult.data ?? []) as ProfileShape[]);
  const orders = orderResult.error ? [] : ((orderResult.data ?? []) as OrderShape[]);

  const owedByShop = new Map<string, number>();
  for (const invoice of invoices) {
    if (!invoice.shop_id || invoice.status === "paid") continue;
    owedByShop.set(invoice.shop_id, (owedByShop.get(invoice.shop_id) ?? 0) + readQuantity(invoice.amount));
  }

  const ordersByShop = new Map<string, ShopOrder[]>();
  const ordersByCustomer = new Map<string, ShopOrder[]>();
  for (const order of orders) {
    const record = readOrder(order);
    if (order.shop_id) {
      const current = ordersByShop.get(order.shop_id) ?? [];
      current.push(record);
      ordersByShop.set(order.shop_id, current);
    }
    if (order.user_id) {
      const current = ordersByCustomer.get(order.user_id) ?? [];
      current.push(record);
      ordersByCustomer.set(order.user_id, current);
    }
  }

  const shops = shopRows.map((shop) => {
    const owed = owedByShop.get(shop.id) ?? 0;
    return {
      id: shop.id,
      name: shop.name,
      city: shop.city,
      tier: tierLabels[shop.price_tier] ?? shop.price_tier,
      creditLabel: formatRupees(readQuantity(shop.credit_limit)),
      owedLabel: formatRupees(owed),
      open: owed > 0,
      orders: ordersByShop.get(shop.id) ?? [],
    };
  });

  const customers = profiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name || "Customer",
    orders: ordersByCustomer.get(profile.id) ?? [],
  }));

  const owedTotal = [...owedByShop.values()].reduce((sum, amount) => sum + amount, 0);

  return {
    shopCount: String(shops.length),
    customerCount: String(customers.length),
    owedTotal: formatRupees(owedTotal),
    shops,
    customers,
  };
};
