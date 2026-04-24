import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaEnvelope, FaBell, FaUserAlt } from 'react-icons/fa';
import { FiUpload, FiTrash2, FiX, FiCheck, FiEye, FiEyeOff, FiLock, FiShield, FiSettings, FiAlertTriangle, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import backend from '../api/backend';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const MAX_PHOTO_SIZE_MB = 4;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

const TABS = [
  { id: 'profile', label: 'Profile', icon: FaUserAlt, color: 'indigo' },
  { id: 'security', label: 'Security', icon: FiLock, color: 'emerald' },
  { id: 'preferences', label: 'Preferences', icon: FiSettings, color: 'sky' },
  { id: 'danger', label: 'Danger Zone', icon: FiAlertTriangle, color: 'rose' },
];

function Account() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('dashboardTheme') || 'light');
  const isDark = theme === 'dark';

  const [user, setUser] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [notifOn, setNotifOn] = useState(() => {
    const saved = localStorage.getItem('notifEnabled');
    return saved === null ? true : JSON.parse(saved);
  });

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isPopupError, setIsPopupError] = useState(false);

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showDeletePhoto, setShowDeletePhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  const [, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await backend.get('/user/me');
        setUser(res.data);
        setFormData({
          firstName: res.data.first_name || '',
          lastName: res.data.last_name || '',
          email: res.data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (err) {
        console.log('Error GET /me:', err);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === 'light' || event.detail === 'dark') {
        setTheme(event.detail);
      }
    };

    window.addEventListener('dashboardThemeChange', handleThemeChange);
    return () => window.removeEventListener('dashboardThemeChange', handleThemeChange);
  }, []);

  const showToast = (type, message) => {
    if (!notifOn) return;
    toast[type](message);
  };

  const handleBack = () => navigate('/dashboard');
  const handleDelete = () => setShowDeleteAccount(true);
  const handleRemovePhoto = () => setShowDeletePhoto(true);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const togglePass = (field) => setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  const broadcastUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
  };

  const confirmDeletePhoto = async () => {
    try {
      const res = await backend.delete('/user/photo');
      if (res.data.success) {
        const updated = { ...user, photo_url: null };
        setUser(updated);
        broadcastUserUpdate(updated);
        showToast('success', 'Photo removed!');
      } else {
        showToast('error', 'Gagal hapus foto!');
      }
    } catch (err) {
      console.log(err);
      showToast('error', 'Gagal hapus foto!');
    }
    setShowDeletePhoto(false);
  };

  const confirmDeleteAccount = async () => {
    try {
      const res = await backend.delete('/user/delete', {
        data: { currentPassword: formData.currentPassword },
      });
      if (res.data.success) {
        localStorage.removeItem('token');
        setIsPopupError(false);
        setPopupMessage('Your account has been deleted.');
        setShowSuccessPopup(true);
        setTimeout(() => navigate('/'), 1800);
      } else {
        setIsPopupError(true);
        setPopupMessage(res.data.message || 'Failed to delete account!');
        setShowSuccessPopup(true);
      }
    } catch (err) {
      console.log('DELETE ERROR:', err);
      setIsPopupError(true);
      setPopupMessage('Failed to delete account!');
      setShowSuccessPopup(true);
    }
  };

  const handleSaveProfile = async () => {
    if (notifOn) toast.dismiss();

    if (!formData.firstName.trim()) return showToast('error', 'First name tidak boleh kosong!');
    if (!formData.lastName.trim()) return showToast('error', 'Last name tidak boleh kosong!');
    if (!formData.email.trim()) return showToast('error', 'Email tidak boleh kosong!');
    if (!formData.email.includes('@') || !formData.email.includes('.')) return showToast('error', 'Format email tidak valid!');

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
    };

    try {
      const res = await backend.put('/user/update', payload);

      if (!res.data.success) {
        setIsPopupError(true);
        setPopupMessage(res.data.message || 'Failed to update profile!');
        setShowSuccessPopup(true);
        return;
      }

      const updatedUser = {
        ...user,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        photo_url: user.photo_url,
      };
      setUser(updatedUser);
      broadcastUserUpdate(updatedUser);

      setIsPopupError(false);
      setPopupMessage('Profile updated successfully!');
      setShowSuccessPopup(true);
      setIsEditingProfile(false);
    } catch (err) {
      console.log('Update error:', err);
      setIsPopupError(true);
      setPopupMessage('Failed to update profile!');
      setShowSuccessPopup(true);
    }
  };

  const handleSavePassword = async () => {
    if (notifOn) toast.dismiss();

    if (!formData.currentPassword.trim()) {
      setIsPopupError(true);
      setPopupMessage('Current password harus diisi!');
      setShowSuccessPopup(true);
      return;
    }

    if (formData.newPassword.length < 6) {
      setIsPopupError(true);
      setPopupMessage('Password minimal 6 karakter!');
      setShowSuccessPopup(true);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setIsPopupError(true);
      setPopupMessage('Konfirmasi password tidak cocok!');
      setShowSuccessPopup(true);
      return;
    }

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    };

    try {
      const res = await backend.put('/user/update', payload);

      if (!res.data.success) {
        setIsPopupError(true);
        setPopupMessage(res.data.message || 'Failed to update password!');
        setShowSuccessPopup(true);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setIsPopupError(false);
      setPopupMessage('Password updated successfully!');
      setShowSuccessPopup(true);
    } catch (err) {
      console.log('Update error:', err);
      setIsPopupError(true);
      setPopupMessage('Failed to update password!');
      setShowSuccessPopup(true);
    }
  };

  const handleSelectPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'File harus berupa gambar.');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      showToast('error', 'Format foto harus PNG, JPG, atau JPEG.');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      showToast('error', `Ukuran foto maksimal ${MAX_PHOTO_SIZE_MB}MB.`);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setShowCropModal(true);
  };

  const handleCropComplete = async () => {
    try {
      const croppedFile = await getCroppedImg(previewUrl, croppedAreaPixels);
      await uploadCroppedPhoto(croppedFile);
      setShowCropModal(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      console.log('Crop error:', err);
      showToast('error', 'Gagal crop foto!');
    }
  };

  const uploadCroppedPhoto = async (file) => {
    const uploadForm = new FormData();
    uploadForm.append('photo', file);

    try {
      const res = await backend.post('/user/photo', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.success) {
        showToast('success', 'Foto profil berhasil diperbarui!');
        const updated = { ...user, photo_url: res.data.photo_url };
        setUser(updated);
        broadcastUserUpdate(updated);
      } else {
        showToast('error', res.data?.message || 'Gagal upload foto!');
      }
    } catch (err) {
      console.log(err);
      showToast('error', 'Gagal upload foto!');
    }
  };

  // ===== STYLE CLASSES =====
  const panelClass = isDark ? 'bg-zinc-900/40 border-zinc-800/80 shadow-md shadow-black/10' : 'bg-white/90 border-slate-200/60 shadow-sm shadow-slate-200/50';
  const labelClass = isDark ? 'text-zinc-300' : 'text-slate-700';
  const helperClass = isDark ? 'text-zinc-500' : 'text-slate-500';
  const fieldClass = isDark
    ? 'w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all'
    : 'w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all';
  const modalCardClass = isDark ? 'bg-zinc-900 text-zinc-100 border-zinc-800' : 'bg-white text-slate-800 border-slate-200';
  const headingClass = isDark ? 'text-zinc-50' : 'text-slate-900';
  const cardBgClass = isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-white border-slate-200/60';

  const profileInitials = useMemo(() => {
    const first = user.first_name?.charAt(0) || 'U';
    const last = user.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  }, [user.first_name, user.last_name]);

  // ===== TAB COLOR HELPERS =====
  const getTabColors = (color, isActive) => {
    const colorMap = {
      indigo: {
        active: isDark ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
        inactive: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent',
        icon: isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600',
      },
      emerald: {
        active: isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        inactive: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent',
        icon: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      },
      sky: {
        active: isDark ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200',
        inactive: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent',
        icon: isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600',
      },
      rose: {
        active: isDark ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
        inactive: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent',
        icon: isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600',
      },
    };
    return isActive ? colorMap[color].active : colorMap[color].inactive;
  };

  // ===== MODALS =====
  const renderSuccessPopup = () =>
    showSuccessPopup && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xl animate-in fade-in duration-300 px-4">
        <div className={`w-full max-w-sm rounded-[2rem] border p-8 shadow-2xl transition-all animate-slide-up ${modalCardClass}`}>
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl rotate-12 transition-transform hover:rotate-0 shadow-lg ${
            isPopupError ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}>
            {isPopupError ? <FiX className="h-10 w-10" /> : <FiCheck className="h-10 w-10" />}
          </div>
          <h2 className={`text-center text-2xl font-black tracking-tight ${headingClass}`}>
            {isPopupError ? 'Something went wrong' : 'Action successful'}
          </h2>
          <p className={`mt-3 text-center text-sm font-medium leading-relaxed ${helperClass}`}>
            {popupMessage}
          </p>
          <button
            onClick={() => setShowSuccessPopup(false)}
            className={`mt-8 w-full rounded-2xl px-4 py-4 font-bold transition-all shadow-lg active:scale-95 ${
              isPopupError ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' : 'bg-[#21569A] text-white hover:bg-[#1a4580] shadow-blue-500/20'
            }`}
          >
            Got it, thanks
          </button>
        </div>
      </div>,
      document.body
    );

  const renderPhotoModal = () =>
    showPhotoModal && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-xl px-4 animate-in fade-in duration-300">
        <div className={`w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl animate-slide-up ${modalCardClass}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-indigo-400' : 'text-[#21569A]'}`}>Interface</p>
              <h2 className={`mt-1 text-2xl font-black tracking-tight ${headingClass}`}>Update Photo</h2>
            </div>
            <button
              onClick={() => setShowPhotoModal(false)}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all hover:rotate-90 ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white' : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-800'}`}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-center mb-10">
            <div className="relative group">
              <div className={`absolute -inset-2 rounded-full blur-xl opacity-20 transition duration-500 group-hover:opacity-40 ${isDark ? 'bg-indigo-500' : 'bg-blue-400'}`}></div>
              {user.photo_url ? (
                <img
                  src={user.photo_url}
                  alt="Current"
                  className={`relative h-32 w-32 rounded-full object-cover border-4 shadow-xl ring-4 ring-transparent transition-all group-hover:scale-105 ${isDark ? 'border-zinc-800' : 'border-white'}`}
                />
              ) : (
                <div className={`relative h-32 w-32 rounded-full flex items-center justify-center text-4xl font-black border-4 shadow-xl transition-all group-hover:scale-105 ${
                  isDark ? 'bg-zinc-800 text-indigo-400 border-zinc-700' : 'bg-slate-50 text-[#21569A] border-white'
                }`}>
                  {profileInitials}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                document.getElementById('uploadPhotoInput')?.click();
                setShowPhotoModal(false);
              }}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-bold text-sm text-white transition-all shadow-lg active:scale-95 ${
                isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-[#21569A] hover:bg-[#1a4580] shadow-blue-500/20'
              }`}
            >
              <FiUpload className="w-4 h-4" />
              <span>Upload New Picture</span>
            </button>

            {user.photo_url && (
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setShowDeletePhoto(true);
                }}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-bold text-sm transition-all border group active:scale-95 ${
                  isDark
                  ? 'border-zinc-700 text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-rose-400 hover:border-rose-500/30'
                  : 'border-slate-200 text-slate-500 bg-slate-50/50 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200'
                }`}
              >
                <FiTrash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Remove Current</span>
              </button>
            )}

            <p className={`text-center text-[10px] font-medium tracking-wide mt-4 uppercase ${helperClass}`}>
              Resolution recommendation: 400x400px • MAX {MAX_PHOTO_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>,
      document.body
    );

  const renderCropModal = () =>
    showCropModal && previewUrl && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4 animate-in fade-in duration-300">
        <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[2.5rem] border p-8 shadow-2xl animate-slide-up ${modalCardClass}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-indigo-400' : 'text-[#21569A]'}`}>Adjustment</p>
              <h2 className={`mt-1 text-2xl font-black tracking-tight ${headingClass}`}>Crop Photo</h2>
            </div>
            <button
              onClick={() => { setShowCropModal(false); setPreviewUrl(null); }}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all hover:rotate-90 ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white' : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-800'}`}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className={`mt-5 h-[300px] md:h-[400px] overflow-hidden rounded-3xl border-4 relative shadow-inner ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-white bg-slate-100'}`}>
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(area, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>

          <div className={`mt-8 p-6 rounded-3xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${helperClass}`}>Zoom Level</span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#21569A]/10 text-[#21569A]'}`}>
                {zoom.toFixed(1)}x
              </span>
            </div>
            <div className="relative h-2 flex items-center">
              <div className={`absolute h-full w-full rounded-full ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}></div>
              <div
                className={`absolute h-full rounded-full transition-all duration-300 ${isDark ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-[#21569A]'}`}
                style={{ width: `${((zoom - 1) / 2) * 100}%` }}
              ></div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute h-5 w-5 rounded-full bg-white shadow-xl border-2 border-indigo-500 pointer-events-none transition-all duration-300"
                style={{ left: `calc(${((zoom - 1) / 2) * 100}% - 10px)` }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 px-1">
              <span className={`text-[10px] font-bold ${helperClass}`}>1x</span>
              <span className={`text-[10px] font-bold ${helperClass}`}>3x</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}
              className={`px-4 py-3.5 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${
                isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Reset
            </button>
            <button
              onClick={() => { setShowCropModal(false); setPreviewUrl(null); }}
              className={`px-4 py-3.5 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${
                isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              className={`col-span-2 sm:col-span-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all shadow-xl active:scale-95 ${
                isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-[#21569A] hover:bg-[#1a4580] shadow-blue-500/20'
              }`}
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  const renderDeleteAccountModal = () =>
    showDeleteAccount && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4 animate-in fade-in duration-300">
        <div className={`w-full max-w-sm rounded-[2.5rem] border p-10 shadow-2xl animate-slide-up ${modalCardClass}`}>
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/5"></div>
            <FiTrash2 className="h-10 w-10 relative z-10" />
          </div>
          <h2 className={`text-center text-2xl font-black tracking-tight ${headingClass}`}>Delete Account?</h2>
          <p className={`mt-4 text-center text-sm font-medium leading-relaxed ${helperClass}`}>
            All your data, tasks, and settings will be permanently erased. This action is irreversible.
          </p>
          <div className="mt-8">
            <label className={`mb-2 block text-xs font-semibold ${labelClass}`}>Current Password</label>
            <div className="relative">
              <input
                type={showPass.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className={fieldClass}
                placeholder="Enter your current password"
              />
              <button type="button" onClick={() => togglePass('current')} className={`absolute right-4 top-1/2 -translate-y-1/2 ${helperClass}`}>
                {showPass.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowDeleteAccount(false)}
              className={`rounded-2xl px-4 py-4 font-bold text-sm transition-all border active:scale-95 ${
                isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Keep Account
            </button>
            <button
              onClick={confirmDeleteAccount}
              className="rounded-2xl px-4 py-4 font-bold text-sm text-white transition-all bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 active:scale-95"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  const renderDeletePhotoModal = () =>
    showDeletePhoto && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4 animate-in fade-in duration-300">
        <div className={`w-full max-w-sm rounded-[2.5rem] border p-10 shadow-2xl animate-slide-up ${modalCardClass}`}>
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg">
            <FiTrash2 className="h-8 w-8" />
          </div>
          <h2 className={`text-center text-2xl font-black tracking-tight ${headingClass}`}>Remove Photo?</h2>
          <p className={`mt-4 text-center text-sm font-medium leading-relaxed ${helperClass}`}>
            You'll reset to your default profile initials.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowDeletePhoto(false)}
              className={`rounded-2xl px-4 py-4 font-bold text-sm transition-all border active:scale-95 ${
                isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeletePhoto}
              className="rounded-2xl px-4 py-4 font-bold text-sm text-white transition-all bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 active:scale-95"
            >
              Remove
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  const renderPasswordField = (label, name, showKey) => (
    <div>
      <label className={`mb-2 block text-xs font-semibold ${labelClass}`}>{label}</label>
      <div className="relative">
        <input
          type={showPass[showKey] ? 'text' : 'password'}
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          className={fieldClass}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button type="button" onClick={() => togglePass(showKey)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${helperClass}`}>
          {showPass[showKey] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
    </div>
  );

  // ===== TAB CONTENT RENDERERS =====

  const renderProfileTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      {/* Profile Info Card */}
      <div className={`lg:col-span-2 rounded-3xl border p-5 md:p-7 backdrop-blur-xl h-full flex flex-col ${panelClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-50 text-[#21569A]'}`}>
            <FaUserAlt className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-sm ${headingClass}`}>Personal Information</h3>
            <p className={`text-[11px] ${helperClass}`}>Manage your name and email</p>
          </div>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${
                isDark ? 'border-zinc-700 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/30' : 'border-slate-200 text-slate-500 hover:text-[#21569A] hover:border-blue-200'
              }`}
            >
              <FiEdit3 className="w-3 h-3" /> Edit Profile
            </button>
          )}
        </div>

        {isEditingProfile ? (
          /* Edit Mode */
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-2 block text-xs font-semibold ${labelClass}`}>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={fieldClass} />
              </div>
              <div>
                <label className={`mb-2 block text-xs font-semibold ${labelClass}`}>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={fieldClass} />
              </div>
            </div>
            <div>
              <label className={`mb-2 block text-xs font-semibold ${labelClass}`}>Email Address</label>
              <div className="relative">
                <FaEnvelope className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${helperClass}`} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${fieldClass} pl-11`} />
              </div>
            </div>

            {/* Sticky Action Buttons */}
            <div className={`flex items-center gap-3 pt-5 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={handleSaveProfile}
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-bold text-xs text-white transition-all shadow-sm active:scale-95 ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/15' : 'bg-[#21569A] hover:bg-[#1a4580] shadow-blue-500/15'}`}
              >
                <FiCheck className="w-3.5 h-3.5" /> Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setFormData(prev => ({
                    ...prev,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    email: user.email || '',
                  }));
                }}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-2.5 font-bold text-xs transition-colors active:scale-95 ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                <FiX className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={`rounded-2xl border p-4 transition-all hover:shadow-md group ${cardBgClass}`}>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>First Name</p>
              <p className={`text-sm font-bold group-hover:text-indigo-500 transition-colors ${headingClass}`}>{user.first_name || '—'}</p>
            </div>
            <div className={`rounded-2xl border p-4 transition-all hover:shadow-md group ${cardBgClass}`}>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Last Name</p>
              <p className={`text-sm font-bold group-hover:text-indigo-500 transition-colors ${headingClass}`}>{user.last_name || '—'}</p>
            </div>
            <div className={`rounded-2xl border p-4 transition-all hover:shadow-md group sm:col-span-2 ${cardBgClass}`}>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Email</p>
              <div className="flex items-center gap-2.5">
                <div className={`p-1 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                  <FaEnvelope className={`w-3 h-3 ${isDark ? 'text-indigo-400' : 'text-[#21569A]'}`} />
                </div>
                <p className={`text-sm font-bold group-hover:text-indigo-500 transition-colors ${headingClass}`}>{user.email || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display Picture Card */}
      <div className={`lg:col-span-1 rounded-3xl border p-5 md:p-7 backdrop-blur-xl h-full flex flex-col ${panelClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
            <FaCamera className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-sm ${headingClass}`}>Photo</h3>
            <p className={`text-[11px] ${helperClass}`}>Profile preview</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            {user.photo_url ? (
              <img src={user.photo_url} alt="Profile" className={`h-20 w-20 rounded-full object-cover border-2 shadow-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`} />
            ) : (
              <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-black border-2 shadow-lg ${
                isDark ? 'bg-zinc-800 text-indigo-400 border-zinc-700' : 'bg-slate-50 text-[#21569A] border-slate-200'
              }`}>
                {profileInitials}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-bold ${headingClass}`}>{user.first_name} {user.last_name}</p>
            <p className={`text-xs ${helperClass}`}>{user.email || 'No email set'}</p>
            <p className={`text-[11px] font-semibold ${helperClass}`}>Klik tombol di bawah untuk ganti foto, bukan avatar header.</p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setShowPhotoModal(true)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-bold text-white transition-all active:scale-95 ${
                  isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-[#21569A] hover:bg-[#1a4580]'
                }`}
              >
                <FiUpload className="w-3.5 h-3.5" /> Ganti Photo
              </button>

              {user.photo_url && (
                <button
                  onClick={handleRemovePhoto}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-bold transition-all active:scale-95 ${
                    isDark ? 'border-zinc-700 text-zinc-300 hover:text-rose-400 hover:border-rose-500/30' : 'border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200'
                  }`}
                >
                  <FiTrash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
      <div className={`rounded-3xl border p-5 md:p-8 backdrop-blur-xl h-full flex flex-col ${panelClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <FiShield className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-sm ${headingClass}`}>Password</h3>
            <p className={`text-[11px] ${helperClass}`}>Update credentials</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {renderPasswordField('Current Password', 'currentPassword', 'current')}
          <div className={`border-t my-2 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderPasswordField('New Password', 'newPassword', 'new')}
            {renderPasswordField('Confirm New', 'confirmPassword', 'confirm')}
          </div>
        </div>

        <div className={`flex items-center gap-3 mt-6 pt-5 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <button
            type="button"
            onClick={handleSavePassword}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-bold text-xs text-white transition-all shadow-sm active:scale-95 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/15' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/15'}`}
          >
            <FiLock className="w-3.5 h-3.5" /> Update
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))}
            className={`flex items-center gap-2 rounded-2xl border px-5 py-2.5 font-bold text-xs transition-colors active:scale-95 ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Security Tips */}
      <div className={`rounded-3xl border p-5 backdrop-blur-xl h-full flex flex-col ${panelClass}`}>
        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-5 p-1 px-3 rounded-lg w-fit ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Security Best Practices</h4>
        <ul className="space-y-4 flex-1">
          {[
            'Use at least 8 characters with a mix of letters, numbers, and symbols',
            'Don\'t reuse passwords from other sites like Social Media',
            'Change your password regularly for better account security',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm ${isDark ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' : 'bg-white text-emerald-600 border border-emerald-100'}`}>{i + 1}</span>
              <span className={`text-xs font-bold leading-relaxed ${helperClass}`}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
      <div className={`rounded-3xl border p-5 md:p-8 backdrop-blur-xl h-full flex flex-col ${panelClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            <FaBell className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-sm ${headingClass}`}>Notifications</h3>
            <p className={`text-[11px] ${helperClass}`}>Manage alerts and reminders</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {/* Main Notification Toggle */}
          <div className={`flex items-center justify-between rounded-2xl border p-4 transition-all hover:shadow-md ${cardBgClass}`}>
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${notifOn ? 'bg-indigo-500/10 text-indigo-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                <FaBell className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-bold ${headingClass}`}>Push Notifications</p>
                <p className={`text-[10px] ${helperClass}`}>Daily reminders & tasks</p>
              </div>
            </div>
            <button
              onClick={() => {
                const newVal = !notifOn;
                setNotifOn(newVal);
                localStorage.setItem('notifEnabled', JSON.stringify(newVal));
              }}
              className={`relative h-7 w-12 rounded-full transition-all duration-500 shadow-inner ${
                notifOn ? (isDark ? 'bg-indigo-600' : 'bg-[#21569A]') : (isDark ? 'bg-zinc-700' : 'bg-slate-300')
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-500 flex items-center justify-center ${notifOn ? 'translate-x-5' : 'translate-x-0'}`}>
                {notifOn ? <FiCheck className="w-2.5 h-2.5 text-indigo-600" /> : <FiX className="w-2.5 h-2.5 text-zinc-400" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className={`rounded-3xl border p-5 backdrop-blur-xl h-full flex flex-col ${panelClass}`}>
        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 p-1 px-3 rounded-lg w-fit ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>App Metadata</h4>
        <div className="space-y-2.5 flex-1">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'System Theme', value: isDark ? 'OLED Dark' : 'Glass Light' },
            { label: 'Unique ID', value: `${profileInitials}-${user.id || 'GO1'}` },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between rounded-xl p-3 border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-slate-50/80 border-slate-100'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${helperClass}`}>{item.label}</span>
              <span className={`text-xs font-black ${headingClass}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDangerTab = () => (
    <div className="space-y-6 animate-slide-up">
      <div className={`rounded-3xl border-2 p-6 md:p-8 backdrop-blur-xl ${isDark ? 'border-rose-500/20 bg-rose-500/5' : 'border-rose-200 bg-rose-50/30'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500">
            <FiAlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`font-bold text-sm ${headingClass}`}>Delete Account</h3>
            <p className={`text-xs ${isDark ? 'text-rose-400/60' : 'text-rose-500'}`}>Permanently delete your account and all data</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white/80 border-slate-200'}`}>
          <p className={`text-sm font-medium leading-relaxed ${helperClass}`}>
            Once you delete your account, there's no going back. All of your data including tasks, categories, preferences, and profile information will be permanently removed. Please be certain.
          </p>
        </div>

        <div className={`rounded-2xl border p-4 mb-6 ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <FiAlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <p className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>What will be deleted:</p>
              <ul className={`mt-2 space-y-1 text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                <li>• All tasks and categories</li>
                <li>• Profile data and photos</li>
                <li>• All preferences and settings</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-bold text-sm text-white transition-all bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 active:scale-95"
        >
          <FiTrash2 className="w-4 h-4" />
          <span>Delete My Account</span>
        </button>
      </div>
    </div>
  );

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-full pb-8">
      {renderSuccessPopup()}
      {renderPhotoModal()}
      {renderDeleteAccountModal()}
      {renderDeletePhotoModal()}
      {renderCropModal()}

      <input type="file" id="uploadPhotoInput" className="hidden" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={handleSelectPhoto} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 animate-slide-up">

        {/* Compact Profile Header */}
        <div className={`rounded-3xl border backdrop-blur-2xl relative overflow-hidden mb-8 ${panelClass}`}>
          {/* Subtle background gradient */}
          <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-30 ${isDark ? 'bg-indigo-600/20' : 'bg-blue-400/20'}`}></div>

          <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-6">
            {/* Back Button - Top Row */}
            <div className="flex justify-start">
              <button
                onClick={handleBack}
                className={`group inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                  isDark
                  ? 'border-zinc-700/50 bg-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-500'
                  : 'border-slate-200/60 bg-white/80 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <FaArrowLeft className="w-2.5 h-2.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>
            </div>

            {/* Profile Info Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
              {/* Avatar */}
              <button
                onClick={() => setActiveTab('profile')}
                className="relative shrink-0"
                type="button"
              >
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt="Profile"
                    className={`relative h-24 w-24 rounded-full object-cover border-[3px] shadow-2xl ${isDark ? 'border-zinc-800' : 'border-white'}`}
                  />
                ) : (
                  <div className={`relative h-24 w-24 rounded-full flex items-center justify-center text-3xl font-black border-[3px] shadow-2xl ${
                    isDark ? 'bg-zinc-800 text-indigo-400 border-zinc-700' : 'bg-slate-50 text-[#21569A] border-white'
                  }`}>
                    {profileInitials}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                  isDark ? 'bg-zinc-900 text-zinc-200 border-zinc-700' : 'bg-white text-slate-700 border-slate-200'
                }`}>
                  Profile
                </span>
              </button>

            {/* Name & Info */}
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${headingClass}`}>
                  {user.first_name} {user.last_name}
                </h2>
              </div>
              <div className={`mt-2 flex flex-wrap justify-center sm:justify-start items-center gap-3 text-[11px] font-bold ${helperClass}`}>
                <span className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                    <FaEnvelope className="w-2.5 h-2.5" />
                  </div>
                  {user.email}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-500/50 hidden sm:block"></span>
                <span className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                    <FaUserAlt className="w-2.5 h-2.5" />
                  </div>
                  @{user.username || user.first_name?.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
        <div className={`rounded-2xl border p-1.5 mb-6 backdrop-blur-xl flex gap-1 overflow-x-auto no-scrollbar ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white/60 border-slate-200/60'}`}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center border ${getTabColors(tab.color, isActive)}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'danger' && renderDangerTab()}
        </div>
      </div>
    </div>
  );
}

export default Account;
