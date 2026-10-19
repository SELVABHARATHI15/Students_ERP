import { useAuth } from "../context/AuthContext";
import OrdsDataPanel from "../components/OrdsDataPanel";

export default function TimetablePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
        <p className="mt-1 text-sm text-slate-600">
          View class schedules. Administrators can add, edit, or remove timetable entries.
        </p>
      </div>
      <OrdsDataPanel
        title="Timetable"
        apiPath="/timetable/"
        emptyHint="No timetable entries have been added yet."
        canCreate={isAdmin}
        canUpdate={isAdmin}
        canDelete={isAdmin}
      />
    </div>
  );
}
