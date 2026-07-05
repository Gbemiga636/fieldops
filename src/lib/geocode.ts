export type GeocodedAddress = {
  /** Full exact location string — street, area, city, state, country */
  formatted: string;
  street: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
};

type NominatimAddress = Record<string, string>;

function pickFirst(...values: (string | undefined | null)[]): string | null {
  for (const v of values) {
    if (v?.trim()) return v.trim();
  }
  return null;
}

function buildExactAddress(a: NominatimAddress): GeocodedAddress {
  const house = pickFirst(a.house_number, a.house_name);
  const place = pickFirst(
    a.amenity,
    a.building,
    a.shop,
    a.office,
    a.tourism,
    a.leisure,
    a.commercial,
    a.industrial
  );
  const road = pickFirst(
    a.road,
    a.pedestrian,
    a.footway,
    a.street,
    a.path,
    a.residential,
    a.cycleway
  );

  const streetParts = [house, place, road].filter(Boolean);
  const street = streetParts.length ? streetParts.join(", ") : null;

  const area = pickFirst(
    a.suburb,
    a.neighbourhood,
    a.quarter,
    a.borough,
    a.city_district,
    a.district,
    a.hamlet
  );

  const city = pickFirst(
    a.city,
    a.town,
    a.village,
    a.municipality,
    a.county
  );

  const state = pickFirst(a.state, a.region, a.province, a.state_district);
  const country = pickFirst(a.country);
  const postcode = pickFirst(a.postcode);

  const formatted = [
    street,
    area,
    city,
    postcode,
    state,
    country,
  ]
    .filter(Boolean)
    .join(", ");

  return { formatted, street, area, city, state, country, postcode };
}

async function geocodeNominatim(
  lat: number,
  lng: number
): Promise<GeocodedAddress | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`,
    {
      headers: {
        "User-Agent": "FieldOps/1.0 (multichoice-field-operations)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const built = buildExactAddress(data.address ?? {});

  // Nominatim display_name is often the most complete single string
  if (data.display_name && data.display_name.length > built.formatted.length) {
    built.formatted = data.display_name;
  }

  if (!built.formatted) return null;
  return built;
}

async function geocodeBigDataCloud(
  lat: number,
  lng: number
): Promise<GeocodedAddress | null> {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    { signal: AbortSignal.timeout(10000) }
  );

  if (!res.ok) return null;

  const data = await res.json();

  const street = pickFirst(
    data.street,
    data.localityInfo?.informative?.find(
      (i: { description?: string }) =>
        i.description?.includes("road") ||
        i.description?.includes("street")
    )?.name
  );

  const area = pickFirst(
    data.locality,
    data.city,
    data.localityInfo?.informative?.[0]?.name
  );

  const city = pickFirst(data.city, data.locality);
  const state = pickFirst(data.principalSubdivision);
  const country = pickFirst(data.countryName);
  const postcode = pickFirst(data.postcode);

  const formatted = [street, area, city, postcode, state, country]
    .filter(Boolean)
    .join(", ");

  if (!formatted) return null;

  return { formatted, street, area, city, state, country, postcode };
}

async function geocodeOpenMeteo(
  lat: number,
  lng: number
): Promise<GeocodedAddress | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&language=en`,
    { signal: AbortSignal.timeout(8000) }
  );

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.results?.length) return null;

  const r = data.results[0];
  const street = r.name || null;
  const area = r.admin3 || null;
  const city = r.admin2 || null;
  const state = r.admin1 || null;
  const country = r.country || null;

  const formatted = [street, area, city, state, country].filter(Boolean).join(", ");
  if (!formatted) return null;

  return { formatted, street, area, city, state, country, postcode: null };
}

function isCoordOnly(str: string): boolean {
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(str.trim());
}

function scoreAddress(g: GeocodedAddress): number {
  let score = g.formatted.length;
  if (g.street) score += 50;
  if (g.area) score += 30;
  if (g.city) score += 20;
  if (g.state) score += 10;
  if (g.postcode) score += 5;
  return score;
}

function pickBest(...candidates: (GeocodedAddress | null)[]): GeocodedAddress | null {
  const valid = candidates.filter((c): c is GeocodedAddress => !!c && !isCoordOnly(c.formatted));
  if (!valid.length) return null;
  return valid.sort((a, b) => scoreAddress(b) - scoreAddress(a))[0];
}

/** Server-side reverse geocode — returns the most exact address possible */
export async function reverseGeocodeServer(
  lat: number,
  lng: number
): Promise<GeocodedAddress> {
  const fallback: GeocodedAddress = {
    formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    street: null,
    area: null,
    city: null,
    state: null,
    country: null,
    postcode: null,
  };

  const results = await Promise.allSettled([
    geocodeNominatim(lat, lng),
    geocodeBigDataCloud(lat, lng),
    geocodeOpenMeteo(lat, lng),
  ]);

  const candidates = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<GeocodedAddress | null>).value);

  const best = pickBest(...candidates);
  return best ?? fallback;
}

/** Display exact location prominently in admin */
export function formatLocationDisplay(loc: {
  address?: string | null;
  street?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postcode?: string | null;
  latitude?: number;
  longitude?: number;
}): {
  exact: string;
  locality: string | null;
  coords: string | null;
} {
  const hasRealAddress = loc.address && !isCoordOnly(loc.address);

  // Build exact line from structured fields if available
  const exactFromParts = [
    loc.street,
    loc.area,
    loc.city,
    loc.postcode,
    loc.state,
    loc.country,
  ]
    .filter(Boolean)
    .join(", ");

  const exact =
    (hasRealAddress && loc.address && loc.address.length >= (exactFromParts?.length ?? 0)
      ? loc.address
      : exactFromParts) ||
    loc.address ||
    null;

  if (exact && !isCoordOnly(exact)) {
    const localityParts = [loc.city, loc.state, loc.country].filter(Boolean);
    const locality =
      localityParts.length > 0 ? localityParts.join(", ") : null;

    return {
      exact,
      locality:
        locality && !exact.includes(locality) ? locality : null,
      coords:
        loc.latitude != null && loc.longitude != null
          ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`
          : null,
    };
  }

  return {
    exact: "Exact address could not be resolved",
    locality: null,
    coords:
      loc.latitude != null && loc.longitude != null
        ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`
        : null,
  };
}
