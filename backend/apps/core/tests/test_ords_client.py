import requests
from django.test import SimpleTestCase, override_settings
from unittest.mock import patch

from apps.core.ords_client import OrdsClient, OrdsNotConfiguredError, OrdsRequestError


@override_settings(
    ORDS_BASE_URL="https://example.com/ords/ws/",
    ORDS_PATHS={"students": "student-erp/students/"},
)
class OrdsClientPathTest(SimpleTestCase):
    def test_builds_full_url(self):
        client = OrdsClient()
        self.assertEqual(
            client._path_for("students"),
            "https://example.com/ords/ws/student-erp/students/",
        )

    def test_missing_path_raises(self):
        client = OrdsClient()
        with self.assertRaises(OrdsNotConfiguredError):
            client._path_for("marks")

    def test_builds_item_url_with_escaped_identifier(self):
        client = OrdsClient()
        self.assertEqual(
            client._path_for("students", "A/B"),
            "https://example.com/ords/ws/student-erp/students/A%2FB",
        )


@override_settings(
    ORDS_BASE_URL="https://example.com/ords/ws/",
    ORDS_PATHS={
        "subjects": "student_erp/subjects/",
        "timetable": "student_erp/timetable/",
        "app_users": "student_erp/app-users/",
    },
)
class OrdsClientDocumentedModulePathTest(SimpleTestCase):
    def test_builds_subjects_timetable_and_app_users_urls(self):
        client = OrdsClient()
        self.assertEqual(
            client._path_for("subjects"),
            "https://example.com/ords/ws/student_erp/subjects/",
        )
        self.assertEqual(
            client._path_for("timetable"),
            "https://example.com/ords/ws/student_erp/timetable/",
        )
        self.assertEqual(
            client._path_for("app_users"),
            "https://example.com/ords/ws/student_erp/app-users/",
        )
        self.assertEqual(
            client._path_for("app_users", "7"),
            "https://example.com/ords/ws/student_erp/app-users/7",
        )


class OrdsClientResponseHandlingTest(SimpleTestCase):
    @override_settings(
        ORDS_BASE_URL="https://example.com/ords/ws/",
        ORDS_PATHS={"students": "student_erp/students/"},
        ORDS_TIMEOUT_SECONDS=30,
        ORDS_VERIFY_SSL=True,
    )
    def test_read_timeout_has_a_distinct_safe_error(self):
        with patch(
            "apps.core.ords_client.requests.request",
            side_effect=requests.exceptions.ReadTimeout("private request detail"),
        ):
            with self.assertRaises(OrdsRequestError) as raised:
                OrdsClient().get("students")

        self.assertEqual(raised.exception.category, "read_timeout")
        self.assertIsNone(raised.exception.status_code)
        self.assertNotIn("private request detail", str(raised.exception))

    @override_settings(
        ORDS_BASE_URL="https://example.com/ords/ws/",
        ORDS_PATHS={"students": "student_erp/students/"},
        ORDS_TIMEOUT_SECONDS=30,
        ORDS_VERIFY_SSL=True,
    )
    def test_connection_and_tls_errors_are_distinct(self):
        for error, expected_category in (
            (requests.exceptions.ConnectTimeout("timeout"), "connect_timeout"),
            (requests.exceptions.SSLError("certificate detail"), "tls_error"),
            (requests.exceptions.ConnectionError("network detail"), "connection_error"),
        ):
            with self.subTest(category=expected_category):
                with patch(
                    "apps.core.ords_client.requests.request",
                    side_effect=error,
                ):
                    with self.assertRaises(OrdsRequestError) as raised:
                        OrdsClient().get("students")
                self.assertEqual(raised.exception.category, expected_category)

    @override_settings(
        ORDS_BASE_URL="https://example.com/ords/ws/",
        ORDS_PATHS={"students": "student_erp/students/"},
        ORDS_TIMEOUT_SECONDS=30,
        ORDS_VERIFY_SSL=True,
    )
    def test_http_error_does_not_expose_upstream_body(self):
        upstream = requests.Response()
        upstream.status_code = 503
        upstream.headers["Content-Type"] = "application/json"
        upstream._content = b'{"error":"private diagnostic"}'

        with patch("apps.core.ords_client.requests.request", return_value=upstream):
            with self.assertRaises(OrdsRequestError) as raised:
                OrdsClient().get("students")

        self.assertEqual(raised.exception.category, "http_error")
        self.assertEqual(raised.exception.status_code, 503)
        self.assertNotIn("private diagnostic", str(raised.exception))

    @override_settings(
        ORDS_BASE_URL="https://example.com/ords/ws/",
        ORDS_PATHS={"students": "student_erp/students/"},
        ORDS_TIMEOUT_SECONDS=30,
        ORDS_VERIFY_SSL=True,
    )
    def test_successful_non_json_response_is_rejected(self):
        upstream = requests.Response()
        upstream.status_code = 200
        upstream.headers["Content-Type"] = "text/html"
        upstream._content = b"<html>private diagnostic</html>"

        with patch("apps.core.ords_client.requests.request", return_value=upstream):
            with self.assertRaises(OrdsRequestError) as raised:
                OrdsClient().get("students")

        self.assertEqual(raised.exception.category, "invalid_json")
        self.assertEqual(raised.exception.status_code, 200)
        self.assertNotIn("private diagnostic", str(raised.exception))

    @override_settings(
        ORDS_BASE_URL="https://example.com/ords/ws/",
        ORDS_PATHS={"students": "student_erp/students/"},
        ORDS_TIMEOUT_SECONDS=30,
        ORDS_VERIFY_SSL=True,
    )
    def test_successful_empty_items_response_is_preserved(self):
        upstream = requests.Response()
        upstream.status_code = 200
        upstream.headers["Content-Type"] = "application/json"
        upstream._content = b'{"items":[],"count":0}'

        with patch("apps.core.ords_client.requests.request", return_value=upstream) as request:
            data = OrdsClient().get("students")

        self.assertEqual(data, {"items": [], "count": 0})
        request.assert_called_once_with(
            "GET",
            "https://example.com/ords/ws/student_erp/students/",
            params=None,
            json=None,
            timeout=30,
            verify=True,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
