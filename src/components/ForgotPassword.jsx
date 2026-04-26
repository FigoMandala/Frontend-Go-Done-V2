import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import backend from '../api/backend';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) return toast.error("Email cannot be empty!");

    // Clear any previous OTP before sending a new one
    setOtp('');
    setIsLoading(true);
    try {
      const res = await backend.post('/auth/password-forgot', { email });
      if (res.data.success) {
        toast.success(res.data.message || "OTP sent successfully!");
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("OTP must be 6 digits!");

    setIsLoading(true);
    try {
      const res = await backend.post('/auth/password-reset-verify', { email, otp });
      if (res.data.success) {
        toast.success("OTP Verified!");
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");

    setIsLoading(true);
    try {
      const res = await backend.post('/auth/password-reset', { email, otp, password });
      if (res.data.success) {
        setStep(4);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reset password.");
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
          
          <button
            onClick={() => {
              if (step === 1) {
                navigate('/login');
              } else {
                // Clear OTP state when going back so stale input doesn't persist
                setOtp('');
                setStep(prev => prev - 1);
              }
            }}
            disabled={step === 4 || isLoading}
            className="absolute top-8 left-8 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-0"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>

          {/* Icon Header */}
          <div className="mb-8 mt-2 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 text-[#21569A] shadow-inner">
            {step === 4 ? <FiCheckCircle className="w-8 h-8 text-emerald-500" /> : <FiLock className="w-8 h-8" />}
          </div>

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Forgot Password</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Enter the email address associated with your account. We'll send you a 6-digit OTP to reset your password.
              </p>
              
              <form onSubmit={handleSendOtp} className="space-y-5 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 px-1">Email Address</label>
                  <div className="relative group">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#21569A]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#21569A] transition-all"
                      placeholder="e.g. jessica@example.com"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {isLoading ? <span className="animate-pulse">Sending...</span> : "Send OTP"}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Check Your Inbox</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                We've sent a 6-digit verification code to <br/><strong className="text-slate-800">{email}</strong>
              </p>
              
              <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full max-w-[280px] text-center bg-blue-50/50 border-2 border-blue-100 rounded-2xl py-4 text-3xl font-black tracking-[0.5em] pl-[0.5em] text-[#21569A] placeholder-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#21569A] transition-all"
                    placeholder="------"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {isLoading ? <span className="animate-pulse">Verifying...</span> : "Verify Code"}
                </button>
              </form>
              <div className="mt-8 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Didn't receive the email?{" "}
                  <button onClick={handleSendOtp} disabled={isLoading} className="text-[#21569A] hover:underline hover:text-blue-700 ml-1">
                    Resend Code
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-2">New Password</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Almost there! Create a new strong password for your account.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-5 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 px-1">New Password</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#21569A]" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#21569A] transition-all"
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#21569A]" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#21569A] transition-all"
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
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 mt-2 flex justify-center items-center"
                >
                  {isLoading ? <span className="animate-pulse">Saving...</span> : "Reset Password"}
                </button>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in text-center pt-2">
              <h2 className="text-2xl font-black text-slate-800 mb-3">All Done!</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Your password has been successfully reset. You can now login with your new credentials.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
