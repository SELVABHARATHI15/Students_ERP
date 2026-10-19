`# Student ERP — Devin AI Handover, API Inventory, and Master Prompt

## Purpose

Use this document as the main handover file for Devin AI. It describes the current Student ERP architecture, the APIs confirmed in the project conversation, the database tables known so far, and the instructions Devin must follow.

**Important accuracy note:** The project conversation confirms which API operations have been created/tested, but it does not contain the exact REST endpoint paths, full request bodies, or every response schema. Do not guess these details. Devin must inspect the ORDS API catalog, available project files, and Postman collection, then fill in the verified endpoint inventory.

---

# Part A — Current Project Context

## 1. Technology stack

- Frontend: React
- Backend: Django + Django REST Framework
- Database: Oracle Database
- Database/API tooling: Oracle APEX and Oracle REST Data Services (ORDS)
- API testing: Postman
- AI features: planned for a later phase

## 2. Existing ORDS URLs

ORDS base URL:

`https://oracleapex.com/ords/selva_space/`

Student ERP API catalog URL:

`https://oracleapex.com/ords/selva_space/open-api-catalog/student-erp/`

These URLs are project context. Devin must verify that they are reachable from its environment and inspect the available API definitions. If the catalog cannot be accessed, ask for the exported OpenAPI specification or Postman collection. Do not claim to have verified endpoints that were not actually inspected.

## 3. API operations confirmed by the project conversation

| Module | Method | Status based on project handover | Exact path |
|---|---|---|---|
| Students | GET | Created and tested | Must verify in ORDS catalog/Postman |
| Staff | GET | Created and tested | Must verify in ORDS catalog/Postman |
| Attendance | GET | Created and tested | Must verify in ORDS catalog/Postman |
| Attendance | POST | Created and tested | Must verify in ORDS catalog/Postman |
| Marks | GET/POST/PUT/PATCH/DELETE | Not confirmed as a complete set | Inspect catalog and Postman |
| Announcements | GET/POST/PUT/PATCH/DELETE | Not confirmed as a complete set | Inspect catalog and Postman |
| APP_USERS | GET/POST/PUT/PATCH/DELETE | Not confirmed as a complete set | Inspect catalog and Postman |

**Do not invent endpoint paths.** The exact paths are intentionally marked “Must verify” because they were not included in the available handover messages.

## 4. Known Oracle tables

The project has identified these tables in the Oracle schema:

- `ANNOUNCEMENTS`
- `APP_USERS`
- `ATTENDANCE`
- `MARKS`
- `STUDENTS`
- `STAFF`

Other Oracle/APEX support tables may also exist. Do not treat support tables as ERP business tables without checking.

### Attendance fields seen in the project

The project conversation showed the following attendance columns:

- `ATTENDANCE_ID`
- `STUDENT_ID`
- `SUBJECT_ID`
- `ATTENDANCE_DATE`
- `STATUS`

A sample record had attendance ID `41`, student ID `1`, subject ID `1`, and date `10/14/2026`. A later query for ID 41 returned “no data found”, so Devin must not assume that sample row currently exists. Check the active schema, workspace, endpoint filters, and transaction state if needed.

### Announcement fields seen in the project

The project conversation showed these columns:

- `ANNOUNCEMENT_ID`
- `TITLE`
- `MESSAGE`
- `CREATED_BY_USER_ID`
- `CREATED_AT`

A sample announcement had ID `2`, title `Internal Examination - Updated`, message `The internal examination schedule will be published shortly.`, and creator user ID `61`. This is an example from prior testing, not a guarantee that the row still exists.

### APP_USERS

The project specifically needs the `APP_USERS` structure and relationship to `STUDENTS` and `STAFF` to be inspected. Do not assume that `APP_USERS` contains password hashes, authentication fields, or a particular role format until the actual table structure is checked.

---

# Part B — Instructions for Devin to Discover and Document Every API

Before building the application, inspect the available workspace and produce a verified API inventory.

For every endpoint, document:

1. Module and purpose
2. HTTP method
3. Full endpoint path (relative to the ORDS base URL)
4. Full URL
5. Authentication requirements, if any
6. Path parameters and query parameters
7. Required request headers
8. Example request body
9. Example successful response
10. Error response formats/status codes
11. Whether it was actually tested in Postman
12. CRUD operation supported
13. Missing handlers or unresolved questions

At minimum, inspect and document endpoints for:

- Students
- Staff
- Attendance
- Marks
- Announcements
- APP_USERS

Use the ORDS API catalog and any existing Postman collections or saved requests. If an endpoint is inaccessible or undocumented, label it **UNVERIFIED** and ask for the necessary information. Do not manufacture an endpoint or claim it was tested.

Create a file in the project named `docs/ORDS_API_INVENTORY.md` containing the verified endpoint table and examples. If the exact API details are unavailable, leave clear TODOs rather than guesses.

---

