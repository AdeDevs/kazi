import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Role } from '../../types';
import { Wrench, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface AuthFlowProps {
  role: Role;
  onAuthenticated: () => void;
  onSwitchRolePreference: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'otp';

export const AuthFlow: React.FC<AuthFlowProps> = ({ role, onAuthenticated, onSwitchRolePreference }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('kazihub_remember_me') === 'true' ? localStorage.getItem('kazihub_remember_email') || '' : '';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('kazihub_remember_me') === 'true';
  });
  const [otpCode, setOtpCode] = useState(['', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);

  const isOtpComplete = otpCode.every((c) => c.trim().length > 0);

  // Auto focus first OTP input when mode switches to 'otp'
  useEffect(() => {
    if (mode === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  // Lock body scroll to make login screen completely unscrollable across all devices
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const triggerOtpVerification = useCallback(() => {
    if (loading || successAnimation) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessAnimation(true);
      setTimeout(() => {
        onAuthenticated();
      }, 1200);
    }, 800);
  }, [loading, successAnimation, onAuthenticated]);

  // Email regex validation
  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Password calculations: min 8 chars, one number, one special character
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  const strengthCount = [hasMinLength, hasNumber, hasSpecial, hasUppercase, hasLowercase].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (strengthCount <= 2) return { text: 'Weak', color: 'bg-rose-500 text-rose-400' };
    if (strengthCount <= 4) return { text: 'Medium', color: 'bg-navy-400 text-navy-400' };
    return { text: 'Strong', color: 'bg-emerald-500 text-emerald-400' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (email && !isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address format (e.g. name@example.com).');
      return;
    }

    if (mode === 'register') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 11) {
        setErrorMsg('Phone number must be exactly 11 digits (e.g. 08012345678).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Password and Confirm Password must match.');
        return;
      }
      if (!hasMinLength || !hasNumber || !hasSpecial) {
        setErrorMsg('Password must be at least 8 characters and include at least one number and one special character.');
        return;
      }
    }

    if (mode === 'login' || mode === 'register') {
      if (rememberMe) {
        localStorage.setItem('kazihub_remember_me', 'true');
        localStorage.setItem('kazihub_remember_email', email);
      } else {
        localStorage.removeItem('kazihub_remember_me');
        localStorage.removeItem('kazihub_remember_email');
      }
    }

    if (mode === 'otp') {
      if (!isOtpComplete) return;
      triggerOtpVerification();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === 'login' || mode === 'register') {
        setMode('otp');
        setOtpCode(['', '', '', '', '']);
      } else if (mode === 'forgot') {
        alert('Password reset link sent to your email.');
        setMode('login');
      }
    }, 800);
  };

  const handleOtpInputChange = (val: string, idx: number) => {
    const cleanVal = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Handle pasted or multi-character string
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 5).split('');
      const newOtp = ['', '', '', '', ''];
      for (let i = 0; i < 5; i++) {
        newOtp[i] = chars[i] || '';
      }
      setOtpCode(newOtp);
      const firstEmptyIndex = newOtp.findIndex(c => !c);
      const focusIndex = firstEmptyIndex === -1 ? 4 : firstEmptyIndex;
      otpInputRefs.current[focusIndex]?.focus();

      if (newOtp.every(c => c.trim().length > 0)) {
        setTimeout(() => triggerOtpVerification(), 100);
      }
      return;
    }

    const newOtp = [...otpCode];
    newOtp[idx] = cleanVal;
    setOtpCode(newOtp);

    if (cleanVal && idx < 4) {
      otpInputRefs.current[idx + 1]?.focus();
    }

    if (newOtp.every(c => c.trim().length > 0)) {
      setTimeout(() => triggerOtpVerification(), 100);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!pastedData) return;
    const chars = pastedData.slice(0, 5).split('');
    const newOtp = ['', '', '', '', ''];
    for (let i = 0; i < 5; i++) {
      newOtp[i] = chars[i] || '';
    }
    setOtpCode(newOtp);
    const firstEmptyIndex = newOtp.findIndex(c => !c);
    const focusIndex = firstEmptyIndex === -1 ? 4 : firstEmptyIndex;
    otpInputRefs.current[focusIndex]?.focus();

    if (newOtp.every(c => c.trim().length > 0)) {
      setTimeout(() => triggerOtpVerification(), 100);
    }
  };

  const strengthInfo = getStrengthLabel();
  const isOtpDisabled = mode === 'otp' && !isOtpComplete;
  const isRegisterInvalid = mode === 'register' && (
    !name.trim() ||
    phone.replace(/\D/g, '').length !== 11 ||
    !password ||
    password !== confirmPassword ||
    !hasMinLength ||
    !hasNumber ||
    !hasSpecial
  );
  const isSubmitDisabled = isOtpDisabled || isRegisterInvalid;

  if (successAnimation) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center p-6 overflow-hidden animate-in fade-in duration-500">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-navy-800/10 to-transparent"></div>
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce shadow-xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-black">Authentication Successful!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Welcome to KaziHub. Preparing your secure dashboard...</p>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-emerald-500 animate-[shimmer_1s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 transition-colors overflow-hidden">
      <div className="w-full max-w-md space-y-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm relative border border-slate-200/80 dark:border-slate-800 max-h-full overflow-y-auto no-scrollbar flex flex-col">

        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3 relative z-10 shrink-0">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-navy-800 flex items-center justify-center text-white shadow-lg shadow-navy-800/20 mb-1">
            <Wrench className="w-5 h-5 text-brand-orange-400" />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800/10 text-navy-800 dark:text-navy-400 text-[11px] font-black uppercase tracking-wider">
              {role === 'customer' ? 'Customer Portal' : 'Professional Partner'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {mode === 'login' && `Welcome Back`}
              {mode === 'register' && 'Create KaziHub Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'otp' && 'Verify Your Identity'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            {mode === 'login' && 'Enter your credentials to securely access your dashboard.'}
            {mode === 'register' && `Register as a ${role === 'customer' ? 'Customer' : 'Professional'} to connect with trusted local experts.`}
            {mode === 'forgot' && 'We will send a secure recovery code to your registered email.'}
            {mode === 'otp' && `Enter the 5-character verification code sent to ${email || 'your email'}`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 relative z-10 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nneka Okonkwo"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number <span className="text-brand-orange-500">* (11 Digits)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="e.g. 08012345678"
                    maxLength={11}
                    required
                    className="w-full pl-11 pr-16 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 transition-all font-mono font-medium"
                  />
                  <span className={`absolute right-3.5 top-3.5 text-[11px] font-bold ${
                    phone.length === 11 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {phone.length}/11 {phone.length === 11 ? '✓' : ''}
                  </span>
                </div>
                {phone.length > 0 && phone.length !== 11 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> Phone number must be exactly 11 digits
                  </p>
                )}
              </div>
            </>
          )}

          {mode !== 'otp' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 transition-all font-medium"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && mode !== 'otp' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 transition-all font-medium"
                />
              </div>

              {/* Password strength & requirements for register mode */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-3 space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">Password Strength:</span>
                    <span className={`font-black uppercase tracking-wider ${strengthInfo.color.split(' ')[1]}`}>
                      {strengthInfo.text}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-full transition-colors ${
                          lvl <= strengthCount ? strengthInfo.color.split(' ')[0] : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="grid grid-cols-1 gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                    <li className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> At least 8 characters
                    </li>
                    <li className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Contains at least one number (0-9)
                    </li>
                    <li className={`flex items-center gap-1.5 font-medium ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Contains a special character (!@#$...)
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 transition-all font-medium"
                />
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-[11px] mt-1 font-bold ${password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </p>
              )}
            </div>
          )}

          {mode === 'otp' && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={otpCode[idx]}
                    onPaste={handleOtpPaste}
                    onChange={(e) => handleOtpInputChange(e.target.value, idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
                        otpInputRefs.current[idx - 1]?.focus();
                      }
                    }}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 shadow-inner uppercase shrink-0"
                  />
                ))}
              </div>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                Didn't receive code? <button type="button" className="text-navy-600 dark:text-navy-400 font-bold underline cursor-pointer">Resend in 30s</button>
              </p>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 accent-navy-600 w-4 h-4 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-navy-600 dark:text-navy-400 hover:underline font-bold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isSubmitDisabled}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer ${
              loading || isSubmitDisabled
                ? 'bg-navy-800/40 text-slate-400 cursor-not-allowed opacity-60 shadow-none'
                : 'bg-navy-800 hover:bg-navy-900 text-white active:scale-[0.99] shadow-navy-800/20'
            }`}
          >
            <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In to Account' : mode === 'register' ? 'Create Secure Account' : mode === 'forgot' ? 'Send Reset Link' : 'Verify & Continue'}</span>
            <ArrowRight className="w-4 h-4 text-brand-orange-400" />
          </button>
        </form>

        {/* Switch modes / roles */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-3 relative z-10 text-xs">
          {mode === 'login' && (
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <button onClick={() => setMode('register')} className="text-navy-600 dark:text-navy-400 font-extrabold hover:underline cursor-pointer">
                Register Now
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-navy-600 dark:text-navy-400 font-extrabold hover:underline cursor-pointer">
                Sign In
              </button>
            </p>
          )}
          {(mode === 'forgot' || mode === 'otp') && (
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Back to{' '}
              <button onClick={() => setMode('login')} className="text-navy-600 dark:text-navy-400 font-extrabold hover:underline cursor-pointer">
                Sign In
              </button>
            </p>
          )}

          <div className="pt-1">
            <button
              onClick={onSwitchRolePreference}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-[11px] font-semibold cursor-pointer"
            >
              Switch portal type (Current: <span className="capitalize text-navy-600 dark:text-navy-400 font-bold">{role}</span>)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
