from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class AuthApiTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="teacher",
            password="teacher123",
            role=User.Role.STAFF,
        )
        self.client = APIClient()

    def test_login_and_me(self):
        res = self.client.post(
            "/api/auth/login/",
            {"username": "teacher", "password": "teacher123"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["role"], "staff")

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["username"], "teacher")

    def test_logout_accepts_local_frontend_origin_with_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(self.user)
        client.get("/api/auth/csrf/")
        csrf_token = client.cookies["csrftoken"].value

        response = client.post(
            "/api/auth/logout/",
            {},
            format="json",
            HTTP_ORIGIN="http://127.0.0.1:10003",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 204)
