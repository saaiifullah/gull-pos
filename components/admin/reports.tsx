import { getReports } from "@/lib/reports";
import { EmptyRecord, RecordIntro, SummaryCard, recordPageClass } from "@/components/admin/record-page";

export const Reports = async () => {
  const reports = await getReports();
  const hasRows = reports.stock.length > 0 || reports.sales.length > 0 || reports.shops.length > 0;

  return (
    <div className={recordPageClass}>
      <RecordIntro
        eyebrow="LIVE LEDGER"
        title="Reports"
        description="Stock on hand, money moved, and how much credit each shop still has. These figures come from the same records as the other pages."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Report summary">
        <SummaryCard label="ITEMS" value={reports.itemCount} />
        <SummaryCard label="STILL UNPAID" value={reports.unpaid} />
        <SummaryCard label="SHOPS" value={reports.shopCount} />
      </ul>
      {hasRows ? (
        <div className="mt-4 flex flex-col gap-4">
          {reports.stock.length > 0 ? (
            <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Stock on hand</h2>
              <table className="mt-4 w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                    <th scope="col" className="pb-3 font-bold">
                      Item
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Remaining
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.stock.map((row) => (
                    <tr key={row.itemId} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-4 font-semibold">
                        {row.name}
                      </th>
                      <td className="py-3 text-right">{row.remainingLabel}</td>
                      <td className="py-3 text-right">
                        {row.low ? (
                          <span className="font-semibold text-[#9a4b32]">Low</span>
                        ) : (
                          "In stock"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {reports.sales.length > 0 ? (
            <section className="rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Sales and cash</h2>
              <table className="mt-4 w-full text-left text-sm">
                <tbody>
                  {reports.sales.map((line) => (
                    <tr key={line.label} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-4 font-semibold">
                        {line.label}
                      </th>
                      <td className="py-3 text-right">{line.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {reports.shops.length > 0 ? (
            <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Shop balances</h2>
              <table className="mt-4 w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                    <th scope="col" className="pb-3 font-bold">
                      Shop
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Credit limit
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Outstanding
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Room left
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.shops.map((shop) => (
                    <tr key={shop.id} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-4 font-semibold">
                        {shop.name}
                      </th>
                      <td className="py-3 text-right">{shop.creditLabel}</td>
                      <td className="py-3 text-right">{shop.owedLabel}</td>
                      <td className="py-3 text-right">
                        {shop.over ? (
                          <span className="font-semibold text-[#9a4b32]">Over {shop.roomLabel}</span>
                        ) : (
                          shop.roomLabel
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyRecord />
      )}
    </div>
  );
};
