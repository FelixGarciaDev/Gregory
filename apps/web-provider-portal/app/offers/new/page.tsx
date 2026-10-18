import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../../actions";
import { requireProviderSession } from "../../../lib/auth";
import { getProviderLocations, getProviderTests } from "../../workspace-data";
import { ProviderOfferForm } from "../forms";

type NewProviderOfferPageProps = { searchParams: Promise<{ locationId?: string }> };

export default async function NewProviderOfferPage({ searchParams }: NewProviderOfferPageProps) {
  const session = await requireProviderSession();
  if (session.user.role !== "provider_admin") redirect("/offers");
  const [{ locationId }, locations, tests] = await Promise.all([searchParams, getProviderLocations(), getProviderTests()]);

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div><p className="eyebrow">Provider Workspace</p><h1>Create location test offer</h1><p className="copy">Publish a canonical test, price, and availability for one location.</p></div>
        <div className="toolbar-actions"><Link className="secondary-button link-button" href="/offers">Back to offers</Link><form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form></div>
      </section>
      <section className="single-panel"><article className="card card-form"><ProviderOfferForm defaultLocationId={locationId} locations={locations} tests={tests} /></article></section>
    </main>
  );
}
