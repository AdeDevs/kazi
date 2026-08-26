import React, { useState, useEffect, useRef } from 'react';
import { useAuth, AuthModalView } from '../context/AuthContext';
import { 
  X, Lock, Mail, User, Phone, MapPin, ShieldCheck, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, 
  Key, Eye, EyeOff, Sparkles, Briefcase, ChevronRight
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

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalView,
    pendingEmail,
    closeAuthModal,
    setAuthModalView,
    setPendingEmail,
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
  } = useAuth();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginTouched, setLoginTouched] = useState<Record<string, boolean>>({});

  // Terms & Privacy Modal state
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'escrow' | 'privacy'>('terms');

  const openTermsWithTab = (tab: 'terms' | 'escrow' | 'privacy') => {
    setTermsTab(tab);
    setIsTermsOpen(true);
  };

  // Register form state (UserCreate)
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regState, setRegState] = useState('Oyo');
  const [regNin, setRegNin] = useState('');
  const [regRole, setRegRole] = useState<'client' | 'artisan'>('client');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [modalTouched, setModalTouched] = useState<Record<string, boolean>>({});

  // Password strength helper
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

  const markModalTouched = (field: string) => {
    setModalTouched(prev => ({ ...prev, [field]: true }));
  };

  const formatNigerianPhone = (val: string) => {
    let digits = val.replace(/[^0-9]/g, '');
    if (digits.startsWith('234')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const emailIsValid = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim());
  const phoneDigits = regPhone.replace(/[^0-9]/g, '');
  const phoneIsValid = phoneDigits.length >= 10;
  const passwordIsValid = regPassword.length >= 6;
  const passwordsMatch = regPassword === regConfirmPassword;
  const ninIsValid = !regNin || regNin.length === 11;

  // OTP Verification state (5 digits for backend schema)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot / Reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Local feedback message
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Sync email when modal opens with a pending email
  useEffect(() => {
    if (pendingEmail) {
      setForgotEmail(pendingEmail);
      if (!loginIdentifier) setLoginIdentifier(pendingEmail);
    }
  }, [pendingEmail, loginIdentifier]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;

    try {
      await login({
        username: loginIdentifier,
        password: loginPassword,
      });
    } catch {
      // Error handled in AuthContext
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    markModalTouched('firstName');
    markModalTouched('lastName');
    markModalTouched('email');
    markModalTouched('password');
    markModalTouched('confirmPassword');
    markModalTouched('phone');
    if (regNin) markModalTouched('nin');

    if (!regFirstName || !regLastName || !regEmail || !regPassword || !regConfirmPassword || !regPhone || !regState) {
      return;
    }
    if (!emailIsValid(regEmail) || !passwordsMatch || !passwordIsValid || !phoneIsValid || !ninIsValid) {
      return;
    }

    const payload: UserCreate = {
      first_name: regFirstName.trim(),
      last_name: regLastName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      phone_number: `+234${phoneDigits}`,
      state: regState,
      role: regRole,
      nin: regNin.trim() ? regNin.trim() : null,
    };

    try {
      await register(payload);
      setFeedbackSuccess(`Verification code sent to ${payload.email}`);
      setResendCooldown(60);
    } catch {
      // Error handled in AuthContext
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanValue.length > 1) {
      // User pasted full OTP
      const pasted = cleanValue.slice(0, 5).split('');
      pasted.forEach((digit, i) => {
        if (i < 5) newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 4);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);

    // Auto advance focus
    if (cleanValue && index < 4) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP Verification Submit
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    const targetEmail = pendingEmail || regEmail || loginIdentifier;

    if (!targetEmail || otpCode.length !== 5) return;

    try {
      await verifyEmail({
        email: targetEmail,
        otp: otpCode,
      });
      setFeedbackSuccess('Email verified successfully! You are now logged in.');
      setTimeout(() => {
        closeAuthModal();
        setFeedbackSuccess(null);
      }, 1200);
    } catch {
      // Error handled in AuthContext
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    const targetEmail = pendingEmail || regEmail || loginIdentifier;
    if (!targetEmail || resendCooldown > 0) return;

    try {
      await resendOtp({ email: targetEmail });
      setResendCooldown(60);
      setFeedbackSuccess(`New 5-digit code sent to ${targetEmail}`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
    } catch {
      // Error handled in AuthContext
    }
  };

  // Handle Forgot Password Submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      await forgotPassword({ email: forgotEmail.trim() });
      setFeedbackSuccess(`Password reset code sent to ${forgotEmail}`);
      setPendingEmail(forgotEmail.trim());
      setResendCooldown(60);
    } catch {
      // Error handled in AuthContext
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = pendingEmail || forgotEmail;
    if (!targetEmail || !resetOtp || !resetNewPassword) return;

    if (resetNewPassword !== resetConfirmPassword) {
      return;
    }

    try {
      await resetPassword({
        email: targetEmail,
        otp: resetOtp.trim(),
        new_password: resetNewPassword,
      });
      setFeedbackSuccess('Password reset successfully! Please log in with your new password.');
      setTimeout(() => {
        setLoginIdentifier(targetEmail);
        setAuthModalView('login');
        setFeedbackSuccess(null);
      }, 1500);
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <ShieldCheck className="w-4 h-4 text-brand-orange-500" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-navy-900 dark:text-zinc-100">
                  Kazi<span className="text-brand-orange-600">Hub</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Auth Portal
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Alerts Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
            </div>
            <button onClick={clearError} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {feedbackSuccess && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="font-semibold">{feedbackSuccess}</p>
          </div>
        )}

        {/* Body Content with Smooth Scrolling */}
        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1 space-y-5">
          
          {/* ================= VIEW 1: LOGIN ================= */}
          {authModalView === 'login' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-navy-900 dark:text-zinc-100 tracking-tight">
                  Welcome back to KaziHub
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sign in with your email or username to access your bookings and verified artisan profile.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. nneka@kazihub.ng"
                      value={loginIdentifier}
                      onBlur={() => setLoginTouched(prev => ({ ...prev, identifier: true }))}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 ${
                        loginTouched.identifier && !loginIdentifier.trim()
                          ? 'border-rose-400 focus:ring-rose-200'
                          : loginTouched.identifier && loginIdentifier.includes('@') && !emailIsValid(loginIdentifier)
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-zinc-300 dark:border-zinc-700 focus:ring-navy-900/30 dark:focus:ring-zinc-400'
                      }`}
                    />
                  </div>
                  {loginTouched.identifier && !loginIdentifier.trim() && (
                    <p className="text-[10px] text-rose-500 mt-1">Email address or username is required</p>
                  )}
                  {loginTouched.identifier && loginIdentifier.includes('@') && !emailIsValid(loginIdentifier) && (
                    <p className="text-[10px] text-rose-500 mt-1">Please enter a valid email format (e.g. name@domain.com)</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginIdentifier);
                        setAuthModalView('forgot');
                      }}
                      className="text-xs text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-navy-900/30 dark:focus:ring-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Terms notice on login */}
                <p className="text-[10px] text-center text-zinc-500 dark:text-zinc-400 leading-tight pt-1">
                  By logging in, you agree to KaziHub's{' '}
                  <button
                    type="button"
                    onClick={() => openTermsWithTab('terms')}
                    className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                  >
                    Terms of Service
                  </button>
                  .
                </p>
              </form>

              {/* Instant Demo Role Switch */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 text-center mb-2">
                  Or test immediately with preconfigured verified accounts:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsDemo('customer')}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-navy-900 dark:text-zinc-100">
                      <User className="w-3.5 h-3.5 text-navy-600 dark:text-navy-400" />
                      <span>Customer Mode</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Nneka Okonkwo (Ibadan)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemo('artisan')}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-navy-900 dark:text-zinc-100">
                      <Briefcase className="w-3.5 h-3.5 text-brand-orange-500" />
                      <span>Pro Partner Mode</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Babatunde (Solar/Electric)</p>
                  </button>
                </div>
              </div>

              {/* Switch to Register */}
              <div className="text-center pt-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Don't have a KaziHub account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setAuthModalView('register');
                    }}
                    className="font-bold text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: REGISTER (UserCreate Schema) ================= */}
          {authModalView === 'register' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-navy-900 dark:text-zinc-100 tracking-tight">
                  Join KaziHub Marketplace
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Connect with verified skilled artisans or list your trade services across Nigeria.
                </p>
              </div>

              {/* Role Toggle Selector */}
              <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setRegRole('client')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    regRole === 'client'
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Client</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('artisan')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    regRole === 'artisan'
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Artisan</span>
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Names Row */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Babatunde"
                      value={regFirstName}
                      onBlur={() => markModalTouched('firstName')}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 ${
                        modalTouched.firstName && !regFirstName.trim()
                          ? 'border-rose-400'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                    {modalTouched.firstName && !regFirstName.trim() && (
                      <p className="text-[10px] text-rose-500 mt-0.5">Required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adebayo"
                      value={regLastName}
                      onBlur={() => markModalTouched('lastName')}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 ${
                        modalTouched.lastName && !regLastName.trim()
                          ? 'border-rose-400'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                    {modalTouched.lastName && !regLastName.trim() && (
                      <p className="text-[10px] text-rose-500 mt-0.5">Required</p>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. babatunde@kazihub.ng"
                      value={regEmail}
                      onBlur={() => markModalTouched('email')}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 ${
                        modalTouched.email && (!regEmail || !emailIsValid(regEmail))
                          ? 'border-rose-400'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                  </div>
                  {modalTouched.email && regEmail && !emailIsValid(regEmail) && (
                    <p className="text-[10px] text-rose-500 mt-0.5">Invalid email format</p>
                  )}
                </div>

                {/* Password & Password Meter */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onBlur={() => markModalTouched('password')}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={`w-full pl-9 pr-9 py-2 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 ${
                        modalTouched.password && (!regPassword || !passwordIsValid)
                          ? 'border-rose-400'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Minimal Password Meter */}
                  {regPassword && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((step) => {
                          const strength = getPasswordStrength(regPassword);
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
                      <span className={`text-[10px] font-bold ${getPasswordStrength(regPassword).textColor}`}>
                        {getPasswordStrength(regPassword).label}
                      </span>
                    </div>
                  )}

                  {modalTouched.password && regPassword && !passwordIsValid && (
                    <p className="text-[10px] text-rose-500 mt-0.5">Min 6 characters</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onBlur={() => markModalTouched('confirmPassword')}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={`w-full pl-9 pr-9 py-2 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 ${
                        modalTouched.confirmPassword && (!regConfirmPassword || !passwordsMatch)
                          ? 'border-rose-400'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {modalTouched.confirmPassword && regConfirmPassword && !passwordsMatch && (
                    <p className="text-[10px] text-rose-500 mt-0.5">Passwords do not match</p>
                  )}
                </div>

                {/* Phone & State Row with +234 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Phone Number *
                    </label>
                    <div className={`flex rounded-xl border bg-white dark:bg-zinc-800 overflow-hidden ${
                      modalTouched.phone && (!regPhone || !phoneIsValid)
                        ? 'border-rose-400'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}>
                      <span className="inline-flex items-center px-2 bg-zinc-100 dark:bg-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 border-r border-zinc-300 dark:border-zinc-700 select-none">
                        +234
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="802 345 6789"
                        value={regPhone}
                        onBlur={() => markModalTouched('phone')}
                        onChange={(e) => setRegPhone(formatNigerianPhone(e.target.value))}
                        className="w-full px-2 py-2 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                      />
                    </div>
                    {modalTouched.phone && (!regPhone || !phoneIsValid) && (
                      <p className="text-[10px] text-rose-500 mt-0.5">Enter 10 digits</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      State / Location *
                    </label>
                    <select
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* NIN (National Identity Number) for Artisans & Trust */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      National Identity Number (NIN)
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      {regRole === 'artisan' ? 'Recommended for verified badge' : 'Optional'}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="11-digit NIN (e.g. 78291048291)"
                    value={regNin}
                    onBlur={() => { if (regNin) markModalTouched('nin'); }}
                    onChange={(e) => setRegNin(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 ${
                      modalTouched.nin && !ninIsValid
                        ? 'border-rose-400'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  />
                  {modalTouched.nin && !ninIsValid && (
                    <p className="text-[10px] text-rose-500 mt-0.5">NIN must be 11 digits</p>
                  )}
                </div>

                {/* Terms agreement */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 text-navy-900 focus:ring-navy-900"
                  />
                  <label htmlFor="terms" className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                    I agree to the KaziHub{' '}
                    <button
                      type="button"
                      onClick={() => openTermsWithTab('terms')}
                      className="text-brand-orange-600 dark:text-brand-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !acceptTerms}
                  className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account & Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue & Verify Email</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="text-center pt-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setAuthModalView('login');
                    }}
                    className="font-bold text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 cursor-pointer"
                  >
                    Sign in to your account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: VERIFY EMAIL OTP (VerifyEmailSchema) ================= */}
          {authModalView === 'verify' && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange-500/10 text-brand-orange-600 mx-auto flex items-center justify-center shadow-xs">
                <Mail className="w-6 h-6" strokeWidth={1.5} />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-navy-900 dark:text-zinc-100">
                  Verify Your Email Address
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  We've sent a 5-digit verification code to{' '}
                  <span className="font-bold text-navy-900 dark:text-zinc-200">
                    {pendingEmail || regEmail || loginIdentifier || 'your email'}
                  </span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                {/* 5-Digit OTP Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
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
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-navy-900 dark:text-zinc-100 focus:border-navy-900 dark:focus:border-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-navy-900/20"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpDigits.some(d => !d)}
                  className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Complete Verification</span>
                  )}
                </button>
              </form>

              {/* Resend OTP */}
              <div className="pt-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResendOtp}
                    className="font-bold text-brand-orange-600 hover:text-brand-orange-700 dark:text-brand-orange-400 disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend 5-digit code'}
                  </button>
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setAuthModalView('login')}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: FORGOT PASSWORD ================= */}
          {authModalView === 'forgot' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-navy-900 dark:text-zinc-100 tracking-tight">
                  Reset Account Password
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter your registered email address and we'll dispatch a password reset code.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. nneka@kazihub.ng"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Reset Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalView('login')}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-navy-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Remember your password? Return to Login
                </button>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: RESET PASSWORD (ResetPasswordSchema) ================= */}
          {authModalView === 'reset' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-navy-900 dark:text-zinc-100 tracking-tight">
                  Set New Password
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter the OTP code sent to <span className="font-semibold text-navy-900 dark:text-zinc-100">{pendingEmail || forgotEmail}</span> and choose a secure new password.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    5-Digit Reset Code (OTP) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reset code"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !resetOtp || !resetNewPassword || resetNewPassword !== resetConfirmPassword}
                  className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password & Sign In</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalView('login')}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-navy-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Comprehensive Terms, Escrow & Privacy Modal */}
      <TermsAndPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        initialTab={termsTab}
      />
    </div>
  );
};
