import { useState, useRef, useCallback, useEffect } from 'react';
import type { GeoLocationState } from './useGeoLocation';
import type { CapturedFrame } from './useCamera';
import { apiClient } from '../api/client';

export interface PotholeDetectionEvent {
  id: string;
  reportId?: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  speedKmH?: number | null;
  heading?: number | null;
  damageType: string;
  confidence: number;
  roadName?: string;
  contractorName?: string;
  dlpActive?: boolean;
  isDuplicate: boolean;
  duplicateOf?: string | null;
  distanceMeters?: number;
  thumbnailUrl?: string;
  status: string;
}

export interface DriveSessionStats {
  startTime: number | null;
  elapsedSeconds: number;
  framesAnalyzed: number;
  potholesDetected: number;
  duplicatesMerged: number;
  distanceKm: number;
}

// Play audible alert when pothole is detected
const playDetectionSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);

    // Haptic feedback for mobile phones
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }
  } catch (e) {
    // AudioContext might be blocked until user gesture
  }
};

export const useDriveSession = (
  captureFrame: () => Promise<CapturedFrame | null>,
  geo: GeoLocationState,
  samplingIntervalMs = 4000
) => {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetection, setLastDetection] = useState<PotholeDetectionEvent | null>(null);
  const [detectionEvents, setDetectionEvents] = useState<PotholeDetectionEvent[]>([]);

  const [stats, setStats] = useState<DriveSessionStats>({
    startTime: null,
    elapsedSeconds: 0,
    framesAnalyzed: 0,
    potholesDetected: 0,
    duplicatesMerged: 0,
    distanceKm: 0,
  });

  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Distance calculator
  const addDistance = useCallback((lat: number, lng: number) => {
    if (lastPosRef.current) {
      const R = 6371; // km
      const dLat = ((lat - lastPosRef.current.lat) * Math.PI) / 180;
      const dLng = ((lng - lastPosRef.current.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lastPosRef.current.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      if (dist > 0.002 && dist < 2) {
        // filter GPS jitter and impossible teleportation
        setStats((s) => ({ ...s, distanceKm: parseFloat((s.distanceKm + dist).toFixed(2)) }));
        lastPosRef.current = { lat, lng };
      }
    } else {
      lastPosRef.current = { lat, lng };
    }
  }, []);

  // Frame processing step
  const processCurrentFrame = useCallback(async () => {
    if (isProcessing) return;

    // Use current coordinates or default Nagpur corridor if GPS unavailable
    const lat = geo.latitude ?? 21.1458;
    const lng = geo.longitude ?? 79.0882;

    addDistance(lat, lng);

    const frame = await captureFrame();
    if (!frame) return;

    setIsProcessing(true);
    setStats((s) => ({ ...s, framesAnalyzed: s.framesAnalyzed + 1 }));

    try {
      const formData = new FormData();
      formData.append('frame', frame.blob, 'drive_frame.jpg');
      formData.append('latitude', lat.toString());
      formData.append('longitude', lng.toString());
      if (geo.speedKmH !== null) formData.append('speed_kmh', geo.speedKmH.toString());
      if (geo.heading !== null) formData.append('heading', geo.heading.toString());
      formData.append('device_id', 'phone-dashcam-v1');

      const res = await apiClient.post('/ml/detect-frame', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const resData = res.data?.data;
      if (resData && resData.detected) {
        playDetectionSound();

        const event: PotholeDetectionEvent = {
          id: 'det_' + Date.now(),
          reportId: resData.report_id,
          timestamp: Date.now(),
          latitude: lat,
          longitude: lng,
          speedKmH: geo.speedKmH,
          heading: geo.heading,
          damageType: resData.damage_type || 'pothole_cavity',
          confidence: resData.confidence || 0.95,
          roadName: resData.road?.road_name || 'Corridor Telemetry',
          contractorName: resData.contractor?.contractor_name || 'Assigned Division',
          dlpActive: resData.road?.dlp_active,
          isDuplicate: resData.is_duplicate || false,
          duplicateOf: resData.duplicate_of || null,
          distanceMeters: resData.distance_to_canonical_meters,
          thumbnailUrl: frame.dataUrl,
          status: resData.status || 'pending_verification',
        };

        setLastDetection(event);
        setDetectionEvents((prev) => [event, ...prev.slice(0, 49)]);

        if (resData.is_duplicate) {
          setStats((s) => ({ ...s, duplicatesMerged: s.duplicatesMerged + 1 }));
        } else {
          setStats((s) => ({ ...s, potholesDetected: s.potholesDetected + 1 }));
        }
      }
    } catch (err) {
      console.warn('Frame analysis skipped or network error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [captureFrame, geo.latitude, geo.longitude, geo.speedKmH, geo.heading, isProcessing, addDistance]);

  // Session start/stop
  const startSession = useCallback(() => {
    setIsActive(true);
    setStats({
      startTime: Date.now(),
      elapsedSeconds: 0,
      framesAnalyzed: 0,
      potholesDetected: 0,
      duplicatesMerged: 0,
      distanceKm: 0,
    });
    lastPosRef.current = geo.latitude && geo.longitude ? { lat: geo.latitude, lng: geo.longitude } : null;
  }, [geo.latitude, geo.longitude]);

  const stopSession = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    intervalRef.current = null;
    timerRef.current = null;
  }, []);

  const toggleSession = useCallback(() => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  }, [isActive, startSession, stopSession]);

  // Timer loop for elapsed seconds
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setStats((s) => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Frame sampling interval loop
  useEffect(() => {
    if (isActive) {
      // First frame capture after small initial warmup
      const initialTimer = setTimeout(() => {
        processCurrentFrame();
      }, 1500);

      intervalRef.current = window.setInterval(() => {
        processCurrentFrame();
      }, samplingIntervalMs);

      return () => {
        clearTimeout(initialTimer);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isActive, samplingIntervalMs, processCurrentFrame]);

  return {
    isActive,
    isProcessing,
    stats,
    lastDetection,
    detectionEvents,
    startSession,
    stopSession,
    toggleSession,
    clearDetections: () => setDetectionEvents([]),
  };
};
