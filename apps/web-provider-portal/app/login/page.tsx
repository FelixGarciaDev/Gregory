import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getSession } from "../../lib/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user.role === "provider_admin" || session?.user.role === "provider_user") {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Provider Workspace</p>
        <h1>Sign in to manage your provider data</h1>
        <p className="auth-copy">
          Provider admins and provider users can use this portal to manage only their provider workspace once the
          API-side scoping is wired in.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
