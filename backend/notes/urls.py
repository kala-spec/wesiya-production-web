from django.urls import path
from .views import (
    create_note,
    get_user_notes,
    upload_voice_note,
    get_user_voice_notes,
    analyze_note,
)

urlpatterns = [
    path("create/", create_note),
    path("user/<int:user_id>/", get_user_notes),
    path("analyze/", analyze_note),
    path("voice/upload/", upload_voice_note),
    path("voice/user/<int:user_id>/", get_user_voice_notes),
]