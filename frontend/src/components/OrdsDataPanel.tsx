import { useEffect, useState, type FormEvent } from "react";

import { getApiErrorMessage } from "../api/errors";
import { formFieldsByPath, type FormField } from "../api/formFields";
import { deleteOrds, fetchOrdsList, postOrds, putOrds } from "../api/modules";

type RecordRow = Record<string, unknown>;
type LookupOption = { value: string; label: string };
const EMPTY_FORM_FIELDS: FormField[] = [];

function isRecord(value: unknown): value is RecordRow {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractRows(data: unknown): RecordRow[] {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (isRecord(data) && Array.isArray(data.items)) return data.items.filter(isRecord);
  if (
    isRecord(data) &&
    Object.entries(data).some(
      ([key, value]) =>
        key.toLowerCase().endsWith("_id") &&
        (typeof value === "string" || typeof value === "number"),
    )
  ) {
    return [data];
  }
  return [];
}

function getIdentifier(row: RecordRow): string | number | null {
  const key =
    Object.keys(row).find((name) => name.toLowerCase() === "id") ??
    Object.keys(row).find((name) => name.toLowerCase().endsWith("_id"));
  const value = key ? row[key] : null;
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function getEditableFields(row: RecordRow): RecordRow {
  const identifierKey =
    Object.keys(row).find((name) => name.toLowerCase() === "id") ??
    Object.keys(row).find((name) => name.toLowerCase().endsWith("_id"));
  if (!identifierKey) return row;
  const editableFields = { ...row };
  delete editableFields[identifierKey];
  return editableFields;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function inputValue(value: unknown, field: FormField): string {
  if (value === null || value === undefined) return "";
  const formatted = String(value);
  return field.type === "date" ? formatted.slice(0, 10) : formatted;
}

export default function OrdsDataPanel({
  title,
  apiPath,
  description,
  emptyHint,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}: {
  title: string;
  apiPath: string;
  description?: string;
  emptyHint?: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const fields = formFieldsByPath[apiPath] ?? EMPTY_FORM_FIELDS;
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [editorError, setEditorError] = useState<string | null>(null);
  const [lookupOptions, setLookupOptions] = useState<Record<string, LookupOption[]>>({});
  const [lookupStatus, setLookupStatus] = useState<Record<string, "loading" | "ready" | "error">>({});
  const [lookupRetryKey, setLookupRetryKey] = useState(0);
  const isFormOpen = isCreating || editingId !== null;
  const visibleFields = fields.filter((field) => isCreating || !field.createOnly);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchOrdsList(apiPath)
      .then((data) => {
        if (active) setRows(extractRows(data));
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiPath, refreshKey]);

  useEffect(() => {
    const lookupFields = fields.filter((field) => field.lookup);
    if (!isFormOpen || lookupFields.length === 0) {
      setLookupOptions({});
      setLookupStatus({});
      return;
    }

    let active = true;
    setLookupStatus(
      Object.fromEntries(lookupFields.map((field) => [field.name, "loading"])),
    );
    setLookupOptions({});

    async function loadLookups() {
      await Promise.all(
        lookupFields.map(async (field) => {
          const lookup = field.lookup;
          if (!lookup) return;
          try {
            const rows = extractRows(await fetchOrdsList(lookup.path));
            const options = rows.flatMap((row) => {
              const idKey = Object.keys(row).find(
                (key) => key.toLowerCase() === lookup.idKey.toLowerCase(),
              );
              const id = idKey ? row[idKey] : undefined;
              if (typeof id !== "string" && typeof id !== "number") return [];
              const label = lookup.labelKeys
                .map((labelKey) => {
                  const key = Object.keys(row).find(
                    (candidate) => candidate.toLowerCase() === labelKey.toLowerCase(),
                  );
                  return key ? row[key] : undefined;
                })
                .filter((value): value is string | number =>
                  typeof value === "string" || typeof value === "number",
                )
                .join(" · ");
              return [{ value: String(id), label: label || `${field.label} ${id}` }];
            });
            if (active) {
              setLookupOptions((current) => ({ ...current, [field.name]: options }));
              setLookupStatus((current) => ({ ...current, [field.name]: "ready" }));
            }
          } catch {
            if (active) {
              setLookupStatus((current) => ({ ...current, [field.name]: "error" }));
            }
          }
        }),
      );
    }

    void loadLookups();
    return () => {
      active = false;
    };
  }, [fields, isFormOpen, lookupRetryKey]);

  function resetFormValues(row?: RecordRow) {
    setFormValues(
      Object.fromEntries(fields.map((field) => [field.name, inputValue(row?.[field.name], field)])),
    );
  }

  function openCreateForm() {
    setEditingId(null);
    resetFormValues();
    setEditorError(null);
    setNotice(null);
    setIsCreating(true);
  }

  function openEditForm(row: RecordRow) {
    const id = getIdentifier(row);
    if (id === null) return;
    setEditingId(id);
    resetFormValues(getEditableFields(row));
    setEditorError(null);
    setNotice(null);
    setIsCreating(false);
  }

  function closeForm() {
    setEditingId(null);
    setIsCreating(false);
    setEditorError(null);
    setFormValues({});
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError(null);
    setNotice(null);
    const confirmationField = visibleFields.find((field) => field.confirmFor);
    if (
      confirmationField &&
      formValues[confirmationField.name] !== formValues[confirmationField.confirmFor ?? ""]
    ) {
      setEditorError("The password confirmation does not match.");
      return;
    }
    const body: Record<string, unknown> = {};
    for (const field of visibleFields) {
      if (field.confirmFor) continue;
      const value = formValues[field.name]?.trim() ?? "";
      if (!value) continue;
      if (field.type === "number" || field.lookup) {
        const number = Number(value);
        if (!Number.isFinite(number) || (field.lookup && number <= 0)) {
          setEditorError(`${field.label} must be a valid number.`);
          return;
        }
        body[field.name] = number;
      } else {
        body[field.name] = value;
      }
    }
    if (
      apiPath === "/marks/" &&
      Number(body.marks_obtained) > Number(body.max_marks)
    ) {
      setEditorError("Marks obtained cannot be greater than the maximum marks.");
      return;
    }
    if (
      apiPath === "/timetable/" &&
      String(body.start_time) >= String(body.end_time)
    ) {
      setEditorError("The end time must be later than the start time.");
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        await postOrds(apiPath, body);
        setNotice(`${title} record added.`);
      } else if (editingId !== null) {
        await putOrds(`${apiPath}${encodeURIComponent(String(editingId))}/`, body);
        setNotice(`${title} record updated.`);
      }
      closeForm();
      setRefreshKey((key) => key + 1);
    } catch (requestError: unknown) {
      setEditorError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(id: string | number) {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record? This action cannot be undone.`)) return;
    setError(null);
    setNotice(null);
    setDeletingId(id);
    try {
      await deleteOrds(`${apiPath}${encodeURIComponent(String(id))}/`);
      setNotice(`${title} record deleted.`);
      setRefreshKey((key) => key + 1);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  const columns =
    rows.length > 0
      ? Object.keys(rows[0]).filter(
          (column) => !/(password|token|secret|credential)/i.test(column),
        )
      : [];
  const showActions = canUpdate || canDelete;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreateForm}
            className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Add {title.toLowerCase().replace(/s$/, "")}
          </button>
        )}
      </header>
      <div className="space-y-4 p-4">
        {(isCreating || editingId !== null) && (
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5"
          >
            <div>
              <h3 className="font-semibold text-slate-900">
                {isCreating ? `Add ${title.toLowerCase().replace(/s$/, "")}` : `Edit ${title.toLowerCase().replace(/s$/, "")}`}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Fill in the details below. Fields marked required must be completed.
              </p>
            </div>
            {visibleFields.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleFields.map((field) => (
                  <label
                    key={field.name}
                    className={`block text-sm font-medium text-slate-700 ${
                      field.type === "textarea" ? "sm:col-span-2" : ""
                    }`}
                  >
                    {field.label}
                    {field.required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
                    {field.type === "select" ? (
                      <>
                        <select
                          name={field.name}
                          value={formValues[field.name] ?? ""}
                          onChange={(event) =>
                            setFormValues((current) => ({
                              ...current,
                              [field.name]: event.target.value,
                            }))
                          }
                          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                          disabled={
                            saving ||
                            (Boolean(field.lookup) && lookupStatus[field.name] !== "ready")
                          }
                          required={field.required}
                        >
                          <option value="">
                            {lookupStatus[field.name] === "loading"
                              ? "Loading choices…"
                              : lookupStatus[field.name] === "error"
                                ? "Could not load choices"
                                : field.lookup && lookupOptions[field.name]?.length === 0
                                  ? "No choices available"
                                  : `Choose ${field.label.toLowerCase()}`}
                          </option>
                          {(field.lookup
                            ? lookupOptions[field.name] ?? []
                            : field.options ?? []
                          ).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {field.lookup && lookupStatus[field.name] === "error" && (
                          <span className="mt-1 block text-xs font-normal text-red-700">
                            Could not load available {field.label.toLowerCase()} records.{" "}
                            <button
                              type="button"
                              className="font-medium underline"
                              onClick={() => setLookupRetryKey((key) => key + 1)}
                            >
                              Try again
                            </button>
                          </span>
                        )}
                        {field.lookup &&
                          lookupStatus[field.name] === "ready" &&
                          lookupOptions[field.name]?.length === 0 && (
                            <span className="mt-1 block text-xs font-normal text-amber-800">
                              Add a {field.label.toLowerCase()} record before continuing.
                            </span>
                          )}
                      </>
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        value={formValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="mt-1 block min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        disabled={saving}
                        required={field.required}
                      />
                    ) : (
                      <input
                        name={field.name}
                        type={field.type ?? "text"}
                        value={formValues[field.name] ?? ""}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        disabled={saving}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        minLength={field.minLength}
                        inputMode={field.type === "number" ? "decimal" : undefined}
                        autoComplete={field.type === "password" ? "new-password" : undefined}
                      />
                    )}
                    {field.hint && <span className="mt-1 block text-xs font-normal text-slate-500">{field.hint}</span>}
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                A guided form is not configured for this record type yet. Contact your administrator.
              </p>
            )}
            {editorError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {editorError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || visibleFields.length === 0}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : isCreating ? "Save record" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {notice && (
          <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}
        {loading && (
          <div role="status" className="flex items-center gap-2 py-4 text-sm text-slate-600">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            Loading {title.toLowerCase()}…
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Could not load {title.toLowerCase()}</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="mt-3 font-medium underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="font-medium text-slate-800">No {title.toLowerCase()} found</p>
            <p className="mt-1 text-sm text-slate-600">
              {emptyHint ?? "There are no records to show yet."}
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Add the first record
              </button>
            )}
          </div>
        )}
        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <p className="mb-2 text-sm text-slate-600">
              {rows.length} {rows.length === 1 ? "record" : "records"}
            </p>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  {columns.map((column) => (
                    <th key={column} scope="col" className="px-3 py-3 font-semibold">
                      {formatLabel(column)}
                    </th>
                  ))}
                  {showActions && <th className="px-2 py-2 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, index) => {
                  const id = getIdentifier(row);
                  return (
                    <tr key={id ?? index} className="border-b border-slate-100 even:bg-slate-50/50">
                      {columns.map((column) => (
                        <td key={column} className="max-w-xs whitespace-pre-wrap break-words px-3 py-3 text-slate-800">
                          {formatValue(row[column])}
                        </td>
                      ))}
                      {showActions && (
                        <td className="whitespace-nowrap px-2 py-2">
                          {id === null ? (
                            <span className="text-slate-500">No record ID</span>
                          ) : (
                            <div className="flex gap-3">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => openEditForm(row)}
                                  className="font-medium text-brand-700 underline-offset-2 hover:underline"
                                >
                                  Edit
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => removeRecord(id)}
                                  disabled={deletingId === id}
                                  className="font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
                                >
                                  {deletingId === id ? "Deleting…" : "Delete"}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="mt-3 text-xs text-slate-500">
                Showing the first 50 records. Refine the list or use ORDS pagination to view more.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
