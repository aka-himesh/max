import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api/endpoints';
import type { Category, ReportDetail, AiResult } from '../api/types';
import { CATEGORY_LABELS } from '../lib/enums';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { ImageWithBoxes } from '../components/ImageWithBoxes';
import {
  findRoadRegistryByGps,
  reverseGeocodeGps,
  generateComplaintEmailDraft,
  type RoadRegistryRecord,
} from '../data/roadRegistry';
import {
  Camera,
  Upload,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Navigation,
  Bot,
  ShieldCheck,
  Building2,
  HardHat,
  Mail,
  Send,
  Sliders,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Custom marker for map location selection
const locationPickerIcon = L.divIcon({
  className: 'custom-picker-marker',
  html: `
    <div style="
      background-color: #6366f1;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="transform: rotate(45deg); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click event listener to update coordinates
function LocationPickerEvents({
  onSelectLocation,
}: {
  onSelectLocation: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface SamplePhoto {
  name: string;
  category: Category;
  url: string;
  lat: number;
  lng: number;
  address: string;
  isPotholeAuto: boolean;
  aiDetection: AiResult | null;
}

const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    name: 'Pothole (AI Auto-Detected)',
    category: 'pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1458,
    lng: 79.0882,
    address: 'Ring Road Arterial Corridor, Pratap Nagar',
    isPotholeAuto: true,
    aiDetection: {
      model_name: 'Urban Issues YOLOv8 Detector',
      model_version: '1.0',
      detected_class_id: 1,
      detected_class: 'Pothole Issues',
      category: 'pothole',
      confidence: 0.96,
      bounding_box: { x1: 220, y1: 260, x2: 680, y2: 560, image_width: 1280, image_height: 720 },
      processed_at: new Date().toISOString(),
    },
  },
  {
    name: 'Severe Pothole Cluster',
    category: 'pothole',
    url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1524,
    lng: 79.0912,
    address: 'Central Market Link Road, Ward 8',
    isPotholeAuto: true,
    aiDetection: {
      model_name: 'Urban Issues YOLOv8 Detector',
      model_version: '1.0',
      detected_class_id: 1,
      detected_class: 'Pothole Issues',
      category: 'pothole',
      confidence: 0.92,
      bounding_box: { x1: 180, y1: 240, x2: 740, y2: 590, image_width: 1280, image_height: 720 },
      processed_at: new Date().toISOString(),
    },
  },
  {
    name: 'Garbage (Manual Category)',
    category: 'garbage',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=1280&q=80',
    lat: 21.161,
    lng: 79.082,
    address: 'Sitabuldi Market Street, Central Zone',
    isPotholeAuto: false,
    aiDetection: null,
  },
  {
    name: 'Fallen Tree (Manual Category)',
    category: 'fallen_tree',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1412,
    lng: 79.0995,
    address: 'Industrial Heavy Corridor, Gate 2',
    isPotholeAuto: false,
    aiDetection: null,
  },
];

export const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<Category>('pothole');
  const [manualSeverity, setManualSeverity] = useState<number>(3);
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(21.1458);
  const [longitude, setLongitude] = useState<number>(79.0882);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('Inner Ring Road Arterial Corridor, Pratap Nagar');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [instantAiResult, setInstantAiResult] = useState<AiResult | null>(SAMPLE_PHOTOS[0].aiDetection);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [createdResult, setCreatedResult] = useState<ReportDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive matched road record & contractor information from GPS
  const matchedRoad: RoadRegistryRecord & { distanceMeters: number } = findRoadRegistryByGps(latitude, longitude);

  // Simulate instant client AI scan on image selection
  const runInstantAiPotholeScan = (imageUrl: string, fileName?: string) => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      // Check if uploaded file or URL indicates a pothole
      const isPothole =
        fileName?.toLowerCase().includes('pothole') ||
        imageUrl.includes('photo-1515162816999') ||
        imageUrl.includes('photo-1578328819058');

      if (isPothole) {
        setCategory('pothole');
        setInstantAiResult({
          model_name: 'Urban Issues YOLOv8 Detector',
          model_version: '1.0',
          detected_class_id: 1,
          detected_class: 'Pothole Issues',
          category: 'pothole',
          confidence: 0.95,
          bounding_box: { x1: 220, y1: 260, x2: 680, y2: 560, image_width: 1280, image_height: 720 },
          processed_at: new Date().toISOString(),
        });
      } else {
        setInstantAiResult(null);
      }
      setIsAiAnalyzing(false);
    }, 400);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      runInstantAiPotholeScan(url, file.name);
    }
  };

  const handleSelectSample = (sample: SamplePhoto) => {
    setSelectedImage(null);
    setImagePreview(sample.url);
    setCategory(sample.category);
    setLatitude(sample.lat);
    setLongitude(sample.lng);
    setGpsAccuracy(null);
    setAddress(sample.address);
    setInstantAiResult(sample.aiDetection);
  };

  const updateLocationDetails = async (lat: number, lng: number, acc?: number | null) => {
    setLatitude(lat);
    setLongitude(lng);
    if (acc !== undefined) setGpsAccuracy(acc);

    setIsReverseGeocoding(true);
    try {
      const geocoded = await reverseGeocodeGps(lat, lng);
      setAddress(geocoded.formattedAddress);
    } catch {
      const road = findRoadRegistryByGps(lat, lng);
      setAddress(`${road.road_name}, ${road.ward}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation hardware is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const acc = position.coords.accuracy ? Math.round(position.coords.accuracy * 10) / 10 : null;
        updateLocationDetails(lat, lng, acc);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setErrorMessage('Unable to acquire hardware GPS fix. Click on the map to pinpoint manually.');
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    const fixedLat = parseFloat(lat.toFixed(6));
    const fixedLng = parseFloat(lng.toFixed(6));
    updateLocationDetails(fixedLat, fixedLng, null);
  };

  // Generate complaint email preview
  const emailDraft = generateComplaintEmailDraft({
    reportId: 'DRAFT_' + Math.floor(Math.random() * 9000 + 1000),
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    roadRecord: matchedRoad,
    latitude,
    longitude,
    severity: category === 'pothole' ? 4 : manualSeverity,
    aiConfidence: instantAiResult?.confidence,
    description,
    evidenceUrl: imagePreview,
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailDraft.body);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Mutation to create report
  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      } else {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        formData.append('image', blob, 'evidence.jpg');
      }
      formData.append('category', category);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      if (description) formData.append('description', description);
      if (address) formData.append('address', address);

      return api.createReport(formData);
    },
    onSuccess: (data) => {
      setCreatedResult(data);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-map'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to submit report. Please check required fields.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    createMutation.mutate();
  };

  // Success view with AI analysis breakdown and contractor dispatch summary
  if (createdResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Civic Issue Successfully Lodged & Dispatched!
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Your complaint has been registered with incident ID{' '}
            <span className="font-mono font-bold text-indigo-400">#{createdResult.report_id}</span> and routed to{' '}
            <span className="font-semibold text-white">{createdResult.department_name}</span>.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>YOLOv8 AI Automatic Triage Result</span>
              </h3>
              {createdResult.category === 'pothole' ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  Pothole Auto-Verified (YOLOv8)
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                  Manual Citizen Classification
                </span>
              )}
            </div>

            <ImageWithBoxes
              imageUrl={createdResult.image_url}
              aiResult={createdResult.ai_result}
              alt={createdResult.category}
            />

            {/* Contractor & DLP Status in Success Modal */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <span>Responsible Contractor / Authority:</span>
                </div>
                {matchedRoad.dlp_active ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Active DLP Warranty (24h SLA)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.05] text-slate-400">
                    Municipal PWD Maintenance
                  </span>
                )}
              </div>
              <p className="text-white font-medium">
                {matchedRoad.contractor ? matchedRoad.contractor.company : matchedRoad.municipal_officer.department}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Notice dispatched to: {matchedRoad.contractor ? matchedRoad.contractor.email : matchedRoad.municipal_officer.email}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400">Assigned Severity</div>
                <div className="font-bold text-white text-sm">Level {createdResult.severity}/5</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400">Calculated Priority</div>
                <div className="font-bold text-indigo-400 font-mono text-sm">{createdResult.priority_score.toFixed(0)}/100</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400">Department</div>
                <div className="font-semibold text-white truncate">{createdResult.department_name}</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400">Current Status</div>
                <div className="font-bold text-emerald-400 uppercase text-[11px]">{createdResult.status}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/reports/${createdResult.report_id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold shadow-md transition"
            >
              <span>View Report in Authority Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedResult(null);
                setDescription('');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold border border-white/10 transition"
            >
              Submit Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Camera className="w-7 h-7 text-indigo-400" />
            <span>Civic & Pothole Issue Reporter</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            YOLOv8 AI automatic pothole detection, manual multi-hazard labeling, and instant road contractor DLP matching.
          </p>
        </div>

        {/* Link to Live Drive Mode */}
        <Link
          to="/drive-mode"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 shadow-md"
          title="Switch to real-time vehicle camera Drive Mode"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Launch Live Drive Mode</span>
        </Link>
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Photo Evidence & AI Realtime Analysis */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">1. Photo Evidence & AI Pothole Scanner</h2>
            </div>
            {category === 'pothole' && instantAiResult ? (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Pothole Auto-Detected ({(instantAiResult.confidence * 100).toFixed(0)}%)</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                Manual Classification Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-indigo-400 bg-white/[0.02] transition relative group">
              <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-indigo-400 transition" />
              <p className="text-xs font-semibold text-slate-200">Upload or drop road photo</p>
              <p className="text-[11px] text-slate-500 mt-0.5">JPEG / PNG up to 8MB (YOLOv8 automatically scans for potholes)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Photo Preview with Bounding Box Overlay */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 h-48 flex items-center justify-center">
              {isAiAnalyzing ? (
                <div className="text-center space-y-2">
                  <Spinner size="md" className="text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Running YOLOv8 scan...</p>
                </div>
              ) : (
                <>
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  {instantAiResult && (
                    <div
                      className="absolute border-2 border-emerald-400 bg-emerald-500/25 rounded transition-all pointer-events-none"
                      style={{
                        left: `${(instantAiResult.bounding_box.x1 / 1280) * 100}%`,
                        top: `${(instantAiResult.bounding_box.y1 / 720) * 100}%`,
                        width: `${((instantAiResult.bounding_box.x2 - instantAiResult.bounding_box.x1) / 1280) * 100}%`,
                        height: `${((instantAiResult.bounding_box.y2 - instantAiResult.bounding_box.y1) / 720) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        Pothole ({(instantAiResult.confidence * 100).toFixed(0)}%)
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    {selectedImage ? selectedImage.name : 'Sample Evidence Loaded'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Demo Scenario Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Or choose a demo scenario:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition flex flex-col gap-1 ${
                    imagePreview === sample.url
                      ? 'border-indigo-500 bg-indigo-500/20 font-semibold text-white shadow-sm'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300'
                  }`}
                >
                  <span className="truncate">{sample.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {sample.isPotholeAuto ? '✦ AI Auto-Pothole' : 'Manual Label'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Location & GPS Road Contractor Match */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold text-white">
                  2. Geolocation & Road Contractor DLP Matching
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {gpsAccuracy !== null ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ⚡ Hardware GPS Fix (±{gpsAccuracy}m precision)
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono text-slate-400 bg-white/[0.05]">
                      Pinpoint Location (Sub-meter Accuracy)
                    </span>
                  )}
                  {isReverseGeocoding && (
                    <span className="text-[10px] text-cyan-400 animate-pulse flex items-center gap-1">
                      <Spinner size="sm" />
                      <span>Resolving address...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-xl border border-indigo-500/30 transition shadow-sm self-start sm:self-auto"
            >
              {isLocating ? <Spinner size="sm" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>{isLocating ? 'Acquiring Satellites...' : 'Lock Live GPS (High Accuracy)'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Click anywhere on the map or drag the pin to set the exact pothole spot. The system uses Haversine geodesic distance to match the registered contractor.
          </p>

          {/* Interactive Leaflet Location Picker with Precision Circle */}
          <div className="h-72 rounded-2xl overflow-hidden border border-white/10 relative">
            <MapContainer
              center={[latitude, longitude]}
              zoom={15}
              className="w-full h-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle
                center={[latitude, longitude]}
                radius={gpsAccuracy ? Math.max(gpsAccuracy, 8) : 12}
                pathOptions={{
                  color: '#6366f1',
                  fillColor: '#818cf8',
                  fillOpacity: 0.2,
                  weight: 1.5,
                }}
              />
              <Marker
                position={[latitude, longitude]}
                icon={locationPickerIcon}
                draggable={true}
                eventHandlers={{
                  dragend(e) {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleMapLocationSelect(pos.lat, pos.lng);
                  },
                }}
              />
              <LocationPickerEvents onSelectLocation={handleMapLocationSelect} />
            </MapContainer>
            <div className="absolute top-2 right-2 z-[400] glass-capsule px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-200 shadow-md">
              💡 Drag pin or click map to reposition
            </div>
            <div className="absolute bottom-2 left-2 z-[400] glass-capsule px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-indigo-300 shadow-md">
              GPS: {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E
            </div>
          </div>

          {/* Road Contractor & Public Tender Match Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Public Tender & Contractor Registry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {matchedRoad.distanceMeters !== undefined ? `${matchedRoad.distanceMeters}m to centerline` : 'Matched'}
                </span>
                {matchedRoad.dlp_active ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>DLP Active (Contractor Liable)</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-white/[0.05] text-slate-400">
                    DLP Expired (Municipal PWD)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 space-y-1">
                <div className="text-[10px] text-slate-400 font-mono">Matched Road Segment</div>
                <div className="font-bold text-white truncate">{matchedRoad.road_name}</div>
                <div className="text-[11px] text-slate-400 truncate">{matchedRoad.road_segment}</div>
                <div className="text-[10px] text-slate-500 font-mono">Tender: {matchedRoad.tender_number}</div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 space-y-1">
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-amber-400" />
                  <span>Responsible Contractor</span>
                </div>
                <div className="font-bold text-white truncate">
                  {matchedRoad.contractor ? matchedRoad.contractor.company : matchedRoad.municipal_officer.department}
                </div>
                <div className="text-[11px] text-slate-400">
                  {matchedRoad.contractor ? `Lead: ${matchedRoad.contractor.contractor_name}` : `Officer: ${matchedRoad.municipal_officer.name}`}
                </div>
                <div className="text-[10px] text-cyan-300 font-mono truncate">
                  {matchedRoad.contractor ? matchedRoad.contractor.email : matchedRoad.municipal_officer.email}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (6 Decimals)</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => updateLocationDetails(parseFloat(e.target.value) || 0, longitude)}
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (6 Decimals)</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => updateLocationDetails(latitude, parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Road / Street Landmark</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Inner Ring Road Arterial Corridor"
                className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Issue Details & Manual Categorization */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">3. Issue Category & Citizen Observation</h2>
            {category !== 'pothole' && (
              <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-semibold">
                Manual Category Selected
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Issue Category (Potholes Auto-Detected, Others Manual)
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setCategory(key as Category);
                      if (key !== 'pothole') {
                        setInstantAiResult(null);
                      }
                    }}
                    className={`p-2 rounded-xl text-left text-xs transition border flex items-center justify-between ${
                      category === key
                        ? 'border-indigo-500 bg-indigo-500/20 text-white font-semibold'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    {key === 'pothole' && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">AI</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {/* Manual Severity Slider if non-pothole */}
              {category !== 'pothole' && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Manual Severity Rating</span>
                    </span>
                    <span className="font-bold text-white">Level {manualSeverity}/5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Low Impact</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                    <span>Critical Hazard</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Additional Observations & Context
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe damage dimensions, depth, water logging, traffic impediment, or safety risk..."
                  className="w-full text-xs p-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Contractor Notice / Email Draft Preview Accordion */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-lg space-y-3">
          <button
            type="button"
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            className="w-full flex items-center justify-between text-left text-xs text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-2 font-bold">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Preview Official DLP Contractor Notice / Email Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-mono">
                {matchedRoad.dlp_active ? '24h Contractor SLA' : '72h Municipal SLA'}
              </span>
              {showEmailPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showEmailPreview && (
            <div className="mt-3 space-y-2 animate-in fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  Recipient:{' '}
                  <span className="font-mono text-cyan-300 font-semibold">{emailDraft.recipientEmail}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/10"
                >
                  {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEmail ? 'Copied!' : 'Copy Draft'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#030712] border border-white/10 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                {emailDraft.body}
              </div>
            </div>
          )}
        </div>

        {/* Submission Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Spinner size="sm" className="text-slate-900" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {createMutation.isPending
                ? 'Processing AI Triage...'
                : category === 'pothole'
                ? 'Submit & Dispatch Pothole Notice'
                : 'Submit Civic Issue'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
