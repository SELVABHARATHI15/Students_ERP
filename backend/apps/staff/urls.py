from django.urls import path

from apps.staff.views import StaffListView

urlpatterns = [
    path("", StaffListView.as_view(), name="staff-list"),
    path("<str:resource_id>/", StaffListView.as_view(), name="staff-detail"),
]
