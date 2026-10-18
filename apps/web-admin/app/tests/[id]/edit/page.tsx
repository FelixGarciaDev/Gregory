import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "../../../actions";
import { requireAdminSession } from "../../../../lib/auth";
import { getCanonicalTest } from "../../data";
import { EditCanonicalTestForm } from "../../forms";

type EditCanonicalTestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCanonicalTestPage({ params }: EditCanonicalTestPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const test = await getCanonicalTest(id);

  if (!test) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Canonical test</p>
          <h1>Edit {test.name}</h1>
          <p className="lede">
            Changes apply to the shared catalog record used by {test.offerCount} provider offers.
          </p>
        </div>

        <div className="toolbar-actions">
          <Link className="secondary-button link-button" href="/tests">
            Back to test catalog
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
          <EditCanonicalTestForm test={test} />
        </article>
      </section>
    </main>
  );
}
