import { logoutAction } from "./actions";
import { requireProviderSession } from "../lib/auth";

const actions = [
  "Edit organization profile",
  "Update locations and hours",
  "Publish price changes",
  "Manage availability",
  "Review last verification timestamps"
];

export default async function ProviderHome() {
  const session = await requireProviderSession();

  return (
    <main className="shell page-shell">
      <section className="masthead masthead-with-toolbar">
        <div>
          <p className="eyebrow">Provider Workspace</p>
          <h1>Direct data control for labs and clinics</h1>
          <p className="copy">
            Signed in as <strong>{session.user.email}</strong> with the <strong>{session.user.role}</strong> role.
            This shell is ready to connect provider users to `/v1/provider/*` endpoints so they can manage their own
            listings directly.
          </p>
        </div>

        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            Sign out
          </button>
        </form>
      </section>

      <section className="actions">
        {actions.map((action) => (
          <article className="card" key={action}>
            <h2>{action}</h2>
            <p>Attach authenticated forms and optimistic updates here.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
