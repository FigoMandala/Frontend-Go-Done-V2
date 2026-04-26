import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiSend } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import backend from '../api/backend';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email input, 2: Check inbox
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSendLink = async (e) => {
    if (e) e.preventDefault();
    if (!email) return toast.error("Email cannot be empty!");

    setIsLoading(true);
    try {
      const res = await backend.post('/auth/password-forgot', { email });
      if (res.data.success) {
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to send reset link.");
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

          {/* Back Button */}
          <button
            onClick={() => step === 1 ? navigate('/login') : setStep(1)}
            disabled={isLoading}
            className="absolute top-8 left-8 p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>

          {/* Icon Header */}
          <div className="mb-8 mt-2 inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 text-[#21569A] shadow-inner">
            {step === 2 ? <FiCheckCircle className="w-8 h-8 text-emerald-500" /> : <FiLock className="w-8 h-8" />}
          </div>

          {/* Step 1: Email input */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Forgot Password</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Enter your email and we'll send you a secure reset link. No code to copy — just click and reset.
              </p>

              <form onSubmit={handleSendLink} className="space-y-5 text-left">
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
                  className="w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isLoading
                    ? <span className="animate-pulse">Sending...</span>
                    : <><FiSend className="w-4 h-4" /> Send Reset Link</>
                  }
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Check inbox */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Check Your Inbox</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 px-4">
                We sent a password reset link to <br />
                <strong className="text-slate-800">{email}</strong>
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5 text-left mb-8">
                <p className="text-xs font-bold text-[#21569A] uppercase tracking-widest mb-2">What to do next</p>
                <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside font-medium">
                  <li>Open your email inbox</li>
                  <li>Find the email from <span className="font-bold text-slate-800">GoDone App</span></li>
                  <li>Click <span className="font-bold text-slate-800">"Reset My Password"</span></li>
                  <li>Create your new password</li>
                </ol>
              </div>

              <p className="text-xs text-slate-400 mb-5">Didn't receive the email?</p>
              <button
                onClick={handleSendLink}
                disabled={isLoading}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {isLoading ? "Resending..." : "Resend Link"}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="mt-3 w-full bg-[#21569A] hover:bg-[#1a4580] text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] text-sm"
              >
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
