import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Navigation,
  Activity,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Layers,
  MapPin,
  Clock,
  Gauge,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building,
  X,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useDriveSession, type PotholeDetectionEvent } from '../hooks/useDriveSession';

export const DriveMode: React.FC = () => {
  const { videoRef, cameraState, startCamera, stopCamera, toggleCamera, captureFrame } = useCamera();
  const geo = useGeoLocation();
  const [selectedEvent, setSelectedEvent] = useState<PotholeDetectionEvent | null>(null);

  const {
    isActive,
    isProcessing,
    stats,
    lastDetection,
    detectionEvents,
    startSession,
    stopSession,
  } = useDriveSession(captureFrame, geo, 3500);

  // Initialize camera and GPS when entering page
  useEffect(() => {
    startCamera('environment');
    geo.startTracking();

    return () => {
      stopCamera();
      geo.stopTracking();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0d1322] border border-white/[0.08] p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Live Drive Mode
                <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold tracking-wider">
                  Vision AI + GPS
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Real-time road camera analysis with continuous telemetry, 30m deduplication, and officer verification pipeline.
              </p>
            </div>
          </div>
        </div>

        {/* Master Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            disabled={!cameraState.isStreaming}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/[0.08] font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            title="Switch front/rear camera"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Flip Camera</span>
          </button>

          <button
            onClick={isActive ? stopSession : startSession}
            disabled={!cameraState.isStreaming}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2.5 shadow-lg transition-all ${
              isActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 disabled:opacity-50'
            }`}
          >
            {isActive ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Stop Drive Recording
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Start Drive Recording
              </>
            )}
          </button>
        </div>
      </div>

      {/* Camera Feed & Real-time HUD Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Viewfinder Main Column */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-[16/10] bg-[#070b14] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl flex items-center justify-center">
            {/* Real WebRTC Video Viewport */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Camera Permission / Error Fallback */}
            {!cameraState.isStreaming && (
              <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
                  <Camera className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Camera Inactive</h3>
                <p className="text-sm text-slate-400 max-w-md mb-5">
                  {cameraState.error ||
                    'Please grant camera permission to stream rear dashcam video for automated pothole detection.'}
                </p>
                <button
                  onClick={() => startCamera('environment')}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-900/40 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Grant Permission & Start Stream
                </button>
              </div>
            )}

            {/* Active AI Scanning Overlay HUD */}
            {cameraState.isStreaming && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10">
                {/* Top HUD Row */}
                <div className="flex items-start justify-between gap-2">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider backdrop-blur-md border flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-slate-900/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-rose-500 animate-ping' : 'bg-slate-500'
                        }`}
                      />
                      {isActive ? 'RECORDING & SCANNING' : 'STANDBY'}
                    </span>

                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-900/80 backdrop-blur-md border border-white/10 text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      {isProcessing ? 'Analyzing Frame...' : 'AI Ready (3.5s interval)'}
                    </span>
                  </div>

                  {/* GPS Coordinates HUD */}
                  <div className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-right">
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 justify-end">
                      <Navigation className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                      {geo.latitude ? `${geo.latitude.toFixed(5)}, ${geo.longitude?.toFixed(5)}` : 'Acquiring GPS...'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Accuracy: {geo.accuracy ? `±${geo.accuracy}m` : 'N/A'} • Speed:{' '}
                      {geo.speedKmH !== null ? `${geo.speedKmH} km/h` : '0 km/h'}
                    </div>
                  </div>
                </div>

                {/* Center Reticle & Detection Bounding Box */}
                <div className="relative w-full flex-1 flex items-center justify-center">
                  {/* Scanning Crosshairs */}
                  {isActive && (
                    <div className="relative w-72 h-44 border-2 border-cyan-500/40 rounded-xl flex items-center justify-center transition-all">
                      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                      {isProcessing && (
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                      )}

                      <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase">
                        AI Vision Detection Zone
                      </span>
                    </div>
                  )}

                  {/* Recent Detection Flash Banner */}
                  {lastDetection && Date.now() - lastDetection.timestamp < 5000 && (
                    <div className="absolute top-4 inset-x-6 p-3 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-200 flex items-center justify-between shadow-2xl animate-bounce">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            {lastDetection.isDuplicate
                              ? '⚠️ 30m Duplicate Pothole Merged'
                              : '🚨 Pothole Detected & Logged!'}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {lastDetection.damageType.replace('_', ' ')} • Lat: {lastDetection.latitude.toFixed(4)},
                            Lng: {lastDetection.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/30 text-amber-100 font-semibold border border-amber-400/30">
                        Pending Verification
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom HUD Overlay */}
                <div className="flex items-center justify-between gap-3 text-xs text-slate-300 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Trip: {formatTime(stats.elapsedSeconds)}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                      {geo.speedKmH ?? 0} km/h
                    </span>
                    <span className="flex items-center gap-1.5 font-medium hidden sm:inline-flex">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {stats.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono text-[11px]">
                      {stats.framesAnalyzed} Frames Processed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Session Real-time Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08]">
              <div className="text-xs text-slate-400 font-medium">Potholes Detected</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 flex items-baseline gap-2">
                {stats.potholesDetected}
                <span className="text-[10px] text-amber-500/80 font-normal">Pending Approval</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08]">
              <div className="text-xs text-slate-400 font-medium">30m Duplicates Merged</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1 flex items-baseline gap-2">
                {stats.duplicatesMerged}
                <span className="text-[10px] text-indigo-400/80 font-normal">Clustered</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08]">
              <div className="text-xs text-slate-400 font-medium">Frames Analyzed</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{stats.framesAnalyzed}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08]">
              <div className="text-xs text-slate-400 font-medium">Distance Covered</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.distanceKm} km</div>
            </div>
          </div>

          {/* Contractor & Verification Pipeline Notice */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Strict Verification Protocol:</strong> All potholes logged by Drive Mode are assigned to the road's registered contractor in the database with status <code className="text-amber-300 font-mono">pending_verification</code>. A municipal officer must verify the capture before the contractor is issued an official DLP Notice & SLA Clock starts.
            </div>
          </div>
        </div>

        {/* Right Column: Live Detection Feed & Contractor Lookup */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-2xl p-5 flex flex-col flex-1 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Session Detections ({detectionEvents.length})
                </h2>
              </div>
              {isActive && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Feed
                </span>
              )}
            </div>

            {/* Detections List */}
            <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
              {detectionEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                  No potholes detected in this session yet.
                  <br />
                  Start drive recording to begin continuous camera inspection.
                </div>
              ) : (
                detectionEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/[0.06] transition-all cursor-pointer flex gap-3"
                  >
                    {/* Thumbnail */}
                    {event.thumbnailUrl ? (
                      <img
                        src={event.thumbnailUrl}
                        alt="Captured Defect"
                        className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-white truncate capitalize">
                          {event.damageType.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                            event.isDuplicate
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {event.isDuplicate ? 'Deduplicated' : 'Pending Verification'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        {event.contractorName || 'Road Contractor Division'}
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                        <span>
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        {event.reportId && (
                          <Link
                            to={`/reports/${event.reportId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                          >
                            View #{event.reportId.replace('r_', '')}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Detection Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c1220] border border-cyan-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white capitalize">
                  {selectedEvent.damageType.replace('_', ' ')} Detection
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedEvent.thumbnailUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black flex items-center justify-center">
                <img
                  src={selectedEvent.thumbnailUrl}
                  alt="Detection Frame"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] text-slate-400">GPS Coordinates</div>
                <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                  {selectedEvent.latitude.toFixed(5)}, {selectedEvent.longitude.toFixed(5)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] text-slate-400">AI Confidence</div>
                <div className="font-mono text-emerald-400 font-semibold mt-0.5">
                  {(selectedEvent.confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 col-span-2">
                <div className="text-[10px] text-slate-400">Assigned Road & Contractor</div>
                <div className="text-slate-200 font-medium mt-0.5">
                  {selectedEvent.roadName} — <span className="text-amber-400">{selectedEvent.contractorName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              {selectedEvent.reportId && (
                <Link
                  to={`/reports/${selectedEvent.reportId}`}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-900/40"
                >
                  <span>Open Full Incident View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
