import type { ReactNode } from "react";
import { getDashboard, type DashboardData } from "@/lib/dashboard";

const EmptyNote = () => {
  return <p className="text-sm leading-6 text-muted">Nothing in this workspace yet.</p>;
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#829089]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </li>
  );
};

const Panel = ({ title, children }: { title: string; children: ReactNode }) => {
  const headingId = title.toLowerCase().replaceAll(" ", "-");

  return (
    <section className="rounded-2xl border border-line bg-white p-4 md:p-5" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-base font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
};

const StockList = ({ stock }: { stock: DashboardData["stock"] }) => {
  if (stock.length === 0) return <EmptyNote />;

  return (
    <ul className="flex flex-col gap-4">
      {stock.map((item) => (
        <li key={item.itemId}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{item.name}</span>
            <span className="shrink-0 font-semibold">{item.remainingLabel}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2ef]" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${item.share}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const LowStockList = ({ items }: { items: DashboardData["lowStock"] }) => {
  if (items.length === 0) return <EmptyNote />;

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.itemId} className="flex items-baseline justify-between gap-3 text-sm">
          <span>{item.name}</span>
          <span className="font-semibold text-[#9a4b32]">{item.remainingLabel}</span>
        </li>
      ))}
    </ul>
  );
};

const BatchList = ({ batches }: { batches: DashboardData["batches"] }) => {
  if (batches.length === 0) return <EmptyNote />;

  return (
    <ul className="flex flex-col gap-4">
      {batches.map((batch) => (
        <li key={batch.number} className="text-sm">
          <p className="font-semibold">
            {batch.number}
            <span className="ml-2 font-medium text-muted">{batch.stage}</span>
          </p>
          <p className="mt-1 text-muted">
            {batch.itemName} · {batch.expected}
          </p>
          <p className="mt-1 text-muted">Due {batch.due}</p>
        </li>
      ))}
    </ul>
  );
};

const InvoiceList = ({ invoices }: { invoices: DashboardData["invoices"] }) => {
  if (invoices.length === 0) return <EmptyNote />;

  return (
    <ul className="flex flex-col gap-4">
      {invoices.map((invoice) => (
        <li key={invoice.number} className="text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold">{invoice.number}</p>
            <p className="font-semibold">{invoice.amount}</p>
          </div>
          <p className="mt-1 text-muted">
            {invoice.shop} · {invoice.status} · Due {invoice.due}
          </p>
        </li>
      ))}
    </ul>
  );
};

const DispatchList = ({ dispatches }: { dispatches: DashboardData["dispatches"] }) => {
  if (dispatches.length === 0) return <EmptyNote />;

  return (
    <ul className="flex flex-col gap-4">
      {dispatches.map((dispatch) => (
        <li key={dispatch.number} className="text-sm">
          <p className="font-semibold">
            {dispatch.number}
            <span className="ml-2 font-medium text-muted">{dispatch.status}</span>
          </p>
          <p className="mt-1 text-muted">
            {dispatch.shop} · {dispatch.delivery}
          </p>
        </li>
      ))}
    </ul>
  );
};

export const Dashboard = async () => {
  const dashboard = await getDashboard();

  return (
    <div className="mx-auto w-full max-w-[1530px] px-4 py-6 md:px-8 md:py-8">
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#829089]">DISTRIBUTION HQ</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.04em]">Dashboard</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {dashboard.fullName} · {dashboard.roleLabel}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
        <SummaryCard label="CLOTH ON HAND" value={dashboard.clothOnHand} />
        <SummaryCard label="PIECES ON HAND" value={dashboard.piecesOnHand} />
        <SummaryCard label="UNPAID INVOICES" value={dashboard.unpaidTotal} />
        <SummaryCard label="OPEN BATCHES" value={dashboard.openBatchCount} />
      </ul>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Panel title="Stock on hand">
          <StockList stock={dashboard.stock} />
        </Panel>
        <Panel title="Low stock">
          <LowStockList items={dashboard.lowStock} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Open production">
          <BatchList batches={dashboard.batches} />
        </Panel>
        <Panel title="Unpaid invoices">
          <InvoiceList invoices={dashboard.invoices} />
        </Panel>
        <Panel title="Recent dispatches">
          <DispatchList dispatches={dashboard.dispatches} />
        </Panel>
      </div>
    </div>
  );
};
