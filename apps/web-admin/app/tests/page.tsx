import Link from "next/link";
import { logoutAction } from "../actions";
import { requireAdminSession } from "../../lib/auth";
import { getCanonicalTests } from "./data";

function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

export default async function CanonicalTestsPage() {
  await requireAdminSession();
  const tests = await getCanonicalTests();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Canonical test catalog</h1>
          <p className="lede">
            Manage the shared medical tests that provider locations use when publishing offers.
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
        <Link className="primary-button link-button" href="/tests/new">
          Add canonical test
        </Link>
      </section>

      <section className="providers-list">
        <div className="section-heading">
          <h2>Existing canonical tests</h2>
          <p className="section-copy">
            Each provider offer points to one of these shared records, keeping names and categories consistent.
          </p>
        </div>

        <div className="grid providers-layout">
          {tests.length === 0 ? (
            <article className="panel">
              <p className="section-copy">No canonical tests yet. Create the first catalog entry.</p>
            </article>
          ) : (
            tests.map((test) => (
              <article className="panel provider-card" key={test.id}>
                <Link
                  aria-label={`Edit ${test.name}`}
                  className="provider-card-hit-area"
                  href={`/tests/${test.id}/edit`}
                />

                <div className="provider-card-header">
                  <div>
                    <h3>{test.name}</h3>
                    <p className="section-copy">
                      {formatCategory(test.category)} - {test.slug}
                    </p>
                  </div>

                  <div className="provider-card-actions">
                    <Link className="secondary-button link-button" href={`/tests/${test.id}/edit`}>
                      Edit
                    </Link>
                  </div>
                </div>

                <p className="section-copy">{test.description ?? "No description provided."}</p>

                <div className="test-card-meta">
                  <span>{test.offerCount} provider offers</span>
                  <span>{test.aliasCount} aliases</span>
                  <span className={test.isActive ? "badge" : "badge badge-muted"}>
                    {test.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