# Part C — Master Prompt to Give Devin AI

Copy the following prompt into Devin after adding this document to the project workspace.

---

## MASTER PROMPT: Build Student ERP with React + Django + Oracle ORDS

Act as a senior full-stack software engineer and architect. Build a secure, modular, maintainable Student ERP web application using React on the frontend and Django REST Framework on the backend.

### 1. Read the project handover first

Read `Student_ERP_Devin_Handover.md` completely before changing files.

Inspect the existing repository, configuration, documentation, API definitions, and Postman collections. Preserve existing work. This is an ongoing project, not a greenfield database rebuild.

The backend is changing from Flask to **Django + Django REST Framework**. Do not use Flask in the new backend.

### 2. Existing architecture and API source

Frontend:
- React
- Prefer TypeScript with Vite
- React Router
- Axios
- Tailwind CSS or an existing styling system already present in the repository

Backend:
- Python Django
- Django REST Framework
- Environment-based configuration
- `django-cors-headers` with restricted origins
- Automated tests

Database and existing API layer:
- Oracle Database
- Oracle APEX
- ORDS REST APIs
- Postman for API verification

ORDS base URL:
`https://oracleapex.com/ords/selva_space/`

API catalog:
`https://oracleapex.com/ords/selva_space/open-api-catalog/student-erp/`

These URLs are not proof that all endpoints are available. Verify access and inspect the catalog. If unavailable, request the OpenAPI export or Postman collection.

### 3. First task: inventory, do not immediately rewrite

Start by:
1. Listing the current project files and identifying any existing React, Flask, Django, or configuration code.
2. Reading this handover.
3. Inspecting the ORDS catalog, OpenAPI definition, and Postman collection if available.
4. Verifying exact endpoint paths, methods, request bodies, response structures, and error responses.
5. Identifying the real Oracle table structures and relationships where access is available.
6. Creating `docs/ORDS_API_INVENTORY.md`.
7. Reporting confirmed facts, missing details, and a phased implementation plan.

The handover confirms these operations were created and tested: Student GET, Staff GET, Attendance GET, and Attendance POST. The exact paths are not present in the handover, so discover them from the source material. Do not guess them.

The known business tables are `STUDENTS`, `STAFF`, `ATTENDANCE`, `MARKS`, `ANNOUNCEMENTS`, and `APP_USERS`. Verify actual columns and constraints before coding.

### 4. Architecture decision

Use React as the frontend and Django REST Framework as the application's backend/API layer. Prefer Django to call existing ORDS endpoints through a dedicated service layer initially, while React calls Django.

Keep the ORDS base URL in environment configuration, for example `ORDS_BASE_URL`. Never hardcode credentials or secrets.

Do not duplicate writes through both ORDS and direct Oracle connections. Do not recreate or migrate existing Oracle tables without explicit approval. If direct Oracle access is proposed, explain why and verify Django/Oracle compatibility before implementing it.

Document which system owns each operation. Reuse working ORDS endpoints and add missing handlers only after verifying the API contract and authorization requirements.

### 5. User roles

The application has three primary roles:

**Admin**
- Dashboard and actual summary metrics
- Student and staff management
- User and role management
- Attendance and marks oversight
- Announcements management
- Reports and filters
- Administrative settings where supported

**Teacher/Staff**
- Staff profile
- Student lists permitted to the staff member
- Attendance entry and history
- Marks entry and history
- Subject/class assignments only if supported by the schema
- Announcements and relevant reports

**Student**
- Own profile
- Own attendance history and percentage
- Own marks and examination results
- Announcements
- Academic summary

Do not invent class, course, subject, semester, or examination relationships. Use only verified schema fields and API capabilities.

### 6. Authentication and authorization

Inspect `APP_USERS` and its relationships before selecting the authentication design. Do not assume it contains passwords or hashes.

Use Django authentication and permission facilities where appropriate. Decide whether Django will own login or securely delegate to an existing authentication service. Avoid two conflicting user systems.

Implement:
- Login and logout
- Secure password handling if Django owns authentication
- Role-based permissions
- Protected frontend routes
- Backend authorization on every protected endpoint
- User activation/deactivation if supported
- Safe error handling

Students must only access their own records. Staff must only manage records they are authorized to access. Never rely solely on frontend route guards.

### 7. Modules

Implement modules incrementally:

1. Students
2. Staff
3. Attendance
4. Marks
5. Announcements
6. APP_USERS/user management
7. Reports and dashboard summaries

For each module, implement the supported operations, form validation, search/filtering, loading states, empty states, error messages, and tests.

Do not show create, update, or delete controls as working unless the backend operation actually exists and has been verified. If a handler is missing, document the gap and implement it through the approved API/data-access architecture.

### 8. Attendance details

The handover shows these attendance fields, subject to schema verification:
- `ATTENDANCE_ID`
- `STUDENT_ID`
- `SUBJECT_ID`
- `ATTENDANCE_DATE`
- `STATUS`

