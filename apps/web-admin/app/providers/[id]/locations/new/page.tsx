import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "../../../../actions";
import { requireAdminSession } from "../../../../../lib/auth";
import { getProvider } from "../../../data";
import { AdminLocationForm } from "../../../location-form";

type NewProviderLocationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewProviderLocationPage({ params }: NewProviderLocationPageProps) {
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
          <p className="eyebrow">Provider location</p>
          <h1>Add location</h1>
          <p className="lede">
            Create a location for <strong>{provider.name}</strong> with Google address search and an exact map pin.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href={`/providers/${provider.id}`}>
            Back to organization
          </Link>

          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="single-column location-form-column">
        <article className="panel form-panel">
          <AdminLocationForm providerId={provider.id} />
        </article>
      </section>
    </main>
  );
}
