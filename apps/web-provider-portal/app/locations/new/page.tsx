import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../../actions";
import { requireProviderSession } from "../../../lib/auth";
import { LocationForm } from "../../organization/location-form";

export default async function NewProviderLocationPage() {
  const session = await requireProviderSession();
  if (session.user.role !== "provider_admin") redirect("/locations");

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div><p className="eyebrow">Provider Workspace</p><h1>Create provider location</h1><p className="copy">Add another branch to your organization.</p></div>
        <div className="toolbar-actions"><Link className="secondary-button link-button" href="/locations">Back to locations</Link><form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form></div>
      </section>
      <section className="single-panel"><article className="card card-form"><LocationForm description="Search for the branch address, verify its details, and place the final map pin." redirectTo="/locations" submitLabel="Create location" title="Location details" /></article></section>
    </main>
  );
}
