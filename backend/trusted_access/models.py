from django.conf import settings
from django.db import models


class TrustedMember(models.Model):
    RELATIONSHIP_CHOICES = [
        ("father", "Father"),
        ("mother", "Mother"),
        ("brother", "Brother"),
        ("sister", "Sister"),
        ("spouse", "Spouse"),
        ("friend", "Friend"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trusted_members"
    )
    member_name = models.CharField(max_length=255)
    member_phone = models.CharField(max_length=50)
    relationship = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member_name} for {self.user.email}"


class TrustedAccessLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trusted_access_logs"
    )
    trusted_member_name = models.CharField(max_length=255)
    trusted_member_phone = models.CharField(max_length=50)
    accessed_at = models.DateTimeField(auto_now_add=True)
    was_successful = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.trusted_member_name} accessed {self.user.email}"
