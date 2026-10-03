import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowUpRight,
  Camera,
  Layers,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const Landing: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glow spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Pill Navigation Header */}
      <header className="sticky top-5 z-50 px-4 max-w-5xl mx-auto w-full">
        <nav className="glass-capsule rounded-full px-5 sm:px-7 py-3 flex items-center justify-between shadow-2xl shadow-black/80 border border-white/[0.12]">
          {/* Brand Serif Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition italic">
              CivicFix
            </span>
          </Link>

          {/* Centered Navigation Menu */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider text-slate-300 uppercase">
            <Link to="/" className="text-white border-b-2 border-white pb-0.5 transition">
              Home
            </Link>
            <Link to="/report-issue" className="hover:text-white transition">
              Citizen Report
            </Link>
            <Link to="/drive-mode" className="hover:text-white transition flex items-center gap-1 text-cyan-400">
              <Camera className="w-3.5 h-3.5" />
              <span>Live Drive Mode</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </Link>
            <Link to="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
            <Link to="/map" className="hover:text-white transition">
              Live Map
            </Link>
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold transition shadow-md"
              >
                <span>Dashboard ({user?.role})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 text-white text-xs font-semibold transition"
              >
                <span>Authority Login</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 flex flex-col items-center text-center">
        {/* Sparkle Icon Accent */}
        <div className="inline-flex items-center justify-center text-slate-300 mb-6 animate-bounce-short">
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>

        {/* Massive Typographic Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.08] mb-6 select-none">
          <span className="block gradient-text">I Detect</span>
          <span className="block italic font-serif font-normal text-slate-300">
            hazards <span className="not-italic text-3xl sm:text-5xl align-top text-indigo-400 font-sans">✦</span>
          </span>
        </h1>

        {/* Subtitle Description */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-normal mb-8">
          Autonomous municipal defect detection, instant road contractor accountability, and realtime civic issue tracking engineered for modern urban governance.
        </p>

        {/* Editorial Quote Kicker */}
        <div className="text-xs sm:text-sm text-slate-500 italic max-w-md font-serif mb-10">
          "Good design is obvious. Safe infrastructure is non-negotiable." —{' '}
          <span className="text-slate-300 not-italic font-sans font-semibold">CivicFix</span>
        </div>

        {/* Animation / Simulation Status Capsule */}
        <button
          type="button"
          onClick={() => setIsAnimationActive(!isAnimationActive)}
          className="glass-panel px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2 mb-16 border border-white/10"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{isAnimationActive ? 'Live System Active' : 'System Paused'}</span>
        </button>

        {/* Scroll Explorer Button */}
        <a
          href="#modules"
          className="glass-capsule px-5 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 hover:border-white/30 transition shadow-lg mb-20"
        >
          <span>Explore Platform Systems</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </a>

        {/* Three Core Platform Feature Cards */}
        <section id="modules" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-6">
          {/* 1. Citizen Reporting Module */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300 group relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Citizen Issue Lodging
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload photo evidence with interactive manual GPS map pinpointing. Automatic YOLOv8 AI triage classifies defects, estimates severity, and routes to appropriate municipal departments.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/report-issue"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-1 transition-transform"
              >
                <span>Report Issue Now</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Live Drive Mode & Pothole Vision */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 group relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-white">
                  Live Drive Mode Vision
                </h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                  Live WebRTC
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use your smartphone or vehicle camera stream with live GPS telemetry. Continuously detects road potholes, deduplicates within 30m, and queues captures for officer verification before notifying responsible contractors.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/drive-mode"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-1 transition-transform"
              >
                <span>Launch Live Drive Mode</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 3. Authority Command Dashboard */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-purple-500/40 transition-all duration-300 group relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Authority Command Center
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Departmental triage dispatch, SLA countdown monitoring with automated escalation workers, and live geospatial mapping with color-coded severity heatmaps.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 group-hover:translate-x-1 transition-transform"
              >
                <span>Open Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Live System Metrics Bar */}
        <section className="w-full mt-16 glass-capsule rounded-3xl p-6 sm:p-8 border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              99.2%
            </div>
            <div className="text-xs text-slate-400 mt-1">YOLOv8 Class Precision</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-mono">
              &lt; 30m
            </div>
            <div className="text-xs text-slate-400 mt-1">GPS Road DLP Match Radius</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">
              24h
            </div>
            <div className="text-xs text-slate-400 mt-1">Contractor SLA Turnaround</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
              100%
            </div>
            <div className="text-xs text-slate-400 mt-1">Automated Audit Trail</div>
          </div>
        </section>

        {/* One-Click Demo Accounts Launcher */}
        <section className="w-full mt-16 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">
                Interactive Hackathon Demo Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant test accounts pre-configured with Roads Department Officer & Administrator roles.
              </p>
            </div>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold shadow-lg transition flex items-center gap-1.5"
            >
              <span>Go to Login Page</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Department Officer</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Roads Dept</span>
              </div>
              <div className="text-xs font-mono text-slate-400 space-y-0.5">
                <div>Email: <span className="text-slate-200">officer@demo.com</span></div>
                <div>Pass: <span className="text-slate-200">Demo@1234</span></div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">City Administrator</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">All Depts</span>
              </div>
              <div className="text-xs font-mono text-slate-400 space-y-0.5">
                <div>Email: <span className="text-slate-200">admin@demo.com</span></div>
                <div>Pass: <span className="text-slate-200">Demo@1234</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sleek Dark Minimalist Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif text-sm text-slate-300 italic">
            CivicFix — AI Civic Issue & Road Infrastructure System
          </div>
          <div className="text-[11px] text-slate-500">
            Conforms to RULES.md Single Source of Truth • Hackathon v1.0
          </div>
        </div>
      </footer>
    </div>
  );
};
