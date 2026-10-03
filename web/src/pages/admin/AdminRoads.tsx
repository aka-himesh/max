import React, { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { ROAD_REGISTRY } from '../../data/roadRegistry';

export const AdminRoads: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoads = ROAD_REGISTRY.filter(
    (r) =>
      r.road_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.road_segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tender_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0d1322] border border-white/[0.08] p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Municipal Road Registry & Corridors</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official database of municipal road assets, tender allocations, pavement specifications, and defect warranty periods.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search road name, tender or ward..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Roads Table */}
      <div className="glass-panel rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Road Asset & Segment</th>
                <th className="py-3.5 px-4">Ward & Zone</th>
                <th className="py-3.5 px-4">Tender Number</th>
                <th className="py-3.5 px-4">Pavement</th>
                <th className="py-3.5 px-4">DLP Warranty Period</th>
                <th className="py-3.5 px-5">Contractor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredRoads.map((road) => (
                <tr key={road.road_id} className="hover:bg-white/[0.02] transition">
                  <td className="py-4 px-5">
                    <div className="font-bold text-white text-sm">{road.road_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{road.road_segment}</div>
                    <div className="text-[10px] font-mono text-cyan-400/80 mt-1">
                      GPS: {road.latitude.toFixed(4)}, {road.longitude.toFixed(4)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    <div className="font-medium">{road.ward}</div>
                    <div className="text-[11px] text-slate-500">{road.zone}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-300 text-[11px]">
                    {road.tender_number}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium">
                      {road.pavement_type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                      <span>{road.dlp_start_date}</span>
                      <span>→</span>
                      <span>{road.dlp_end_date}</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold mt-1 inline-block ${
                        road.dlp_active ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {road.dlp_active ? '● DLP Active (Contractor Liable)' : '○ Municipal Maintenance'}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {road.contractor ? (
                      <div>
                        <div className="font-semibold text-white">{road.contractor.contractor_name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {road.contractor.company}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned (In-House PWD)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
