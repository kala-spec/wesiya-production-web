from django.urls import path
from . import views
from . import passkey_views

urlpatterns = [
    path("signup/", views.signup),
    path("login/", views.login),
    path("verify-email/<str:uidb64>/<str:token>/", views.verify_email),

    # Passkeys / WebAuthn
    path("passkeys/register/options/", passkey_views.passkey_register_options),
    path("passkeys/register/verify/", passkey_views.passkey_register_verify),
    path("passkeys/login/options/", passkey_views.passkey_login_options),
    path("passkeys/login/verify/", passkey_views.passkey_login_verify),
]