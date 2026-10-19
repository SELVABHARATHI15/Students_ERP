from __future__ import annotations

import logging
import time
from typing import Any
from urllib.parse import quote

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OrdsNotConfiguredError(Exception):
    """Raised when a module path is not set in environment configuration."""


class OrdsRequestError(Exception):
    def __init__(
        self,
        message: str,
        *,
        category: str,
        status_code: int | None = None,
    ):
        super().__init__(message)
        self.category = category
        self.status_code = status_code


class OrdsClient:
    """Thin HTTP client for Oracle ORDS REST modules."""

    def __init__(self) -> None:
        self.base_url = settings.ORDS_BASE_URL
        self.paths = settings.ORDS_PATHS
        self.timeout = settings.ORDS_TIMEOUT_SECONDS
        self.verify = settings.ORDS_VERIFY_SSL

    def _path_for(self, module: str, resource_id: str | int | None = None) -> str:
        relative = self.paths.get(module, "").strip()
        if not relative:
            raise OrdsNotConfiguredError(
                f"ORDS path for '{module}' is not configured. "
                f"Set ORDS_PATH_{module.upper()} in .env after verifying in Postman."
            )
        if not relative.startswith("/"):
            relative = "/" + relative
        url = self.base_url.rstrip("/") + relative
        if resource_id is not None:
            url = f"{url.rstrip('/')}/{quote(str(resource_id), safe='')}"
        return url

    def get(
        self,
        module: str,
        params: dict | None = None,
        resource_id: str | int | None = None,
    ) -> Any:
        return self._request("GET", module, params=params, resource_id=resource_id)

    def post(
        self,
        module: str,
        json: dict | None = None,
        resource_id: str | int | None = None,
    ) -> Any:
        return self._request("POST", module, json=json, resource_id=resource_id)

    def put(
        self,
        module: str,
        json: dict | None = None,
        resource_id: str | int | None = None,
    ) -> Any:
        return self._request("PUT", module, json=json, resource_id=resource_id)

    def patch(
        self,
        module: str,
        json: dict | None = None,
        resource_id: str | int | None = None,
    ) -> Any:
        return self._request("PATCH", module, json=json, resource_id=resource_id)

    def delete(self, module: str, resource_id: str | int | None = None) -> Any:
        return self._request("DELETE", module, resource_id=resource_id)

    def _request(
        self,
        method: str,
        module: str,
        params: dict | None = None,
        json: dict | None = None,
        resource_id: str | int | None = None,
    ) -> Any:
        url = self._path_for(module, resource_id)
        started_at = time.monotonic()
        try:
            response = requests.request(
                method,
                url,
                params=params,
                json=json,
                timeout=self.timeout,
                verify=self.verify,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
            )
        except requests.exceptions.ConnectTimeout as exc:
            duration_ms = self._duration_ms(started_at)
            logger.warning(
                "ORDS connect timeout method=%s module=%s duration_ms=%d timeout_seconds=%s",
                method,
                module,
                duration_ms,
                self.timeout,
            )
            raise OrdsRequestError(
                "Could not establish a connection to ORDS before the configured timeout.",
                category="connect_timeout",
            ) from exc
        except requests.exceptions.ReadTimeout as exc:
            duration_ms = self._duration_ms(started_at)
            logger.warning(
                "ORDS read timeout method=%s module=%s duration_ms=%d timeout_seconds=%s",
                method,
                module,
                duration_ms,
                self.timeout,
            )
            raise OrdsRequestError(
                "ORDS did not complete its response before the configured timeout.",
                category="read_timeout",
            ) from exc
        except requests.exceptions.SSLError as exc:
            duration_ms = self._duration_ms(started_at)
            logger.error(
                "ORDS TLS error method=%s module=%s duration_ms=%d timeout_seconds=%s",
                method,
                module,
                duration_ms,
                self.timeout,
            )
            raise OrdsRequestError(
                "TLS verification failed while connecting to ORDS.",
                category="tls_error",
            ) from exc
        except requests.exceptions.ConnectionError as exc:
            duration_ms = self._duration_ms(started_at)
            logger.warning(
                "ORDS connection error method=%s module=%s duration_ms=%d timeout_seconds=%s",
                method,
                module,
                duration_ms,
                self.timeout,
            )
            raise OrdsRequestError(
                "Could not connect to ORDS. Check DNS and backend network access.",
                category="connection_error",
            ) from exc
        except requests.exceptions.RequestException as exc:
            duration_ms = self._duration_ms(started_at)
            logger.error(
                "ORDS request error method=%s module=%s duration_ms=%d timeout_seconds=%s",
                method,
                module,
                duration_ms,
                self.timeout,
            )
            raise OrdsRequestError(
                "The request to ORDS could not be completed.",
                category="request_error",
            ) from exc

        duration_ms = self._duration_ms(started_at)
        if response.status_code >= 400:
            logger.warning(
                "ORDS HTTP error method=%s module=%s status=%d content_type=%s duration_ms=%d redirects=%d",
                method,
                module,
                response.status_code,
                response.headers.get("Content-Type", "unknown"),
                duration_ms,
                len(response.history or []),
            )
            raise OrdsRequestError(
                f"ORDS returned HTTP {response.status_code}.",
                category="http_error",
                status_code=response.status_code,
            )

        if not response.content:
            logger.info(
                "ORDS response method=%s module=%s status=%d content_type=%s duration_ms=%d redirects=%d",
                method,
                module,
                response.status_code,
                response.headers.get("Content-Type", "unknown"),
                duration_ms,
                len(response.history or []),
            )
            return None
        try:
            data = response.json()
        except ValueError as exc:
            logger.error(
                "ORDS invalid JSON method=%s module=%s status=%d content_type=%s duration_ms=%d redirects=%d",
                method,
                module,
                response.status_code,
                response.headers.get("Content-Type", "unknown"),
                duration_ms,
                len(response.history or []),
            )
            raise OrdsRequestError(
                "ORDS returned a successful response that was not valid JSON.",
                category="invalid_json",
                status_code=response.status_code,
            ) from exc

        item_count = (
            len(data["items"])
            if isinstance(data, dict) and isinstance(data.get("items"), list)
            else len(data)
            if isinstance(data, list)
            else None
        )
        logger.info(
            "ORDS response method=%s module=%s status=%d content_type=%s duration_ms=%d redirects=%d item_count=%s",
            method,
            module,
            response.status_code,
            response.headers.get("Content-Type", "unknown"),
            duration_ms,
            len(response.history or []),
            item_count,
        )
        return data

    @staticmethod
    def _duration_ms(started_at: float) -> int:
        return round((time.monotonic() - started_at) * 1000)
