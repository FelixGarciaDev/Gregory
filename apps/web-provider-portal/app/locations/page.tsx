import Link from "next/link";
import { logoutAction } from "../actions";
import { requireProviderSession } from "../../lib/auth";
import { getProviderLocations } from "../workspace-data";

function address(location: Awaited<ReturnType<typeof getProviderLocations>>[number]) {
  return [location.addressLine1, location.addressLine2, location.city, location.stateRegion, location.country].filter(Boolean).join(", ");
}

export default async function ProviderLocationsPage() {
  const session = await requireProviderSession();
  const locations = await getProviderLocations();
  const canEdit = session.user.role === "provider_admin";

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div><p className="eyebrow">Provider Workspace</p><h1>Provider locations</h1><p className="copy">Review the branches belonging to your organization.</p></div>
        <div className="toolbar-actions"><Link className="secondary-button link-button" href="/">Back to workspace</Link><form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form></div>
      </section>

      {canEdit ? <div className="page-actions"><Link className="primary-button link-button" href="/locations/new">Add location</Link></div> : null}

      <section className="record-list">
        {locations.length === 0 ? (
          <article className="card"><p className="section-copy">No active locations yet.</p></article>
        ) : locations.map((location) => (
          <article className="card record-card" key={location.id}>
            <div className="record-card-header">
              <div><h2>{location.name ?? "Unnamed location"}</h2><p className="section-copy">{address(location)}</p></div>
              <div className="record-actions">
                {canEdit ? <Link className="secondary-button link-button" href={`/locations/${location.id}/edit`}>Edit</Link> : null}
                {canEdit ? <Link className="secondary-button link-button" href={`/offers/new?locationId=${location.id}`}>Add offer</Link> : null}
              </div>
            </div>
            <div className="record-meta"><span>{location.phone ?? "No phone provided"}</span><span className="status-badge">Active</span></div>
          </article>
        ))}
      </section>
    </main>
  );
}
