import Link from "next/link";
import { logoutAction } from "../../actions";
import { requireAdminSession } from "../../../lib/auth";
import { getCanonicalTests } from "../../tests/data";
import { getAdminLocationOptions } from "../data";
import { AdminOfferForm } from "../forms";

type NewAdminOfferPageProps = {
  searchParams: Promise<{ locationId?: string; providerId?: string }>;
};

export default async function NewAdminOfferPage({ searchParams }: NewAdminOfferPageProps) {
  await requireAdminSession();
  const [{ locationId, providerId }, locations, tests] = await Promise.all([
    searchParams,
    getAdminLocationOptions(),
    getCanonicalTests()
  ]);

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div><p className="eyebrow">Gregory Admin</p><h1>Create location test offer</h1><p className="lede">Attach one canonical test and price to a provider location.</p></div>
        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/offers">Back to offers</Link>
          <form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form>
        </div>
      </section>
      <section className="single-column"><article className="panel form-panel">
        <AdminOfferForm defaultLocationId={locationId} defaultProviderId={providerId} locations={locations} tests={tests} />
      </article></section>
    </main>
  );
}
