import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    def is_used(self):
        return self.used_at is not None

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(days=7)

    def mark_used(self):
        self.used_at = timezone.now()
        self.save()

    def __str__(self):
        return f"Email verification token for {self.user.username}"


class PasskeyCredential(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="passkey_credentials"
    )

    # WebAuthn credential ID, stored as base64url text
    credential_id = models.TextField(unique=True)

    # Public key from the authenticator.
    # This is NOT the user's fingerprint or face data.
    public_key = models.BinaryField()

    sign_count = models.PositiveBigIntegerField(default=0)

    device_name = models.CharField(max_length=120, blank=True)
    transports = models.JSONField(default=list, blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    def mark_used(self, new_sign_count=None):
        self.last_used_at = timezone.now()

        if new_sign_count is not None:
            self.sign_count = new_sign_count

        self.save()

    def __str__(self):
        return f"Passkey for {self.user.username}"


class PasskeyChallenge(models.Model):
    PURPOSE_REGISTER = "register"
    PURPOSE_LOGIN = "login"

    PURPOSE_CHOICES = [
        (PURPOSE_REGISTER, "Register"),
        (PURPOSE_LOGIN, "Login"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="passkey_challenges",
        null=True,
        blank=True
    )

    challenge = models.TextField()
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    def is_used(self):
        return self.used_at is not None

    def is_expired(self):
        return timezone.now() > self.expires_at

    def mark_used(self):
        self.used_at = timezone.now()
        self.save()

    def __str__(self):
        username = self.user.username if self.user else "Unknown user"
        return f"{self.purpose} passkey challenge for {username}"

    @classmethod
    def create_challenge(cls, user, challenge, purpose, minutes_valid=5):
        return cls.objects.create(
            user=user,
            challenge=challenge,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=minutes_valid),
        )