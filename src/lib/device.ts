export function getDeviceInfo(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

export function getBrowserInfo(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;

  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Unknown";
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "FieldOps/1.0" } }
    );
    if (!res.ok) throw new Error("Geocode failed");
    const data = await res.json();
    if (data.display_name) return data.display_name;

    const a = data.address;
    if (a) {
      const parts = [
        a.house_number,
        a.road || a.pedestrian,
        a.suburb || a.neighbourhood,
        a.city || a.town || a.village,
        a.state,
        a.country,
      ].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
