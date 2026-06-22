from django.urls import path
from .views import create_trusted_contact, get_trusted_contacts

urlpatterns = [
    path("create/", create_trusted_contact),
    path("user/<int:user_id>/", get_trusted_contacts),
]