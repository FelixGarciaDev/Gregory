import Link from "next/link";
import { logoutAction } from "../actions";
import { requireAdminSession } from "../../lib/auth";
import { getAdminOffers } from "./data";

export default async function AdminOffersPage() {
  await requireAdminSession();
  const offers = await getAdminOffers();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Location test offers</h1>
          <p className="lede">Manage provider pricing and availability for every location.</p>
        </div>
        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/">Back to dashboard</Link>
          <form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form>
        </div>
      </section>

      <section className="providers-actions">
        <Link className="primary-button link-button" href="/offers/new">Add offer</Link>
      </section>

      <section className="providers-list">
        <div className="section-heading">
          <h2>Existing offers</h2>
          <p className="section-copy">Inactive offers remain visible so they can be reviewed or reactivated.</p>
        </div>
        <div className="grid providers-layout">
          {offers.length === 0 ? (
            <article className="panel"><p className="section-copy">No location test offers yet.</p></article>
          ) : offers.map((offer) => (
            <article className="panel provider-card" key={offer.id}>
              <Link aria-label={`Edit ${offer.testName} offer`} className="provider-card-hit-area" href={`/offers/${offer.id}/edit`} />
              <div className="provider-card-header">
                <div>
                  <h3>{offer.testName}</h3>
                  <p className="section-copy">{offer.providerName} - {offer.providerLocationName ?? "Unnamed location"}</p>
                </div>
                <div className="provider-card-actions">
                  <Link className="secondary-button link-button" href={`/offers/${offer.id}/edit`}>Edit</Link>
                </div>
              </div>
              <div className="test-card-meta">
                <strong>{offer.priceAmount} {offer.currencyCode}</strong>
                <span>{offer.turnaroundTime ?? "No turnaround provided"}</span>
                <span className={offer.isAvailable ? "badge" : "badge badge-muted"}>{offer.publicStatus}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
