"use client";

import { useActionState } from "react";
import {
  AdminFormState,
  createCanonicalTestAction,
  updateCanonicalTestAction
} from "../actions";
import type { CanonicalTestRecord } from "./data";

const initialState: AdminFormState = {};

const categories = [
  ["bloodwork", "Bloodwork"],
  ["imaging", "Imaging"],
  ["diagnostic", "Diagnostic"],
  ["urinalysis", "Urinalysis"],
  ["other", "Other"]
] as const;

function CanonicalTestFields({ test }: { test?: CanonicalTestRecord }) {
  return (
    <>
      <label className="field">
        <span>Canonical name</span>
        <input
          defaultValue={test?.name}
          maxLength={160}
          name="name"
          placeholder="Complete Blood Count"
          required
        />
      </label>

      <label className="field">
        <span>Slug</span>
        <input
          defaultValue={test?.slug}
          maxLength={160}
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="complete-blood-count"
        />
        <small className="field-hint">Leave blank to generate it from the name.</small>
      </label>

      <label className="field">
        <span>Category</span>
        <select defaultValue={test?.category ?? "bloodwork"} name="category" required>
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          defaultValue={test?.description ?? ""}
          maxLength={2000}
          name="description"
          placeholder="Explain what this test measures and when it is commonly requested."
          rows={5}
        />
      </label>

      <label className="field">
        <span>Preparation notes</span>
        <textarea
          defaultValue={test?.preparationNotes ?? ""}
          maxLength={4000}
          name="preparationNotes"
          placeholder="For example: fasting requirements or medication guidance."
          rows={5}
        />
      </label>

      <label className="checkbox-field">
        <input defaultChecked={test?.isActive ?? true} name="isActive" type="checkbox" />
        <span>
          <strong>Active</strong>
          <small>Active tests are available to providers when they create offers.</small>
        </span>
      </label>
    </>
  );
}

export function CreateCanonicalTestForm() {
  const [state, action, pending] = useActionState(createCanonicalTestAction, initialState);

  return (
    <form action={action} className="stack-form">
      <CanonicalTestFields />

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create canonical test"}
      </button>
    </form>
  );
}

export function EditCanonicalTestForm({ test }: { test: CanonicalTestRecord }) {
  const [state, action, pending] = useActionState(updateCanonicalTestAction, initialState);

  return (
    <form action={action} className="stack-form">
      <input name="testId" type="hidden" value={test.id} />
      <CanonicalTestFields test={test} />

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
