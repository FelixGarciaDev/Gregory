"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveLocationAction, type ProviderFormState } from "../actions";
import type { ProviderLocation } from "../workspace-data";

declare global {
  interface Window {
    google?: any;
  }
}

const initialState: ProviderFormState = {};
const DEFAULT_CENTER = { lat: 10.501362, lng: -66.910064 };
const GOOGLE_MAPS_SRC = "https://maps.googleapis.com/maps/api/js";

type LocationDraft = {
  locationId: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  phone: string;
  notes: string;
};

type LocationStatus = "manual" | "google" | "map";

function toDraft(location?: ProviderLocation): LocationDraft {
  return {
    locationId: location?.id ?? "",
    name: location?.name ?? "",
    addressLine1: location?.addressLine1 ?? "",
    addressLine2: location?.addressLine2 ?? "",
    city: location?.city ?? "",
    stateRegion: location?.stateRegion ?? "",
    country: location?.country ?? "VE",
    postalCode: location?.postalCode ?? "",
    latitude: location?.latitude ?? "",
    longitude: location?.longitude ?? "",
    phone: location?.phone ?? "",
    notes: location?.notes ?? ""
  };
}

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.Map && window.google?.maps?.places?.PlaceAutocompleteElement) {
    return Promise.resolve(window.google);
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.google ?? null), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Google Maps.")), {
        once: true
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      libraries: "places",
      language: "es",
      region: "VE",
      loading: "async",
      v: "weekly"
    });

    script.src = `${GOOGLE_MAPS_SRC}?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => resolve(window.google ?? null);
    script.onerror = () => reject(new Error("Could not load Google Maps."));
    document.head.appendChild(script);
  });
}

function waitForGoogleMaps(timeoutMs = 10000) {
  return new Promise<any>((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      if (window.google?.maps?.Map && window.google?.maps?.places?.PlaceAutocompleteElement) {
        resolve(window.google);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Google Maps loaded, but Maps/Places APIs were not ready."));
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

function parseAddressComponent(components: any[], type: string, useShortName = false) {
  const match = components.find((component) => component.types?.includes(type));
  return match ? (useShortName ? componentShortText(match) : componentLongText(match)) : "";
}

function componentLongText(component: any) {
  return component.longText ?? component.long_name ?? "";
}

function componentShortText(component: any) {
  return component.shortText ?? component.short_name ?? "";
}

function labelForStatus(status: LocationStatus) {
  if (status === "google") {
    return "Matched with Google";
  }

  if (status === "map") {
    return "Pin adjusted on map";
  }

  return "Edited manually";
}

function extraLocations(primaryLocationId: string, locations: ProviderLocation[]) {
  return locations.filter((location) => location.id !== primaryLocationId);
}

function toLatLngLiteral(location: any) {
  if (!location) {
    return null;
  }

  const lat = typeof location.lat === "function" ? location.lat() : location.lat;
  const lng = typeof location.lng === "function" ? location.lng() : location.lng;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function LocationForm({ locations }: { locations: ProviderLocation[] }) {
  const [state, formAction, pending] = useActionState(saveLocationAction, initialState);
  const primaryLocation = locations[0];
  const [draft, setDraft] = useState<LocationDraft>(() => toDraft(primaryLocation));
  const [status, setStatus] = useState<LocationStatus>(primaryLocation ? "manual" : "manual");
  const [mapsMessage, setMapsMessage] = useState("");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const autocompleteHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const googleReadyRef = useRef(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  useEffect(() => {
    setDraft(toDraft(primaryLocation));
    setStatus("manual");
  }, [primaryLocation]);

  const mapCenter = useMemo(() => {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lat: latitude, lng: longitude };
    }

    return DEFAULT_CENTER;
  }, [draft.latitude, draft.longitude]);

  useEffect(() => {
    if (!apiKey) {
      setMapsMessage("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google address suggestions and the map.");
      return;
    }

    let cancelled = false;
    let placeAutocomplete: HTMLElement | null = null;
    let handlePlaceSelection: ((event: Event) => Promise<void>) | null = null;

    loadGoogleMaps(apiKey)
      .then(() => waitForGoogleMaps())
      .then((google) => {
        if (cancelled || !google || !mapElementRef.current || !autocompleteHostRef.current) {
          return;
        }

        const map = new google.maps.Map(mapElementRef.current, {
          center: mapCenter,
          zoom: draft.latitude && draft.longitude ? 15 : 7,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });

        const marker = new google.maps.Marker({
          map,
          position: mapCenter,
          draggable: true
        });

        map.addListener("click", (event: any) => {
          const lat = event.latLng?.lat?.();
          const lng = event.latLng?.lng?.();

          if (typeof lat !== "number" || typeof lng !== "number") {
            return;
          }

          marker.setPosition({ lat, lng });
          setDraft((current) => ({
            ...current,
            latitude: lat.toFixed(7),
            longitude: lng.toFixed(7)
          }));
          setStatus("map");
        });

        marker.addListener("dragend", (event: any) => {
          const lat = event.latLng?.lat?.();
          const lng = event.latLng?.lng?.();

          if (typeof lat !== "number" || typeof lng !== "number") {
            return;
          }

          setDraft((current) => ({
            ...current,
            latitude: lat.toFixed(7),
            longitude: lng.toFixed(7)
          }));
          setStatus("map");
        });

        autocompleteHostRef.current.replaceChildren();

        const placeAutocompleteElement = new google.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: ["VE"]
        });
        placeAutocompleteElement.setAttribute("placeholder", "Av. Principal, Caracas");
        placeAutocomplete = placeAutocompleteElement;

        handlePlaceSelection = async (event: Event) => {
          const customEvent = event as CustomEvent<{ placePrediction?: { toPlace?: () => any } }>;
          const place = customEvent.detail?.placePrediction?.toPlace?.();

          if (!place) {
            return;
          }

          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location", "viewport", "addressComponents"]
          });

          const position = toLatLngLiteral(place.location);
          const components = place.addressComponents ?? [];

          if (!position) {
            return;
          }

          const locality = parseAddressComponent(components, "locality");
          const adminAreaLevel2 = parseAddressComponent(components, "administrative_area_level_2");
          const stateRegion = parseAddressComponent(components, "administrative_area_level_1");
          const streetNumber = parseAddressComponent(components, "street_number");
          const route = parseAddressComponent(components, "route");
          const neighborhood =
            parseAddressComponent(components, "sublocality") ||
            parseAddressComponent(components, "neighborhood");
          const country = parseAddressComponent(components, "country", true) || "VE";
          const postalCode = parseAddressComponent(components, "postal_code");
          const addressLine1 = [route, streetNumber].filter(Boolean).join(" ").trim();

          marker.setPosition(position);
          if (place.viewport) {
            map.fitBounds(place.viewport);
          } else {
            map.panTo(position);
            map.setZoom(16);
          }

          setDraft((current) => ({
            ...current,
            name: current.name || place.displayName || "",
            addressLine1: addressLine1 || place.formattedAddress || current.addressLine1,
            city: locality || adminAreaLevel2 || current.city,
            stateRegion: stateRegion || current.stateRegion,
            country,
            postalCode: postalCode || current.postalCode,
            latitude: position.lat.toFixed(7),
            longitude: position.lng.toFixed(7),
            addressLine2: current.addressLine2 || neighborhood
          }));
          setStatus("google");
        };

        placeAutocompleteElement.addEventListener("gmp-select", handlePlaceSelection as EventListener);
        autocompleteHostRef.current.appendChild(placeAutocompleteElement);

        mapRef.current = map;
        markerRef.current = marker;
        googleReadyRef.current = true;
        setMapsMessage("");
      })
      .catch((error) => {
        if (!cancelled) {
          setMapsMessage(error instanceof Error ? error.message : "Could not load Google Maps.");
        }
      });

    return () => {
      cancelled = true;
      googleReadyRef.current = false;
      if (placeAutocomplete && handlePlaceSelection) {
        placeAutocomplete.removeEventListener("gmp-select", handlePlaceSelection as EventListener);
      }
      autocompleteHostRef.current?.replaceChildren();
    };
  }, [apiKey]);

  useEffect(() => {
    if (!googleReadyRef.current || !mapRef.current || !markerRef.current) {
      return;
    }

    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const position = { lat: latitude, lng: longitude };
    markerRef.current.setPosition(position);
    mapRef.current.setCenter(position);
  }, [draft.latitude, draft.longitude]);

  const otherLocations = extraLocations(primaryLocation?.id ?? "", locations);

  return (
    <div className="location-panel">
      <div className="location-panel-header">
        <div>
          <p className="eyebrow">Main location</p>
          <h2>{primaryLocation ? "Edit primary location" : "Add your first location"}</h2>
          <p className="section-copy">
            Search with Google Maps, tweak the address manually if needed, and confirm the final pin on the map.
          </p>
        </div>
        <span className={`location-status location-status-${status}`}>{labelForStatus(status)}</span>
      </div>

      <form action={formAction} className="provider-form location-form">
        <input type="hidden" name="locationId" value={draft.locationId} />

        <label className="field">
          <span>Location name</span>
          <input
            name="name"
            type="text"
            maxLength={160}
            value={draft.name}
            onChange={(event) => {
              setDraft((current) => ({ ...current, name: event.target.value }));
              setStatus("manual");
            }}
            placeholder="Sucursal principal"
          />
        </label>

        <label className="field">
          <span>Search address with Google</span>
          <div className="google-autocomplete-host" ref={autocompleteHostRef} />
        </label>

        <div className="location-grid">
          <label className="field location-grid-span-2">
            <span>Address line 1</span>
            <input
              name="addressLine1"
              type="text"
              maxLength={160}
              value={draft.addressLine1}
              onChange={(event) => {
                setDraft((current) => ({ ...current, addressLine1: event.target.value }));
                setStatus("manual");
              }}
              required
            />
          </label>

          <label className="field location-grid-span-2">
            <span>Address line 2</span>
            <input
              name="addressLine2"
              type="text"
              maxLength={160}
              value={draft.addressLine2}
              onChange={(event) => {
                setDraft((current) => ({ ...current, addressLine2: event.target.value }));
                setStatus("manual");
              }}
              placeholder="Piso, local, referencia"
            />
          </label>

          <label className="field">
            <span>City</span>
            <input
              name="city"
              type="text"
              maxLength={120}
              value={draft.city}
              onChange={(event) => {
                setDraft((current) => ({ ...current, city: event.target.value }));
                setStatus("manual");
              }}
              required
            />
          </label>

          <label className="field">
            <span>State / region</span>
            <input
              name="stateRegion"
              type="text"
              maxLength={120}
              value={draft.stateRegion}
              onChange={(event) => {
                setDraft((current) => ({ ...current, stateRegion: event.target.value }));
                setStatus("manual");
              }}
              required
            />
          </label>

          <label className="field">
            <span>Country</span>
            <input
              name="country"
              type="text"
              maxLength={2}
              value={draft.country}
              onChange={(event) => {
                setDraft((current) => ({ ...current, country: event.target.value.toUpperCase() }));
                setStatus("manual");
              }}
              required
            />
          </label>

          <label className="field">
            <span>Postal code</span>
            <input
              name="postalCode"
              type="text"
              maxLength={32}
              value={draft.postalCode}
              onChange={(event) => {
                setDraft((current) => ({ ...current, postalCode: event.target.value }));
                setStatus("manual");
              }}
            />
          </label>
        </div>

        <div className="map-shell">
          <div className="map-header">
            <div>
              <strong>Pin the exact place</strong>
              <p className="section-copy">Click the map or drag the marker to fine-tune the final coordinates.</p>
            </div>
            <div className="coordinate-pill">
              <span>{draft.latitude || "--"}</span>
              <span>{draft.longitude || "--"}</span>
            </div>
          </div>

          <div className="location-map" ref={mapElementRef} />
          {mapsMessage ? <p className="map-message">{mapsMessage}</p> : null}
        </div>

        <div className="location-grid">
          <label className="field">
            <span>Latitude</span>
            <input
              name="latitude"
              type="number"
              step="0.0000001"
              value={draft.latitude}
              onChange={(event) => {
                setDraft((current) => ({ ...current, latitude: event.target.value }));
                setStatus("manual");
              }}
              required
            />
          </label>

          <label className="field">
            <span>Longitude</span>
            <input
              name="longitude"
              type="number"
              step="0.0000001"
              value={draft.longitude}
              onChange={(event) => {
                setDraft((current) => ({ ...current, longitude: event.target.value }));
                setStatus("manual");
              }}
              required
            />
          </label>

          <label className="field">
            <span>Location phone</span>
            <input
              name="phone"
              type="text"
              maxLength={40}
              value={draft.phone}
              onChange={(event) => {
                setDraft((current) => ({ ...current, phone: event.target.value }));
                setStatus("manual");
              }}
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <input
              name="notes"
              type="text"
              maxLength={1000}
              value={draft.notes}
              onChange={(event) => {
                setDraft((current) => ({ ...current, notes: event.target.value }));
                setStatus("manual");
              }}
              placeholder="Entrada lateral, torre B, frente a farmacia"
            />
          </label>
        </div>

        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.success ? <p className="form-success">{state.success}</p> : null}

        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Saving..." : primaryLocation ? "Save main location" : "Create main location"}
        </button>
      </form>

      {otherLocations.length > 0 ? (
        <div className="location-list">
          <h3>Other active locations</h3>
          <div className="location-list-grid">
            {otherLocations.map((location) => (
              <article className="location-summary" key={location.id}>
                <strong>{location.name || "Unnamed location"}</strong>
                <p>{location.addressLine1}</p>
                <p>
                  {location.city}, {location.stateRegion}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
