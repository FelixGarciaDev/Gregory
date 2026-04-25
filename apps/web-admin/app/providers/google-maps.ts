export const DEFAULT_CENTER = { lat: 10.501362, lng: -66.910064 };

const GOOGLE_MAPS_SRC = "https://maps.googleapis.com/maps/api/js";

declare global {
  interface Window {
    google?: any;
  }
}

export function parseCoordinate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const coordinate = Number(trimmedValue);
  return Number.isFinite(coordinate) ? coordinate : null;
}

export function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.Map) {
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

export function waitForGoogleMaps(timeoutMs = 10000) {
  return new Promise<any>((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      if (window.google?.maps?.Map && window.google?.maps?.places) {
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

export async function loadPlacesDataApi(google: any) {
  if (typeof google.maps.importLibrary === "function") {
    const placesLibrary = await google.maps.importLibrary("places");

    return {
      AutocompleteSessionToken:
        placesLibrary.AutocompleteSessionToken ?? google.maps.places.AutocompleteSessionToken,
      AutocompleteSuggestion:
        placesLibrary.AutocompleteSuggestion ?? google.maps.places.AutocompleteSuggestion
    };
  }

  return {
    AutocompleteSessionToken: google.maps.places.AutocompleteSessionToken,
    AutocompleteSuggestion: google.maps.places.AutocompleteSuggestion
  };
}

export function toLatLngLiteral(location: any) {
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
