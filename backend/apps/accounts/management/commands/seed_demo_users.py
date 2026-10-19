from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create demo admin, staff, and student users for local development."

    def handle(self, *args, **options):
        User = get_user_model()
        demos = [
            ("admin", "admin123", User.Role.ADMIN, "Demo Admin"),
            ("teacher", "teacher123", User.Role.STAFF, "Demo Teacher"),
            ("student", "student123", User.Role.STUDENT, "Demo Student"),
        ]
        for username, password, role, full_name in demos:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "role": role,
                    "first_name": full_name.split()[0],
                    "last_name": full_name.split()[-1] if " " in full_name else "",
                },
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created {username}"))
            else:
                self.stdout.write(f"Skipped existing user {username}")
