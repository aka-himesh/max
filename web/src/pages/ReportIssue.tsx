import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api/endpoints';
import type { Category, ReportDetail } from '../api/types';
import { CATEGORY_LABELS } from '../lib/enums';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { ImageWithBoxes } from '../components/ImageWithBoxes';
import {
  Camera,
  Upload,
  MapPin,
  Compass,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Navigation,
} from 'lucide-react';

// Custom marker for map location selection
const locationPickerIcon = L.divIcon({
  className: 'custom-picker-marker',
  html: `
    <div style="
      background-color: #4f46e5;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
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

const SAMPLE_PHOTOS = [
  {
    name: 'Pothole (Road Hazard)',
    category: 'pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1458,
    lng: 79.0882,
    address: 'Ring Road Junction, Sector 4',
  },
  {
    name: 'Fallen Tree (Obstruction)',
    category: 'fallen_tree',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1412,
    lng: 79.0995,
    address: 'Parkview Boulevard, near Gate 2',
  },
  {
    name: 'Garbage Accumulation',
    category: 'garbage',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1524,
    lng: 79.0912,
    address: 'Sector 4, Market Street',
  },
  {
    name: 'Electric Hazard (Snapped Wire)',
    category: 'electric_hazard',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1280&q=80',
    lat: 21.1399,
    lng: 79.0755,
    address: 'South Avenue, St. Mary School Rd',
  },
];

export const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<Category>('pothole');
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(21.1458);
  const [longitude, setLongitude] = useState<number>(79.0882);
  const [address, setAddress] = useState<string>('Ring Road Junction, Ward 12');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [createdResult, setCreatedResult] = useState<ReportDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutation to create report
  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      } else {
        // Create synthetic blob from sample preview image for mock or real submission
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setSelectedImage(null);
    setImagePreview(sample.url);
    setCategory(sample.category as Category);
    setLatitude(sample.lat);
    setLongitude(sample.lng);
    setAddress(sample.address);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAddress(`GPS Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setErrorMessage('Unable to retrieve your current location. Please click on the map to choose manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(`Selected Location (Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)})`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    createMutation.mutate();
  };

  // Success view with AI analysis breakdown
  if (createdResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Civic Issue Successfully Lodged!
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Your complaint has been submitted with incident ID{' '}
            <span className="font-mono font-bold text-indigo-600">#{createdResult.report_id}</span> and routed to{' '}
            <span className="font-semibold text-slate-800">{createdResult.department_name}</span>.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              AI Automatic Triage & Detection Result
            </h3>
            <ImageWithBoxes
              imageUrl={createdResult.image_url}
              aiResult={createdResult.ai_result}
              alt={createdResult.category}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Assigned Severity</div>
                <div className="font-bold text-slate-800 text-sm">Level {createdResult.severity}/5</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Calculated Priority</div>
                <div className="font-bold text-indigo-600 text-sm">{createdResult.priority_score.toFixed(0)}/100</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Department</div>
                <div className="font-semibold text-slate-800 truncate">{createdResult.department_name}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Current Status</div>
                <div className="font-bold text-emerald-600 uppercase text-[11px]">{createdResult.status}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/reports/${createdResult.report_id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Report Civic Issue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload photo evidence, classify the category, and select the location on the map for automatic AI triage and dispatch.
        </p>
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Photo Evidence */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">1. Photographic Evidence</h2>
            </div>
            <span className="text-xs text-rose-500 font-semibold">*Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-indigo-500 bg-slate-50/50 transition relative">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Upload photo from device</p>
              <p className="text-[11px] text-slate-400 mt-0.5">JPEG or PNG up to 8MB</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Photo Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 h-48 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono">
                {selectedImage ? selectedImage.name : 'Sample Evidence Selected'}
              </div>
            </div>
          </div>

          {/* Quick Sample Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Or choose a demo sample photo:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2 rounded-xl text-left border text-xs transition flex flex-col gap-1 ${
                    imagePreview === sample.url
                      ? 'border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-950'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">{sample.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Location with Manual Map Selection */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                2. Geolocation & Manual Map Pinpoint
              </h2>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
            >
              {isLocating ? <Spinner size="sm" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Click anywhere on the map below or enter coordinates to manually adjust the issue location.
          </p>

          {/* Interactive Leaflet Location Picker */}
          <div className="h-64 rounded-xl overflow-hidden border border-slate-200 relative">
            <MapContainer
              center={[latitude, longitude]}
              zoom={14}
              className="w-full h-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[latitude, longitude]} icon={locationPickerIcon} />
              <LocationPickerEvents onSelectLocation={handleMapLocationSelect} />
            </MapContainer>
            <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 shadow-xs">
              Click map to reposition marker
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Landmark</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Ring Road Junction"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Issue Details */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">3. Issue Category & Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Classification</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Observations</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide helpful context (e.g. depth of pothole, obstruction level, hazard risk)..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submission Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {createMutation.isPending ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{createMutation.isPending ? 'Processing AI Triage...' : 'Submit Civic Issue'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
