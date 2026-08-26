import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, User, Phone, MapPin, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, 
  Eye, EyeOff, Sparkles, Briefcase, ChevronRight, 
  Check, Star, Zap, Users
} from 'lucide-react';
import { UserCreate } from '../types/api';
import { TermsAndPrivacyModal } from './ui/TermsAndPrivacyModal';

const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Oyo', 'Rivers', 'Ogun', 'Kano', 'Kaduna', 
  'Edo', 'Delta', 'Enugu', 'Anambra', 'Abia', 'Akwa Ibom', 'Ondo', 
  'Osun', 'Kwara', 'Plateau', 'Imo', 'Cross River', 'Benue', 'Bauchi', 
  'Borno', 'Adamawa', 'Bayelsa', 'Ebonyi', 'Ekiti', 'Gombe', 'Jigawa', 
  'Katsina', 'Kebbi', 'Kogi', 'Nasarawa', 'Niger', 'Sokoto', 'Taraba', 
  'Yobe', 'Zamfara'
];

export type AuthPageView = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

interface AuthPageProps {
  initialView?: AuthPageView;
  onAuthSuccess?: (role: 'client' | 'artisan') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialView = 'signin',
  onAuthSuccess,
}) => {
  const {
    login,
    register,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword,
    loginAsDemo,
    isLoading,
    error,
    clearError,
    pendingEmail,
    setPendingEmail,
  } = useAuth();

  const [currentView, setCurrentView] = useState<AuthPageView>(initialView);

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInTouched, setSignInTouched] = useState<Record<string, boolean>>({});

  // Sign Up State
  const [selectedRole, setSelectedRole] = useState<'client' | 'artisan'>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [state, setState] = useState('Oyo');
  const [nin, setNin] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Terms & Privacy Modal State
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'terms' | 'escrow' | 'privacy'>('terms');

  // OTP Verification State (5-digit code)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Alert/Success notification
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Password strength meter helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-zinc-200 dark:bg-zinc-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' };
    if (score >= 4) return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    return { score: 0, label: 'Too short', color: 'bg-rose-500', textColor: 'text-rose-500' };
  };

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const markSignInTouched = (field: string) => {
    setSignInTouched(prev => ({ ...prev, [field]: true }));
  };

  // Nigerian phone number input formatter
  const formatNigerianPhone = (val: string) => {
    let digits = val.replace(/[^0-9]/g, '');
    if (digits.startsWith('234')) {
      digits = digits.slice(3);
    }
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const emailIsValid = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim());
  const phoneDigits = phoneNumber.replace(/[^0-9]/g, '');
  const phoneIsValid = phoneDigits.length >= 10;
  const passwordIsValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const ninIsValid = !nin || nin.length === 11;

  const openTermsWithTab = (tab: 'terms' | 'escrow' | 'privacy') => {
    setTermsModalTab(tab);
    setIsTermsOpen(true);
  };

  // Countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(interval);
  }, [resendTimer]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier || !signInPassword) return;

    try {
      await login({
        username: signInIdentifier.trim(),
        password: signInPassword,
      });
      if (onAuthSuccess) {
        onAuthSuccess('client');
      }
    } catch {
      // Error is caught in AuthContext
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markTouched('firstName');
    markTouched('lastName');
    markTouched('email');
    markTouched('password');
    markTouched('confirmPassword');
    markTouched('phone');
    if (nin) markTouched('nin');

    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !state) return;
    if (!emailIsValid(email) || !passwordsMatch || !passwordIsValid || !phoneIsValid || !ninIsValid) return;

    const formattedFullPhone = `+234${phoneDigits}`;

    const payload: UserCreate = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      phone_number: formattedFullPhone,
      state: state,
      role: selectedRole, // strictly 'client' or 'artisan'
      nin: nin.trim() ? nin.trim() : null,
    };

    try {
      await register(payload);
      setPendingEmail(payload.email);
      setSuccessBanner(`5-digit verification code sent to ${payload.email}`);
      setResendTimer(60);
      setCurrentView('verify');
    } catch {
      // Error caught in context
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    const newArr = [...otpDigits];

    if (clean.length > 1) {
      // Multi-digit paste
      const pasted = clean.slice(0, 5).split('');
      pasted.forEach((ch, idx) => {
        if (idx < 5) newArr[idx] = ch;
      });
      setOtpDigits(newArr);
      const nextIdx = Math.min(pasted.length, 4);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    newArr[index] = clean;
    setOtpDigits(newArr);

    if (clean && index < 4) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    const targetEmail = pendingEmail || email || signInIdentifier;

    if (!targetEmail || code.length !== 5) return;

    try {
      const verified = await verifyEmail({
        email: targetEmail,
        otp: code,
      });
      setSuccessBanner('Account verified successfully!');
      if (onAuthSuccess) {
        onAuthSuccess(verified.role as 'client' | 'artisan');
      }
    } catch {
      // Error caught in context
    }
  };

  const handleResendOtpCode = async () => {
    const targetEmail = pendingEmail || email || signInIdentifier;
    if (!targetEmail || resendTimer > 0) return;

    try {
      await resendOtp({ email: targetEmail });
      setResendTimer(60);
      setSuccessBanner(`New 5-digit verification code sent to ${targetEmail}`);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch {
      // Handled in context
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      await forgotPassword({ email: forgotEmail.trim() });
      setPendingEmail(forgotEmail.trim());
      setSuccessBanner(`Password reset code sent to ${forgotEmail}`);
      setResendTimer(60);
      setCurrentView('reset');
    } catch {
      // Handled in context
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = pendingEmail || forgotEmail;
    if (!targetEmail || !resetOtp || !resetNewPassword || resetNewPassword !== resetConfirmPassword) return;

    try {
      await resetPassword({
        email: targetEmail,
        otp: resetOtp.trim(),
        new_password: resetNewPassword,
      });
      setSuccessBanner('Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        setSignInIdentifier(targetEmail);
        setCurrentView('signin');
        setSuccessBanner(null);
      }, 1500);
    } catch {
      // Handled in context
    }
  };

  const handleDemoAccess = (role: 'client' | 'artisan') => {
    loginAsDemo(role);
    if (onAuthSuccess) {
      onAuthSuccess(role);
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-brand-orange-500 selection:text-white overflow-hidden">
      {/* Top Edge-to-Edge Bar */}
      <header className="w-full h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 lg:px-12 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tight text-navy-900 dark:text-zinc-100">
            Kazi<span className="text-brand-orange-600">Hub</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            Nigeria Verified
          </span>
        </div>
      </header>

      {/* Main Split Poster Layout: Edge to Edge, Left Side strictly non-scrolling 100vh fit with space-between, Right Side scrollable only if needed */}
      <main className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden">
        
        {/* Left Side Poster Column (Strictly non-scrolling, fits inside available height with space-between distribution) */}
        <section className="lg:w-5/12 xl:w-1/2 bg-navy-950 text-white px-8 py-8 sm:px-12 sm:py-10 lg:px-14 lg:py-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-navy-900 relative overflow-hidden shrink-0">
          {/* Subtle background ambient gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-800/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top/Main Brand Content with space-between distribution */}
          <div className="relative z-10 flex flex-col justify-between flex-1 max-w-lg pb-6">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
                Vetted Artisans. Guaranteed Escrow.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                KaziHub connects verified electricians, plumbers, AC technicians, solar installers, and carpenters with clients across all 36 Nigerian states.
              </p>
            </div>

            {/* Role Pillars with balanced spacing */}
            <div className="space-y-4 my-auto py-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-orange-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">Client Experience</h3>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
                  Browse real video & voice portfolios, compare itemized pricing, book with escrow deposits, and release funds only after job inspection.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">Artisan Partner Experience</h3>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
                  Get high-intent client requests, submit custom bids, manage schedules, build verified reputation badges, and withdraw directly to your bank.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom RBAC Quick Test Links (Text links instead of large cards) */}
          <div className="relative z-10 pt-4 border-t border-white/10 space-y-2 max-w-lg shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Quick Portal Evaluation (RBAC)
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleDemoAccess('client')}
                className="text-zinc-300 hover:text-brand-orange-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Test Client Portal</span>
                <span className="text-zinc-500 text-[10px]">(Nneka)</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </button>

              <span className="text-zinc-600">•</span>

              <button
                type="button"
                onClick={() => handleDemoAccess('artisan')}
                className="text-zinc-300 hover:text-brand-orange-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Test Artisan Portal</span>
                <span className="text-zinc-500 text-[10px]">(Babatunde)</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Side Form Column */}
        <section className={`lg:w-7/12 xl:w-1/2 bg-white dark:bg-zinc-900 px-6 sm:px-10 lg:px-14 py-8 sm:py-10 overflow-y-auto min-h-0 flex-1 flex flex-col ${
          currentView === 'signin' ? 'justify-center' : 'justify-start'
        }`}>
          <div className={`w-full max-w-md mx-auto space-y-5 ${
            currentView === 'signin' ? 'my-auto' : 'my-0 py-2'
          }`}>
            
            {/* Feedback Notifications */}
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{error}</p>
                </div>
                <button onClick={clearError} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                  ×
                </button>
              </div>
            )}

            {successBanner && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="font-semibold">{successBanner}</p>
              </div>
            )}

            {/* =================================================== */}
            {/* 1. SIGN IN VIEW                                    */}
            {/* =================================================== */}
            {currentView === 'signin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-zinc-100 tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Enter your email or username to access your dashboard.
                  </p>
                </div>

                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Email Address or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="nneka.okonkwo@kazihub.ng"
                        value={signInIdentifier}
                        onBlur={() => markSignInTouched('identifier')}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                          signInTouched.identifier && !signInIdentifier.trim()
                            ? 'border-rose-400 focus:ring-rose-200'
                            : signInTouched.identifier && signInIdentifier.includes('@') && !emailIsValid(signInIdentifier)
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30 dark:focus:ring-zinc-400'
                        }`}
                      />
                    </div>
                    {signInTouched.identifier && !signInIdentifier.trim() && (
                      <p className="text-[11px] text-rose-500 mt-1">Email address or username is required</p>
                    )}
                    {signInTouched.identifier && signInIdentifier.includes('@') && !emailIsValid(signInIdentifier) && (
                      <p className="text-[11px] text-rose-500 mt-1">Please enter a valid email format (e.g. name@domain.com)</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          clearError();
                          setForgotEmail(signInIdentifier);
                          setCurrentView('forgot');
                        }}
                        className="text-xs text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-navy-900/30 dark:focus:ring-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* On logging in notice */}
                  <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                    By logging in, you agree to the{' '}
                    <button
                      type="button"
                      onClick={() => openTermsWithTab('terms')}
                      className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    ,{' '}
                    <button
                      type="button"
                      onClick={() => openTermsWithTab('escrow')}
                      className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      Escrow Settlement Rules
                    </button>
                    , and{' '}
                    <button
                      type="button"
                      onClick={() => openTermsWithTab('privacy')}
                      className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                </form>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    New to KaziHub?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearError();
                        setCurrentView('signup');
                      }}
                      className="font-bold text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* 2. SIGN UP VIEW (Strict 'client' or 'artisan')     */}
            {/* =================================================== */}
            {currentView === 'signup' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-zinc-100 tracking-tight">
                    Create your account
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Select your account role to set up your workspace.
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('client')}
                    className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedRole === 'client'
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Client</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('artisan')}
                    className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedRole === 'artisan'
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Artisan</span>
                  </button>
                </div>

                <form onSubmit={handleSignUpSubmit} className="space-y-3">
                  {/* Names Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Babatunde"
                        value={firstName}
                        onBlur={() => markTouched('firstName')}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                          touched.firstName && !firstName.trim()
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30'
                        }`}
                      />
                      {touched.firstName && !firstName.trim() && (
                        <p className="text-[11px] text-rose-500 mt-1">First name is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Adebayo"
                        value={lastName}
                        onBlur={() => markTouched('lastName')}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                          touched.lastName && !lastName.trim()
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30'
                        }`}
                      />
                      {touched.lastName && !lastName.trim() && (
                        <p className="text-[11px] text-rose-500 mt-1">Last name is required</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        required
                        placeholder="babatunde@kazihub.ng"
                        value={email}
                        onBlur={() => markTouched('email')}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                          touched.email && (!email || !emailIsValid(email))
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30'
                        }`}
                      />
                    </div>
                    {touched.email && !email && (
                      <p className="text-[11px] text-rose-500 mt-1">Email is required</p>
                    )}
                    {touched.email && email && !emailIsValid(email) && (
                      <p className="text-[11px] text-rose-500 mt-1">Please enter a valid email address (e.g. name@domain.com)</p>
                    )}
                  </div>

                  {/* Password & Password Meter */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onBlur={() => markTouched('password')}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                          touched.password && (!password || !passwordIsValid)
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Simplistic Minimal Password Meter */}
                    {password && (
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((step) => {
                            const strength = getPasswordStrength(password);
                            const isActive = strength.score >= step;
                            return (
                              <div
                                key={step}
                                className={`h-1 rounded-full transition-colors ${
                                  isActive ? strength.color : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className={`text-[10px] font-bold ${getPasswordStrength(password).textColor}`}>
                          {getPasswordStrength(password).label}
                        </span>
                      </div>
                    )}

                    {touched.password && !password && (
                      <p className="text-[11px] text-rose-500 mt-1">Password is required</p>
                    )}
                    {touched.password && password && !passwordIsValid && (
                      <p className="text-[11px] text-rose-500 mt-1">Password must be at least 6 characters</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onBlur={() => markTouched('confirmPassword')}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                          touched.confirmPassword && (!confirmPassword || !passwordsMatch)
                            ? 'border-rose-400 focus:ring-rose-200'
                            : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {touched.confirmPassword && !confirmPassword && (
                      <p className="text-[11px] text-rose-500 mt-1">Please confirm your password</p>
                    )}
                    {touched.confirmPassword && confirmPassword && !passwordsMatch && (
                      <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Phone with +234 Nigerian Formatter & State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Phone Number *
                      </label>
                      <div className={`flex rounded-lg border bg-white dark:bg-zinc-800 overflow-hidden focus-within:ring-2 ${
                        touched.phone && (!phoneNumber || !phoneIsValid)
                          ? 'border-rose-400 focus-within:ring-rose-200'
                          : 'border-zinc-300 dark:border-zinc-700 focus-within:ring-navy-900/30'
                      }`}>
                        <span className="inline-flex items-center px-2.5 bg-zinc-100 dark:bg-zinc-700/60 text-xs font-bold text-zinc-600 dark:text-zinc-300 border-r border-zinc-300 dark:border-zinc-700 select-none">
                          +234
                        </span>
                        <input
                          type="tel"
                          required
                          placeholder="802 345 6789"
                          value={phoneNumber}
                          onBlur={() => markTouched('phone')}
                          onChange={(e) => setPhoneNumber(formatNigerianPhone(e.target.value))}
                          className="w-full px-2.5 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                        />
                      </div>
                      {touched.phone && (!phoneNumber || !phoneIsValid) && (
                        <p className="text-[11px] text-rose-500 mt-1">Enter a valid 10-digit number</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        State of Residence *
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-navy-900/30 cursor-pointer"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* NIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        National Identity Number (NIN)
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        {selectedRole === 'artisan' ? 'Required for Verified Badge' : 'Optional'}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="11-digit NIN (e.g. 78291048291)"
                      value={nin}
                      onBlur={() => { if (nin) markTouched('nin'); }}
                      onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, ''))}
                      className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                        touched.nin && !ninIsValid
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30'
                      }`}
                    />
                    {touched.nin && !ninIsValid && (
                      <p className="text-[11px] text-rose-500 mt-1">NIN must be exactly 11 digits</p>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="signup-terms"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-300 text-navy-900 focus:ring-navy-900 cursor-pointer"
                    />
                    <label htmlFor="signup-terms" className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      I agree to the KaziHub{' '}
                      <button
                        type="button"
                        onClick={() => openTermsWithTab('terms')}
                        className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                      >
                        Terms of Service
                      </button>
                      ,{' '}
                      <button
                        type="button"
                        onClick={() => openTermsWithTab('escrow')}
                        className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                      >
                        Escrow Settlement Rules
                      </button>
                      , and{' '}
                      <button
                        type="button"
                        onClick={() => openTermsWithTab('privacy')}
                        className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !termsAccepted}
                    className="w-full py-3 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending 5-digit OTP code...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account & Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Already registered on KaziHub?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearError();
                        setCurrentView('signin');
                      }}
                      className="font-bold text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* 3. VERIFY EMAIL OTP VIEW                            */}
            {/* =================================================== */}
            {currentView === 'verify' && (
              <div className="space-y-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-brand-orange-500/10 text-brand-orange-600 mx-auto flex items-center justify-center">
                  <Mail className="w-6 h-6" strokeWidth={1.75} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-zinc-100">
                    Verify Your Email
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    Enter the 5-digit verification code sent to{' '}
                    <span className="font-bold text-navy-900 dark:text-zinc-200">
                      {pendingEmail || email || signInIdentifier || 'your email'}
                    </span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputsRef.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-navy-900 dark:text-zinc-100 focus:border-navy-900 dark:focus:border-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-navy-900/20"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.some(d => !d)}
                    className="w-full py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Token...</span>
                      </>
                    ) : (
                      <span>Complete Verification</span>
                    )}
                  </button>
                </form>

                <div className="pt-2 space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      disabled={resendTimer > 0 || isLoading}
                      onClick={handleResendOtpCode}
                      className="font-bold text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 disabled:opacity-50 cursor-pointer"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend 5-digit code'}
                    </button>
                  </p>

                  <div>
                    <button
                      type="button"
                      onClick={() => setCurrentView('signin')}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* 4. FORGOT PASSWORD VIEW                             */}
            {/* =================================================== */}
            {currentView === 'forgot' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-zinc-100 tracking-tight">
                    Recover Password
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Enter your account email to receive a password reset token.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        required
                        placeholder="nneka.okonkwo@kazihub.ng"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending reset code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('signin')}
                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-navy-900 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* 5. RESET PASSWORD VIEW                              */}
            {/* =================================================== */}
            {currentView === 'reset' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-zinc-100 tracking-tight">
                    Set New Password
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Enter the reset OTP code sent to <span className="font-semibold">{pendingEmail || forgotEmail}</span>.
                  </p>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      5-Digit Reset Code (OTP) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 5-digit code"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !resetOtp || !resetNewPassword || resetNewPassword !== resetConfirmPassword}
                    className="w-full py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Proceed to Sign In</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* Full-Width Sticky Footer spanning edge-to-edge across the page */}
      <footer className="w-full h-11 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 lg:px-12 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 z-20 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} KaziHub Nigeria</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
          <button
            type="button"
            onClick={() => openTermsWithTab('escrow')}
            className="hover:text-brand-orange-600 dark:hover:text-brand-orange-400 transition-colors cursor-pointer"
          >
            Escrow Protection
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => openTermsWithTab('terms')}
            className="hover:text-brand-orange-600 dark:hover:text-brand-orange-400 transition-colors cursor-pointer"
          >
            Verified Artisans
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => openTermsWithTab('privacy')}
            className="hover:text-brand-orange-600 dark:hover:text-brand-orange-400 transition-colors font-medium cursor-pointer"
          >
            Terms & Privacy
          </button>
        </div>
      </footer>

      {/* Comprehensive Terms, Escrow & Privacy Modal */}
      <TermsAndPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        initialTab={termsModalTab}
      />
    </div>
  );
};
