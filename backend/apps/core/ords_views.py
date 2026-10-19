from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.ords_client import OrdsClient, OrdsNotConfiguredError, OrdsRequestError


class OrdsProxyView(APIView):
    """Proxy configured ORDS collection and item operations."""

    permission_classes = [IsAuthenticated]
    ords_module: str = ""
    allow_post: bool = False
    allow_put: bool = False
    allow_delete: bool = False

    def get(self, request, resource_id=None):
        if not self._method_enabled("GET", resource_id):
            return self._method_not_allowed("GET", resource_id)
        return self._proxy("GET", request, resource_id=resource_id)

    def post(self, request, resource_id=None):
        return self._write("POST", request, resource_id)

    def put(self, request, resource_id=None):
        return self._write("PUT", request, resource_id)

    def delete(self, request, resource_id=None):
        if not self._method_enabled("DELETE", resource_id):
            return self._method_not_allowed("DELETE", resource_id)
        return self._proxy("DELETE", request, resource_id=resource_id)

    def _write(self, method: str, request, resource_id=None):
        if not self._method_enabled(method, resource_id):
            return self._method_not_allowed(method, resource_id)
        if not isinstance(request.data, dict):
            return Response(
                {"detail": "Expected a JSON object request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        body = request.data
        if method == "POST" and self.ords_module in ("students", "staff"):
            body, error_response = self._hash_linked_account_password(body)
            if error_response:
                return error_response
        return self._proxy(method, request, body=body, resource_id=resource_id)

    @staticmethod
    def _hash_linked_account_password(body):
        password = body.get("password")
        if password is None:
            return body, None
        if not isinstance(password, str) or len(password) < 12:
            return body, Response(
                {"detail": "Temporary passwords must be at least 12 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "password_hash" in body:
            return body, Response(
                {"detail": "Send a password, not both password and password_hash."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        safe_body = {key: value for key, value in body.items() if key != "password"}
        safe_body["password_hash"] = make_password(password)
        return safe_body, None

    def _method_enabled(self, method: str, resource_id=None):
        if method == "GET":
            return resource_id is None
        if method == "POST":
            return self.allow_post and resource_id is None
        if method == "PUT":
            return self.allow_put and resource_id is not None
        if method == "DELETE":
            return self.allow_delete and resource_id is not None
        return False

    def _method_not_allowed(self, method: str, resource_id=None):
        if method == "POST":
            detail = "POST is not enabled for this collection."
        elif resource_id is None:
            detail = f"{method} requires a resource ID."
        else:
            detail = f"{method} is not enabled for this resource."
        return Response({"detail": detail}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def _proxy(self, method: str, request, body=None, resource_id=None):
        client = OrdsClient()
        try:
            if method == "GET":
                data = client.get(
                    self.ords_module,
                    params=request.query_params.dict(),
                    resource_id=resource_id,
                )
            elif method == "POST":
                data = client.post(self.ords_module, json=body)
            elif method == "PUT":
                data = client.put(self.ords_module, json=body, resource_id=resource_id)
            else:
                data = client.delete(self.ords_module, resource_id=resource_id)
        except OrdsNotConfiguredError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "inventory": "See docs/ORDS_API_INVENTORY.md",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except OrdsRequestError as exc:
            if exc.category in ("read_timeout", "connect_timeout"):
                response_status = status.HTTP_504_GATEWAY_TIMEOUT
            else:
                response_status = status.HTTP_502_BAD_GATEWAY
            return Response(
                {
                    "detail": str(exc),
                    "error_code": exc.category,
                    "upstream_status": exc.status_code,
                },
                status=response_status,
            )
        data = self._remove_secrets(data)
        if method == "POST":
            return Response(data, status=status.HTTP_201_CREATED)
        if method == "DELETE":
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(data)

    @classmethod
    def _remove_secrets(cls, value):
        if isinstance(value, list):
            return [cls._remove_secrets(item) for item in value]
        if isinstance(value, dict):
            return {
                key: cls._remove_secrets(item)
                for key, item in value.items()
                if not any(
                    part in key.lower()
                    for part in ("password", "token", "secret", "credential")
                )
            }
        return value
