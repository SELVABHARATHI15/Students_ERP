import OrdsDataPanel from "../../components/OrdsDataPanel";
import { useAuth } from "../../context/AuthContext";

export default function MarksPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "staff";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marks</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add or update examination results. Marks must not exceed the maximum marks.
        </p>
      </div>
      <OrdsDataPanel
        title="Marks"
        apiPath="/marks/"
        emptyHint="When marks are entered, they will appear here."
        canCreate={canManage}
        canUpdate={canManage}
        canDelete={canManage}
      />
    </div>
  );
}
