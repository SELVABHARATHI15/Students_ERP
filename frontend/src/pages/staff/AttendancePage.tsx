import { useAuth } from "../../context/AuthContext";
import OrdsDataPanel from "../../components/OrdsDataPanel";

export default function AttendancePage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "staff";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Record and review attendance. Enter the student, subject, and staff IDs from the ERP records.
        </p>
      </div>
      <OrdsDataPanel
        title="Attendance"
        apiPath="/attendance/"
        description="Attendance is unique for each student, subject, and date."
        emptyHint="When attendance is recorded, it will appear here."
        canCreate={canManage}
        canUpdate={canManage}
        canDelete={canManage}
      />
    </div>
  );
}
