import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { getApiErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/user";

const navByRole: Record<UserRole, { to: string; label: string }[]> = {
  admin: [
    { to: "/", label: "Dashboard" },
    { to: "/students", label: "Students" },
    { to: "/staff", label: "Staff" },
    { to: "/attendance", label: "Attendance" },
    { to: "/marks", label: "Marks" },
    { to: "/announcements", label: "Announcements" },
    { to: "/subjects", label: "Subjects" },
    { to: "/timetable", label: "Timetable" },
    { to: "/users", label: "User management" },
  ],
  staff: [
    { to: "/", label: "Dashboard" },
    { to: "/students", label: "Students" },
    { to: "/attendance", label: "Attendance" },
    { to: "/marks", label: "Marks" },
    { to: "/announcements", label: "Announcements" },
    { to: "/subjects", label: "Subjects" },
    { to: "/timetable", label: "Timetable" },
  ],
  student: [
    { to: "/", label: "Dashboard" },
    { to: "/announcements", label: "Announcements" },
    { to: "/subjects", label: "Subjects" },
    { to: "/timetable", label: "Timetable" },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const links = user ? navByRole[user.role] : [];

  async function onLogout() {
    setLogoutError(null);
    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Student ERP
          </p>
          <p className="text-sm text-slate-600">{user?.username}</p>
          <p className="text-xs capitalize text-slate-400">{user?.role}</p>
        </div>
        <nav aria-label="Main navigation" className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:block md:space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-8 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
        {logoutError && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {logoutError}
          </p>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
