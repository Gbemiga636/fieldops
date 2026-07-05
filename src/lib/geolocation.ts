const FAST_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 8000,
};

const REFINE_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000,
};

export type GeoErrorCode =
  | "PERMISSION_DENIED"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED";

export function getGeoErrorMessage(code: GeoErrorCode): string {
  switch (code) {
    case "PERMISSION_DENIED":
      return "Location access denied. On mobile: Settings → Browser → Location → Allow.";
    case "UNAVAILABLE":
      return "GPS signal unavailable. Go outdoors or enable Location Services, then try again.";
    case "TIMEOUT":
      return "GPS is taking too long. Move to an open area with clear sky view and retry.";
    case "UNSUPPORTED":
      return "This browser does not support GPS location.";
    default:
      return "Could not get your location. Please try again.";
  }
}

function toGeoError(err: GeolocationPositionError): GeoErrorCode {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "PERMISSION_DENIED";
    case err.POSITION_UNAVAILABLE:
      return "UNAVAILABLE";
    case err.TIMEOUT:
      return "TIMEOUT";
    default:
      return "UNAVAILABLE";
  }
}

function getCurrentPosition(
  options: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (err) =>
      reject(new Error(toGeoError(err)))
    , options);
  });
}

function isValidReading(position: GeolocationPosition): boolean {
  const { accuracy } = position.coords;
  return accuracy > 0 && accuracy < 500;
}

function pickBest(
  a: GeolocationPosition,
  b: GeolocationPosition
): GeolocationPosition {
  return a.coords.accuracy <= b.coords.accuracy ? a : b;
}

/** Haversine distance in metres between two coordinates */
export function distanceMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type AcquireProgress = {
  samples: number;
  bestAccuracy: number | null;
  phase: "searching" | "refining" | "locked";
};

/**
 * Fast GPS: get a fix quickly, optionally refine once if accuracy is poor.
 * Typically completes in 1–4 seconds instead of 15–28.
 */
export function acquireBestPosition(
  onProgress?: (progress: AcquireProgress) => void
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("UNSUPPORTED"));
      return;
    }

    let settled = false;
    const finish = (position: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      onProgress?.({
        samples: 1,
        bestAccuracy: position.coords.accuracy,
        phase: "locked",
      });
      resolve(position);
    };

    onProgress?.({ samples: 0, bestAccuracy: null, phase: "searching" });

    getCurrentPosition(FAST_OPTIONS)
      .then(async (first) => {
        if (!isValidReading(first)) {
          throw new Error("UNAVAILABLE");
        }

        onProgress?.({
          samples: 1,
          bestAccuracy: first.coords.accuracy,
          phase: first.coords.accuracy <= 35 ? "locked" : "refining",
        });

        // Good enough — ship immediately
        if (first.coords.accuracy <= 35) {
          finish(first);
          return;
        }

        // One quick refinement attempt (max 3s extra)
        try {
          const refined = await getCurrentPosition(REFINE_OPTIONS);
          if (isValidReading(refined)) {
            finish(pickBest(first, refined));
          } else {
            finish(first);
          }
        } catch {
          finish(first);
        }
      })
      .catch((err) => {
        if (settled) return;
        reject(err instanceof Error ? err : new Error("UNAVAILABLE"));
      });
  });
}

export type LiveTrackerOptions = {
  onPosition: (position: GeolocationPosition) => void;
  onError: (code: GeoErrorCode) => void;
  minIntervalMs?: number;
  minDistanceM?: number;
};

/** Live tracking — only fires when moved or accuracy improves */
export function startLiveTracker(options: LiveTrackerOptions): () => void {
  const {
    onPosition,
    onError,
    minIntervalMs = 12000,
    minDistanceM = 8,
  } = options;

  let lastSent: { lat: number; lng: number; accuracy: number; time: number } | null =
    null;

  const shouldSend = (position: GeolocationPosition): boolean => {
    const now = Date.now();
    const { latitude, longitude, accuracy } = position.coords;

    if (!lastSent) return true;
    if (now - lastSent.time >= minIntervalMs) return true;
    if (accuracy < lastSent.accuracy - 5) return true;

    return (
      distanceMetres(lastSent.lat, lastSent.lng, latitude, longitude) >=
      minDistanceM
    );
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (!shouldSend(position)) return;
      lastSent = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        time: Date.now(),
      };
      onPosition(position);
    },
    (err) => onError(toGeoError(err)),
    FAST_OPTIONS
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export function formatAccuracy(metres: number): string {
  if (metres <= 5) return "Excellent";
  if (metres <= 15) return "Good";
  if (metres <= 50) return "Fair";
  return "Approximate";
}
