import { useEffect, useState } from "react";

import { getApiErrorMessage } from "../api/errors";
import { fetchDashboardSummary } from "../api/modules";

type ModuleSummary = {
  count?: number | null;
  status: string;
  error?: string;
};

const moduleLabels: Record<string, string> = {
  students: "Students",
  staff: "Staff",
  attendance: "Attendance",
  marks: "Marks",
  announcements: "Announcements",
  subjects: "Subjects",
  timetable: "Timetable",
};

function parseModuleSummaries(value: unknown): Record<string, ModuleSummary> {
  if (!value || typeof value !== "object" || !("modules" in value)) return {};
  const modules = (value as { modules: unknown }).modules;
  if (!modules || typeof modules !== "object") return {};
  return Object.fromEntries(
    Object.entries(modules).flatMap(([key, item]) => {
      if (!item || typeof item !== "object" || !("status" in item)) return [];
      const summary = item as { count?: unknown; status: unknown; error?: unknown };
      if (typeof summary.status !== "string") return [];
      return [[key, {
        status: summary.status,
        count: typeof summary.count === "number" ? summary.count : null,
        error: typeof summary.error === "string" ? summary.error : undefined,
      }]];
    }),
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardSummary()
      .then(setSummary)
      .catch((requestError: unknown) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const modules = parseModuleSummaries(summary);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Live overview from the ERP services.</p>
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(moduleLabels).map(([key, label]) => {
            const module = modules[key];
            const connected = module?.status === "ok";
            return (
              <section
                key={key}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-slate-900">{label}</h2>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      connected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {connected ? "Connected" : module?.status ?? "Unavailable"}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {module?.count ?? "—"}
                </p>
                <p className="mt-1 text-sm text-slate-500">records</p>
                {module?.error && (
                  <p className="mt-3 text-xs text-red-700">{module.error}</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
