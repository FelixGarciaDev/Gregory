import { logoutAction } from "./actions";
import { requireProviderSession } from "../lib/auth";
import { getProviderWorkspace } from "./workspace-data";

export default async function ProviderHome() {
  const session = await requireProviderSession();
  const workspace = await getProviderWorkspace();
  const isProviderAdmin = session.user.role === "provider_admin";
  const actions = isProviderAdmin
    ? [
        "Edit organization profile",
        "Update locations and hours",
        "Publish price changes",
        "Manage provider users",
        "Review last verification timestamps"
      ]
    : [
        "View organization profile",
        "Review locations and hours",
        "View prices and availability",
        "Review provider users",
        "Browse canonical tests"
      ];

  return (
    <main className="shell page-shell">
      <section className="masthead masthead-with-toolbar">
        <div>
          <p className="eyebrow">Provider Workspace</p>
          <h1>Direct data control for labs and clinics</h1>
          <p className="copy">
            Signed in as <strong>{session.user.email}</strong> with the <strong>{session.user.role}</strong> role.
            {workspace ? (
              <>
                {" "}
                You are scoped to <strong>{workspace.organization.name}</strong> with{" "}
                <strong>{workspace.organization.locationCount}</strong> active locations and{" "}
                <strong>{workspace.organization.userCount}</strong> active provider users.
              </>
            ) : (
              " The provider API is available through the authenticated `/v1/provider/*` routes."
            )}
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
            <p>
              {isProviderAdmin
                ? "Attach authenticated provider-admin forms here."
                : "Read-only provider users can review this data once the UI flow is attached."}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
