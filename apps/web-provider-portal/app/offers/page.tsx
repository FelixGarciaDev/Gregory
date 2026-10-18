import Link from "next/link";
import { logoutAction } from "../actions";
import { requireProviderSession } from "../../lib/auth";
import { getProviderOffers } from "../workspace-data";

export default async function ProviderOffersPage() {
  const session = await requireProviderSession();
  const offers = await getProviderOffers();
  const canEdit = session.user.role === "provider_admin";

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div><p className="eyebrow">Provider Workspace</p><h1>Location test offers</h1><p className="copy">Manage prices and availability for tests offered by your locations.</p></div>
        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/">Back to workspace</Link>
          <form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form>
        </div>
      </section>

      {canEdit ? <div className="page-actions"><Link className="primary-button link-button" href="/offers/new">Add offer</Link></div> : null}

      <section className="record-list">
        {offers.length === 0 ? (
          <article className="card"><p className="section-copy">No location test offers yet.</p></article>
        ) : offers.map((offer) => (
          <article className="card record-card" key={offer.id}>
            <div className="record-card-header">
              <div><h2>{offer.testName}</h2><p className="section-copy">{offer.providerLocationName ?? "Unnamed location"} - {offer.testCategory}</p></div>
              {canEdit ? <Link className="secondary-button link-button" href={`/offers/${offer.id}/edit`}>Edit</Link> : null}
            </div>
            <div className="record-meta">
              <strong>{offer.priceAmount} {offer.currencyCode}</strong>
              <span>{offer.turnaroundTime ?? "No turnaround provided"}</span>
              <span className={offer.isAvailable ? "status-badge" : "status-badge status-badge-muted"}>{offer.publicStatus}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
