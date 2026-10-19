from django.urls import path

from apps.students.views import StudentListView

urlpatterns = [
    path("", StudentListView.as_view(), name="students-list"),
    path("<str:resource_id>/", StudentListView.as_view(), name="students-detail"),
]
