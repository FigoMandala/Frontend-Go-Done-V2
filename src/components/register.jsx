import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import backend from "../api/backend";
import toast, { Toaster } from "react-hot-toast";
import illustration from "../assets/Registrasi.svg";
import { FaUser, FaLock, FaRegUser } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    const { firstName, lastName, username, email, password, confirmPassword } = formData;

    // Validasi
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Email tidak valid!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }

    try {
      const res = await backend.post("/auth/register", {
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        password,
      });

      if (res.data.success) {
        toast.success("Registrasi berhasil! Category default sudah siap.");

        // Auto-login: Simpan token & user data
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setFormData({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Redirect otomatis ke dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        toast.error(res.data.message || "Registrasi gagal!");
      }
    } catch (err) {
      console.error("Registration Error:", err.response?.data || err);
      
      if (err.response?.status === 422 && err.response?.data?.errors) {
        // Tampilkan error validasi pertama yang ditemukan
        const firstError = Object.values(err.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        const backendMessage = err.response?.data?.message;
        toast.error(backendMessage || "Terjadi kesalahan saat registrasi!");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eff6ff] via-[#f8fafc] to-[#e0f2fe] relative overflow-hidden font-sans">
      {/* Soft Ambient Blobs Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-blue-300/30 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-300/30 blur-[130px] pointer-events-none"></div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: "16px",
            padding: "16px 24px",
            borderRadius: "16px",
          },
        }}
      />

      <div className="relative z-10 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/80 flex flex-col lg:flex-row items-stretch justify-between w-[90%] max-w-[1200px] min-h-[650px] overflow-hidden transition-all duration-500 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] py-4 lg:py-0 my-8">
        
        {/* FORM REGISTER */}
        <form
          onSubmit={handleSubmit}
          className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-10 z-10 bg-white/40 overflow-y-auto"
        >
          <div className="flex flex-col mb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
              Sign Up
            </h1>
            <p className="text-slate-500 font-medium">Create a new account to continue.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIRST NAME */}
              <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
                <FaRegUser className="text-slate-400 group-focus-within:text-[#21569A] mr-3 transition-colors text-lg" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full text-sm"
                />
              </div>

              {/* LAST NAME */}
              <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
                <FaRegUser className="text-slate-400 group-focus-within:text-[#21569A] mr-3 transition-colors text-lg" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full text-sm"
                />
              </div>
            </div>

            {/* USERNAME */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <FaUser className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-lg" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full text-sm"
              />
            </div>

            {/* EMAIL */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <MdOutlineMail className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-[22px]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full text-sm"
              />
            </div>

            {/* PASSWORD */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <FaLock className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-lg" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Password"
                className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full text-sm"
              />
              <button
                type="button"
                className="ml-2 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="text-slate-400 hover:text-slate-600 transition-colors w-5 h-5" />
                ) : (
                  <FiEye className="text-slate-400 hover:text-slate-600 transition-colors w-5 h-5" />
                )}
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <FaLock className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-lg" />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="flex-1 outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium w-full text-sm"
              />
              <button
                type="button"
                className="ml-2 focus:outline-none"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? (
                  <FiEyeOff className="text-slate-400 hover:text-slate-600 transition-colors w-5 h-5" />
                ) : (
                  <FiEye className="text-slate-400 hover:text-slate-600 transition-colors w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col mt-8">
            <button
              type="submit"
              className="bg-[#21569A] text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-[#21569A]/30 hover:bg-[#1B4B59] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-center items-center w-full"
            >
              Register
            </button>
            
            <p className="mt-8 text-center text-slate-500 font-medium text-sm">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[#21569A] font-bold hover:text-[#163a68] hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </form>

        {/* ILLUSTRATION */}
        <div className="w-full lg:w-[55%] hidden lg:flex items-center justify-center p-12 relative">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={illustration}
              alt="Register Illustration"
              className="w-[85%] max-w-[550px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-700 relative z-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
