"use client";

import { useActionState } from "react";
import { AdminFormState, createProviderAction, createProviderUserAction } from "../actions";

const initialState: AdminFormState = {};

type ProviderOption = {
  id: string;
  name: string;
};

export function CreateProviderForm() {
  const [state, action, pending] = useActionState(createProviderAction, initialState);

  return (
    <form action={action} className="stack-form">
      <label className="field">
        <span>Provider name</span>
        <input name="name" placeholder="Centro Medico Chacao" required />
      </label>

      <label className="field">
        <span>Type</span>
        <select name="type" defaultValue="clinic" required>
          <option value="clinic">Clinic</option>
          <option value="lab">Lab</option>
          <option value="imaging_center">Imaging center</option>
          <option value="hospital">Hospital</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="field">
        <span>Phone</span>
        <input name="phone" placeholder="+58 212 555 0000" />
      </label>

      <label className="field">
        <span>Website</span>
        <input name="website" placeholder="https://provider.example" type="url" />
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}

      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create provider"}
      </button>
    </form>
  );
}

export function CreateProviderUserForm({ providers }: { providers: ProviderOption[] }) {
  const [state, action, pending] = useActionState(createProviderUserAction, initialState);

  return (
    <form action={action} className="stack-form">
      <label className="field">
        <span>Provider</span>
        <select defaultValue="" name="providerId" required>
          <option disabled value="">
            Select a provider
          </option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Full name</span>
        <input name="fullName" placeholder="Ana Perez" required />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" placeholder="ana@provider.com" required type="email" />
      </label>

      <label className="field">
        <span>Password</span>
        <input minLength={8} name="password" required type="password" />
      </label>

      <label className="field">
        <span>Role</span>
        <select defaultValue="provider_admin" name="role" required>
          <option value="provider_admin">Provider admin</option>
          <option value="provider_user">Provider user</option>
        </select>
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}

      <button className="primary-button" disabled={pending || providers.length === 0} type="submit">
        {pending ? "Creating..." : "Create provider user"}
      </button>
    </form>
  );
}
