import { useAuth } from "../context/AuthContext";
import OrdsDataPanel from "../components/OrdsDataPanel";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
        <p className="mt-1 text-sm text-slate-600">
          Important updates from your college. Administrators can publish and manage announcements.
        </p>
      </div>
      <OrdsDataPanel
        title="Announcements"
        apiPath="/announcements/"
        emptyHint="There are no announcements at the moment."
        canCreate={isAdmin}
        canUpdate={isAdmin}
        canDelete={isAdmin}
      />
    </div>
  );
}
