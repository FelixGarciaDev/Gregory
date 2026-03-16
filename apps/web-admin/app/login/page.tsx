import { LoginForm } from "./login-form";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user.role === "admin") {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Gregory Admin</p>
        <h1>Sign in to manage the platform</h1>
        <p className="auth-copy">
          Use the admin account created by the Prisma seed so we can start wiring the internal dashboard to the API.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
