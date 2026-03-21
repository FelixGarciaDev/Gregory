import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
import { requireProviderSession } from "../../lib/auth";
import { OrganizationForm } from "./organization-form";
import { getProviderWorkspace } from "../workspace-data";

export default async function OrganizationPage() {
  const session = await requireProviderSession();

  if (session.user.role !== "provider_admin") {
    redirect("/");
  }

  const workspace = await getProviderWorkspace();

  if (!workspace) {
    redirect("/");
  }

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div>
          <p className="eyebrow">Provider Workspace</p>
          <h1>Edit organization profile</h1>
          <p className="copy">
            Update the shared provider details that appear across your scoped workspace. Access is limited to
            provider admins for <strong>{workspace.organization.name}</strong>.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/">
            Back to workspace
          </Link>

          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="single-panel">
        <article className="card card-form">
          <OrganizationForm organization={workspace.organization} />
        </article>
      </section>
    </main>
  );
}
