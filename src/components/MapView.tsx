"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationShare } from "@/lib/supabase";

interface MapViewProps {
  locations: LocationShare[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const createIcon = (active: boolean) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 32px; height: 32px;
      background: ${active ? "linear-gradient(135deg, #0066cc, #00a3e0)" : "#64748b"};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

export default function MapView({
  locations,
  selectedId,
  onSelect,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const defaultCenter: L.LatLngExpression = [-26.2041, 28.0473]; // Johannesburg
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(defaultCenter, 6);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((loc) => {
      const isRecent =
        Date.now() - new Date(loc.shared_at).getTime() < 30 * 60 * 1000;
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createIcon(isRecent),
      })
        .addTo(mapInstance.current!)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:180px">
            <strong style="color:#00a3e0">${loc.agent_name}</strong><br/>
            <span style="color:#94a3b8;font-size:12px">${loc.address || "Unknown"}</span><br/>
            <span style="color:#64748b;font-size:11px">${new Date(loc.shared_at).toLocaleString()}</span>
          </div>`
        );

      marker.on("click", () => onSelect?.(loc.id));
      markersRef.current.push(marker);

      if (selectedId === loc.id) {
        marker.openPopup();
      }
    });

    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map((l) => [l.latitude, l.longitude] as L.LatLngTuple)
      );
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [locations, selectedId, onSelect]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[300px] rounded-xl overflow-hidden"
    />
  );
}
