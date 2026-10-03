import React, { useState } from 'react';
import { HardHat, MapPin, ShieldCheck, Search } from 'lucide-react';
import { ROAD_REGISTRY } from '../../data/roadRegistry';

export const AdminContractors: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique contractors
  const contractorsMap = new Map();
  ROAD_REGISTRY.forEach((r) => {
    if (r.contractor) {
      if (!contractorsMap.has(r.contractor.contractor_id)) {
        contractorsMap.set(r.contractor.contractor_id, {
          ...r.contractor,
          roads: [r],
        });
      } else {
        contractorsMap.get(r.contractor.contractor_id).roads.push(r);
      }
    }
  });

  const contractors = Array.from(contractorsMap.values()).filter(
    (c) =>
      c.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.license_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0d1322] border border-white/[0.08] p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-amber-400" />
            <span>Contractors & DLP Warranty Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered road construction companies, active Defect Liability Period (DLP) obligations, and official dispatch contacts.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contractor, company or license..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractors.map((contractor) => (
          <div
            key={contractor.contractor_id}
            className="bg-[#0c1220] border border-white/10 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                  {contractor.contractor_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{contractor.contractor_name}</h3>
                  <div className="text-xs text-slate-400 font-medium">{contractor.company}</div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active Class-1
              </span>
            </div>

            {/* License & Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">License Number</div>
                <div className="font-mono text-slate-200 mt-0.5">{contractor.license_no}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Contact Email</div>
                <a href={`mailto:${contractor.email}`} className="text-indigo-400 hover:underline font-mono text-[11px] truncate block mt-0.5">
                  {contractor.email}
                </a>
              </div>
            </div>

            {/* Office Address */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-xs flex items-start gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{contractor.office_address}</span>
            </div>

            {/* Assigned Road Contracts */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Under Warranty Road Corridors ({contractor.roads.length})
              </div>
              <div className="space-y-2">
                {contractor.roads.map((road: any) => (
                  <div
                    key={road.road_id}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-white/[0.08] text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-white">{road.road_name}</div>
                      <div className="text-[11px] text-slate-400">{road.road_segment}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        road.dlp_active
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {road.dlp_active ? 'DLP 2028' : 'Expired'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
