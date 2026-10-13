import { getSettings } from "@/lib/settings";
import { EmptyRecord, RecordIntro, SummaryCard, recordPageClass } from "@/components/admin/record-page";

export const Settings = async () => {
  const settings = await getSettings();

  return (
    <div className={recordPageClass}>
      <RecordIntro
        eyebrow="TEAM"
        title="Settings"
        description="People who can sign in, and the role each one has. Changing a role comes later, and only an owner can do it."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Team summary">
        <SummaryCard label="PEOPLE" value={settings.people} />
        <SummaryCard label="STAFF" value={settings.staff} />
        <SummaryCard label="CUSTOMERS" value={settings.customers} />
      </ul>
      {settings.members.length === 0 ? (
        <EmptyRecord />
      ) : (
        <section className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white p-4 md:p-5">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] tracking-[0.12em] text-[#829089]">
                <th scope="col" className="pb-3 font-bold">
                  Name
                </th>
                <th scope="col" className="pb-3 font-bold">
                  Role
                </th>
                <th scope="col" className="pb-3 font-bold">
                  Shop
                </th>
              </tr>
            </thead>
            <tbody>
              {settings.members.map((member) => (
                <tr key={member.id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {member.name}
                  </th>
                  <td className="py-3 pr-4">{member.role}</td>
                  <td className="py-3">{member.shop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};
