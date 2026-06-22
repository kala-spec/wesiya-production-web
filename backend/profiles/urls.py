from django.urls import path
from .views import get_profile, update_profile

urlpatterns = [
    path("user/<int:user_id>/", get_profile),
    path("update/", update_profile),
]