import Link from "next/link";
import { logoutAction } from "../../actions";
import { requireAdminSession } from "../../../lib/auth";
import { CreateProviderForm } from "../forms";

export default async function NewProviderPage() {
  await requireAdminSession();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Create provider organization</h1>
          <p className="lede">Create the organization first, then assign provider users from the user page.</p>
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

      <section className="single-column">
        <article className="panel form-panel">
          <CreateProviderForm />
        </article>
      </section>
    </main>
  );
}
