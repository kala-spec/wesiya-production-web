from django.db import models
from django.conf import settings



class Note(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled Note'}"


class WrittenNote(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="written_notes"
    )
    original_text = models.TextField()
    detected_language = models.CharField(max_length=50, blank=True)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Written note by {self.user.username}"


class VoiceNote(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="voice_notes"
    )
    title = models.CharField(max_length=255, blank=True)
    audio_file = models.FileField(upload_to="voice_notes/")
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Voice Note'}"


class NoteTranscript(models.Model):
    voice_note = models.OneToOneField(
        VoiceNote,
        on_delete=models.CASCADE,
        related_name="transcript"
    )
    transcript_text = models.TextField()
    transcript_language = models.CharField(max_length=50, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transcript for voice note {self.voice_note.id}"


class NoteAnalysis(models.Model):
    written_note = models.OneToOneField(
        WrittenNote,
        on_delete=models.CASCADE,
        related_name="analysis",
        null=True,
        blank=True
    )
    voice_note = models.OneToOneField(
        VoiceNote,
        on_delete=models.CASCADE,
        related_name="analysis",
        null=True,
        blank=True
    )
    summary = models.TextField(blank=True)
    key_points = models.JSONField(default=list, blank=True)
    action_items = models.JSONField(default=list, blank=True)
    detected_people = models.JSONField(default=list, blank=True)
    detected_dates = models.JSONField(default=list, blank=True)
    emotional_tone = models.CharField(max_length=100, blank=True)
    risk_level = models.CharField(max_length=50, default="normal")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI analysis {self.id}"