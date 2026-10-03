import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  KeyRound,
  Mail,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowLeft,
  UserPlus,
  User as UserIcon,
  Phone,
  Building2,
  Shield,
} from 'lucide-react';
import { Spinner } from '../components/Spinner';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Sign In fields
  const [email, setEmail] = useState<string>('officer@demo.com');
  const [password, setPassword] = useState<string>('Demo@1234');

  // Register fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'officer' | 'admin' | 'citizen'>('officer');
  const [regDept, setRegDept] = useState<string>('d_roads');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState<boolean>(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to sign in. Please verify your credentials or create a new user.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: regRole,
        department_id: regRole === 'officer' ? regDept : null,
      });
      setSuccessMsg('Account created successfully! Logging you in...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to create account. Please check your information.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@1234');
    setMode('signin');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-md w-full relative z-10">
        {/* Back to Home link */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Landing Page</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="font-tech text-2xl sm:text-3xl font-bold text-white tracking-widest uppercase">
            CIVICFIX<span className="text-zinc-500">.SYS</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-mono-tech">
            Authority Command Portal
          </p>
        </div>

        {/* Auth Card with Mode Tabs */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-white/[0.04] p-1 mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Sign In Mode */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@demo.com"
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="text-slate-900" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Create User Account
                </button>
              </div>
            </form>
          ) : (
            /* Form: Create User / Register Mode */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Er. Rajesh Patil"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rajesh.patil@city.gov"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98230 12345"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    System Role
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full pl-9 pr-2 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="officer">Officer</option>
                      <option value="admin">Administrator</option>
                      <option value="citizen">Citizen</option>
                    </select>
                  </div>
                </div>

                {regRole === 'officer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={regDept}
                        onChange={(e) => setRegDept(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="d_roads">Roads & Infra</option>
                        <option value="d_sanitation">Sanitation</option>
                        <option value="d_traffic">Traffic</option>
                        <option value="d_electricity">Electricity</option>
                        <option value="d_horticulture">Parks</option>
                        <option value="d_enforcement">Enforcement</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register User & Enter Portal</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Sign In Here
                </button>
              </div>
            </form>
          )}

          {/* Demo Accounts Disclosure */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-between text-xs font-medium text-slate-400 hover:text-white transition"
            >
              <span>Demo Accounts (Instant Fill)</span>
              {showDemoCredentials ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDemoCredentials && (
              <div className="mt-3 space-y-2 bg-white/[0.02] rounded-xl p-3 border border-white/10 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">Officer (Roads Dept):</span>
                    <span className="text-slate-400 block font-mono text-[11px]">officer@demo.com / Demo@1234</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillCredentials('officer@demo.com')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 bg-white/[0.05] rounded border border-white/10"
                  >
                    Use
                  </button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div>
                    <span className="font-semibold text-white">Admin (City Commissioner):</span>
                    <span className="text-slate-400 block font-mono text-[11px]">admin@demo.com / Demo@1234</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@demo.com')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 bg-white/[0.05] rounded border border-white/10"
                  >
                    Use
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Restricted access. Actions logged and audited per municipal protocols.
        </p>
      </div>
    </div>
  );
};
