import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import backend from "../api/backend";
import toast from "react-hot-toast";
import illustration from "../assets/Registrasi.svg";
import { FaUser, FaLock, FaRegUser } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import { FiCheck, FiEye, FiEyeOff, FiX } from "react-icons/fi";

const PASSWORD_RULES = [
  { id: "length", test: () => true },
  { id: "letter", label: "Ada huruf", test: (value) => /[A-Za-z]/.test(value) },
  { id: "number", label: "Ada angka", test: (value) => /[0-9]/.test(value) },
  { id: "symbol", label: "Ada simbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const getPasswordStrength = (password) => {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;

  if (!password) {
    return {
      passed,
      label: "Belum diisi",
      width: "0%",
      barClass: "bg-slate-200",
      textClass: "text-slate-400",
    };
  }

  if (passed <= 2) {
    return {
      passed,
      label: "Lemah",
      width: "33%",
      barClass: "bg-rose-500",
      textClass: "text-rose-500",
    };
  }

  if (passed === 3) {
    return {
      passed,
      label: "Sedang",
      width: "66%",
      barClass: "bg-amber-500",
      textClass: "text-amber-500",
    };
  }

  return {
    passed,
    label: password.length >= 12 ? "Sangat kuat" : "Kuat",
    width: "100%",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  };
};

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordValid = passwordStrength.passed === PASSWORD_RULES.length;

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

    //if (!isPasswordValid) {
      //toast.error("Password minimal 8 karakter dan harus berisi huruf, angka, serta simbol.");
      //return;
    //}

    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eff6ff] via-[#f8fafc] to-[#e0f2fe] relative overflow-hidden font-sans">
      {/* Soft Ambient Blobs Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-blue-300/30 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-300/30 blur-[130px] pointer-events-none"></div>

      <div className="relative z-10 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/80 flex flex-col lg:flex-row items-stretch justify-between w-[90%] max-w-[1200px] min-h-[650px] overflow-hidden transition-all duration-500 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] py-4 lg:py-0 my-8">
        
        {/* FORM REGISTER */}
        <form
          onSubmit={handleSubmit}
          className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-10 z-10 bg-white/40 overflow-y-auto"
        >
          <div className="flex flex-col mb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
              Daftar
            </h1>
            <p className="text-slate-500 font-medium">Buat akun baru untuk melanjutkan.</p>
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
                  placeholder="Nama Depan"
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
                  placeholder="Nama Belakang"
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
                placeholder="Masukkan Email"
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
                placeholder="Masukkan Password"
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

            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Kekuatan password</p>
                <span className={`text-xs font-black ${passwordStrength.textClass}`}>{passwordStrength.label}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                  style={{ width: passwordStrength.width }}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(formData.password);
                  return (
                    <div key={rule.id} className={`flex items-center gap-2 text-[11px] font-bold ${passed ? "text-emerald-600" : "text-slate-400"}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${passed ? "bg-emerald-100" : "bg-slate-100"}`}>
                        {passed ? <FiCheck className="h-3 w-3" /> : <FiX className="h-3 w-3" />}
                      </span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="group flex items-center border border-slate-200/80 bg-white/80 rounded-2xl px-4 py-3.5 focus-within:border-[#21569A] focus-within:ring-4 focus-within:ring-[#21569A]/10 transition-all duration-300 shadow-sm">
              <FaLock className="text-slate-400 group-focus-within:text-[#21569A] mr-3.5 transition-colors text-lg" />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Konfirmasi Password"
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
              disabled={isLoading}
              className={`bg-[#21569A] text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-[#21569A]/30 hover:bg-[#1B4B59] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-center items-center w-full ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? "Mendaftar..." : "Daftar"}
            </button>
            
            <p className="mt-8 text-center text-slate-500 font-medium text-sm">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[#21569A] font-bold hover:text-[#163a68] hover:underline transition-colors">
                Masuk
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
