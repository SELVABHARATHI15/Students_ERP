from django.urls import path

from apps.attendance.views import AttendanceView

urlpatterns = [
    path("", AttendanceView.as_view(), name="attendance"),
    path("<str:resource_id>/", AttendanceView.as_view(), name="attendance-detail"),
]
