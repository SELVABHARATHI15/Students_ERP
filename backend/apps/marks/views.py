from apps.core.ords_views import OrdsProxyView
from apps.core.permissions import IsStaffRole


class MarksView(OrdsProxyView):
    ords_module = "marks"
    allow_post = True
    allow_put = True
    allow_delete = True

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated

        return [IsAuthenticated(), IsStaffRole()]
