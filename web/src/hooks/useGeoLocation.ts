import { useState, useEffect, useRef, useCallback } from 'react';

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null; // m/s
  speedKmH: number | null;
  heading: number | null; // degrees
  altitude: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
}

export const useGeoLocation = () => {
  const [location, setLocation] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    speedKmH: null,
    heading: null,
    altitude: null,
    timestamp: null,
    error: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        isTracking: false,
      }));
      return;
    }

    // Clear previous watcher if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocation((prev) => ({ ...prev, isTracking: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
      const speedKmH = speed !== null && speed >= 0 ? Math.round(speed * 3.6 * 10) / 10 : null;

      setLocation({
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        accuracy: accuracy ? Math.round(accuracy * 10) / 10 : null,
        speed: speed ?? null,
        speedKmH,
        heading: heading ?? null,
        altitude: altitude ? Math.round(altitude * 10) / 10 : null,
        timestamp: position.timestamp,
        error: null,
        isTracking: true,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let message = 'Unable to retrieve location.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission was denied. Please allow location access to tag road coordinates.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'GPS location is currently unavailable. Ensure device location is turned ON.';
          break;
        case error.TIMEOUT:
          message = 'GPS request timed out. Retrying...';
          break;
      }
      setLocation((prev) => ({
        ...prev,
        error: message,
      }));
    };

    // First try immediate one-shot position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Then start continuous watch
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
