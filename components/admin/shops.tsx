import { getShops, type ShopOrder } from "@/lib/shops";
import { EmptyRecord, RecordIntro, SummaryCard, recordPageClass } from "@/components/admin/record-page";

const OrderList = ({ orders }: { orders: ShopOrder[] }) => {
  if (orders.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {orders.map((order) => (
        <li key={order.id} className="text-sm text-muted">
          <span className="font-semibold text-ink">{order.number}</span>
          {" · "}
          {order.status}
          {" · "}
          {order.totalLabel}
          {order.items ? <span className="mt-0.5 block text-xs">{order.items}</span> : null}
        </li>
      ))}
    </ul>
  );
};

export const Shops = async () => {
  const shops = await getShops();
  const hasRows = shops.shops.length > 0 || shops.customers.length > 0;

  return (
    <div className={recordPageClass}>
      <RecordIntro
        eyebrow="WHOLESALE AND RETAIL"
        title="Shops & Customers"
        description="Wholesale shops, what they still owe, and retail customers with their orders. This list is a record only."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Shop summary">
        <SummaryCard label="SHOPS" value={shops.shopCount} />
        <SummaryCard label="CUSTOMERS" value={shops.customerCount} />
        <SummaryCard label="STILL OWED" value={shops.owedTotal} />
      </ul>
      {hasRows ? (
        <div className="mt-4 flex flex-col gap-4">
          {shops.shops.length > 0 ? (
            <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Shops</h2>
              <table className="mt-4 w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                    <th scope="col" className="pb-3 font-bold">
                      Shop
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      City
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Credit limit
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Outstanding
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Tier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shops.shops.map((shop) => (
                    <tr key={shop.id} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-4 font-semibold">
                        {shop.name}
                        <OrderList orders={shop.orders} />
                      </th>
                      <td className="py-3 pr-4">{shop.city}</td>
                      <td className="py-3 text-right">{shop.creditLabel}</td>
                      <td className="py-3 text-right">
                        {shop.open ? (
                          <span className="font-semibold text-[#9a4b32]">{shop.owedLabel}</span>
                        ) : (
                          shop.owedLabel
                        )}
                      </td>
                      <td className="py-3 text-right">{shop.tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {shops.customers.length > 0 ? (
            <section className="rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Customers</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {shops.customers.map((customer) => (
                  <li key={customer.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold">{customer.name}</p>
                    {customer.orders.length === 0 ? (
                      <p className="mt-1 text-sm text-muted">No orders yet.</p>
                    ) : (
                      <OrderList orders={customer.orders} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyRecord />
      )}
    </div>
  );
};