Reuse the existing GET and POST endpoints after verifying their contracts. Check whether update/delete handlers exist before implementing those UI actions. Calculate attendance percentages only from an appropriate and complete dataset, and document the calculation.

### 9. Announcements details

The handover shows these fields, subject to schema verification:
- `ANNOUNCEMENT_ID`
- `TITLE`
- `MESSAGE`
- `CREATED_BY_USER_ID`
- `CREATED_AT`

Implement authorized listing and management based on actual supported endpoints. Never expose sensitive user information.

### 10. Frontend quality

Build a professional, responsive college ERP interface:
- Role-specific sidebar and navigation
- Dashboard cards connected to real API data
- Tables with search, filters, and pagination where supported
- Reusable forms and validation
- Confirmation for destructive actions
- Loading, empty, success, and error states
- Accessible labels and keyboard navigation
- Consistent typography, spacing, and design tokens

Do not use fake production statistics. If temporary mock data is needed for development, label it clearly and keep it separate from production API code.

### 11. Suggested structure

Adapt to the existing repository rather than blindly overwriting it.

Frontend:
- `src/api/` for a shared Axios client and module API services
- `src/components/`
- `src/layouts/`
- `src/pages/auth/`
- `src/pages/admin/`
- `src/pages/staff/`
- `src/pages/student/`
- `src/routes/`
- `src/types/`
- `src/utils/`

Backend:
- `manage.py`
- `config/`
- `apps/accounts/`
- `apps/students/`
- `apps/staff/`
- `apps/attendance/`
- `apps/marks/`
- `apps/announcements/`
- `requirements.txt`

Create only modules that have a clear purpose. Add an ORDS service/client layer and keep API calls out of React components.

### 12. Security and configuration

- Keep secrets in environment variables.
- Provide `.env.example` with placeholder values only.
- Restrict CORS to the configured frontend origin.
- Use CSRF protection for cookie-based authentication.
- Configure secure cookies and HTTPS for production.
- Validate inputs on the backend.
- Avoid logging passwords, tokens, or sensitive personal data.
- Handle Oracle/ORDS errors safely.
- Never commit real credentials.

### 13. Testing

Write automated tests for:
- Authentication and role permissions
- Student and staff access
- Attendance
- Marks
- Announcements
- User management
- Invalid inputs
- Unauthorized access
- ORDS timeout/error responses

Mock ORDS in unit tests where appropriate. Keep separate integration tests for a configured development environment. Run frontend lint/build checks and backend tests, and report actual results.

### 14. Required development sequence

**Phase 1 — Inspect and document**
- Inspect the workspace.
- Verify APIs and schema.
- Create `docs/ORDS_API_INVENTORY.md`.
- List missing endpoint handlers.
- Present an implementation plan.

**Phase 2 — Foundation**
- Set up Django and React without damaging existing work.
- Configure environment variables and API clients.
- Add basic tests and run instructions.

**Phase 3 — Authentication**
- Implement the agreed authentication design and test all three roles.

**Phase 4 — Core modules**
- Implement students, staff, attendance, marks, announcements, and user management in sequence.

**Phase 5 — Reports and verification**
- Connect dashboard metrics to real data.
- Run tests and fix issues.
- Document setup, endpoint mappings, and known limitations.

After every phase, report:
- Files created or changed
- Features implemented
- Tests run and actual results
- Unverified assumptions
- Missing API handlers
- Next step

Do not claim success without running the relevant checks. Ask me before destructive changes, database schema changes, or any action that could overwrite existing working code.

**Begin with Phase 1 only. Inspect the project and return the verified inventory and plan before making large code changes.**

---

# Part D — What to provide alongside this document

For the most accurate implementation, add these items to Devin's workspace if available:

1. Exported Postman collection containing the working Student GET, Staff GET, Attendance GET, and Attendance POST requests.
2. OpenAPI/Swagger JSON or YAML exported from ORDS.
3. Oracle table structure output for `STUDENTS`, `STAFF`, `ATTENDANCE`, `MARKS`, `ANNOUNCEMENTS`, and `APP_USERS`.
4. Example successful and error responses from Postman.
5. Existing source code, if any.

Never include production passwords, API secrets, private keys, or real student personal data in the handover file.

# Part E — Completion checklist

- [ ] Devin inspected the existing repository.
- [ ] Exact ORDS paths were verified rather than guessed.
- [ ] API inventory saved in `docs/ORDS_API_INVENTORY.md`.
- [ ] Actual table columns and relationships were checked.
- [ ] Django backend starts successfully.
- [ ] React frontend builds successfully.
- [ ] Authentication and role permissions were tested.
- [ ] Existing ORDS endpoints were integrated.
- [ ] Missing handlers were clearly identified.
- [ ] Each implemented module was tested.
- [ ] README and environment setup instructions were added.
