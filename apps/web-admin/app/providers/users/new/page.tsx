import Link from "next/link";
import { logoutAction } from "../../../actions";
import { requireAdminSession } from "../../../../lib/auth";
import { CreateProviderUserForm } from "../../forms";
import { getProviders } from "../../data";

type NewProviderUserPageProps = {
  searchParams: Promise<{
    providerId?: string;
  }>;
};

export default async function NewProviderUserPage({ searchParams }: NewProviderUserPageProps) {
  await requireAdminSession();
  const { providerId } = await searchParams;
  const providers = await getProviders();
  const selectedProvider = providers.find((provider) => provider.id === providerId);
  const defaultProviderId = selectedProvider?.id;

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Create provider user</h1>
          <p className="lede">
            Assign either a provider_admin or provider_user account to an existing provider organization.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href={defaultProviderId ? `/providers/${defaultProviderId}` : "/providers"}>
            {defaultProviderId ? "Back to organization" : "Back to organizations"}
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
          <CreateProviderUserForm
            defaultProviderId={defaultProviderId}
            providers={providers.map(({ id, name }) => ({ id, name }))}
          />
        </article>
      </section>
    </main>
  );
}
