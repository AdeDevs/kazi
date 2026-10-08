import React, { useState, useEffect, useRef } from 'react';
import { NIGERIAN_STATES, digitsOnly, formatNigerianPhone, isValidNigerianPhone, nationalDigits, sanitizeName } from '../lib/inputRules';
import { Checkbox } from './ui/Checkbox';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserCreate } from '../types/auth';
import { ApiError } from '../lib/apiClient';
import { TERMS_VERSION } from './ui/TermsAndPrivacyModal';
import { BackupCodeInput, CodeInputHandle, DigitCodeInput, isCompleteBackupCode } from './ui/CodeInput';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { TermsAndPrivacyModal } from './ui/TermsAndPrivacyModal';
import { CustomDropdown } from './CustomDropdown';
import { art } from '../assets/landing';
import { Phone, MockHome, MockNearYou, MockWallet, MockCodeMail, MockResetMail } from './landing/PhoneMocks';


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
    isLoginLoading,
    isRegisterLoading,
    isVerifyLoading,
    isResendOtpLoading,
    isForgotPasswordLoading,
    isResetPasswordLoading,
    error,
    clearError,
    pendingEmail,
    setPendingEmail,
  } = useAuth();

  const [currentView, setCurrentView] = useState<AuthPageView>(initialView);

  // Give each internal view a real URL without touching the many existing setCurrentView(...)
  // call sites throughout this file: whenever currentView changes, push the matching URL; whenever
  // the URL changes independently (browser Back/Forward), sync currentView back from it. The
  // path-vs-view guards on both sides stop this from looping or adding a redundant history entry
  // when they already agree (e.g. right after mount).
  const navigate = useNavigate();
  const location = useLocation();
  const VIEW_TO_PATH: Record<AuthPageView, string> = {
    signin: '/signin',
    signup: '/signup',
    verify: '/verify-email',
    forgot: '/forgot-password',
    reset: '/reset-password',
  };
  const PATH_TO_VIEW: Record<string, AuthPageView> = {
    '/signin': 'signin',
    '/signup': 'signup',
    '/verify-email': 'verify',
    '/forgot-password': 'forgot',
    '/reset-password': 'reset',
  };
  useEffect(() => {
    const targetPath = VIEW_TO_PATH[currentView];
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);
  useEffect(() => {
    const viewForPath = PATH_TO_VIEW[location.pathname];
    if (viewForPath && viewForPath !== currentView) {
      setCurrentView(viewForPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const VIEW_META: Record<AuthPageView, { title: string; description: string }> = {
    signin: { title: 'Sign In', description: 'Sign in to KaziHub to book electricians, plumbers, AC technicians, and more near you, with payment held safely until the job is done.' },
    signup: { title: 'Create Account', description: 'Create a free KaziHub account as a client or a verified artisan.' },
    verify: { title: 'Verify Your Email', description: 'Enter the 5-digit code sent to your email to verify your KaziHub account.' },
    forgot: { title: 'Forgot Password', description: 'Request a password reset code for your KaziHub account.' },
    reset: { title: 'Reset Password', description: 'Set a new password for your KaziHub account.' },
  };
  useDocumentMeta(VIEW_META[currentView].title, VIEW_META[currentView].description);

  // Sign In State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInTouched, setSignInTouched] = useState<Record<string, boolean>>({});
  // Two-step sign-in. Login answers 401 `totp_required` once the password is right; that's the
  // next step, not an error, so the card swaps to a code step. The backend keeps no challenge:
  // the code is sent with the same email and password, which stay in memory here.
  const [signinStep, setSigninStep] = useState<'credentials' | 'code'>('credentials');
  const [stepAnim, setStepAnim] = useState<'' | 'kh-step-fwd' | 'kh-step-back'>('');
  const [codeMode, setCodeMode] = useState<'app' | 'backup'>('app');
  const [totpCode, setTotpCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [credentialsNote, setCredentialsNote] = useState<string | null>(null);
  const totpInputRef = useRef<CodeInputHandle | null>(null);

  // Sign Up State
  // The landing page's two sign-up buttons pass ?role=client or ?role=artisan.
  const [selectedRole, setSelectedRole] = useState<'client' | 'artisan'>(() =>
    new URLSearchParams(window.location.search).get('role') === 'artisan' ? 'artisan' : 'client'
  );
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
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    if (pass.length >= 8) score += 1;
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

  const emailIsValid = (em: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim());
  const phoneDigits = nationalDigits(phoneNumber);
  const phoneIsValid = isValidNigerianPhone(phoneNumber);
  const passwordIsValid = password.length >= 8 && password.length <= 128;
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

  const finishSignIn = (role: string) => onAuthSuccess?.(role === 'artisan' ? 'artisan' : 'client');

  const goToCodeStep = () => {
    clearError();
    setTotpCode('');
    setCodeError(null);
    setCodeMode('app');
    setStepAnim('kh-step-fwd');
    setSigninStep('code');
  };

  const backToCredentials = (note: string | null = null) => {
    setCodeError(null);
    setTotpCode('');
    setCredentialsNote(note);
    setStepAnim('kh-step-back');
    setSigninStep('credentials');
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier || !signInPassword) return;
    setCredentialsNote(null);
    try {
      const authedUser = await login({ username: signInIdentifier.trim(), password: signInPassword });
      finishSignIn(authedUser.role);
    } catch (err) {
      // Other errors are shown by AuthContext's banner.
      if (err instanceof ApiError && err.code === 'totp_required') goToCodeStep();
    }
  };

  const verifyCode = async (code: string) => {
    if (isLoginLoading || (codeMode === 'app' ? code.length !== 6 : !isCompleteBackupCode(code))) return;
    setCodeError(null);
    try {
      const authedUser = await login(
        { username: signInIdentifier.trim(), password: signInPassword, totp_code: code },
        { quiet: true },
      );
      finishSignIn(authedUser.role);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.code === 'totp_invalid') {
        setCodeError(codeMode === 'app'
          ? 'That code didn’t work. Codes change every 30 seconds, so enter the one showing now.'
          : 'That backup code didn’t work, or it’s already been used.');
        setTotpCode('');
        // After the cleared boxes render, so focus lands on the first one.
        setTimeout(() => totpInputRef.current?.focus(), 30);
      } else if (apiErr?.code === 'invalid_credentials' || apiErr?.code === 'totp_required') {
        // The email/password pair no longer signs in (e.g. the password was just changed elsewhere).
        backToCredentials('Your sign-in needs to start again. Enter your password.');
        setSignInPassword('');
      } else if (apiErr?.status === 429) {
        setCodeError(apiErr.message || 'Too many attempts. Wait a minute, then try again.');
      } else if (apiErr?.status === 423) {
        setCodeError(apiErr.message || 'This account is locked. Contact support to get back in.');
      } else {
        setCodeError(err instanceof Error && err.message ? err.message : 'Couldn’t check the code. Try again.');
      }
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(totpCode);
  };

  const handleCodeChange = (next: string) => {
    setTotpCode(next);
    if (codeError) setCodeError(null);
  };

  // Leaving sign-in (to sign-up, forgot password…) starts it fresh next time.
  useEffect(() => {
    if (currentView !== 'signin') {
      setSigninStep('credentials');
      setStepAnim('');
      setTotpCode('');
      setCodeError(null);
    }
  }, [currentView]);

  // The code step opens ready to type.
  useEffect(() => {
    if (signinStep === 'code') totpInputRef.current?.focus();
  }, [signinStep, codeMode]);

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
      nin: nin.trim() ? nin.trim() : '',
      terms_version: TERMS_VERSION,
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

    if (clean.length > 2) {
      // Pasted or autofilled code: spread it across the boxes from this one on.
      const start = clean.length >= 5 ? 0 : index;
      clean.slice(0, 5 - start).split('').forEach((ch, idx) => { newArr[start + idx] = ch; });
      setOtpDigits(newArr);
      otpInputsRef.current[Math.min(start + clean.length, 4)]?.focus();
      return;
    }

    // Typing over a filled box leaves two digits in it; keep the new one.
    newArr[index] = clean.slice(-1);
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

  const panel = currentView === 'signup'
    ? PANELS[selectedRole === 'artisan' ? 'signupArtisan' : 'signupClient']
    : PANELS[currentView];

  const goTo = (view: AuthPageView) => {
    clearError();
    setCurrentView(view);
  };

  const topLink: Record<AuthPageView, { text: string; cta: string; view: AuthPageView }> = {
    signin: { text: 'New to KaziHub?', cta: 'Create an account', view: 'signup' },
    signup: { text: 'Already on KaziHub?', cta: 'Sign in', view: 'signin' },
    verify: { text: 'Wrong account?', cta: 'Sign in', view: 'signin' },
    forgot: { text: 'Remembered it?', cta: 'Sign in', view: 'signin' },
    reset: { text: 'Remembered it?', cta: 'Sign in', view: 'signin' },
  };
  const switchLink = topLink[currentView];

  const strength = getPasswordStrength(password);
  const resetMismatch = resetConfirmPassword.length > 0 && resetNewPassword !== resetConfirmPassword;
  const resendClock = `${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`;

  const submitLabel = (loading: boolean, idle: string, busy: string) => loading ? (
    <><RefreshCw className="w-[18px] h-[18px] animate-spin" aria-hidden="true" /><span>{busy}</span></>
  ) : (
    <><span>{idle}</span><Arrow /></>
  );

  return (
    <div className="kh-auth min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col lg:flex-row font-['Plus_Jakarta_Sans',system-ui,sans-serif]" style={{ background: C.cream, color: C.navy }}>
      {/* ───────── Phones: a plain header with the two-colour logo and a way back to the landing page ───────── */}
      <header className="lg:hidden h-16 md:h-[88px] shrink-0 px-5 md:px-10 flex items-center justify-between">
        <Link to="/" aria-label="KaziHub home" className={`${display} text-2xl md:text-[28px] tracking-[-0.04em]`}>
          <span style={{ color: '#3B35C9' }}>Kazi</span><span style={{ color: '#FF6A2B' }}>Hub</span>
        </Link>
        <Link to="/" aria-label="Close and go back to the home page" className="w-10 h-10 -mr-2.5 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
        </Link>
      </header>

      {/* ───────── Desktop: a rounded colour panel with the page's line and an app screen in a phone ───────── */}
      <aside
        className="hidden lg:block relative shrink-0 overflow-hidden w-[43%] max-w-[620px] m-5 mr-0 rounded-[32px]"
        style={{ background: panel.bg, color: panel.fg, transition: 'background-color 360ms ease' }}
      >
        <div className="relative z-10 flex flex-col gap-12 max-w-[480px] px-11 pt-9">
          <Link to="/" aria-label="KaziHub home" className={`${display} text-[28px] tracking-[-0.04em]`} style={{ color: panel.fg }}>KaziHub</Link>
          <div className="flex flex-col gap-3.5">
            <p className={`${display} text-[48px] leading-[0.92] tracking-[-0.05em]`}>{panel.title}</p>
            <p className="text-base leading-normal font-semibold">{panel.text}</p>
          </div>
        </div>
        <Phone key={panel.key} w={250} h={520} scale={1.4} className="kh-fade absolute left-1/2 -translate-x-1/2 top-[370px]">
          <panel.screen />
        </Phone>
      </aside>

      {/* ───────── Form column ───────── */}
      <main className="relative flex-1 min-h-0 lg:overflow-y-auto flex flex-col">
        <p className="hidden lg:block absolute top-[34px] right-12 text-[15px] font-semibold" style={{ color: C.body }}>
          {switchLink.text}{' '}
          <button type="button" onClick={() => goTo(switchLink.view)} className="kh-link pb-px font-extrabold cursor-pointer" style={{ color: C.navy }}>{switchLink.cta}</button>
        </p>

        <div key={currentView} className="kh-rise w-full max-w-[440px] mx-auto md:my-auto px-5 md:px-0 pt-6 pb-8 md:pt-2 md:pb-[72px] lg:py-24 flex flex-col gap-5 md:gap-[22px]" style={{ animationDuration: '600ms' }}>
          {error && (
            <div role="alert" className="flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold leading-snug" style={{ background: '#FDE3E0', color: C.navy }}>
              <AlertCircle className="w-[18px] h-[18px] shrink-0 mt-px" style={{ color: C.error }} aria-hidden="true" />
              <p className="flex-1">{error}</p>
              <button type="button" onClick={clearError} aria-label="Dismiss" className="shrink-0 -m-1 p-1 text-lg leading-none cursor-pointer">×</button>
            </div>
          )}
          {successBanner && (
            <div role="status" className="flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold leading-snug" style={{ background: '#D9F7E7', color: C.navy }}>
              <CheckCircle2 className="w-[18px] h-[18px] shrink-0" style={{ color: C.success }} aria-hidden="true" />
              <p>{successBanner}</p>
            </div>
          )}

          {/* ═════════ Sign in ═════════ */}
          {currentView === 'signin' && signinStep === 'credentials' && (
            <div key="signin-credentials" className={`flex flex-col gap-5 md:gap-[22px] ${stepAnim}`}>
              <Heading title="Welcome back" sub="Sign in with the email or username on your account." />
              {credentialsNote && (
                <p className="-mt-1 text-sm font-semibold leading-snug" style={{ color: C.body }} role="status">{credentialsNote}</p>
              )}
              <form onSubmit={handleSignInSubmit} className="flex flex-col gap-4" noValidate>
                <Field
                  label="Email or username"
                  htmlFor="signin-id"
                  error={
                    signInTouched.identifier && !signInIdentifier.trim() ? 'Enter your email or username'
                      : signInTouched.identifier && signInIdentifier.includes('@') && !emailIsValid(signInIdentifier) ? 'Enter a valid email, e.g. name@domain.com'
                      : undefined
                  }
                >
                  <input
                    id="signin-id"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    placeholder="you@example.com"
                    value={signInIdentifier}
                    onBlur={() => markSignInTouched('identifier')}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                  />
                </Field>
                <Field
                  label="Password"
                  htmlFor="signin-password"
                  aside={
                    <button type="button" onClick={() => { setForgotEmail(signInIdentifier.includes('@') ? signInIdentifier : ''); goTo('forgot'); }} className="kh-link pb-px text-sm font-extrabold cursor-pointer">
                      Forgot password?
                    </button>
                  }
                >
                  <input
                    id="signin-password"
                    type={showSignInPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                  />
                  <EyeToggle shown={showSignInPassword} onToggle={() => setShowSignInPassword(!showSignInPassword)} />
                </Field>
                <button type="submit" disabled={isLoginLoading || !signInIdentifier.trim() || !signInPassword} className={primaryBtn}>
                  {submitLabel(isLoginLoading, 'Sign in', 'Signing in…')}
                </button>
                <p className="text-[13px] leading-normal font-medium" style={{ color: C.muted }}>
                  By signing in you agree to KaziHub’s{' '}
                  <button type="button" onClick={() => openTermsWithTab('terms')} className="font-bold underline underline-offset-2 cursor-pointer" style={{ color: C.navy }}>Terms</button>.
                </p>
              </form>
            </div>
          )}

          {/* ═════════ Sign in, step 2: two-step code ═════════ */}
          {currentView === 'signin' && signinStep === 'code' && (
            <div key="signin-code" className={`flex flex-col gap-5 md:gap-[22px] ${stepAnim}`}>
              <button type="button" onClick={() => backToCredentials()} className="kh-link self-start pb-px text-sm font-extrabold cursor-pointer" style={{ color: C.navy }}>
                <span aria-hidden="true">←</span> Back
              </button>
              <Heading
                title={codeMode === 'app' ? 'Enter your 6-digit code' : 'Enter a backup code'}
                sub={codeMode === 'app'
                  ? <>Open your authenticator app and enter the code it shows for <strong>{signInIdentifier.trim()}</strong>.</>
                  : 'Use one of the backup codes you saved when you turned on two-step sign-in. Each one works once.'}
              />
              <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-2">
                  {codeMode === 'app' ? (
                    <DigitCodeInput
                      ref={totpInputRef}
                      idPrefix="signin-totp"
                      label="6-digit code"
                      value={totpCode}
                      onChange={handleCodeChange}
                      // Typing, pasting or autofilling the sixth digit submits; the button stays too.
                      onComplete={verifyCode}
                      invalid={Boolean(codeError)}
                      disabled={isLoginLoading}
                    />
                  ) : (
                    <BackupCodeInput
                      ref={totpInputRef}
                      idPrefix="signin-backup"
                      value={totpCode}
                      onChange={handleCodeChange}
                      invalid={Boolean(codeError)}
                      disabled={isLoginLoading}
                    />
                  )}
                  {codeError && <p className="text-[13px] font-semibold" style={{ color: C.error }} aria-live="polite">{codeError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isLoginLoading || (codeMode === 'app' ? totpCode.length !== 6 : !isCompleteBackupCode(totpCode))}
                  className={primaryBtn}
                >
                  {submitLabel(isLoginLoading, 'Verify and sign in', 'Verifying…')}
                </button>
                <button
                  type="button"
                  onClick={() => { setCodeMode((m) => (m === 'app' ? 'backup' : 'app')); setTotpCode(''); setCodeError(null); }}
                  className="kh-link self-start pb-px text-sm font-extrabold cursor-pointer"
                  style={{ color: C.navy }}
                >
                  {codeMode === 'app' ? 'Use a backup code' : 'Use the code from your app'}
                </button>
              </form>
            </div>
          )}

          {/* ═════════ Sign up ═════════ */}
          {currentView === 'signup' && (
            <>
              <Heading title="Create your account" sub="Takes a minute. We’ll email you a 5-digit code to confirm it’s you." />
              <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4" noValidate>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-extrabold">I’m joining to…</legend>
                  <div className="flex gap-2.5">
                    <RoleCard selected={selectedRole === 'client'} onSelect={() => setSelectedRole('client')} icon="icon-quote" title="Hire an artisan" sub="Book and pay safely" />
                    <RoleCard selected={selectedRole === 'artisan'} onSelect={() => setSelectedRole('artisan')} icon="spot-electrician" title="Find work" sub="Get jobs near you" />
                  </div>
                </fieldset>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" htmlFor="signup-first" error={touched.firstName && !firstName.trim() ? 'Required' : undefined}>
                    <input id="signup-first" type="text" autoComplete="given-name" required placeholder="Babatunde" value={firstName} onBlur={() => markTouched('firstName')} onChange={(e) => setFirstName(sanitizeName(e.target.value))} />
                  </Field>
                  <Field label="Last name" htmlFor="signup-last" error={touched.lastName && !lastName.trim() ? 'Required' : undefined}>
                    <input id="signup-last" type="text" autoComplete="family-name" required placeholder="Adebayo" value={lastName} onBlur={() => markTouched('lastName')} onChange={(e) => setLastName(sanitizeName(e.target.value))} />
                  </Field>
                </div>

                <Field
                  label="Email"
                  htmlFor="signup-email"
                  error={touched.email && !email ? 'Email is required' : touched.email && !emailIsValid(email) ? 'Enter a valid email, e.g. name@domain.com' : undefined}
                >
                  <input id="signup-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" value={email} onBlur={() => markTouched('email')} onChange={(e) => setEmail(e.target.value)} />
                </Field>

                <div className="flex flex-col gap-2">
                  <Field
                    label="Password"
                    htmlFor="signup-password"
                    error={touched.password && !password ? 'Password is required' : touched.password && !passwordIsValid ? 'Use 8 to 128 characters' : undefined}
                  >
                    <input id="signup-password" type={showSignUpPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} placeholder="At least 8 characters" value={password} onBlur={() => markTouched('password')} onChange={(e) => setPassword(e.target.value)} />
                    <EyeToggle shown={showSignUpPassword} onToggle={() => setShowSignUpPassword(!showSignUpPassword)} />
                  </Field>
                  {password && (
                    <div className="flex items-center gap-3" aria-live="polite">
                      <div className="flex-1 grid grid-cols-4 gap-1.5" aria-hidden="true">
                        {[1, 2, 3, 4].map(step => (
                          <span key={step} className="h-1.5 rounded-full transition-colors duration-200" style={{ background: strength.score >= step ? STRENGTH[strength.score] : C.line }} />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold" style={{ color: STRENGTH[strength.score] }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <Field
                  label="Confirm password"
                  htmlFor="signup-confirm"
                  error={touched.confirmPassword && !confirmPassword ? 'Please confirm your password' : touched.confirmPassword && !passwordsMatch ? 'Passwords don’t match' : undefined}
                >
                  <input id="signup-confirm" type={showSignUpConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required placeholder="Type it again" value={confirmPassword} onBlur={() => markTouched('confirmPassword')} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <EyeToggle shown={showSignUpConfirmPassword} onToggle={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3">
                  <Field
                    label="Phone number"
                    htmlFor="signup-phone"
                    error={touched.phone && (!phoneNumber || !phoneIsValid) ? 'Enter a valid Nigerian number, e.g. 802 345 6789' : undefined}
                  >
                    <span className="flex items-center gap-2 pr-3 h-7 shrink-0 border-r-2" style={{ borderColor: C.line }}>
                      <svg width="22" height="16" viewBox="0 0 3 2" aria-hidden="true" className="rounded-[3px] shrink-0"><rect width="3" height="2" fill="#FFFFFF" /><rect width="1" height="2" fill="#008751" /><rect x="2" width="1" height="2" fill="#008751" /></svg>
                      <span className="font-extrabold">+234</span>
                    </span>
                    <input id="signup-phone" type="tel" inputMode="tel" autoComplete="tel-national" required placeholder="802 345 6789" value={phoneNumber} onBlur={() => markTouched('phone')} onChange={(e) => setPhoneNumber(formatNigerianPhone(e.target.value))} />
                  </Field>
                  <div className="flex flex-col gap-2 min-w-0">
                    <span id="signup-state-label" className="text-sm font-extrabold">State</span>
                    <CustomDropdown
                      value={state}
                      onChange={(val) => setState(val)}
                      options={NIGERIAN_STATES.map((st) => ({ value: st, label: st }))}
                      className="w-full"
                      buttonClassName="kh-auth-select !h-[54px] lg:!h-14 !px-4 !rounded-[14px] !border-2 !border-[#0B1B3A] !bg-white !text-[16px] !font-semibold !text-[#0B1B3A] !shadow-none"
                    />
                  </div>
                </div>

                <Field
                  label="NIN"
                  htmlFor="signup-nin"
                  aside={<span className="text-[13px] font-bold" style={{ color: C.muted }}>{selectedRole === 'artisan' ? 'Needed for the Verified badge' : 'Optional'}</span>}
                  error={touched.nin && !ninIsValid ? 'Your NIN is exactly 11 digits' : undefined}
                >
                  <input id="signup-nin" type="text" inputMode="numeric" maxLength={11} placeholder="11-digit National Identity Number" value={nin} onBlur={() => { if (nin) markTouched('nin'); }} onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, ''))} />
                </Field>

                <Checkbox id="signup-terms" required checked={termsAccepted} onChange={setTermsAccepted} className="pt-1 text-sm font-medium leading-normal">
                  I agree to KaziHub’s{' '}
                  <button type="button" onClick={() => openTermsWithTab('terms')} className="font-bold underline underline-offset-2 cursor-pointer">Terms</button>
                  {' '}and{' '}
                  <button type="button" onClick={() => openTermsWithTab('privacy')} className="font-bold underline underline-offset-2 cursor-pointer">Privacy Policy</button>.
                </Checkbox>

                <button type="submit" disabled={isRegisterLoading || !termsAccepted} className={primaryBtn}>
                  {submitLabel(isRegisterLoading, 'Create account', 'Creating your account…')}
                </button>
              </form>
            </>
          )}

          {/* ═════════ Verify email ═════════ */}
          {currentView === 'verify' && (
            <>
              <BackLink onClick={() => goTo('signup')}>Back</BackLink>
              <Heading
                title="Check your email"
                sub={<>We sent a 5-digit code to <strong style={{ color: C.navy }}>{pendingEmail || email || signInIdentifier || 'your email'}</strong>.{' '}<button type="button" onClick={() => goTo('signup')} className="font-extrabold underline underline-offset-2 cursor-pointer" style={{ color: C.navy }}>Change</button></>}
              />
              <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-5">
                <div className="flex gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputsRef.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${index + 1}`}
                      maxLength={5}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`kh-otp w-[52px] h-[62px] sm:w-[58px] sm:h-[68px] text-center ${display} text-[28px] sm:text-[30px]`}
                    />
                  ))}
                </div>
                <p className="text-[15px] font-semibold" style={{ color: C.body }}>
                  Didn’t get it?{' '}
                  {resendTimer > 0 ? (
                    <>Resend in <strong className="tabular-nums" style={{ color: C.navy }}>{resendClock}</strong></>
                  ) : (
                    <button type="button" onClick={handleResendOtpCode} disabled={isResendOtpLoading} className="kh-link pb-px font-extrabold cursor-pointer disabled:opacity-50" style={{ color: C.navy }}>
                      {isResendOtpLoading ? 'Sending…' : 'Send a new code'}
                    </button>
                  )}
                </p>
                <button type="submit" disabled={isVerifyLoading || otpDigits.some(d => !d)} className={primaryBtn}>
                  {submitLabel(isVerifyLoading, 'Verify', 'Verifying…')}
                </button>
              </form>
              {selectedRole === 'artisan' && (
                <div className="flex gap-3 items-start p-4 rounded-2xl text-sm leading-[1.45] font-semibold" style={{ background: C.peach }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-0.5"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  <span>Signing up as an artisan? Once you’re in, you’ll verify your government ID and a live selfie to get the Verified badge.</span>
                </div>
              )}
            </>
          )}

          {/* ═════════ Forgot password ═════════ */}
          {currentView === 'forgot' && (
            <>
              <BackLink onClick={() => goTo('signin')}>Back to sign in</BackLink>
              <Heading title="Reset your password" sub="Enter the email on your account and we’ll send you a 5-digit code to set a new password." />
              <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
                <Field label="Email" htmlFor="forgot-email">
                  <input id="forgot-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                </Field>
                <button type="submit" disabled={isForgotPasswordLoading || !emailIsValid(forgotEmail)} className={primaryBtn}>
                  {submitLabel(isForgotPasswordLoading, 'Send reset code', 'Sending code…')}
                </button>
              </form>
            </>
          )}

          {/* ═════════ Reset password ═════════ */}
          {currentView === 'reset' && (
            <>
              <BackLink onClick={() => goTo('forgot')}>Back</BackLink>
              <Heading
                title="Set a new password"
                sub={(pendingEmail || forgotEmail)
                  ? <>Enter the 5-digit code we sent to <strong style={{ color: C.navy }}>{pendingEmail || forgotEmail}</strong>, then choose a new password.</>
                  : 'Enter the 5-digit code from your email, then choose a new password.'}
              />
              <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                <Field label="Reset code" htmlFor="reset-code">
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={5}
                    pattern="\d{5}"
                    placeholder="5-digit code"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(digitsOnly(e.target.value, 5))}
                    className={resetOtp ? 'tracking-[0.3em] tabular-nums' : undefined}
                  />
                </Field>
                <Field label="New password" htmlFor="reset-password">
                  <input id="reset-password" type={showResetPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} placeholder="At least 8 characters" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} />
                  <EyeToggle shown={showResetPassword} onToggle={() => setShowResetPassword(!showResetPassword)} />
                </Field>
                <Field label="Confirm new password" htmlFor="reset-confirm" error={resetMismatch ? 'Passwords don’t match' : undefined}>
                  <input id="reset-confirm" type={showResetPassword ? 'text' : 'password'} autoComplete="new-password" required placeholder="Type it again" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} />
                </Field>
                <button type="submit" disabled={isResetPasswordLoading || resetOtp.length !== 5 || resetNewPassword.length < 8 || resetNewPassword !== resetConfirmPassword} className={primaryBtn}>
                  {submitLabel(isResetPasswordLoading, 'Save new password', 'Saving…')}
                </button>
              </form>
            </>
          )}

          {currentView !== 'forgot' && <p className="lg:hidden pt-1 text-center text-[15px] font-semibold" style={{ color: C.body }}>
            {switchLink.text}{' '}
            <button type="button" onClick={() => goTo(switchLink.view)} className="kh-link pb-px font-extrabold cursor-pointer" style={{ color: C.navy }}>{switchLink.cta}</button>
          </p>}
        </div>
      </main>

      <TermsAndPrivacyModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} initialTab={termsModalTab} />
    </div>
  );
};

/* ───────── Page pieces ───────── */

// The public pages' own palette (see LandingPage), independent of the app theme.

const C = {
  navy: '#0B1B3A',
  cream: '#FFF6EC',
  peach: '#FFE3CC',
  body: '#3A4458',
  muted: '#5A6478',
  line: '#E6DED3',
  error: '#D93A2B',
  success: '#1F9D5B',
};
const display = "font-['Bricolage_Grotesque',sans-serif] font-extrabold";
const primaryBtn = 'kh-btn w-full h-14 md:h-[58px] rounded-2xl flex items-center justify-center gap-2 text-[17px] font-extrabold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';
const STRENGTH: Record<number, string> = { 0: C.error, 1: C.error, 2: '#C98500', 3: '#3B35C9', 4: C.success };

const PANELS: Record<'signin' | 'signupClient' | 'signupArtisan' | 'verify' | 'forgot' | 'reset', {
  key: string; bg: string; fg: string; title: string; text: string; screen: React.FC;
}> = {
  signin: { key: 'home', bg: '#9BF0C4', fg: C.navy, title: 'Welcome back. Wetin need fixing?', text: 'Your quotes, bookings and payments are right where you left them.', screen: MockHome },
  signupClient: { key: 'near', bg: '#F7B8D2', fg: C.navy, title: 'Get person wey sabi, and pay when the job is done.', text: 'Checked artisans near you. Your money waits in escrow until you confirm.', screen: MockNearYou },
  signupArtisan: { key: 'wallet', bg: '#3B35C9', fg: C.cream, title: 'You do the work. The money don already land.', text: 'Requests from people near you, and payment secured before you start.', screen: MockWallet },
  verify: { key: 'code', bg: '#FFB020', fg: C.navy, title: 'One quick check, then you’re in.', text: 'Your email keeps your bookings, quotes and escrow payments tied to you.', screen: MockCodeMail },
  forgot: { key: 'reset', bg: '#3B35C9', fg: C.cream, title: 'It happens. Let’s get you back in.', text: 'Your escrow payments stay safe while you reset.', screen: MockResetMail },
  reset: { key: 'reset', bg: '#3B35C9', fg: C.cream, title: 'It happens. Let’s get you back in.', text: 'Your escrow payments stay safe while you reset.', screen: MockResetMail },
};

const Arrow = () => <span className="kh-arrow" aria-hidden="true">→</span>;

const Heading: React.FC<{ title: string; sub: React.ReactNode }> = ({ title, sub }) => (
  <div className="flex flex-col gap-2.5">
    <h1 className={`${display} text-[36px] md:text-[46px] leading-[0.92] tracking-[-0.05em]`}>{title}</h1>
    <p className="text-[15px] md:text-base leading-normal font-medium" style={{ color: C.body }}>{sub}</p>
  </div>
);

const BackLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="kh-link self-start inline-flex items-center gap-2 pb-px text-[15px] font-extrabold cursor-pointer">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
    {children}
  </button>
);

/** A labelled input box. Children go inside the bordered box (the input, plus any prefix or eye toggle). */
const Field: React.FC<{ label: string; htmlFor: string; aside?: React.ReactNode; error?: string; children: React.ReactNode }> = ({ label, htmlFor, aside, error, children }) => (
  <div className="flex flex-col gap-2 min-w-0">
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-extrabold">{label}</label>
      {aside}
    </div>
    <div className="kh-input h-[54px] md:h-14 box-border flex items-center gap-3 px-4 rounded-[14px] border-2 bg-white text-base font-semibold" data-invalid={error ? 'true' : undefined}>
      {children}
    </div>
    {error && <p className="text-[13px] font-semibold" style={{ color: C.error }} aria-live="polite">{error}</p>}
  </div>
);

const EyeToggle: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} className="shrink-0 -mr-1 p-1 flex cursor-pointer">
    {shown ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
  </button>
);

const RoleCard: React.FC<{ selected: boolean; onSelect: () => void; icon: string; title: string; sub: string }> = ({ selected, onSelect, icon, title, sub }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className="kh-role relative flex-1 min-w-0 box-border p-4 rounded-[18px] border-2 flex flex-col gap-2.5 text-left cursor-pointer"
    data-selected={selected ? 'true' : undefined}
  >
    <img src={art(icon)} alt="" className="w-10 h-10 lg:w-11 lg:h-11" />
    <span className={`${display} text-[19px] lg:text-[21px] leading-none tracking-[-0.03em]`}>{title}</span>
    <span className="text-[13px] leading-snug font-semibold opacity-85">{sub}</span>
    {selected && (
      <span aria-hidden="true" className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#9BF0C4', color: C.navy }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
    )}
  </button>
);
