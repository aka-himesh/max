import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  Video,
  Play,
  Pause,
  Mail,
  Building2,
  HardHat,
  CheckCircle2,
  Send,
  ExternalLink,
  Bot,
  Phone,
} from 'lucide-react';

interface DashcamFrame {
  id: string;
  label: string;
  imageUrl: string;
  speedKmH: number;
  latitude: number;
  longitude: number;
  detection: {
    class_id: number;
    class_name: string;
    category: string;
    confidence: number;
    bbox: { x1: number; y1: number; x2: number; y2: number };
  };
  road: {
    road_id: string;
    road_name: string;
    road_segment: string;
    dlp_start_date: string;
    dlp_end_date: string;
    dlp_active: boolean;
  };
  contractor: {
    contractor_id: string;
    contractor_name: string;
    company: string;
    email: string;
    phone: string;
  } | null;
  regionalEngineerEmail: string;
}

const DASHCAM_SIMULATION_FRAMES: DashcamFrame[] = [
  {
    id: 'frame-pothole-dlp',
    label: 'Inner Ring Road (km 13.2) - Under Active Contractor DLP',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1280&q=80',
    speedKmH: 42,
    latitude: 21.1458,
    longitude: 79.0882,
    detection: {
      class_id: 1,
      class_name: 'Pothole Issues',
      category: 'pothole',
      confidence: 0.94,
      bbox: { x1: 220, y1: 280, x2: 640, y2: 560 },
    },
    road: {
      road_id: 'rd_401',
      road_name: 'Inner Ring Road',
      road_segment: 'Segment 4A (km 12.4 - 14.1)',
      dlp_start_date: '2024-06-01',
      dlp_end_date: '2028-05-31',
      dlp_active: true,
    },
    contractor: {
      contractor_id: 'c_901',
      contractor_name: 'Rajesh Sharma',
      company: 'Apex Infrastructure & Highway Builders Ltd.',
      email: 'contact@apexinfra.com',
      phone: '+91 98230 45678',
    },
    regionalEngineerEmail: 'roads.engineer@city.gov',
  },
  {
    id: 'frame-road-nodlp',
    label: 'Central Market Expressway - Municipal Maintenance (DLP Expired)',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1280&q=80',
    speedKmH: 36,
    latitude: 21.161,
    longitude: 79.082,
    detection: {
      class_id: 3,
      class_name: 'Broken Road Sign Issues',
      category: 'broken_road_sign',
      confidence: 0.91,
      bbox: { x1: 150, y1: 120, x2: 380, y2: 460 },
    },
    road: {
      road_id: 'rd_402',
      road_name: 'Market Link Arterial Road',
      road_segment: 'North Sector Link (km 3.1 - 4.5)',
      dlp_start_date: '2019-01-01',
      dlp_end_date: '2023-12-31',
      dlp_active: false,
    },
    contractor: null,
    regionalEngineerEmail: 'traffic.engineer@city.gov',
  },
  {
    id: 'frame-damaged-road',
    label: 'Industrial Highway Link - Heavy Asphalt Subsidence',
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1280&q=80',
    speedKmH: 48,
    latitude: 21.1412,
    longitude: 79.0995,
    detection: {
      class_id: 0,
      class_name: 'Damaged Road Issues',
      category: 'damaged_road',
      confidence: 0.88,
      bbox: { x1: 180, y1: 300, x2: 720, y2: 600 },
    },
    road: {
      road_id: 'rd_403',
      road_name: 'Industrial Heavy Corridor',
      road_segment: 'Phase II Heavy Freight Sector',
      dlp_start_date: '2023-10-01',
      dlp_end_date: '2027-09-30',
      dlp_active: true,
    },
    contractor: {
      contractor_id: 'c_902',
      contractor_name: 'Vikram Mehta',
      company: 'Premier Roadways & Pavements Corp.',
      email: 'support@premierroadways.in',
      phone: '+91 98450 11223',
    },
    regionalEngineerEmail: 'corridor.officer@city.gov',
  },
];

