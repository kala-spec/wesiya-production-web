from django.urls import path
from .views import create_note, get_user_notes

urlpatterns = [
    path("create/", create_note),
    path("user/<int:user_id>/", get_user_notes),
]