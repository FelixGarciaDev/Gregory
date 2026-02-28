const cards = [
  "Providers and branches",
  "Canonical test catalog",
  "Offers, prices, and hours",
  "Payment methods and verification",
  "Provider account assignment"
];

export default function AdminHome() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Gregory Admin</p>
        <h1>Data operations cockpit</h1>
        <p className="lede">
          This shell is ready for provider CRUD, catalog management, pricing, verification, and CSV imports against the
          Nest API.
        </p>
      </section>

      <section className="grid">
        {cards.map((card) => (
          <article className="panel" key={card}>
            <h2>{card}</h2>
            <p>Implement authenticated forms here and point them at the `/v1/admin/*` endpoints.</p>
          </article>
        ))}
      </section>
    </main>
  );
}

