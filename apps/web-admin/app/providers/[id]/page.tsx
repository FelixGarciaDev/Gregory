import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "../../actions";
import { requireAdminSession } from "../../../lib/auth";
import { getProvider, type ProviderSnapshot } from "../data";

type ProviderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatAddress(location: ProviderSnapshot["locations"][number]) {
  return [
    location.addressLine1,
    location.addressLine2,
    location.city,
    location.stateRegion,
    location.postalCode,
    location.country
  ]
    .filter(Boolean)
    .join(", ");
}

function formatHour(dayOfWeek: number) {
  return dayNames[dayOfWeek] ?? `Day ${dayOfWeek}`;
}

function StatusBadge({ active, label }: { active: boolean; label?: string }) {
  return (
    <span className={active ? "badge" : "badge badge-muted"}>
      {label ?? (active ? "Active" : "Inactive")}
    </span>
  );
}

export default async function ProviderDetailsPage({ params }: ProviderDetailsPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Provider organization</p>
          <h1>{provider.name}</h1>
          <p className="lede">
            Review the full admin snapshot for this organization, including inactive records.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/providers">
            Back to organizations
          </Link>

          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="status-strip">
        <article className="status-card">
          <span className="status-label">Type</span>
          <strong>{provider.type}</strong>
        </article>

        <article className="status-card">
          <span className="status-label">Provider locations</span>
          <strong>{provider.locationCount}</strong>
        </article>

        <article className="status-card">
          <span className="status-label">Provider users</span>
          <strong>{provider.userCount}</strong>
        </article>

        <article className="status-card">
          <span className="status-label">Location test offers</span>
          <strong>{provider.offerCount}</strong>
        </article>
      </section>

      <section className="provider-actions-row">
        <Link className="primary-button link-button" href={`/providers/users/new?providerId=${provider.id}`}>
          Add user
        </Link>
      </section>

      <section className="provider-detail-layout">
        <article className="panel provider-detail-panel">
          <div className="provider-detail-header">
            <div className="section-heading">
              <h2>Organization details</h2>
              <p className="section-copy">These fields come from the provider organization record.</p>
            </div>
            <StatusBadge active={provider.isActive} />
          </div>

          <dl className="detail-list detail-grid">
            <div>
              <dt>Name</dt>
              <dd>{provider.name}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{provider.type}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{provider.phone ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>
                {provider.website ? (
                  <a href={provider.website} rel="noreferrer" target="_blank">
                    {provider.website}
                  </a>
                ) : (
                  "Not provided"
                )}
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(provider.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(provider.updatedAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel provider-detail-panel">
          <div className="section-heading">
            <h2>Assigned provider users</h2>
            <p className="section-copy">Users attached to this organization through membership records.</p>
          </div>

          <div className="user-list">
            {provider.users.length === 0 ? (
              <p className="section-copy">No provider users assigned yet.</p>
            ) : (
              provider.users.map((user) => (
                <div className="user-row" key={user.id}>
                  <div>
                    <strong>{user.fullName}</strong>
                    <p className="section-copy">
                      {user.email} - {user.role} - {user.membershipRole}
                    </p>
                  </div>
                  <StatusBadge active={user.isActive} />
                </div>
              ))
            )}
          </div>
        </article>

        <section className="provider-detail-panel">
          <div className="section-heading">
            <h2>Provider locations</h2>
            <p className="section-copy">Each location owns its hours, payment methods, and test offers.</p>
          </div>

          {provider.locations.length === 0 ? (
            <article className="panel">
              <p className="section-copy">No provider locations have been created yet.</p>
            </article>
          ) : (
            provider.locations.map((location) => (
              <article className="panel provider-location-panel" key={location.id}>
                <div className="provider-detail-header">
                  <div>
                    <h3>{location.name ?? "Unnamed location"}</h3>
                    <p className="section-copy">{formatAddress(location)}</p>
                  </div>
                  <StatusBadge active={location.isActive} />
                </div>

                <dl className="detail-list detail-grid">
                  <div>
                    <dt>Phone</dt>
                    <dd>{location.phone ?? "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Coordinates</dt>
                    <dd>
                      {location.latitude}, {location.longitude}
                    </dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(location.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDate(location.updatedAt)}</dd>
                  </div>
                </dl>

                {location.notes ? <p className="section-copy">Notes: {location.notes}</p> : null}

                <div className="snapshot-section">
                  <h4>Operating hours</h4>
                  {location.operatingHours.length === 0 ? (
                    <p className="section-copy">No operating hours recorded.</p>
                  ) : (
                    <div className="compact-list">
                      {location.operatingHours.map((hour) => (
                        <div className="compact-row" key={hour.id}>
                          <strong>{formatHour(hour.dayOfWeek)}</strong>
                          <span>{hour.isClosed ? "Closed" : `${hour.opensAt} - ${hour.closesAt}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="snapshot-section">
                  <h4>Payment methods</h4>
                  {location.paymentMethods.length === 0 ? (
                    <p className="section-copy">No payment methods recorded.</p>
                  ) : (
                    <div className="pill-list">
                      {location.paymentMethods.map((method) => (
                        <span className="pill" key={method.id}>
                          {method.label} ({method.code})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="snapshot-section">
                  <h4>Location test offers</h4>
                  {location.offers.length === 0 ? (
                    <p className="section-copy">No offers recorded for this location.</p>
                  ) : (
                    <div className="offer-list">
                      {location.offers.map((offer) => (
                        <article className="offer-item" key={offer.id}>
                          <div className="provider-detail-header">
                            <div>
                              <h5>{offer.test.name}</h5>
                              <p className="section-copy">
                                {offer.test.category} - {offer.priceAmount} {offer.currencyCode}
                              </p>
                            </div>
                            <StatusBadge active={offer.isAvailable} label={offer.publicStatus} />
                          </div>

                          <dl className="detail-list detail-grid">
                            <div>
                              <dt>Turnaround</dt>
                              <dd>{offer.turnaroundTime ?? "Not provided"}</dd>
                            </div>
                            <div>
                              <dt>Appointment</dt>
                              <dd>{offer.requiresAppointment ? "Required" : "Not required"}</dd>
                            </div>
                            <div>
                              <dt>Walk-in</dt>
                              <dd>{offer.walkInAllowed ? "Allowed" : "Not allowed"}</dd>
                            </div>
                            <div>
                              <dt>Verification source</dt>
                              <dd>{offer.verificationSource}</dd>
                            </div>
                            <div>
                              <dt>Last verified</dt>
                              <dd>{formatDate(offer.lastVerifiedAt)}</dd>
                            </div>
                            <div>
                              <dt>Verified by</dt>
                              <dd>{offer.verifiedByUser?.fullName ?? "Not recorded"}</dd>
                            </div>
                          </dl>

                          {offer.priceNotes ? <p className="section-copy">Price notes: {offer.priceNotes}</p> : null}

                          {offer.verificationRecords.length === 0 ? (
                            <p className="section-copy">No verification records.</p>
                          ) : (
                            <div className="compact-list">
                              {offer.verificationRecords.map((record) => (
                                <div className="compact-row" key={record.id}>
                                  <strong>{formatDate(record.verifiedAt)}</strong>
                                  <span>
                                    {record.method} by {record.verifiedByUser.fullName}
                                    {record.notes ? ` - ${record.notes}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
