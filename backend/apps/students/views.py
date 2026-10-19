from apps.core.ords_views import OrdsProxyView
from apps.core.permissions import IsStaffRole


class StudentListView(OrdsProxyView):
    ords_module = "students"
    allow_post = True
    allow_put = True
    allow_delete = True

    def get_permissions(self):
        from apps.core.permissions import IsAdminRole
        from rest_framework.permissions import IsAuthenticated

        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated(), IsStaffRole()]
