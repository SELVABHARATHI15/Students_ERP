from django.urls import path

from apps.announcements.views import AnnouncementsView

urlpatterns = [
    path("", AnnouncementsView.as_view(), name="announcements"),
    path("<str:resource_id>/", AnnouncementsView.as_view(), name="announcements-detail"),
]
