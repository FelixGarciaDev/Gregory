"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_CENTER, loadGoogleMaps, parseCoordinate, waitForGoogleMaps } from "./google-maps";

type LocationMapProps = {
  label: string;
  latitude: string;
  longitude: string;
};

export function LocationMap({ label, latitude, longitude }: LocationMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  useEffect(() => {
    const lat = parseCoordinate(latitude);
    const lng = parseCoordinate(longitude);
    const position = lat !== null && lng !== null ? { lat, lng } : DEFAULT_CENTER;

    if (!apiKey) {
      setMessage("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to display the map.");
      return;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => waitForGoogleMaps())
      .then((google) => {
        if (cancelled || !google || !mapElementRef.current) {
          return;
        }

        const map = new google.maps.Map(mapElementRef.current, {
          center: position,
          zoom: lat !== null && lng !== null ? 16 : 12,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });

        new google.maps.Marker({
          map,
          position,
          title: label
        });
        setMessage("");
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Could not load Google Maps.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, label, latitude, longitude]);

  return (
    <div className="admin-map-shell">
      <div className="admin-location-map" ref={mapElementRef} />
      {message ? <p className="map-message">{message}</p> : null}
    </div>
  );
}
