"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "../actions";

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="admin@gregory.app" required />
      </label>

      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" placeholder="********" required />
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
