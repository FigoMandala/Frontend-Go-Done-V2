 GoDone Frontend

Frontend aplikasi manajemen tugas **GoDone** yang dibangun dengan **React.js** dan **Vite**, dengan styling menggunakan **Tailwind CSS**.

## 📋 Table of Contents

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Folder](#struktur-folder)
- [Komponen Utama](#komponen-utama)
- [Routing](#routing)
- [API Integration](#api-integration)
- [Environment Variables](#environment-variables)
- [Build & Deployment](#build--deployment)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## ✨ Fitur Utama

- ✅ **Autentikasi** - Login & Register dengan JWT Token
- ✅ **Dashboard** - Overview statistik tugas & aktivitas
- ✅ **Manajemen Tugas** - CRUD tasks dengan priority & deadline
- ✅ **Kategori Tugas** - Organisasi task berdasarkan kategori
- ✅ **Kalender** - Visualisasi task dalam format kalender
- ✅ **Priority Filter** - Filter task berdasarkan prioritas
- ✅ **Edit Task** - Form untuk edit tugas yang sudah dibuat
- ✅ **Profile Management** - Edit profil & upload foto
- ✅ **Protected Routes** - Akses terbatas untuk user yang login
- ✅ **Toast Notifications** - Notifikasi real-time untuk user actions
- ✅ **Responsive Design** - Mobile-friendly dengan Tailwind CSS
- ✅ **Image Cropping** - Tool untuk crop profile picture sebelum upload

## 🛠 Tech Stack

| Technology | Version | Deskripsi |
|-----------|---------|-----------|
| **React** | ^18.3.1 | UI Framework |
| **Vite** | ^7.3.0 | Build tool & dev server |
| **React Router** | ^6.30.1 | Client-side routing |
| **Axios** | ^1.13.2 | HTTP client |
| **Tailwind CSS** | ^3.4.13 | Utility-first CSS framework |
| **React Calendar** | ^6.0.0 | Calendar component |
| **React Icons** | ^5.5.0 | Icon library |
| **React Hot Toast** | ^2.6.0 | Toast notifications |
| **React Easy Crop** | ^5.5.6 | Image cropping tool |
| **Canvas** | ^3.2.0 | Image processing |

## 📦 Prerequisites

Pastikan Anda memiliki:

- **Node.js** (v14 atau lebih tinggi)
- **npm** atau **yarn**
- **GoDone Backend** (running di `http://localhost:8000`)

Cek instalasi:
```bash
node --version
npm --version
```

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/username/godone-frontend.git
cd godone-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root folder:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## ⚙️ Konfigurasi

### API Base URL Configuration
Edit file `src/api/backend.js`:

```javascript
// src/api/backend.js akan membaca VITE_API_BASE_URL
// dan otomatis menambahkan /api jika belum ada.
```

### Tailwind CSS
Sudah dikonfigurasi di `tailwind.config.js` dengan:
- Dark mode support
- Custom colors
- Responsive breakpoints

## 🎯 Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### Build untuk Production
```bash
npm run build
```

Hasil build akan tersimpan di folder `dist/`

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 📁 Struktur Folder

```
frontend-Go-Done/
├── src/
│   ├── components/
│   │   ├── Login.jsx                # Halaman login
│   │   ├── register.jsx             # Halaman registrasi
│   │   ├── Dashboard.jsx            # Dashboard utama
│   │   ├── MyTask.jsx               # Daftar task user
│   │   ├── TaskPriorities.jsx       # Filter task by priority
│   │   ├── Calendar.jsx             # Kalender task
│   │   ├── Account.jsx              # Profile management
│   │   ├── EditTaskForm.jsx         # Form edit task
│   │   ├── CustomDropdown.jsx       # Dropdown component
│   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   ├── Topbar.jsx               # Top navigation bar
│   │   ├── MainLayout.jsx           # Layout dengan sidebar
│   │   ├── TopbarOnlyLayout.jsx     # Layout dengan topbar only
│   │   ├── ProtectedRoute.jsx       # Route protection wrapper
│   │   └── LoadingSpinner.jsx       # Loading indicator
│   ├── api/
│   │   └── backend.js               # Axios instance & configuration
│   ├── utils/
│   │   └── cropImage.js             # Image cropping utility
│   ├── assets/                      # Static assets
│   ├── App.css                      # Global styles
│   ├── index.css                    # Tailwind imports
│   └── main.jsx                     # Entry point
├── public/                          # Static files
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
├── postcss.config.js                # PostCSS configuration
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML template
├── .env.local                       # Environment variables (create manually)
├── vercel.json                      # Vercel deployment config
└── README.md                        # Documentation
```

## 🧩 Komponen Utama

### Authentication Components

#### Login.jsx
- Form login dengan email & password
- Validasi input
- Token storage di localStorage
- Redirect ke dashboard setelah berhasil login

#### register.jsx
- Form registrasi user baru
- Validasi password strength
- Email validation
- Redirect ke login setelah berhasil register

**Password Requirements:**
- Minimal 8 karakter
- Mengandung huruf besar (A-Z)
- Mengandung huruf kecil (a-z)
- Mengandung angka (0-9)

### Layout Components

#### MainLayout.jsx
Layout dengan Sidebar + Topbar
- Navigation sidebar (desktop)
- Top navigation bar
- Main content area
- Protected untuk authenticated users

#### TopbarOnlyLayout.jsx
Layout hanya dengan Topbar
- Untuk halaman yang tidak memerlukan sidebar
- Responsive design

### Page Components

#### Dashboard.jsx
Halaman utama dengan:
- Statistik overview
- Total tasks
- Completed tasks
- Pending tasks
- Recently added tasks

#### MyTask.jsx
Daftar semua tasks dengan fitur:
- CRUD operations
- Filter by category
- Sort by date/priority
- Mark as complete/incomplete
- Delete task

#### TaskPriorities.jsx
Filter & view tasks berdasarkan prioritas:
- High priority
- Medium priority
- Low priority
- Organize by due date

#### Calendar.jsx
Visualisasi task dalam kalender:
- Monthly view
- Highlight task dates
- Click untuk lihat task detail
- Show pending tasks

#### Account.jsx
Profile management dengan fitur:
- View profile information
- Edit profile (name, email)
- Upload profile picture
- Change password
- Image cropping sebelum upload

### Supporting Components

#### ProtectedRoute.jsx
Wrapper untuk protected routes:
```jsx
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

Mengecek:
- Token ada di localStorage
- User sudah authenticated
- Redirect ke login jika belum auth

#### EditTaskForm.jsx
Modal form untuk edit task dengan fields:
- Title
- Description
- Category
- Priority (low, medium, high)
- Due date
- Status

#### CustomDropdown.jsx
Reusable dropdown component untuk:
- Category selection
- Priority selection
- Status selection

#### Sidebar.jsx
Navigation sidebar dengan menu items:
- Dashboard
- My Tasks
- Priorities
- Calendar
- Account
- Logout

#### Topbar.jsx
Top navigation bar dengan:
- User info display
- Logout button
- Search (optional)
- Notification icon

#### LoadingSpinner.jsx
Loading indicator untuk:
- Data fetching
- Page transitions
- Form submission

## 🛣️ Routing

```jsx
/                       → Redirect ke /login
/login                  → Login page
/register               → Register page

/dashboard              → Dashboard (protected)
/my-tasks               → My Tasks (protected)
/priorities             → Task Priorities (protected)
/calendar               → Calendar view (protected)
/account                → Account/Profile (protected)
```

### Protected Routes
Routes yang memerlukan authentication:
- Dashboard
- My Tasks
- Task Priorities
- Calendar
- Account

User yang tidak authenticated akan di-redirect ke login page.

## 🔌 API Integration

### Axios Configuration
File `src/api/backend.js` menghandle:

**Base URL:**
```javascript
baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
```

**Request Interceptor:**
- Inject JWT token dari localStorage
- Add Authorization header: `Bearer <token>`

**Response Interceptor:**
- Handle 401/403 errors (Unauthorized)
- Global error handling

### Contoh API Call
```javascript
import backend from "./api/backend.js";

// GET
const getTasks = async () => {
  try {
    const response = await backend.get("/tasks");
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

// POST
const createTask = async (taskData) => {
  try {
    const response = await backend.post("/tasks", taskData);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

// PUT
const updateTask = async (taskId, taskData) => {
  try {
    const response = await backend.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

// DELETE
const deleteTask = async (taskId) => {
  try {
    const response = await backend.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
```

## 🔐 Authentication Flow

### Login Process
1. User input email & password
2. Submit ke `/auth/login`
3. Receive JWT token
4. Save token ke localStorage
5. Redirect ke dashboard
6. Token otomatis inject di setiap request

### Logout
1. Clear token dari localStorage
2. Redirect ke login page
3. All protected routes blocked

### Token Storage
```javascript
// Save token
localStorage.setItem("token", token);

// Get token
const token = localStorage.getItem("token");

// Remove token
localStorage.removeItem("token");
```

## 🎨 Styling

### Tailwind CSS
- Utility-first CSS framework
- Responsive design
- Custom configuration di `tailwind.config.js`

### Color Scheme
- Primary: Blue
- Success: Green
- Warning: Yellow
- Danger: Red
- Neutral: Gray

### Responsive Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## 📦 Environment Variables

Buat `.env.local`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=GoDone
VITE_APP_VERSION=1.0.0
```

**Akses di component:**
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## 🚢 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Output akan tersimpan di folder `dist/`

### Deploy ke Vercel
1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set Environment Variables di Vercel
4. Vercel akan auto-deploy setiap push ke main branch

File `vercel.json` sudah dikonfigurasi untuk Vercel deployment.

### Deploy ke Netlify
```bash
npm run build
# Upload dist/ folder ke Netlify
```

### Deploy ke GitHub Pages
```bash
npm run build
# Push dist/ folder ke gh-pages branch
```

## 🔧 Development Tips

### Hot Module Replacement (HMR)
Vite support HMR otomatis - changes akan reflect instantly saat development.

### React DevTools
Install extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/)

### Network Debugging
Gunakan browser DevTools Network tab untuk monitor API calls.

## 🐛 Troubleshooting

### Error: "Cannot find module 'react'"
```bash
npm install
```

### Error: "CORS error dari backend"
- Pastikan backend running
- Check backend CORS configuration
- Verify `baseURL` di `src/api/backend.js`

### Error: "Token not found"
- Login kembali untuk get new token
- Clear localStorage: `localStorage.clear()`
- Check browser console untuk error details

### Error: "Vite: Failed to resolve"
```bash
# Clear node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install
```

### Slow Performance
- Check Network tab di DevTools
- Optimize image size
- Use React.memo untuk prevent unnecessary re-renders
- Check untuk unused dependencies

## 📝 Code Style

### ESLint
Project menggunakan ESLint untuk code quality:

```bash
npm run lint
```

### Formatting
Recommended text editor: VS Code dengan extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License - lihat file [LICENSE](../LICENSE) untuk detail.

## 🤝 Kontribusi

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Support

Jika ada pertanyaan atau issue, silakan:
- Buka GitHub Issue
- Hubungi tim development
- Email: support@godone.com

---

**Dibuat dengan ❤️ oleh Tim GoDone**
