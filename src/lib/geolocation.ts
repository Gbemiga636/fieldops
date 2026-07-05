const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 30000,
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
 * Collect multiple GPS readings and return the most accurate one.
 * Mobile GPS often improves over several seconds — this waits for the best fix.
 */
export function acquireBestPosition(
  onProgress?: (progress: AcquireProgress) => void
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("UNSUPPORTED"));
      return;
    }

    const samples: GeolocationPosition[] = [];
    const maxSamples = 6;
    const maxWaitMs = 28000;
    const goodAccuracyM = 15;
    let watchId: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();

      if (samples.length === 0) {
        reject(new Error("UNAVAILABLE"));
        return;
      }

      const best = samples.reduce((a, b) =>
        a.coords.accuracy <= b.coords.accuracy ? a : b
      );
      resolve(best);
    };

    const report = (phase: AcquireProgress["phase"]) => {
      const best = samples.length
        ? samples.reduce((a, b) =>
            a.coords.accuracy <= b.coords.accuracy ? a : b
          )
        : null;
      onProgress?.({
        samples: samples.length,
        bestAccuracy: best?.coords.accuracy ?? null,
        phase,
      });
    };

    report("searching");

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (settled) return;

        const { accuracy } = position.coords;
        if (accuracy > 0 && accuracy < 500) {
          samples.push(position);
        }

        report(samples.length < 2 ? "searching" : "refining");

        const best = samples.reduce((a, b) =>
          a.coords.accuracy <= b.coords.accuracy ? a : b
        );

        if (
          best.coords.accuracy <= goodAccuracyM &&
          samples.length >= 2
        ) {
          report("locked");
          settled = true;
          cleanup();
          resolve(best);
        } else if (samples.length >= maxSamples) {
          finish();
        }
      },
      (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(toGeoError(err)));
      },
      GEO_OPTIONS
    );

    const timer = setTimeout(finish, maxWaitMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        if (position.coords.accuracy > 0 && position.coords.accuracy < 500) {
          samples.push(position);
          report("refining");
        }
      },
      () => {},
      GEO_OPTIONS
    );
  });
}

export type LiveTrackerOptions = {
  onPosition: (position: GeolocationPosition) => void;
  onError: (code: GeoErrorCode) => void;
  minIntervalMs?: number;
  minDistanceM?: number;
};

/** Live tracking with debounce — only fires when moved or accuracy improves */
export function startLiveTracker(options: LiveTrackerOptions): () => void {
  const {
    onPosition,
    onError,
    minIntervalMs = 15000,
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
    GEO_OPTIONS
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export function formatAccuracy(metres: number): string {
  if (metres <= 5) return "Excellent";
  if (metres <= 15) return "Good";
  if (metres <= 50) return "Fair";
  return "Approximate";
}
