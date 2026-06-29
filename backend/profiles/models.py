from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    full_name = models.CharField(max_length=255, blank=True)

    # Required during signup from the backend validation
    phone = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=100, blank=True)
    country_code = models.CharField(max_length=10, blank=True)
    city = models.CharField(max_length=100, blank=True)

    # Translation / language preference
    preferred_language = models.CharField(max_length=20, blank=True)
    preferred_language_name = models.CharField(max_length=100, blank=True)

    # Optional profile details
    date_of_birth = models.DateField(null=True, blank=True)
    height = models.CharField(max_length=50, blank=True)
    emergency_note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def location(self):
        if self.city and self.country:
            return f"{self.city}, {self.country}"
        if self.city:
            return self.city
        if self.country:
            return self.country
        return ""

    @property
    def language_display(self):
        if self.preferred_language_name:
            return self.preferred_language_name
        if self.preferred_language:
            return self.preferred_language
        return ""

    def __str__(self):
        return self.full_name or self.user.username