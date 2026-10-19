import { useAuth } from "../../context/AuthContext";
import OrdsDataPanel from "../../components/OrdsDataPanel";

export default function SubjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
        <p className="mt-1 text-sm text-slate-600">
          Browse the subjects used for attendance, marks, and the timetable.
        </p>
      </div>
      <OrdsDataPanel
        title="Subjects"
        apiPath="/subjects/"
        emptyHint="Add a subject to make it available in timetable and marks forms."
        canCreate={isAdmin}
        canUpdate={isAdmin}
        canDelete={isAdmin}
      />
    </div>
  );
}
