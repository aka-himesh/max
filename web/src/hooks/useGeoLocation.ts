import { useState, useEffect, useRef, useCallback } from 'react';

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // meters
  accuracyLevel: 'satellite' | 'standard' | 'approximate' | 'unknown';
  speed: number | null; // m/s
  speedKmH: number | null;
  heading: number | null; // degrees
  altitude: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
  fixCount: number;
}

export const useGeoLocation = () => {
  const [location, setLocation] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    accuracyLevel: 'unknown',
    speed: null,
    speedKmH: null,
    heading: null,
    altitude: null,
    timestamp: null,
    error: null,
    isTracking: false,
    fixCount: 0,
  });

  const watchIdRef = useRef<number | null>(null);
  const bestFixRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);

  const getAccuracyLevel = (accuracy: number | null): 'satellite' | 'standard' | 'approximate' | 'unknown' => {
    if (accuracy === null) return 'unknown';
    if (accuracy <= 8) return 'satellite'; // High Precision Satellite Fix (<8m)
    if (accuracy <= 25) return 'standard'; // Standard GPS Fix (8-25m)
    return 'approximate'; // Cellular / Wi-Fi Triangulation (>25m)
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation hardware is not supported on this browser.',
        isTracking: false,
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocation((prev) => ({ ...prev, isTracking: true, error: null }));

    // High-accuracy hardware GPS options
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0, // Force fresh satellite/sensor reading, no cached positions
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
      const speedKmH = speed !== null && speed >= 0 ? Math.round(speed * 3.6 * 10) / 10 : null;
      const acc = accuracy ? Math.round(accuracy * 10) / 10 : null;
      const accLevel = getAccuracyLevel(acc);

      // Track the best accuracy fix
      if (!bestFixRef.current || (acc !== null && acc < bestFixRef.current.accuracy)) {
        bestFixRef.current = { lat: latitude, lng: longitude, accuracy: acc || 999 };
      }

      setLocation((prev) => ({
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        accuracy: acc,
        accuracyLevel: accLevel,
        speed: speed ?? null,
        speedKmH,
        heading: heading ?? null,
        altitude: altitude ? Math.round(altitude * 10) / 10 : null,
        timestamp: position.timestamp,
        error: null,
        isTracking: true,
        fixCount: prev.fixCount + 1,
      }));
    };

    const handleError = (error: GeolocationPositionError) => {
      let message = 'Unable to acquire satellite GPS fix.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access permission was denied. Please allow GPS access in browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Satellite GPS signal unavailable. Please ensure Device Location / High Accuracy is ON.';
          break;
        case error.TIMEOUT:
          message = 'GPS acquisition timed out. Re-acquiring satellite lock...';
          break;
      }
      setLocation((prev) => ({
        ...prev,
        error: message,
      }));
    };

    // Immediate one-shot fix
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Continuous watch for movement updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocation((prev) => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...location,
    startTracking,
    stopTracking,
  };
};
