import { useState } from "react";
import backend from "../api/backend";
import illustration from "../assets/illustration.svg";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- HANDLER FUNCTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    toast.dismiss();

    if (!emailOrUsername) return toast.error("Email atau Username tidak boleh kosong!");
    if (!password) return toast.error("Password tidak boleh kosong!");
    if (password.length < 6) return toast.error("Password minimal 6 karakter!");

    if (isLoading) return;
    setIsLoading(true);

    try {
      console.log("🔄 Testing connection to backend...");
      
      const res = await backend.post("/auth/login", {
        emailOrUsername,
        password,
      });

      if (res.data.success) {
        toast.success("Login berhasil!");

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        toast.error(res.data.message || "Login gagal!");
      }
    } catch (err) {
      console.error("❌ Login Error Details:", {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        toast.error("Lagi Tidak Terhubung Ke server coba lagi 😀");
      } else if (err.code === "ECONNABORTED") {
        toast.error("❌ Request timeout - server tidak response");
      } else {
        toast.error("❌ Error: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eff6ff] via-[#f8fafc] to-[#e0f2fe] relative overflow-hidden font-sans">
      {/* Soft Ambient Blobs Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-blue-300/30 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-300/30 blur-[130px] pointer-events-none"></div>

      <Toaster position="top-center" />

      <div className="relative z-10 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/80 flex flex-col lg:flex-row items-stretch justify-between w-[90%] max-w-[1100px] min-h-[600px] overflow-hidden transition-all duration-500 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)]">
        
        {/* FORM SECTION */}
        <form onSubmit={handleSubmit} className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-12 z-10 bg-white/40">
          <div className="flex flex-col mb-10">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
              Sign In
            </h1>
            <p className="text-slate-500 font-medium">Hello there! Please enter your details.</p>
          </div>

          <div className="space-y-5">
            {/* Email or Username */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-4 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <FaUser className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-lg" />
              <input
                type="text"
                placeholder="Email atau Username"
                className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-4 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <FaLock className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-lg" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
          
          </div>

          <div className="flex flex-col mt-10">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`bg-[#21569A] text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-[#21569A]/30 hover:bg-[#1B4B59] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-center items-center w-full ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            <p className="mt-8 text-center text-slate-500 font-medium text-sm">
              Belum punya akun?{" "}
              <Link to="/register" className="text-[#21569A] font-bold hover:text-[#163a68] hover:underline transition-colors">
                Register
              </Link>
            </p>
          </div>
        </form>

        {/* ILLUSTRATION SECTION */}
        <div className="w-full lg:w-[55%] hidden lg:flex items-center justify-center p-12 relative">
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={illustration} alt="Login Illustration" className="w-[85%] max-w-[500px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-700 relative z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;