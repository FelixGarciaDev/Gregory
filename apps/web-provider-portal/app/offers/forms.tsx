"use client";

import { useActionState } from "react";
import {
  createProviderOfferAction,
  ProviderFormState,
  updateProviderOfferAction
} from "../actions";
import type {
  ProviderCanonicalTest,
  ProviderLocation,
  ProviderOffer
} from "../workspace-data";

const initialState: ProviderFormState = {};

export function ProviderOfferForm({
  locations,
  tests,
  offer,
  defaultLocationId
}: {
  locations: ProviderLocation[];
  tests: ProviderCanonicalTest[];
  offer?: ProviderOffer;
  defaultLocationId?: string;
}) {
  const action = offer ? updateProviderOfferAction : createProviderOfferAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const hasCurrentLocation = !offer || locations.some((location) => location.id === offer.providerLocationId);
  const hasCurrentTest = !offer || tests.some((test) => test.id === offer.testId);

  return (
    <form action={formAction} className="provider-form">
      {offer ? <input name="offerId" type="hidden" value={offer.id} /> : null}

      <label className="field">
        <span>Provider location</span>
        <select defaultValue={offer?.providerLocationId ?? defaultLocationId ?? ""} name="providerLocationId" required>
          <option disabled value="">Select a location</option>
          {!hasCurrentLocation && offer ? (
            <option value={offer.providerLocationId}>{offer.providerLocationName ?? "Current location"} (inactive)</option>
          ) : null}
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name ?? "Unnamed location"} - {location.city}, {location.stateRegion}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Canonical test</span>
        <select defaultValue={offer?.testId ?? ""} name="testId" required>
          <option disabled value="">Select a canonical test</option>
          {!hasCurrentTest && offer ? (
            <option value={offer.testId}>{offer.testName} ({offer.testCategory}, inactive)</option>
          ) : null}
          {tests.map((test) => (
            <option key={test.id} value={test.id}>{test.name} ({test.category})</option>
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
