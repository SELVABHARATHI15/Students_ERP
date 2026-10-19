from django.urls import path

from apps.marks.views import MarksView

urlpatterns = [
    path("", MarksView.as_view(), name="marks"),
    path("<str:resource_id>/", MarksView.as_view(), name="marks-detail"),
]
