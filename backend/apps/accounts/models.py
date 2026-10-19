from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STAFF = "staff", "Staff"
        STUDENT = "student", "Student"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )
    # Link to Oracle ERP ids once APP_USERS schema is verified
    external_student_id = models.CharField(max_length=64, blank=True, null=True)
    external_staff_id = models.CharField(max_length=64, blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
