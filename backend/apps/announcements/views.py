from rest_framework.permissions import IsAuthenticated

from apps.core.ords_views import OrdsProxyView
from apps.core.permissions import IsAdminRole


class AnnouncementsView(OrdsProxyView):
    ords_module = "announcements"
    allow_post = True
    allow_put = True
    allow_delete = True

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminRole()]
