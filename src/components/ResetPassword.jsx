import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import backend from '../api/backend';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success' | 'invalid'

  useEffect(() => {
    if (!token || !email) {
      setStep('invalid');
    }
  }, [token, email]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");

    setIsLoading(true);
    try {
      const res = await backend.post('/auth/password-reset', {
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      if (res.data.success) {
        setStep('success');
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to reset password.";
      // If token is expired/invalid, show a more helpful state
      if (msg.includes('invalid') || msg.includes('expired')) {
        setStep('invalid');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[150px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-300/30 blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-2xl px-10 py-12 rounded-3xl shadow-2xl border border-white/50 text-center">

          {/* SUCCESS STATE */}
          {step === 'success' && (
            <div className="animate-fade-in">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 shadow-inner">
                <FiCheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3">Password Reset!</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Your password has been updated successfully. You can now login with your new credentials.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* INVALID/EXPIRED LINK STATE */}
          {step === 'invalid' && (
            <div className="animate-fade-in">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-50 text-red-400 shadow-inner">
                <FiAlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3">Link Invalid or Expired</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                This password reset link has expired or is invalid. Reset links are only valid for <strong className="text-slate-700">60 minutes</strong>.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] mb-3"
              >
                Request New Link
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3.5 rounded-2xl transition-all text-sm"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* FORM STATE */}
          {step === 'form' && (
            <div className="animate-fade-in">
              <div className="mb-8 mt-2 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 text-[#21569A] shadow-inner">
                <FiLock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">New Password</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Create a strong new password for <strong className="text-slate-700">{email}</strong>
              </p>

              <form onSubmit={handleReset} className="space-y-5 text-left">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 px-1">New Password</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#21569A]" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-16 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#21569A] transition-all"
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 hover:text-[#21569A]"
                    >
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 flex gap-1 px-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= (i + 1) * 3
                              ? password.length >= 12 ? 'bg-emerald-400' : password.length >= 8 ? 'bg-yellow-400' : 'bg-red-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#21569A]" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-2xl py-3.5 pl-11 pr-16 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-slate-200 focus:border-[#21569A]'
                      }`}
                      placeholder="Repeat password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 hover:text-[#21569A]"
                    >
                      {showConfirmPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400 font-semibold mt-1.5 px-1">Passwords don't match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (confirmPassword && confirmPassword !== password)}
                  className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 mt-2 flex justify-center items-center"
                >
                  {isLoading ? <span className="animate-pulse">Saving...</span> : "Reset Password"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
