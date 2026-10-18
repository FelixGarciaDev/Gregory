import Link from "next/link";
import { logoutAction } from "../../actions";
import { requireAdminSession } from "../../../lib/auth";
import { CreateCanonicalTestForm } from "../forms";

export default async function NewCanonicalTestPage() {
  await requireAdminSession();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Create canonical test</h1>
          <p className="lede">
            Add one shared medical-test definition that provider locations can use for their offers.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/tests">
            Back to test catalog
          </Link>

          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="single-column">
        <article className="panel form-panel">
          <CreateCanonicalTestForm />
        </article>
      </section>
    </main>
  );
}
