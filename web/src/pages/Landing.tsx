import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Layers,
  ArrowUpRight,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col font-sans selection:bg-zinc-100 selection:text-zinc-950 relative overflow-x-hidden tech-grid-bg">
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between text-xs tracking-widest text-zinc-400 font-mono-tech">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-zinc-200 font-medium">CIVIC INFRASTRUCTURE INTELLIGENCE</span>
            <div className="h-[1px] bg-zinc-800 flex-1 hidden sm:block"></div>
          </div>
          <div className="flex items-center gap-4 pl-4 text-zinc-500">
            <span className="hidden md:inline text-[11px] text-zinc-400">LATENCY: 12ms // YOLOv8: ACTIVE</span>
            <span>@CIVICFIX-AI // V1.0</span>
          </div>
        </div>
      </div>

      {/* Floating Modern Capsule Navigation */}
      <header className="sticky top-4 z-50 px-4 max-w-6xl mx-auto w-full my-2">
        <nav className="tech-panel-glass px-5 sm:px-8 py-3.5 flex items-center justify-between border border-zinc-800/80 shadow-2xl">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="font-tech text-sm sm:text-base font-bold tracking-wider text-white group-hover:text-zinc-300 transition">
              CIVICFIX<span className="text-zinc-500">.SYS</span>
            </span>
          </Link>

          {/* Centered Navigation Menu */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-mono-tech tracking-widest text-zinc-400 uppercase">
            <Link to="/" className="text-white border-b border-white pb-0.5 transition">
              OVERVIEW
            </Link>
            <Link to="/report-issue" className="hover:text-white transition">
              REPORT DEFECT
            </Link>
            <Link to="/drive-mode" className="hover:text-white transition flex items-center gap-1.5 text-zinc-200">
              <Camera className="w-3.5 h-3.5 text-zinc-300" />
              <span>LIVE DRIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </Link>
            <Link to="/dashboard" className="hover:text-white transition">
              DASHBOARD
            </Link>
            <Link to="/map" className="hover:text-white transition">
              HEATMAP
            </Link>
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-mono-tech uppercase font-bold transition"
              >
                <span>PORTAL ({user?.role})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-mono-tech uppercase tracking-wider transition"
              >
                <span>AUTHORITY LOGIN</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Area Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20 flex flex-col gap-8">
        
        {/* ======================================================== */}
        {/* CARD 1: HERO - DRILLING/ROAD PROCESS OPTIMIZATION CARD  */}
        {/* ======================================================== */}
        <section className="tech-panel w-full border border-zinc-800 relative p-6 sm:p-10 flex flex-col items-center justify-between min-h-[360px] sm:min-h-[420px] overflow-hidden">
          {/* Top Process Breadcrumb Bar */}
          <div className="w-full grid grid-cols-4 border-b border-zinc-800/80 pb-4 text-center text-[10px] sm:text-xs font-mono-tech tracking-widest text-zinc-400 uppercase">
            <div className="border-r border-zinc-800/80 px-2 flex items-center justify-center gap-1.5 text-zinc-200">
              <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full inline-block"></span>
              <span>MEASURE</span>
            </div>
            <div className="border-r border-zinc-800/80 px-2 flex items-center justify-center gap-1.5">
              <span>ANALYZE</span>
            </div>
            <div className="border-r border-zinc-800/80 px-2 flex items-center justify-center gap-1.5">
              <span>IMPLEMENT</span>
            </div>
            <div className="px-2 flex items-center justify-center gap-1.5">
              <span>MORE</span>
            </div>
          </div>


          {/* Corner Crosshair Glyphs */}
          <div className="w-full flex items-center justify-between text-zinc-600 font-mono-tech text-xs select-none">
            <span>※ ※</span>
            <span>※ ※</span>
          </div>

          {/* Primary Extended Title */}
          <div className="w-full pt-4 text-center">
            <h1 className="font-tech text-2xl sm:text-4xl md:text-5xl tracking-[0.18em] uppercase chrome-gradient-text font-black leading-tight">
              ROAD DEFECT PROCESS OPTIMIZATION
            </h1>
            <p className="font-mono-tech text-[11px] sm:text-xs text-zinc-400 tracking-widest mt-2 uppercase">
              Autonomous Dashcam Telemetry &bull; YOLOv8 Hazard Detection &bull; SLA Contractor Dispatch
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8 pt-6 border-t border-zinc-800/80 w-full">
            <Link
              to="/drive-mode"
              className="px-6 py-2.5 bg-white text-zinc-950 font-mono-tech text-xs tracking-wider uppercase font-bold hover:bg-zinc-200 transition flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Live Drive Mode</span>
            </Link>

            <Link
              to="/report-issue"
              className="px-6 py-2.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-mono-tech text-xs tracking-wider uppercase transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Road Incident</span>
            </Link>

            <Link
              to="/dashboard"
              className="px-6 py-2.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-mono-tech text-xs tracking-wider uppercase transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Command Center</span>
            </Link>
          </div>
        </section>

        {/* ======================================================== */}
        {/* ROW 2: SPLIT CARD (DATA ASSESSMENT & PERCENTAGE METRICS) */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Card: Data Assessment */}
          <div className="tech-panel border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[380px]">
            {/* Header Tabs */}
            <div className="grid grid-cols-3 border-b border-zinc-800 pb-3 text-[10px] font-mono-tech tracking-widest text-zinc-500 uppercase">
              <span>MEASURE</span>
              <span className="text-zinc-200">ANALYZE</span>
              <span>IMPLEMENT</span>
            </div>

            {/* Title & Description */}
            <div className="my-6">
              <h2 className="font-tech text-xl sm:text-2xl tracking-[0.12em] uppercase text-zinc-100 font-bold leading-snug">
                DATA THAT ASSESS THE IMPACT ON INFRASTRUCTURE
              </h2>
              <div className="mt-4 text-xs font-mono-tech text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3">
                Result of deploying digital vision twins for live asphalt cavity detection, 
                high-frequency GPS drift correction, and automated contractor routing parameters.
              </div>
            </div>

            {/* Bottom Wireframe Wave & Glyphs */}
            <div className="relative pt-6 border-t border-zinc-800 flex items-end justify-between">
              <div className="text-[10px] font-mono-tech text-zinc-500 uppercase">
                LATITUDE // LONGITUDE TELEMETRY STREAM
              </div>
              <span className="text-zinc-600 font-mono-tech text-xs">※ ※</span>
            </div>
          </div>

          {/* Right Card: 22% & 35% Metric Column with Wireframe Mesh */}
          <div className="tech-panel border border-zinc-800 relative overflow-hidden grid grid-cols-1 sm:grid-cols-2 min-h-[380px]">
            {/* Background Wireframe Mesh Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="/wireframe_mesh.jpg"
                alt="Wireframe Contour Mesh"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Column 1: 22% Stat */}
            <div className="p-6 sm:p-8 border-b sm:border-b-0 sm:border-r border-zinc-800 flex flex-col justify-between relative z-10">
              <div>
                <div className="text-[10px] font-mono-tech text-zinc-500 tracking-widest uppercase mb-4">
                  01 // RESPONSE
                </div>
                <div className="font-tech text-4xl sm:text-5xl text-white font-bold tracking-tight">
                  22%
                </div>
                <div className="text-xs font-mono-tech text-zinc-400 mt-3 leading-snug">
                  reduction in average civic issue verification & triage cycle time
                </div>
              </div>

              <div className="pt-8 flex justify-end text-zinc-600 font-mono-tech text-xs">
                <span>※ ※</span>
              </div>
            </div>

            {/* Column 2: 35% Stat */}
            <div className="p-6 sm:p-8 flex flex-col justify-between relative z-10 bg-zinc-950/40">
              <div className="flex justify-between items-start">
                <div className="text-[10px] font-mono-tech text-zinc-500 tracking-widest uppercase mb-4">
                  02 // LONGEVITY
                </div>
                <div className="text-[10px] font-mono-tech text-zinc-400 uppercase">MORE</div>
              </div>

              <div>
                <div className="font-tech text-4xl sm:text-5xl text-white font-bold tracking-tight">
                  35%
                </div>
                <div className="text-xs font-mono-tech text-zinc-400 mt-3 leading-snug">
                  increase in average contractor repair efficiency in challenging roadway formations
                </div>
              </div>

              <div className="pt-8 flex justify-between items-center text-zinc-600 font-mono-tech text-xs">
                <span className="text-[10px] text-zinc-500 uppercase">SLA COMPLIANCE</span>
                <span>※ ※</span>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* ROW 3: ALLOCATION & BUDGET PROJECT DEVELOPMENT CARD     */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Card: $40 M Project Development */}
          <div className="tech-panel border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[360px]">
            {/* Header Tabs */}
            <div className="grid grid-cols-3 border-b border-zinc-800 pb-3 text-[10px] font-mono-tech tracking-widest text-zinc-500 uppercase">
              <span>MEASURE</span>
              <span>ANALYZE</span>
              <span className="text-zinc-200">IMPLEMENT</span>
            </div>

            {/* Title & Graphic */}
            <div className="my-auto py-6">
              <div className="font-tech text-3xl sm:text-4xl text-white font-bold tracking-[0.14em] uppercase leading-tight">
                $40 M
              </div>
              <div className="font-tech text-lg sm:text-xl text-zinc-300 font-bold tracking-wider uppercase mt-1">
                FOR ROAD RESILIENCE & ASSET MANAGEMENT
              </div>
            </div>

            {/* Wireframe curve accent */}
            <div className="border-t border-zinc-800 pt-4 flex items-center justify-between text-xs font-mono-tech text-zinc-500">
              <span>ALLOCATION // FY2026-2027</span>
              <span>※ ※</span>
            </div>
          </div>

          {/* Right Card: Percentage Distribution Table */}
          <div className="tech-panel border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between min-h-[360px]">
            <div className="text-[10px] font-mono-tech text-zinc-500 tracking-widest uppercase mb-4 pb-2 border-b border-zinc-800">
              INFRASTRUCTURE RESOURCE MATRIX
            </div>

            <div className="space-y-4 my-auto">
              {/* Row 1 */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs font-mono-tech">
                <div className="w-14 text-zinc-200 font-bold bg-zinc-900 px-2 py-1 text-center border border-zinc-800">
                  15%
                </div>
                <div className="flex-1 px-4 text-zinc-300">
                  Continuous Telemetry & Data Notice Ingestion
                </div>
                <span className="text-zinc-600">※ ※</span>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs font-mono-tech">
                <div className="w-14 text-zinc-200 font-bold bg-zinc-900 px-2 py-1 text-center border border-zinc-800">
                  35%
                </div>
                <div className="flex-1 px-4 text-zinc-300">
                  Pothole Verification & SLA Management Portal
                </div>
                <span className="text-zinc-600">※ ※</span>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs font-mono-tech">
                <div className="w-14 text-zinc-200 font-bold bg-zinc-900 px-2 py-1 text-center border border-zinc-800">
                  35%
                </div>
                <div className="flex-1 px-4 text-zinc-300">
                  Field Contractor Dispatch & Push Notifications
                </div>
                <span className="text-zinc-600">※ ※</span>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <div className="w-14 text-zinc-200 font-bold bg-zinc-900 px-2 py-1 text-center border border-zinc-800">
                  35%
                </div>
                <div className="flex-1 px-4 text-zinc-300">
                  YOLOv8 Edge Vision Cores & Digital Twin Mapping
                </div>
                <span className="text-zinc-600">※ ※</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3 text-[10px] font-mono-tech text-zinc-500 uppercase flex justify-between">
              <span>STATUS: VALIDATED</span>
              <span>ISO 9001 / ROAD-SAFETY</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* ROW 4: HACKATHON LIVE TESTING CREDENTIALS PANEL          */}
        {/* ======================================================== */}
        <section className="tech-panel border border-zinc-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                <span className="font-tech text-xs tracking-wider uppercase text-zinc-400">
                  TEST BENCH ACTIVE
                </span>
              </div>
              <h3 className="font-tech text-lg text-white font-bold uppercase tracking-wider">
                Authority Test Accounts & Roles
              </h3>
              <p className="text-xs font-mono-tech text-zinc-400 mt-1">
                Pre-seeded municipal credentials for role-based review & verification workflows.
              </p>
            </div>

            <Link
              to="/login"
              className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono-tech text-xs uppercase font-bold transition flex items-center gap-1.5"
            >
              <span>ACCESS LOGIN</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {/* Officer */}
            <div className="bg-zinc-900/60 p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-tech font-bold text-white uppercase">Roads Officer</span>
                <span className="text-[10px] font-mono-tech bg-zinc-800 text-zinc-300 px-2 py-0.5">ROADS DEPT</span>
              </div>
              <div className="text-xs font-mono-tech text-zinc-400 space-y-1">
                <div>EMAIL: <span className="text-zinc-200">officer@demo.com</span></div>
                <div>PASS: <span className="text-zinc-200">Demo@1234</span></div>
              </div>
            </div>

            {/* Admin */}
            <div className="bg-zinc-900/60 p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-tech font-bold text-white uppercase">City Administrator</span>
                <span className="text-[10px] font-mono-tech bg-zinc-800 text-zinc-300 px-2 py-0.5">ALL DEPTS</span>
              </div>
              <div className="text-xs font-mono-tech text-zinc-400 space-y-1">
                <div>EMAIL: <span className="text-zinc-200">admin@demo.com</span></div>
                <div>PASS: <span className="text-zinc-200">Demo@1234</span></div>
              </div>
            </div>

            {/* Citizen */}
            <div className="bg-zinc-900/60 p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-tech font-bold text-white uppercase">Public Citizen</span>
                <span className="text-[10px] font-mono-tech bg-zinc-800 text-zinc-300 px-2 py-0.5">CITIZEN</span>
              </div>
              <div className="text-xs font-mono-tech text-zinc-400 space-y-1">
                <div>EMAIL: <span className="text-zinc-200">citizen@demo.com</span></div>
                <div>PASS: <span className="text-zinc-200">Demo@1234</span></div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Brutalist Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 text-center text-xs font-mono-tech text-zinc-500 bg-[#050507]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-tech text-zinc-300 text-xs tracking-wider">CIVICFIX.SYS</span>
            <span className="text-zinc-700">|</span>
            <span>CIVIC INFRASTRUCTURE INTELLIGENCE</span>
          </div>
          <div className="text-[11px] text-zinc-600">
            COMPLIANT WITH RULES.MD &bull; HACKATHON ARCHITECTURE SPECIFICATION
          </div>
        </div>
      </footer>
    </div>
  );
};
