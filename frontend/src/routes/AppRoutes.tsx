import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import StudentsPage from "../pages/admin/StudentsPage";
import StaffPage from "../pages/admin/StaffPage";
import AttendancePage from "../pages/staff/AttendancePage";
import MarksPage from "../pages/staff/MarksPage";
import AnnouncementsPage from "../pages/AnnouncementsPage";
import SubjectsPage from "../pages/admin/SubjectsPage";
import TimetablePage from "../pages/TimetablePage";
import UsersPage from "../pages/admin/UsersPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  const { user, loading, sessionError, refresh } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (sessionError && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <section className="max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Unable to connect to the ERP backend
          </h1>
          <p role="alert" className="mt-2 text-sm text-red-700">
            {sessionError}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="students"
          element={
            <ProtectedRoute roles={["admin", "staff"]}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff"
          element={
            <ProtectedRoute roles={["admin"]}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <ProtectedRoute roles={["admin", "staff"]}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="marks"
          element={
            <ProtectedRoute roles={["admin", "staff"]}>
              <MarksPage />
            </ProtectedRoute>
          }
        />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
