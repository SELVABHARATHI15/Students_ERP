# Student ERP

React + Django REST Framework application that proxies Oracle ORDS APIs for college ERP modules (students, staff, attendance, marks, announcements).

Handover reference: `Student_ERP_Devin_Handover.md`  
API inventory: `docs/ORDS_API_INVENTORY.md`

## Prerequisites

- Python 3.11+
- Node.js 18+

## Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo_users
python manage.py runserver
```

Demo users (local only):

| Username | Password   | Role    |
|----------|------------|---------|
| admin    | admin123   | Admin   |
| teacher  | teacher123 | Staff   |
| student  | student123 | Student |

## Frontend setup

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:5173. The frontend sends requests to `/api`; Vite forwards them to Django using `VITE_BACKEND_URL` from `frontend/.env.local` (defaults to `http://127.0.0.1:8000`). Keep `VITE_API_BASE_URL=/api` for the development proxy. In production, serve the frontend and backend on the same origin or configure an HTTPS reverse proxy to `/api`; do not put Apex credentials in frontend environment variables.

Run `npm run build` and `npm run lint` from `frontend` to verify the frontend.

## Connect ORDS

1. Copy the default relative paths from `backend/.env.example` or override them in `backend/.env` if your ORDS module paths differ.
2. The UI calls Django, which proxies requests to ORDS; do not put ORDS credentials in frontend configuration.
3. Update `docs/ORDS_API_INVENTORY.md` with the exact request bodies and example responses for your handlers.

Students, staff, attendance, marks, announcements, subjects, and timetable use Django collection/item API routes backed by ORDS. The proxy exposes collection GET/POST and item PUT/DELETE routes, matching the documented handlers; it does not expose item GET or PATCH. The frontend provides guided forms with labels, hints, dropdowns for related student/subject/staff records, validation, and clear save/error feedback. New student/staff login passwords are hashed by Django before being sent to ORDS; plain text passwords are never forwarded. Verify ORDS accepts Django's hash format before using account creation in production.

The admin-only `/users` page explains what must be verified before `APP_USERS` can be connected. Although `/api/users/` routes exist, the upstream ORDS path is not in the catalog and remains unconfigured until verified. User responses strip password and other authentication secrets. Keep authentication in Django.

## Tests

```powershell
cd backend
python manage.py test
```

```powershell
cd frontend
npm run build
```

## Architecture

- **React (Vite + TypeScript + Tailwind)** → **Django REST** → **ORDS** → Oracle tables  
- Django uses SQLite only for sessions, users, and roles until `APP_USERS` is documented.  
- No Flask; no direct Oracle writes from Django unless explicitly approved later.
# Students_ERP
