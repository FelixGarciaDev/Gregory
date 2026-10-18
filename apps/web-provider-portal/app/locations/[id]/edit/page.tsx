import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { logoutAction } from "../../../actions";
import { requireProviderSession } from "../../../../lib/auth";
import { LocationForm } from "../../../organization/location-form";
import { getProviderLocation } from "../../../workspace-data";

type EditProviderLocationPageProps = { params: Promise<{ id: string }> };

export default async function EditProviderLocationPage({ params }: EditProviderLocationPageProps) {
  const session = await requireProviderSession();
  if (session.user.role !== "provider_admin") redirect("/locations");
  const { id } = await params;
  const location = await getProviderLocation(id);
  if (!location) notFound();

  return (
    <main className="page-shell">
      <section className="masthead masthead-with-toolbar">
        <div><p className="eyebrow">Provider location</p><h1>Edit {location.name ?? "location"}</h1><p className="copy">Update this branch’s address and contact details.</p></div>
        <div className="toolbar-actions"><Link className="secondary-button link-button" href="/locations">Back to locations</Link><form action={logoutAction}><button className="secondary-button" type="submit">Sign out</button></form></div>
      </section>
      <section className="single-panel"><article className="card card-form"><LocationForm description="Update the branch address, contact details, and exact map pin." location={location} redirectTo="/locations" submitLabel="Save location" title="Location details" /></article></section>
    </main>
  );
}
