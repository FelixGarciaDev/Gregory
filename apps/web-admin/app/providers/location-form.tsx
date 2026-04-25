"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createProviderLocationAction, type AdminFormState } from "../actions";
import {
  DEFAULT_CENTER,
  loadGoogleMaps,
  loadPlacesDataApi,
  parseCoordinate,
  toLatLngLiteral,
  waitForGoogleMaps
} from "./google-maps";

const initialState: AdminFormState = {};

type LocationDraft = {
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

type PlaceSuggestionItem = {
  id: string;
  fullText: string;
  primaryText: string;
  secondaryText: string;
  placePrediction: any;
};

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

function getSuggestionLabel(prediction: any) {
  const text = prediction?.text?.toString?.() ?? "";
  const mainText = prediction?.mainText?.toString?.() ?? text;
  const secondaryText = prediction?.secondaryText?.toString?.() ?? "";

  return {
    fullText: text,
    primaryText: mainText,
    secondaryText
  };
}

export function AdminLocationForm({ providerId }: { providerId: string }) {
  const [state, formAction, pending] = useActionState(createProviderLocationAction, initialState);
  const [draft, setDraft] = useState<LocationDraft>({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateRegion: "",
    country: "VE",
    postalCode: "",
    latitude: "",
    longitude: "",
    phone: "",
    notes: ""
  });
  const [status, setStatus] = useState<LocationStatus>("manual");
  const [mapsMessage, setMapsMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const placesApiRef = useRef<{ AutocompleteSessionToken: any; AutocompleteSuggestion: any } | null>(null);
  const googleReadyRef = useRef(false);
  const sessionTokenRef = useRef<any>(null);
  const blurTimeoutRef = useRef<number | null>(null);
  const searchRequestRef = useRef(0);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const mapCenter = useMemo(() => {
    const latitude = parseCoordinate(draft.latitude);
    const longitude = parseCoordinate(draft.longitude);

    if (latitude !== null && longitude !== null) {
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

    loadGoogleMaps(apiKey)
      .then(() => waitForGoogleMaps())
      .then(async (google) => {
        if (cancelled || !google || !mapElementRef.current) {
          return;
        }

        const placesApi = await loadPlacesDataApi(google);

        if (!placesApi.AutocompleteSessionToken || !placesApi.AutocompleteSuggestion) {
          throw new Error("Google Places Autocomplete Data API is unavailable for this key.");
        }

        const map = new google.maps.Map(mapElementRef.current, {
          center: mapCenter,
          zoom: draft.latitude && draft.longitude ? 16 : 12,
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

        placesApiRef.current = placesApi;
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
      placesApiRef.current = null;
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

  useEffect(() => {
    if (!googleReadyRef.current || !placesApiRef.current) {
      return;
    }

    const query = searchQuery.trim();

    if (query.length < 2) {
      searchRequestRef.current += 1;
      setIsSearching(false);
      setSearchMessage("");
      setSuggestions([]);
      if (!query) {
        sessionTokenRef.current = null;
      }
      return;
    }

    setIsSearching(true);
    setSearchMessage("");
    const requestId = ++searchRequestRef.current;
    const timeoutId = window.setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesApiRef.current!;

        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const latitude = parseCoordinate(draft.latitude) ?? DEFAULT_CENTER.lat;
        const longitude = parseCoordinate(draft.longitude) ?? DEFAULT_CENTER.lng;
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          language: "es",
          region: "ve",
          sessionToken: sessionTokenRef.current,
          origin: { lat: latitude, lng: longitude },
          locationBias: {
            center: { lat: latitude, lng: longitude },
            radius: 50_000
          }
        });

        if (requestId !== searchRequestRef.current) {
          return;
        }

        const nextSuggestions = (response.suggestions ?? response.placePredictions ?? [])
          .map((suggestion: any) => {
            const prediction = suggestion.placePrediction;

            if (!prediction) {
              return null;
            }

            const label = getSuggestionLabel(prediction);

            return {
              id: prediction.placeId ?? label.fullText,
              fullText: label.fullText,
              primaryText: label.primaryText,
              secondaryText: label.secondaryText,
              placePrediction: prediction
            } satisfies PlaceSuggestionItem;
          })
          .filter(Boolean) as PlaceSuggestionItem[];

        setSuggestions(nextSuggestions);
        setIsSearching(false);
        setSearchMessage(nextSuggestions.length === 0 ? "No Google suggestions for this search yet." : "");
      } catch (error) {
        if (requestId === searchRequestRef.current) {
          console.error("Google autocomplete request failed.", error);
          setSuggestions([]);
          setIsSearching(false);
          setSearchMessage("Google autocomplete request failed. Check the browser console and API setup.");
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft.latitude, draft.longitude, searchQuery]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  async function handleSuggestionSelect(suggestion: PlaceSuggestionItem) {
    const place = suggestion.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location", "viewport", "addressComponents"]
    });

    const position = toLatLngLiteral(place.location);
    const components = place.addressComponents ?? [];

    if (!position || !mapRef.current || !markerRef.current) {
      return;
    }

    const locality = parseAddressComponent(components, "locality");
    const adminAreaLevel2 = parseAddressComponent(components, "administrative_area_level_2");
    const stateRegion = parseAddressComponent(components, "administrative_area_level_1");
    const streetNumber = parseAddressComponent(components, "street_number");
    const route = parseAddressComponent(components, "route");
    const neighborhood =
      parseAddressComponent(components, "sublocality") || parseAddressComponent(components, "neighborhood");
    const country = parseAddressComponent(components, "country", true) || "VE";
    const postalCode = parseAddressComponent(components, "postal_code");
    const addressLine1 = [route, streetNumber].filter(Boolean).join(" ").trim();

    markerRef.current.setPosition(position);

    if (place.viewport) {
      mapRef.current.fitBounds(place.viewport);
    } else {
      mapRef.current.panTo(position);
      mapRef.current.setZoom(16);
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
    setSearchQuery(place.formattedAddress || suggestion.fullText);
    setSuggestions([]);
    setIsSearchFocused(false);
    setIsSearching(false);
    setStatus("google");
    sessionTokenRef.current = null;
  }

  const showSuggestions = isSearchFocused && (isSearching || suggestions.length > 0 || searchQuery.trim().length >= 2);

  return (
    <div className="location-panel">
      <div className="location-panel-header">
        <div>
          <p className="eyebrow">Provider location</p>
          <h2>Add provider location</h2>
          <p className="section-copy">
            Search with Google Maps, tune the address manually if needed, and confirm the final pin.
          </p>
        </div>
        <span className={`location-status location-status-${status}`}>{labelForStatus(status)}</span>
      </div>

      <form action={formAction} className="stack-form location-form">
        <input type="hidden" name="providerId" value={providerId} />

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
          <div className="place-search">
            <input
              className="place-search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchFocused(true);
                setStatus("manual");
              }}
              onFocus={() => {
                if (blurTimeoutRef.current) {
                  window.clearTimeout(blurTimeoutRef.current);
                }
                setIsSearchFocused(true);
              }}
              onBlur={() => {
                blurTimeoutRef.current = window.setTimeout(() => setIsSearchFocused(false), 140);
              }}
              placeholder="Av. Principal, Caracas"
              autoComplete="off"
            />

            {showSuggestions ? (
              <div className="place-search-dropdown">
                {isSearching ? <p className="place-search-meta">Searching in Google Maps...</p> : null}
                {!isSearching && suggestions.length === 0 ? (
                  <p className="place-search-meta">{searchMessage || "No Google suggestions for this search yet."}</p>
                ) : null}
                {suggestions.length > 0 ? (
                  <ul className="place-search-results">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          className="place-search-option"
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => void handleSuggestionSelect(suggestion)}
                        >
                          <span className="place-search-option-title">{suggestion.primaryText}</span>
                          {suggestion.secondaryText ? (
                            <span className="place-search-option-copy">{suggestion.secondaryText}</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="place-search-footer">Powered by Google</div>
              </div>
            ) : null}
          </div>
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
          {pending ? "Creating..." : "Create location"}
        </button>
      </form>
    </div>
  );
}
