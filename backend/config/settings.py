import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "apps.accounts",
    "apps.core",
    "apps.students",
    "apps.staff",
    "apps.attendance",
    "apps.marks",
    "apps.announcements",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
] + ["http://127.0.0.1:10003", "http://localhost:10003"]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

ORDS_BASE_URL = os.environ.get(
    "ORDS_BASE_URL", "https://oracleapex.com/ords/selva_space/"
).rstrip("/") + "/"


def _ords_path(environment_key: str, default: str = "") -> str:
    return os.environ.get(environment_key, "").strip() or default


ORDS_PATHS = {
    "students": _ords_path("ORDS_PATH_STUDENTS", "student_erp/students/"),
    "staff": _ords_path("ORDS_PATH_STAFF", "student_erp/staff/"),
    "attendance": _ords_path("ORDS_PATH_ATTENDANCE", "student_erp/attendance/"),
    "marks": _ords_path("ORDS_PATH_MARKS", "student_erp/marks/"),
    "announcements": _ords_path(
        "ORDS_PATH_ANNOUNCEMENTS",
        "student_erp/announcements/",
    ),
    "subjects": _ords_path("ORDS_PATH_SUBJECTS", "student_erp/subjects/"),
    "timetable": _ords_path("ORDS_PATH_TIMETABLE", "student_erp/timetable/"),
    "app_users": _ords_path("ORDS_PATH_APP_USERS", "student_erp/app-users/"),
}
ORDS_TIMEOUT_SECONDS = int(os.environ.get("ORDS_TIMEOUT_SECONDS", "30"))
ORDS_VERIFY_SSL = os.environ.get("ORDS_VERIFY_SSL", "True").lower() in (
    "1",
    "true",
    "yes",
)
