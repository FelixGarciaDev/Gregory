const actions = [
  "Edit organization profile",
  "Update locations and hours",
  "Publish price changes",
  "Manage availability",
  "Review last verification timestamps"
];

export default function ProviderHome() {
  return (
    <main className="shell">
      <section className="masthead">
        <p className="eyebrow">Provider Workspace</p>
        <h1>Direct data control for labs and clinics</h1>
        <p className="copy">
          This shell is ready to connect provider users to `/v1/provider/*` endpoints so they can manage their own
          listings directly.
        </p>
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

