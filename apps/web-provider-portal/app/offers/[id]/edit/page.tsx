import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { logoutAction } from "../../../actions";
import { requireProviderSession } from "../../../../lib/auth";
import { getProviderLocations, getProviderOffer, getProviderTests } from "../../../workspace-data";
import { ProviderOfferForm } from "../../forms";

type EditProviderOfferPageProps = { params: Promise<{ id: string }> };

export default async function EditProviderOfferPage({ params }: EditProviderOfferPageProps) {
  const session = await requireProviderSession();
  if (session.user.role !== "provider_admin") redirect("/offers");
  const { id } = await params;
  const [offer, locations, tests] = await Promise.all([getProviderOffer(id), getProviderLocations(), getProviderTests()]);
  if (!offer) notFound();

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div><p className="eyebrow">Location test offer</p><h1>Edit {offer.testName}</h1><p className="copy">Update pricing and availability for {offer.providerLocationName ?? "this location"}.</p></div>
        <div className="toolbar-actions"><Link className="secondary-button link-button" href="/offers">Back to offers</Link><form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form></div>
      </section>
      <section className="single-panel"><article className="card card-form"><ProviderOfferForm locations={locations} offer={offer} tests={tests} /></article></section>
    </main>
  );
}
