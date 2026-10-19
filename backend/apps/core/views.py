from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.ords_client import OrdsClient, OrdsNotConfiguredError, OrdsRequestError
from apps.core.ords_views import OrdsProxyView
from apps.core.permissions import IsAdminRole


class SubjectsProxyView(OrdsProxyView):
    ords_module = "subjects"
    allow_post = True
    allow_put = True
    allow_delete = True

    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "DELETE"):
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]


class TimetableProxyView(OrdsProxyView):
    ords_module = "timetable"
    allow_post = True
    allow_put = True
    allow_delete = True

    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "DELETE"):
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]


class AppUsersProxyView(OrdsProxyView):
    ords_module = "app_users"
    allow_post = True
    allow_put = True
    allow_delete = True

    def get_permissions(self):
        return [IsAuthenticated(), IsAdminRole()]

    def _proxy(self, method, request, body=None, resource_id=None):
        response = super()._proxy(
            method,
            request,
            body=body,
            resource_id=resource_id,
        )
        if response.status_code >= 400:
            if isinstance(response.data, dict):
                response.data.pop("ords_body", None)
                response.data = self._remove_secrets(response.data)
            return response
        if response.status_code == 204:
            return response
        if response.data is not None and not isinstance(response.data, (dict, list)):
            return Response(
                {"detail": "ORDS returned an unexpected user response."},
                status=502,
            )
        return response


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = OrdsClient()
        summary: dict = {"modules": {}, "ords_configured": {}}
        for module in (
            "students",
            "staff",
            "attendance",
            "marks",
            "announcements",
            "subjects",
            "timetable",
        ):
            try:
                data = client.get(module)
                if isinstance(data, dict) and "items" in data:
                    count = len(data["items"])
                elif isinstance(data, list):
                    count = len(data)
                else:
                    count = None
                summary["modules"][module] = {"count": count, "status": "ok"}
                summary["ords_configured"][module] = True
            except OrdsNotConfiguredError:
                summary["modules"][module] = {"status": "not_configured"}
                summary["ords_configured"][module] = False
            except OrdsRequestError as exc:
                summary["modules"][module] = {
                    "status": "ords_error",
                    "error": str(exc),
                    "http_status": exc.status_code,
                }
                summary["ords_configured"][module] = True

        return Response(summary)
