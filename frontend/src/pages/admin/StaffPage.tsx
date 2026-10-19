import OrdsDataPanel from "../../components/OrdsDataPanel";

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage staff profiles and their ERP identifiers.
        </p>
      </div>
      <OrdsDataPanel
        title="Staff"
        apiPath="/staff/"
        emptyHint="No staff records are available yet."
        canCreate
        canUpdate
        canDelete
      />
    </div>
  );
}
