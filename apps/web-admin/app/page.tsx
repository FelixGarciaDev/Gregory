import Link from "next/link";
import { logoutAction } from "./actions";
import { requireAdminSession } from "../lib/auth";

const cards = [
  {
    title: "Providers",
    description: "Create providers and assign provider admins or provider users.",
    href: "/providers"
  },
  {
    title: "Canonical test catalog",
    description: "Implement authenticated forms here and point them at the `/v1/admin/*` endpoints."
  },
  {
    title: "Offers, prices, and hours",
    description: "Implement authenticated forms here and point them at the `/v1/admin/*` endpoints."
  },
  {
    title: "Payment methods and verification",
    description: "Implement authenticated forms here and point them at the `/v1/admin/*` endpoints."
  },
  {
    title: "Provider account assignment",
    description: "Implement authenticated forms here and point them at the `/v1/admin/*` endpoints."
  }
];

export default async function AdminHome() {
  const session = await requireAdminSession();

  return (
    <main className="page-shell">
      <section className="hero hero-with-toolbar">
        <div>
          <p className="eyebrow">Gregory Admin</p>
          <h1>Data operations cockpit</h1>
          <p className="lede">
            Signed in as <strong>{session.user.email}</strong>. This shell is ready for provider CRUD, catalog
            management, pricing, verification, and CSV imports against the Nest API.
          </p>
        </div>

        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            Sign out
          </button>
        </form>
      </section>

      <section className="status-strip">
        <article className="status-card">
          <span className="status-label">Access</span>
          <strong>Administrator</strong>
        </article>

        <article className="status-card">
          <span className="status-label">Auth source</span>
          <strong>Nest `/v1/auth/login`</strong>
        </article>

        <article className="status-card">
          <span className="status-label">Session</span>
          <strong>HTTP-only cookie</strong>
        </article>
      </section>

      <section className="grid">
        {cards.map((card) => (
          card.href ? (
            <Link className="panel panel-link" href={card.href} key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </Link>
          ) : (
            <article className="panel" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </article>
          )
        ))}
      </section>
    </main>
  );
}
