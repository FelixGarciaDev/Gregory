import Link from "next/link";
import { logoutAction } from "./actions";
import { requireProviderSession } from "../lib/auth";
import { getProviderWorkspace } from "./workspace-data";

export default async function ProviderHome() {
  const session = await requireProviderSession();
  const workspace = await getProviderWorkspace();
  const isProviderAdmin = session.user.role === "provider_admin";
  const actions = isProviderAdmin
    ? [
        { title: "Update locations and hours", href: "/locations" },
        { title: "Location test offers", href: "/offers" },
        { title: "Manage provider users" },
        { title: "Review last verification timestamps" }
      ]
    : [
        { title: "View organization profile" },
        { title: "Review locations and hours", href: "/locations" },
        { title: "View prices and availability", href: "/offers" },
        { title: "Review provider users" },
        { title: "Browse canonical tests" }
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
        {isProviderAdmin ? (
          <Link className="card card-accent card-link" href="/organization">
            <h2>Edit organization profile</h2>
            <p>Update provider name, type, phone, and website for your scoped organization.</p>
          </Link>
        ) : null}

        {actions.map((action) =>
          action.href ? (
            <Link className="card card-link" href={action.href} key={action.title}>
              <h2>{action.title}</h2>
              <p>{isProviderAdmin ? "Open the authenticated management flow." : "Review scoped provider data."}</p>
            </Link>
          ) : (
            <article className="card" key={action.title}>
              <h2>{action.title}</h2>
              <p>{isProviderAdmin ? "This management flow is not attached yet." : "This read-only flow is not attached yet."}</p>
            </article>
          )
        )}
      </section>
    </main>
  );
}
