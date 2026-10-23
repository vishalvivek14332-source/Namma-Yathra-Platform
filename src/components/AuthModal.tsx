import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Compass,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  MapPin
} from 'lucide-react';
import {
  AuthUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  onSuccess: (user: AuthUser) => void;
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  promptMessage
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [devTokenNotice, setDevTokenNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
      setDevTokenNotice(null);
    }
  }, [isOpen, initialMode]);

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDevTokenNotice(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        setErrorMsg('Please enter both your email address and password.');
        setIsLoading(false);
        return;
      }

      const res = await loginUser({ email: email.trim(), password });
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Invalid email or password.');
      } else {
        setSuccessMsg('Welcome back to Namma Yatra!');
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters long.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Registration failed.');
      } else {
        setSuccessMsg('Account created successfully! Welcome to Namma Yatra.');
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please provide your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to request password reset.');
      } else {
        setSuccessMsg(res.message || 'Password reset instructions have been generated.');
        if (res.resetToken) {
          setResetToken(res.resetToken);
          setDevTokenNotice(
            `Email server is in standby. For instant verification, your single-use reset token is: ${res.resetToken}`
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while requesting password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resetToken.trim()) {
      setErrorMsg('Reset token is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithToken({
        token: resetToken.trim(),
        newPassword: password,
        confirmPassword
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to reset password.');
      } else {
        setSuccessMsg('Your password has been reset successfully! You can now sign in.');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setResetToken('');
          resetFormState();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#102D23]/65 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 min-h-[580px]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#FFFEFA]/80 hover:bg-[#EDE8DE] text-[#555850] hover:text-[#102D23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Column: Authentic Karnataka Travel Visual (5 Cols on MD+) */}
          <div className="relative hidden md:flex md:col-span-5 bg-[#173D2E] text-[#FFFEFA] flex-col justify-between p-8 overflow-hidden">
            {/* Background Image: Hampi / Stone Chariot authentic atmosphere */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity scale-105"
              style={{
                backgroundImage: `url('/images/hampi_stone_chariot.jpg')`
              }}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#102D23] via-[#173D2E]/80 to-[#173D2E]/90" />

            {/* Top Brand Marker */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#102D23] border border-[#D8A735]/40 flex items-center justify-center text-[#D8A735] shadow-sm">
                  <Compass className="w-5 h-5 text-[#D8A735]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-editorial text-[#FFFEFA] tracking-tight">
                    Namma Yatra
                  </h1>
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-[#D8A735]">
                    ನಮ್ಮ ಯಾತ್ರೆ
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#E5DFD3]/90 italic font-editorial">
                "Your Karnataka. Your Journey."
              </p>
            </div>

            {/* Center Cultural Highlight */}
            <div className="relative z-10 space-y-4 py-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFEFA]/10 border border-[#FFFEFA]/20 text-[11px] text-[#D8A735]">
                <MapPin className="w-3.5 h-3.5" />
                <span>32 Curated Karnataka Destinations</span>
              </div>
              <p className="text-sm font-editorial leading-relaxed text-[#FFFEFA]/95">
                From UNESCO Vijayanagara ruins to mist-clad Western Ghats and coastal temple horizons, preserve your personalized journeys with secure account synchronization.
              </p>
            </div>

            {/* Bottom Trust Indicators */}
            <div className="relative z-10 pt-4 border-t border-[#FFFEFA]/15 flex items-center gap-4 text-[11px] text-[#E5DFD3]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D8A735]" />
                <span>Encrypted Passwords</span>
              </div>
              <span className="text-[#D8A735]">•</span>
              <div>MongoDB Atlas Cloud</div>
            </div>
          </div>

          {/* Right Column: Authentication Forms (7 Cols) */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-[#FFFEFA] space-y-6">
            {/* Header info */}
            <div className="space-y-1">
              {promptMessage && (
                <div className="mb-3 px-3 py-2 bg-[#F7F4EC] rounded-lg border border-[#D5CEBF] text-xs font-medium text-[#173D2E] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D8A735] shrink-0" />
                  <span>{promptMessage}</span>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#102D23] tracking-tight">
                {mode === 'login' && 'Sign in to Namma Yatra'}
                {mode === 'signup' && 'Create your Namma Yatra account'}
                {mode === 'forgot' && 'Reset your password'}
                {mode === 'reset' && 'Choose a new password'}
              </h2>
              <p className="text-xs text-[#77786F]">
                {mode === 'login' && 'Access your saved Karnataka itineraries and travel calculations.'}
                {mode === 'signup' && 'Join Karnataka travelers for intelligent, personalized trip curation.'}
                {mode === 'forgot' && 'Enter your registered email to receive a recovery token.'}
                {mode === 'reset' && 'Enter your recovery token and new password.'}
              </p>
            </div>

            {/* Error & Success Banners */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMsg}</span>
              </motion.div>
            )}

            {devTokenNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <p className="font-mono text-[11px] break-all bg-white p-2 rounded border border-amber-300">
                  {devTokenNotice}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    resetFormState();
                  }}
                  className="text-xs font-semibold text-[#173D2E] hover:underline flex items-center gap-1"
                >
                  <span>Proceed to reset password with this token</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29] placeholder-[#999990]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#555850]">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        resetFormState();
                      }}
                      className="text-[11px] font-semibold text-[#B9684B] hover:text-[#9B4E33] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29] placeholder-[#999990]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#77786F] hover:text-[#292D29] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFEFA] bg-[#173D2E] hover:bg-[#102D23] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D8A735]" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-[#77786F]">
                  Don’t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      resetFormState();
                    }}
                    className="font-bold text-[#173D2E] hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arun Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29] placeholder-[#999990]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29] placeholder-[#999990]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#555850]">Password (min 8)</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#77786F] hover:text-[#292D29] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#555850]">Confirm Password</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-[#77786F] hover:text-[#292D29] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFEFA] bg-[#173D2E] hover:bg-[#102D23] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D8A735]" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-[#77786F]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      resetFormState();
                    }}
                    className="font-bold text-[#173D2E] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">Account Email</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] text-[#292D29]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFEFA] bg-[#173D2E] hover:bg-[#102D23] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating recovery token...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Reset Token</span>
                      <KeyRound className="w-3.5 h-3.5 text-[#D8A735]" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-[#77786F]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      resetFormState();
                    }}
                    className="font-semibold text-[#173D2E] hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      resetFormState();
                    }}
                    className="font-semibold text-[#B9684B] hover:underline"
                  >
                    Already have a token?
                  </button>
                </div>
              </form>
            )}

            {/* 4. RESET PASSWORD WITH TOKEN */}
            {mode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">Reset Token</label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type="text"
                      required
                      placeholder="Paste 64-character token"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E] font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">New Password (min 8)</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#77786F] hover:text-[#292D29] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#555850]">Confirm New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl focus:outline-none focus:border-[#173D2E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[#77786F] hover:text-[#292D29] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-[#FFFEFA] bg-[#173D2E] hover:bg-[#102D23] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Set New Password</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D8A735]" />
                    </>
                  )}
                </button>

                <div className="text-center text-xs text-[#77786F]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      resetFormState();
                    }}
                    className="font-semibold text-[#173D2E] hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
