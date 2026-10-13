import { getAccounts } from "@/lib/accounts";
import { EmptyRecord, RecordIntro, SummaryCard, recordPageClass } from "@/components/admin/record-page";

export const Accounts = async () => {
  const accounts = await getAccounts();
  const hasRows = accounts.invoices.length > 0 || accounts.payments.length > 0;

  return (
    <div className={recordPageClass}>
      <RecordIntro
        eyebrow="MONEY IN AND OUT"
        title="Accounts"
        description="Invoices and payments already on the books. This list is a record only. Recording a payment comes later."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Account summary">
        <SummaryCard label="MONEY IN" value={accounts.moneyIn} />
        <SummaryCard label="MONEY OUT" value={accounts.moneyOut} />
        <SummaryCard label="STILL UNPAID" value={accounts.unpaid} />
      </ul>
      {hasRows ? (
        <div className="mt-4 flex flex-col gap-4">
          {accounts.invoices.length > 0 ? (
            <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Invoices</h2>
              <table className="mt-4 w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                    <th scope="col" className="pb-3 font-bold">
                      Invoice
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      Shop
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      Status
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Due
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-4 font-semibold">
                        {invoice.number}
                      </th>
                      <td className="py-3 pr-4">{invoice.shop}</td>
                      <td className="py-3 pr-4">
                        {invoice.open ? (
                          <span className="font-semibold text-[#9a4b32]">{invoice.status}</span>
                        ) : (
                          invoice.status
                        )}
                      </td>
                      <td className="py-3 text-right">{invoice.due}</td>
                      <td className="py-3 text-right font-semibold">{invoice.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {accounts.payments.length > 0 ? (
            <section className="overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
              <h2 className="text-base font-semibold tracking-[-0.03em]">Payments</h2>
              <table className="mt-4 w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                    <th scope="col" className="pb-3 font-bold">
                      Date
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      Direction
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      Memo
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      Shop
                    </th>
                    <th scope="col" className="pb-3 font-bold">
                      Invoice
                    </th>
                    <th scope="col" className="pb-3 text-right font-bold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-4 font-semibold">
                        {payment.date}
                      </th>
                      <td className="py-3 pr-4">
                        {payment.outgoing ? (
                          <span className="font-semibold text-[#9a4b32]">{payment.direction}</span>
                        ) : (
                          payment.direction
                        )}
                      </td>
                      <td className="py-3 pr-4">{payment.memo}</td>
                      <td className="py-3 pr-4">{payment.shop}</td>
                      <td className="py-3 pr-4">{payment.invoice}</td>
                      <td className="py-3 text-right font-semibold">{payment.amount}</td>
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
