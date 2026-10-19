# ORDS API Inventory — Student ERP

**Last updated:** 2026-10-18

This project uses Django as the API façade and proxies requests to the Oracle ORDS APIs. The frontend does not write directly to Oracle; it calls Django routes such as `/api/students/`, `/api/staff/`, `/api/attendance/`, `/api/marks/`, `/api/announcements/`, `/api/subjects/`, and `/api/timetable/`.

## Verified source

The ORDS catalog snapshot and request/response log in `docs/cat log details.txt` contain:

- `https://oracleapex.com/ords/selva_space/open-api-catalog/student_erp/`
- server URL: `https://oracleapex.com/ords/selva_space/student_erp`

The OpenAPI response lists these collection and item handlers:

- `/announcements/`
- `/attendance/`
- `/marks/`
- `/staff/`
- `/students/`
- `/subjects/`
- `/timetable/`

The catalog documents collection `GET`/`POST` and item `PUT`/`DELETE`. It does not document item `GET` or `PATCH`. The request/response log separately shows successful collection `GET` responses from `/subjects/` and `/timetable/`.

No `/users/` or `APP_USERS` handler appears in the catalog snapshot. The API plan proposes `/users/`, but that path remains unverified and is not configured by default.

## Backend configuration used by the app

The Django project is configured with these ORDS paths in `backend/.env.example`:

```env
ORDS_BASE_URL=https://oracleapex.com/ords/selva_space/
ORDS_PATH_STUDENTS=student_erp/students/
ORDS_PATH_STAFF=student_erp/staff/
ORDS_PATH_ATTENDANCE=student_erp/attendance/
ORDS_PATH_MARKS=student_erp/marks/
ORDS_PATH_ANNOUNCEMENTS=student_erp/announcements/
# Paths evidenced in the ORDS request/response log.
ORDS_PATH_SUBJECTS=student_erp/subjects/
ORDS_PATH_TIMETABLE=student_erp/timetable/
# Configure only after verifying the APP_USERS ORDS path and response contract.
ORDS_PATH_APP_USERS=
ORDS_TIMEOUT_SECONDS=30
ORDS_VERIFY_SSL=True
```

The Django proxy does the following:

- frontend -> `/api/.../`
- Django -> `OrdsProxyView`
- `OrdsClient` -> `ORDS_BASE_URL + ORDS_PATH_*`
- Oracle ORDS -> business data

### ORDS troubleshooting behavior

The client uses the configured `ORDS_TIMEOUT_SECONDS` (30 seconds by default). A connect/read timeout is returned to the frontend as HTTP `504`; TLS, network, upstream HTTP, or invalid-JSON errors return HTTP `502`. Logs record method, module, elapsed milliseconds, timeout, response status/content type, redirect count, and returned item count only. Response bodies and student fields are not logged or included in gateway errors. A read timeout from the backend indicates that its HTTP request did not complete; it does not by itself prove a bad URL or database schema.

## Oracle table facts verified from the schema export

The schema export confirms the following tables and key fields:

| Table | Key columns |
|------|-------------|
| `STUDENTS` | `STUDENT_ID`, `USER_ID`, `REGISTER_NUMBER`, `FULL_NAME`, `EMAIL`, `CLASS_NAME`, `SECTION` |
| `STAFF` | `STAFF_ID`, `USER_ID`, `STAFF_CODE`, `FULL_NAME`, `EMAIL` |
| `ATTENDANCE` | `ATTENDANCE_ID`, `STUDENT_ID`, `SUBJECT_ID`, `MARKED_BY_STAFF_ID`, `ATTENDANCE_DATE`, `STATUS`, `CREATED_AT` |
| `MARKS` | `MARK_ID`, `STUDENT_ID`, `SUBJECT_ID`, `EXAM_NAME`, `MARKS_OBTAINED`, `MAX_MARKS`, `ENTERED_BY_STAFF_ID` |
| `ANNOUNCEMENTS` | `ANNOUNCEMENT_ID`, `TITLE`, `MESSAGE`, `CREATED_BY_USER_ID`, `CREATED_AT` |
| `APP_USERS` | `USER_ID`, `USERNAME`, `PASSWORD_HASH`, `ROLE`, `IS_ACTIVE`, `CREATED_AT` |
| `SUBJECTS` | `SUBJECT_ID`, `SUBJECT_CODE`, `SUBJECT_NAME` |
| `TIMETABLE` | `TIMETABLE_ID`, `CLASS_NAME`, `SECTION`, `SUBJECT_ID`, `STAFF_ID`, `DAY_OF_WEEK`, `START_TIME`, `END_TIME` |

