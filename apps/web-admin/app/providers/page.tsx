import Link from "next/link";
import { logoutAction } from "../actions";
import { requireAdminSession } from "../../lib/auth";
import { getProviders } from "./data";

export default async function ProvidersPage() {
  await requireAdminSession();
  const providers = await getProviders();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Provider organizations</h1>
          <p className="lede">
            Review provider organizations and jump into the dedicated flows to create organizations or provider users.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/">
            Back to dashboard
          </Link>

          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="providers-actions">
        <Link className="primary-button link-button" href="/providers/new">
          Add organization
        </Link>
      </section>

      <section className="providers-list">
        <div className="section-heading">
          <h2>Existing provider organizations</h2>
          <p className="section-copy">Admins can verify which provider users are already attached before creating more.</p>
        </div>

        <div className="grid providers-layout">
          {providers.length === 0 ? (
            <article className="panel">
              <p className="section-copy">No provider organizations yet. Use the add organization flow to create the first one.</p>
            </article>
          ) : (
            providers.map((provider) => (
              <article className="panel provider-card" key={provider.id}>
                <Link
                  aria-label={`View ${provider.name} details`}
                  className="provider-card-hit-area"
                  href={`/providers/${provider.id}`}
                />
                <div className="provider-card-header">
                  <div>
                    <h3>{provider.name}</h3>
                    <p className="section-copy">
                      {provider.type} - {provider.locationCount} branches - {provider.userCount} users
                    </p>
                  </div>
                  <div className="provider-card-actions">
                    <button className="secondary-button" type="button">
                      Edit
                    </button>
                    {provider.website ? (
                      <a className="secondary-button link-button" href={provider.website} rel="noreferrer" target="_blank">
                        Website
                      </a>
                    ) : null}
                  </div>
                </div>

                {provider.phone ? <p className="section-copy">Phone: {provider.phone}</p> : null}

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
                        <span className={user.isActive ? "badge" : "badge badge-muted"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
