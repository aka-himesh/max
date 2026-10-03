import React, { useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api/endpoints';
import type { MapReportPoint, Department, ReportFilterParams } from '../api/types';
import { FilterBar, type FilterState } from '../components/FilterBar';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryChip } from '../components/CategoryChip';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../auth/AuthContext';
import { ExternalLink, MapPin } from 'lucide-react';

// Custom colored leaflet markers by severity
function createCustomMarkerIcon(severity: number, status: string) {
  let color = '#10b981'; // green (1-2)
  if (severity === 3) color = '#f59e0b'; // amber
  if (severity === 4) color = '#f97316'; // orange
  if (severity === 5) color = '#ef4444'; // red

  const isPulse = status === 'escalated' || status === 'in_progress';

  const html = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid #0f172a;
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
      font-family: sans-serif;
      ${isPulse ? 'animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
    ">
      ${severity}
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Component to dynamically fit map bounds
const ChangeView: React.FC<{ points: MapReportPoint[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [points, map]);

  return null;
};

export const MapView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const filters: FilterState = useMemo(() => {
    return {
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      severity: searchParams.get('severity') || undefined,
      department_id: searchParams.get('department_id') || undefined,
      source: searchParams.get('source') || undefined,
    };
  }, [searchParams]);

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  const queryParams: Omit<ReportFilterParams, 'page' | 'page_size'> = useMemo(() => {
    return {
      status: filters.status,
      category: filters.category,
      severity: filters.severity,
      department_id: filters.department_id,
      source: filters.source,
    };
  }, [filters]);

  const {
    data: points = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MapReportPoint[]>({
    queryKey: ['reports-map', queryParams],
    queryFn: () => api.getReportsMap(queryParams),
    refetchInterval: 20000,
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const defaultCenter: [number, number] = [21.1458, 79.0882];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Geospatial Incident Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic density, cluster analysis and severity hot spots.
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        departments={departments}
        showDepartmentFilter={user?.role === 'admin'}
      />

      {isError && (
        <ErrorBanner
          message={(error as Error)?.message || 'Failed to load map data.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Map Container */}
      <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-[620px] relative">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Spinner size="lg" className="text-indigo-400 mb-2" />
            <span className="text-xs font-semibold text-slate-300">Rendering map coordinates...</span>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {points.map((point) => (
              <Marker
                key={point.report_id}
                position={[point.latitude, point.longitude]}
                icon={createCustomMarkerIcon(point.severity, point.status)}
              >
                <Popup>
                  <div className="p-3.5 w-60 bg-[#0f172a] text-slate-100 font-sans">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <CategoryChip category={point.category} />
                      <SeverityBadge severity={point.severity} />
                    </div>

                    <div className="mb-2">
                      <div className="text-xs font-bold text-white">
                        Report #{point.report_id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <StatusBadge status={point.status} />
                      <Link
                        to={`/reports/${point.report_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            <ChangeView points={points} />
          </MapContainer>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] glass-capsule p-3.5 rounded-2xl border border-white/10 shadow-2xl text-xs space-y-1.5">
          <div className="font-bold text-white mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>Severity Legend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 text-[11px]">S1–S2: Low / Minor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300 text-[11px]">S3: Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-300 text-[11px]">S4: High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300 text-[11px]">S5: Critical Hazard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
