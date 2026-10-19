export default function UsersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage ERP login accounts securely.
        </p>
      </div>
      <section
        className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
        role="status"
      >
        <h2 className="font-semibold text-amber-950">Waiting for the APP_USERS API details</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          The database table contains password hashes, but the ORDS catalog does not list a users
          endpoint. User creation and editing are intentionally unavailable until the real endpoint
          and its password-handling rules are confirmed. This prevents accidentally exposing or
          storing passwords incorrectly.
        </p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">What to verify in APEX</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
            <li>The exact collection and item URL paths for APP_USERS.</li>
            <li>Which methods are enabled: GET, POST, PUT, and DELETE.</li>
            <li>How a new password is securely hashed before Oracle stores it.</li>
            <li>That responses never include PASSWORD_HASH or other secrets.</li>
          </ul>
        </div>
        <p className="mt-4 text-xs text-amber-900">
          Do not paste passwords or password hashes into this page. Once the API contract is
          verified, user management can be connected with safe form fields.
        </p>
      </section>
    </div>
  );
}
