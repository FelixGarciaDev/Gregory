"use client";

import { useActionState } from "react";
import {
  AdminFormState,
  createAdminOfferAction,
  updateAdminOfferAction
} from "../actions";
import type { CanonicalTestRecord } from "../tests/data";
import type { AdminLocationOption, AdminOfferRecord } from "./data";

const initialState: AdminFormState = {};

type AdminOfferFormProps = {
  locations: AdminLocationOption[];
  tests: CanonicalTestRecord[];
  offer?: AdminOfferRecord;
  defaultLocationId?: string;
  defaultProviderId?: string;
};

function locationLabel(location: AdminLocationOption) {
  return `${location.name ?? "Unnamed location"} - ${location.city}, ${location.stateRegion}`;
}

export function AdminOfferForm({
  locations,
  tests,
  offer,
  defaultLocationId,
  defaultProviderId
}: AdminOfferFormProps) {
  const action = offer ? updateAdminOfferAction : createAdminOfferAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const availableLocations = locations.filter(
    (location) =>
      (location.isActive && location.organizationIsActive && (!defaultProviderId || location.organizationId === defaultProviderId)) ||
      location.id === offer?.providerLocationId
  );
  const availableTests = tests.filter((test) => test.isActive || test.id === offer?.testId);
  const locationsByProvider = availableLocations.reduce<Record<string, AdminLocationOption[]>>((groups, location) => {
    (groups[location.organizationName] ??= []).push(location);
    return groups;
  }, {});

  return (
    <form action={formAction} className="stack-form">
      {offer ? <input name="offerId" type="hidden" value={offer.id} /> : null}

      <label className="field">
        <span>Provider location</span>
        <select
          defaultValue={offer?.providerLocationId ?? defaultLocationId ?? ""}
          name="providerLocationId"
          required
        >
          <option disabled value="">Select a provider location</option>
          {Object.entries(locationsByProvider).map(([providerName, providerLocations]) => (
            <optgroup key={providerName} label={providerName}>
              {providerLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {locationLabel(location)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Canonical test</span>
        <select defaultValue={offer?.testId ?? ""} name="testId" required>
          <option disabled value="">Select a canonical test</option>
          {availableTests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.name} ({test.category})
            </option>
          ))}
        </select>
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Price</span>
          <input defaultValue={offer?.priceAmount} min="0" name="priceAmount" required step="0.01" type="number" />
        </label>

        <label className="field">
          <span>Currency</span>
          <input defaultValue={offer?.currencyCode ?? "USD"} maxLength={8} name="currencyCode" required />
        </label>
      </div>

      <label className="field">
        <span>Turnaround time</span>
        <input defaultValue={offer?.turnaroundTime ?? ""} maxLength={120} name="turnaroundTime" placeholder="Same day" />
      </label>

      <label className="field">
        <span>Price notes</span>
        <textarea defaultValue={offer?.priceNotes ?? ""} maxLength={500} name="priceNotes" rows={4} />
      </label>

      <div className="checkbox-grid">
        <label className="checkbox-field">
          <input defaultChecked={offer?.requiresAppointment ?? false} name="requiresAppointment" type="checkbox" />
          <span>Requires appointment</span>
        </label>
        <label className="checkbox-field">
          <input defaultChecked={offer?.walkInAllowed ?? true} name="walkInAllowed" type="checkbox" />
          <span>Walk-ins allowed</span>
        </label>
        {offer ? (
          <label className="checkbox-field">
            <input defaultChecked={offer.isAvailable} name="isAvailable" type="checkbox" />
            <span>Available to consumers</span>
          </label>
        ) : null}
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Saving..." : offer ? "Save offer" : "Create offer"}
      </button>
    </form>
  );
}
