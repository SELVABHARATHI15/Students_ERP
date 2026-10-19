from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.ords_client import OrdsRequestError


class OrdsProxyCrudTest(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(
            username="admin-test",
            password="not-used",
            role="admin",
        )
        self.staff = user_model.objects.create_user(
            username="staff-test",
            password="not-used",
            role="staff",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    @patch("apps.core.ords_views.OrdsClient")
    def test_item_put_is_proxied_to_ords(self, ords_client):
        ords_client.return_value.put.return_value = {"staff_id": 1}

        response = self.client.put(
            "/api/staff/1/",
            {"full_name": "Updated Teacher"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"staff_id": 1})
        ords_client.return_value.put.assert_called_once_with(
            "staff",
            json={"full_name": "Updated Teacher"},
            resource_id="1",
        )

    @patch("apps.core.ords_views.OrdsClient")
    def test_post_is_only_allowed_on_collection(self, ords_client):
        response = self.client.post(
            "/api/staff/1/",
            {"full_name": "New Teacher"},
            format="json",
        )

        self.assertEqual(response.status_code, 405)
        ords_client.return_value.post.assert_not_called()

    @patch("apps.core.ords_views.OrdsClient")
    def test_ords_read_timeout_returns_gateway_timeout(self, ords_client):
        ords_client.return_value.get.side_effect = OrdsRequestError(
            "ORDS did not complete its response before the configured timeout.",
            category="read_timeout",
        )

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.data["error_code"], "read_timeout")
        self.assertNotIn("ords_body", response.data)

    @patch("apps.core.ords_views.OrdsClient")
    def test_ords_invalid_json_returns_bad_gateway_without_upstream_body(
        self,
        ords_client,
    ):
        ords_client.return_value.get.side_effect = OrdsRequestError(
            "ORDS returned a successful response that was not valid JSON.",
            category="invalid_json",
            status_code=200,
        )

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["error_code"], "invalid_json")
        self.assertEqual(response.data["upstream_status"], 200)
        self.assertNotIn("ords_body", response.data)

    @patch("apps.core.ords_views.OrdsClient")
    def test_student_creation_hashes_temporary_password_before_proxying(self, ords_client):
        ords_client.return_value.post.return_value = {"student_id": 9}
        password = "A-secure-temporary-password"

        response = self.client.post(
            "/api/students/",
            {
                "username": "new-student",
                "password": password,
                "register_number": "REG-009",
                "full_name": "New Student",
                "class_name": "BCA",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        payload = ords_client.return_value.post.call_args.kwargs["json"]
        self.assertNotIn("password", payload)
        self.assertTrue(check_password(password, payload["password_hash"]))

    @patch("apps.core.ords_views.OrdsClient")
    def test_student_creation_rejects_short_temporary_password(self, ords_client):
        response = self.client.post(
            "/api/students/",
            {"username": "new-student", "password": "short"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        ords_client.return_value.post.assert_not_called()

    @patch("apps.core.ords_views.OrdsClient")
    def test_collection_post_and_item_put_delete_are_proxied(self, ords_client):
        ords_client.return_value.post.return_value = {"attendance_id": 3}
        ords_client.return_value.put.return_value = {"attendance_id": 3}
        ords_client.return_value.delete.return_value = None

        created = self.client.post(
            "/api/attendance/",
            {"student_id": 4, "status": "Present"},
            format="json",
        )
        updated = self.client.put(
            "/api/attendance/3/",
            {"status": "Absent"},
            format="json",
        )
        deleted = self.client.delete("/api/attendance/3/")

        self.assertEqual(created.status_code, 201)
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(deleted.status_code, 204)
        ords_client.return_value.post.assert_called_once_with(
            "attendance",
            json={"student_id": 4, "status": "Present"},
        )
        ords_client.return_value.put.assert_called_once_with(
            "attendance",
            json={"status": "Absent"},
            resource_id="3",
        )
        ords_client.return_value.delete.assert_called_once_with(
            "attendance",
            resource_id="3",
        )

    @patch("apps.core.ords_views.OrdsClient")
    def test_all_documented_modules_expose_collection_and_item_crud(self, ords_client):
        ords_client.return_value.get.return_value = {"items": []}
        ords_client.return_value.post.return_value = {"created": True}
        ords_client.return_value.put.return_value = {"updated": True}
        ords_client.return_value.delete.return_value = None

        modules = (
            "students",
            "staff",
            "attendance",
            "marks",
            "announcements",
            "subjects",
            "timetable",
        )
        for module in modules:
            with self.subTest(module=module):
                collection = f"/api/{module}/"
                self.assertEqual(self.client.get(collection).status_code, 200)
                self.assertEqual(
                    self.client.post(collection, {"value": 1}, format="json").status_code,
                    201,
                )
                self.assertEqual(
                    self.client.put(
                        f"{collection}1/",
                        {"value": 2},
                        format="json",
                    ).status_code,
                    200,
                )
                self.assertEqual(self.client.delete(f"{collection}1/").status_code, 204)

        self.assertEqual(ords_client.return_value.get.call_count, len(modules))
        self.assertEqual(ords_client.return_value.post.call_count, len(modules))
        self.assertEqual(ords_client.return_value.put.call_count, len(modules))
        self.assertEqual(ords_client.return_value.delete.call_count, len(modules))
        for module in modules:
            ords_client.return_value.get.assert_any_call(
                module,
                params={},
                resource_id=None,
            )
            ords_client.return_value.post.assert_any_call(
                module,
                json={"value": 1},
            )
            ords_client.return_value.put.assert_any_call(
                module,
                json={"value": 2},
                resource_id="1",
            )
            ords_client.return_value.delete.assert_any_call(
                module,
                resource_id="1",
            )

    @patch("apps.core.ords_views.OrdsClient")
    def test_user_api_is_admin_only_and_removes_auth_secrets(self, ords_client):
        ords_client.return_value.get.return_value = {
            "items": [
                {
                    "user_id": 5,
                    "username": "test",
                    "password_hash": "never-return-this",
                    "metadata": {"access_token": "never-return-this-either"},
                }
            ]
        }

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"items": [{"user_id": 5, "username": "test", "metadata": {}}]},
        )
        ords_client.return_value.get.assert_called_once_with(
            "app_users",
            params={},
            resource_id=None,
        )

        self.client.force_authenticate(self.staff)
        forbidden = self.client.get("/api/users/")

        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(ords_client.return_value.get.call_count, 1)

    @patch("apps.core.ords_views.OrdsClient")
    def test_user_api_proxies_create_update_and_delete_without_returning_hashes(
        self,
        ords_client,
    ):
        ords_client.return_value.post.return_value = {
            "user_id": 7,
            "password_hash": "hashed-value",
        }
        ords_client.return_value.put.return_value = {
            "user_id": 7,
            "password_hash": "new-hash",
        }
        ords_client.return_value.delete.return_value = None

        created = self.client.post(
            "/api/users/",
            {
                "username": "api-user",
                "password_hash": "already-hashed",
                "role": "STUDENT",
            },
            format="json",
        )
        updated = self.client.put(
            "/api/users/7/",
            {"role": "STAFF"},
            format="json",
        )
        deleted = self.client.delete("/api/users/7/")

        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data, {"user_id": 7})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data, {"user_id": 7})
        self.assertEqual(deleted.status_code, 204)
        ords_client.return_value.post.assert_called_once_with(
            "app_users",
            json={
                "username": "api-user",
                "password_hash": "already-hashed",
                "role": "STUDENT",
            },
        )
        ords_client.return_value.put.assert_called_once_with(
            "app_users",
            json={"role": "STAFF"},
            resource_id="7",
        )
        ords_client.return_value.delete.assert_called_once_with(
            "app_users",
            resource_id="7",
        )

    @patch("apps.core.ords_views.OrdsClient")
    def test_item_get_and_patch_are_not_forwarded(self, ords_client):
        item_get = self.client.get("/api/students/1/")
        item_patch = self.client.patch(
            "/api/students/1/",
            {"full_name": "Updated"},
            format="json",
        )

        self.assertEqual(item_get.status_code, 405)
        self.assertEqual(item_patch.status_code, 405)
        ords_client.return_value.get.assert_not_called()
        ords_client.return_value.patch.assert_not_called()

    @patch("apps.core.ords_views.OrdsClient")
    def test_student_cannot_mutate_records(self, ords_client):
        self.client.force_authenticate(self.staff)

        response = self.client.delete("/api/students/1/")

        self.assertEqual(response.status_code, 403)
        ords_client.return_value.delete.assert_not_called()
