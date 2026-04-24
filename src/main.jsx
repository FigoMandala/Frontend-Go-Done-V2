import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";
import Login from "./components/Login.jsx";
import Register from "./components/register.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import Dashboard from "./components/Dashboard.jsx";
import TaskPriorities from "./components/TaskPriorities.jsx";
import MyTask from "./components/MyTask.jsx";
import Calendar from "./components/Calendar.jsx";
import PomodoroTimer from "./components/PomodoroTimer.jsx";
import MainLayout from "./components/MainLayout.jsx";
import TopbarOnlyLayout from "./components/TopbarOnlyLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Account from "./components/Account.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
        
      {/* Dashboard Routes with Layout - Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-task"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyTask />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/priorities"
        element={
          <ProtectedRoute>
            <MainLayout>
              <TaskPriorities />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Calendar />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pomodoro"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PomodoroTimer />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Account page - full width under Topbar only (no Sidebar) */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <TopbarOnlyLayout>
              <Account />
            </TopbarOnlyLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);
