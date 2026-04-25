import Link from "next/link";
import { logoutAction } from "./actions";
import { requireAdminSession } from "../lib/auth";

const cards = [
  {
    title: "Provider organizations",
    description: "Create provider organizations and assign provider admins or provider users.",
    href: "/providers"
  },
  {
    title: "Canonical test catalog",
    description: "Manage the shared tests that provider locations can attach offers to."
  },
  {
    title: "Location test offers",
    description: "Manage branch-specific test pricing, availability, and turnaround details."
  },
  {
    title: "Location payments and verification",
    description: "Track payment methods per provider location and offer verification records."
  },
  {
    title: "Provider user assignment",
    description: "Attach users to provider organizations with the right provider and membership roles."
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
            Signed in as <strong>{session.user.email}</strong>. This shell is ready for provider organization CRUD,
            shared test catalog management, location-specific offers, verification, and CSV imports against the Nest API.
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
