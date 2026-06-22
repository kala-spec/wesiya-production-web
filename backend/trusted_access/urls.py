from django.urls import path
from .views import (
    create_trusted_contact,
    get_trusted_contacts,
    verify_trusted_access,
)

urlpatterns = [
    path("create/", create_trusted_contact),
    path("user/<int:user_id>/", get_trusted_contacts),
    path("verify/", verify_trusted_access),
]