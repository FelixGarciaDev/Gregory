import Link from "next/link";
import { logoutAction } from "../../../actions";
import { requireAdminSession } from "../../../../lib/auth";
import { CreateProviderUserForm } from "../../forms";
import { getProviders } from "../../data";

export default async function NewProviderUserPage() {
  await requireAdminSession();
  const providers = await getProviders();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Create provider user</h1>
          <p className="lede">Assign either a `provider_admin` or `provider_user` account to an existing provider.</p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/providers">
            Back to providers
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
          <CreateProviderUserForm providers={providers.map(({ id, name }) => ({ id, name }))} />
        </article>
      </section>
    </main>
  );
}
