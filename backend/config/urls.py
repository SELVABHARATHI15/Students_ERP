from django.contrib import admin
from django.urls import include, path

from apps.core.views import AppUsersProxyView, SubjectsProxyView, TimetableProxyView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/students/", include("apps.students.urls")),
    path("api/staff/", include("apps.staff.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/marks/", include("apps.marks.urls")),
    path("api/announcements/", include("apps.announcements.urls")),
    path("api/dashboard/", include("apps.core.urls")),
    path("api/subjects/", SubjectsProxyView.as_view(), name="subjects-list"),
    path(
        "api/subjects/<str:resource_id>/",
        SubjectsProxyView.as_view(),
        name="subjects-detail",
    ),
    path("api/timetable/", TimetableProxyView.as_view(), name="timetable-list"),
    path(
        "api/timetable/<str:resource_id>/",
        TimetableProxyView.as_view(),
        name="timetable-detail",
    ),
    path("api/users/", AppUsersProxyView.as_view(), name="users-list"),
    path(
        "api/users/<str:resource_id>/",
        AppUsersProxyView.as_view(),
        name="users-detail",
    ),
]
