import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "../../../actions";
import { requireAdminSession } from "../../../../lib/auth";
import { getCanonicalTests } from "../../../tests/data";
import { getAdminLocationOptions, getAdminOffer } from "../../data";
import { AdminOfferForm } from "../../forms";

type EditAdminOfferPageProps = { params: Promise<{ id: string }> };

export default async function EditAdminOfferPage({ params }: EditAdminOfferPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const [offer, locations, tests] = await Promise.all([getAdminOffer(id), getAdminLocationOptions(), getCanonicalTests()]);
  if (!offer) notFound();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div><p className="eyebrow">Location test offer</p><h1>Edit {offer.testName}</h1><p className="lede">Update pricing and availability for {offer.providerName}.</p></div>
        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/offers">Back to offers</Link>
          <form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form>
        </div>
      </section>
      <section className="single-column"><article className="panel form-panel">
        <AdminOfferForm locations={locations} offer={offer} tests={tests} />
      </article></section>
    </main>
  );
}