export const DashcamSimulator: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<{
    report_id: string;
    is_duplicate: boolean;
    status: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentFrame = DASHCAM_SIMULATION_FRAMES[activeFrameIndex];

  // Continuous dashcam frame cycle simulation when play is enabled
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % DASHCAM_SIMULATION_FRAMES.length);
      setIsEmailSent(false);
      setSubmissionResult(null);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Submit dashcam detection to ML Ingestion endpoint
  const mlIngestMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      const payload = {
        client_event_id: `dashcam_${Date.now()}`,
        device_id: 'bus-12-cam-1',
        captured_at: new Date().toISOString(),
        latitude: currentFrame.latitude,
        longitude: currentFrame.longitude,
        model: { name: 'Urban Issues YOLOv8 Detector', version: '1.0' },
        detection: {
          class_id: currentFrame.detection.class_id,
          class_name: currentFrame.detection.class_name,
          category: currentFrame.detection.category,
          confidence: currentFrame.detection.confidence,
          bbox: currentFrame.detection.bbox,
          image_width: 1280,
          image_height: 720,
        },
      };

      const res = await fetch(currentFrame.imageUrl);
      const blob = await res.blob();
      formData.append('image', blob, 'dashcam_frame.jpg');
      formData.append('payload', JSON.stringify(payload));

      return api.submitMlReport(formData);
    },
    onSuccess: (data) => {
      setSubmissionResult(data);
      setIsEmailSent(true);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-map'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Failed to submit vehicle detection report.');
    },
  });

  const handleSendEmailNotice = () => {
    setErrorMsg(null);
    mlIngestMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Video className="w-7 h-7 text-indigo-600" />
            <span>AI Dashcam Vehicle Runner & DLP Contractor Mailer</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated dashcam detection, GPS road registry matching, Defect Liability Period (DLP) verification, and direct contractor email notification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition ${
              isPlaying
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Feed' : 'Resume Live Feed'}</span>
          </button>
        </div>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} />}

      {/* Main Simulation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Feed HUD & Bounding Box Overlay (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-xl overflow-hidden relative">
            {/* Top HUD Telemetry */}
            <div className="flex items-center justify-between text-xs text-white/90 pb-3 border-b border-white/10 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold text-red-400">REC [LIVE DASHCAM]</span>
                <span className="text-slate-400 hidden sm:inline">| Unit: bus-12-cam-1</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">{currentFrame.speedKmH} km/h</span>
                <span className="text-slate-400">GPS: {currentFrame.latitude.toFixed(4)}, {currentFrame.longitude.toFixed(4)}</span>
              </div>
            </div>

            {/* Frame Display with YOLO Bounding Box */}
            <div className="relative my-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src={currentFrame.imageUrl}
                alt={currentFrame.label}
                className="w-full h-80 object-cover"
              />

              {/* Bounding Box Overlay */}
              <div
                className="absolute border-3 border-rose-500 bg-rose-500/25 rounded-md transition-all shadow-lg animate-pulse"
                style={{
                  left: `${(currentFrame.detection.bbox.x1 / 1280) * 100}%`,
                  top: `${(currentFrame.detection.bbox.y1 / 720) * 100}%`,
                  width: `${((currentFrame.detection.bbox.x2 - currentFrame.detection.bbox.x1) / 1280) * 100}%`,
                  height: `${((currentFrame.detection.bbox.y2 - currentFrame.detection.bbox.y1) / 720) * 100}%`,
                }}
              >
                <div className="absolute -top-7 left-0 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>
                    {currentFrame.detection.class_name} ({(currentFrame.detection.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Bottom Frame Caption */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm p-2 rounded-lg text-white text-[11px] flex items-center justify-between border border-white/10">
                <span className="truncate">{currentFrame.label}</span>
                <span className="text-indigo-300 font-mono shrink-0">YOLOv8 Inference: 38ms</span>
              </div>
            </div>

            {/* Frame Selector Thumbnails */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {DASHCAM_SIMULATION_FRAMES.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveFrameIndex(idx);
                    setIsPlaying(false);
                    setIsEmailSent(false);
                    setSubmissionResult(null);
                  }}
                  className={`p-2 rounded-xl text-left border text-[11px] transition ${
                    activeFrameIndex === idx
                      ? 'border-indigo-500 bg-indigo-950/70 text-white font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-medium">{f.detection.class_name}</div>
                  <div className="text-[10px] opacity-75">{f.road.dlp_active ? 'DLP Active' : 'DLP Expired'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: GPS Road Lookup & Contractor DLP Email System (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Road Database & DLP Match Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">GPS Road Registry Match</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Match &lt; 15m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Matched Road:</span>
                <span className="font-bold text-slate-800">{currentFrame.road.road_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Segment:</span>
                <span className="font-medium text-slate-700">{currentFrame.road.road_segment}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">DLP Liability Status:</span>
                {currentFrame.road.dlp_active ? (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                    ACTIVE (Contractor Liable)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[11px]">
                    EXPIRED (Municipal Engineer)
                  </span>
                )}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>DLP Period:</span>
                <span>{currentFrame.road.dlp_start_date} to {currentFrame.road.dlp_end_date}</span>
              </div>
            </div>
          </div>

          {/* 2. Contractor & Responsible Entity Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Responsible Maintenance Entity</h3>
            </div>

            {currentFrame.contractor ? (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                <div className="font-bold text-amber-950 text-sm">{currentFrame.contractor.company}</div>
                <div className="text-amber-800 font-medium">Lead Contractor: {currentFrame.contractor.contractor_name}</div>
                <div className="flex items-center gap-1.5 text-amber-900 pt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-mono">{currentFrame.contractor.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-900">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{currentFrame.contractor.phone}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">Municipal Public Works Department</div>
                <div className="text-slate-600">Regional Highway Maintenance Division</div>
                <div className="flex items-center gap-1.5 text-slate-700 pt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-mono">{currentFrame.regionalEngineerEmail}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Automated Email Dispatch Simulation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Automated DLP Email Dispatch</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Dry Run Mode</span>
            </div>

            {/* Email Preview Box */}
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
              <div className="text-slate-400">
                To:{' '}
                <span className="text-indigo-300 font-bold">
                  {currentFrame.contractor ? currentFrame.contractor.email : currentFrame.regionalEngineerEmail}
                </span>
              </div>
              <div className="text-slate-400">
                CC: <span className="text-slate-300">{currentFrame.regionalEngineerEmail}</span>
              </div>
              <div className="text-amber-300 font-semibold truncate">
                Subject: [ACTION REQUIRED] {currentFrame.detection.class_name} Detected on {currentFrame.road.road_name}
              </div>
              <div className="text-slate-400 text-[10px] pt-1.5 border-t border-white/10 line-clamp-2">
                Body: Automated notification for hazard on {currentFrame.road.road_segment} (Lat: {currentFrame.latitude.toFixed(4)}, Lng: {currentFrame.longitude.toFixed(4)}). {currentFrame.road.dlp_active ? 'Under active DLP warranty. Deploy repair unit within 24 hours.' : 'Scheduled for municipal repair team dispatch.'}
              </div>
            </div>

            {/* Submit & Dispatch Action Button */}
            {isEmailSent && submissionResult ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Report #{submissionResult.report_id} Ingested & Email Dispatched!</span>
                </div>
                <p className="text-emerald-700 text-[11px]">
                  Simulated DLP notification successfully delivered to{' '}
                  <span className="font-mono font-semibold">
                    {currentFrame.contractor ? currentFrame.contractor.email : currentFrame.regionalEngineerEmail}
                  </span>
                  .
                </p>
                <Link
                  to={`/reports/${submissionResult.report_id}`}
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 pt-1"
                >
                  <span>Open in Authority Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendEmailNotice}
                disabled={mlIngestMutation.isPending}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mlIngestMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {mlIngestMutation.isPending
                    ? 'Transmitting Vehicle Report...'
                    : `Dispatch ${currentFrame.road.dlp_active ? 'Contractor DLP' : 'Municipal'} Notice`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
