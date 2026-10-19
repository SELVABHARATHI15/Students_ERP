import { useAuth } from "../../context/AuthContext";
import OrdsDataPanel from "../../components/OrdsDataPanel";

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="mt-1 text-sm text-slate-600">
          Browse student records. Administrators can add, edit, and remove records.
        </p>
      </div>
      <OrdsDataPanel
        title="Students"
        apiPath="/students/"
        emptyHint="No student records are available yet."
        canCreate={isAdmin}
        canUpdate={isAdmin}
        canDelete={isAdmin}
      />
    </div>
  );
}
