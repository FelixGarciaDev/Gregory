"use client";

import { useActionState } from "react";
import { updateOrganizationAction, type ProviderFormState } from "../actions";

const initialState: ProviderFormState = {};

type OrganizationFormProps = {
  organization: {
    id: string;
    name: string;
    type: string;
    phone: string | null;
    website: string | null;
  };
};

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [state, formAction, pending] = useActionState(updateOrganizationAction, initialState);

  return (
    <form action={formAction} className="provider-form">
      <input type="hidden" name="organizationId" value={organization.id} />

      <label className="field">
        <span>Organization name</span>
        <input name="name" type="text" defaultValue={organization.name} maxLength={160} required />
      </label>

      <label className="field">
        <span>Organization type</span>
        <select name="type" defaultValue={organization.type} required>
          <option value="clinic">Clinic</option>
          <option value="lab">Lab</option>
          <option value="imaging_center">Imaging center</option>
          <option value="hospital">Hospital</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="field">
        <span>Phone</span>
        <input name="phone" type="text" defaultValue={organization.phone ?? ""} maxLength={40} />
      </label>

      <label className="field">
        <span>Website</span>
        <input
          name="website"
          type="url"
          defaultValue={organization.website ?? ""}
          maxLength={255}
          placeholder="https://example.com"
        />
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}

      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save organization profile"}
      </button>
    </form>
  );
}