Important note:

- `APP_USERS` is not connected to the frontend screens because the project intentionally keeps authentication inside Django until the Oracle user/auth contract is fully documented.
- The app logs in via Django `User` and not by reading `APP_USERS` directly.

## API route inventory

Each catalog-backed module exposes collection and item routes through Django. The catalog documents `GET`/`POST` on collections and `PUT`/`DELETE` on items. Item `GET` and `PATCH` are not enabled because the catalog does not list those handlers.

| Module | ORDS path | Django collection | Django item |
|---|---|---|---|
| Students | `/student_erp/students/` | `/api/students/` | `/api/students/<id>/` |
| Staff | `/student_erp/staff/` | `/api/staff/` | `/api/staff/<id>/` |
| Attendance | `/student_erp/attendance/` | `/api/attendance/` | `/api/attendance/<id>/` |
| Marks | `/student_erp/marks/` | `/api/marks/` | `/api/marks/<id>/` |
| Announcements | `/student_erp/announcements/` | `/api/announcements/` | `/api/announcements/<id>/` |
| Subjects | `/student_erp/subjects/` | `/api/subjects/` | `/api/subjects/<id>/` |
| Timetable | `/student_erp/timetable/` | `/api/timetable/` | `/api/timetable/<id>/` |

The database schema lists these payload fields; the generated OpenAPI request schemas are incomplete for some modules, so confirm the exact body with ORDS before production writes:

| Module | Main fields |
|---|---|
| Students | `username`, `password_hash` (when creating a linked user), `register_number`, `full_name`, `email`, `class_name`, `section` |
| Staff | `username`, `password_hash` (when creating a linked user), `staff_code`, `full_name`, `email` |
| Attendance | `student_id`, `subject_id`, `marked_by_staff_id`, `attendance_date`, `status` |
| Marks | `student_id`, `subject_id`, `exam_name`, `marks_obtained`, `max_marks`, `entered_by_staff_id` |
| Announcements | `title`, `message`, `created_by_user_id` |
| Subjects | `subject_code`, `subject_name` |
| Timetable | `class_name`, `section`, `subject_id`, `staff_id`, `day_of_week`, `start_time`, `end_time` |

The request/response log includes example POST payloads for students, staff, subjects, and timetable, plus sample collection GET responses for subjects and timetable. Earlier sample rows in this inventory are illustrative, not evidence of live current data.

The React UI uses guided forms for all these modules, with friendly field labels and lookup dropdowns for student, subject, and staff references. Student and staff creation accepts a temporary password in the form; Django hashes it with its configured password hasher and sends only `password_hash` to ORDS. The password confirmation field is browser-only and is never sent. Verify that ORDS authentication accepts Django's hash format before using the flow in production. Forms enforce required values and numeric/date/time input types before sending the request.

## APP_USERS

The schema export confirms `USER_ID`, `USERNAME`, `PASSWORD_HASH`, `ROLE`, `IS_ACTIVE`, and `CREATED_AT`.

- The Django API route `/api/users/` (and `/api/users/<id>/`) is admin-only and supports collection `GET`/`POST` and item `PUT`/`DELETE`.
- The upstream ORDS route is **UNVERIFIED**. The API plan proposes `/student_erp/users/`, but the catalog snapshot has no users handler. `ORDS_PATH_APP_USERS` remains blank by default, so requests return an explicit `503` until the real route is confirmed and configured.
- The proxy strips password, token, secret, and credential fields from JSON responses, including nested data. Authentication remains Django-owned.

## Store and retrieve data flow

The intended pattern in this project is:

1. Frontend sends requests to Django routes under `/api/`.
2. Django validates the user/session and permission role.
3. `OrdsProxyView` calls `OrdsClient`.
4. `OrdsClient` uses the configured ORDS path to fetch or write Oracle data.
5. The frontend receives the JSON response and renders it.

Example flow:

```ts
// frontend
await api.get('/students/');
await api.post('/attendance/', payload);
```

This is stored and retrieved through the ORDS backend, not via direct DB calls from the browser.

## Open questions / future work

1. Verify the real ORDS path and safe response contract for `APP_USERS` before setting `ORDS_PATH_APP_USERS`.
2. Validate authentication requirements for ORDS itself, if the gateway requires headers or OAuth.
3. Confirm exact request bodies and valid values with ORDS; the exported schemas are incomplete.

For now, the app is functioning in the intended API-first style: store/retrieve data through the Django-to-ORDS proxy layer.
