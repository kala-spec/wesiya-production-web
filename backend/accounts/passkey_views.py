import base64
import json
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import login as django_login
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
    base64url_to_bytes,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from .models import PasskeyCredential, PasskeyChallenge


def _json_body(request):
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return {}


def _bytes_to_base64url(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("utf-8")


def _get_user_from_identifier(identifier):
    if not identifier:
        return None

    identifier = identifier.strip().lower()

    return User.objects.filter(
        Q(username__iexact=identifier) | Q(email__iexact=identifier)
    ).first()


def _passkey_settings():
    return {
        "rp_id": getattr(settings, "PASSKEY_RP_ID", "localhost"),
        "rp_name": getattr(settings, "PASSKEY_RP_NAME", "Wesiya"),
        "origin": getattr(settings, "PASSKEY_ORIGIN", "http://localhost:3000"),
    }


def _user_payload(user):
    profile = getattr(user, "profile", None)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_superuser": user.is_superuser,
        "full_name": profile.full_name if profile else "",
        "phone": profile.phone if profile else "",
        "country": profile.country if profile else "",
        "country_code": profile.country_code if profile else "",
        "city": profile.city if profile else "",
        "preferred_language": profile.preferred_language if profile else "",
        "preferred_language_name": profile.preferred_language_name if profile else "",
    }


@csrf_exempt
def passkey_register_options(request):
    """
    Creates passkey registration options.

    Frontend sends:
    {
        "username_or_email": "...",
        "password": "..."
    }

    We require password confirmation before adding a passkey.
    This protects users from someone adding a passkey to their account.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    data = _json_body(request)

    identifier = (
        data.get("username_or_email")
        or data.get("username")
        or data.get("email")
        or ""
    )
    password = data.get("password") or ""

    if not identifier or not password:
        return JsonResponse(
            {"error": "Username/email and password are required"},
            status=400,
        )

    user = _get_user_from_identifier(identifier)

    if user is None:
        return JsonResponse({"error": "Invalid username/email or password"}, status=400)

    if not user.check_password(password):
        return JsonResponse({"error": "Invalid username/email or password"}, status=400)

    if not user.is_active:
        return JsonResponse(
            {"error": "Please verify your email before adding a passkey"},
            status=403,
        )

    passkey_config = _passkey_settings()

    existing_credentials = []
    for passkey in PasskeyCredential.objects.filter(user=user):
        existing_credentials.append(
            PublicKeyCredentialDescriptor(
                id=base64url_to_bytes(passkey.credential_id)
            )
        )

    options = generate_registration_options(
        rp_id=passkey_config["rp_id"],
        rp_name=passkey_config["rp_name"],
        user_id=str(user.id).encode("utf-8"),
        user_name=user.username,
        user_display_name=user.get_full_name() or user.username,
        attestation=AttestationConveyancePreference.NONE,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        exclude_credentials=existing_credentials,
        timeout=60000,
    )

    options_json = json.loads(options_to_json(options))

    PasskeyChallenge.objects.filter(
        user=user,
        challenge_type="registration",
        created_at__lt=timezone.now() - timedelta(minutes=10),
    ).delete()

    challenge = PasskeyChallenge.objects.create(
        user=user,
        challenge=options_json["challenge"],
        challenge_type="registration",
    )

    return JsonResponse(
        {
            "challenge_id": challenge.id,
            "options": options_json,
        },
        status=200,
    )


@csrf_exempt
def passkey_register_verify(request):
    """
    Verifies and saves a new passkey.

    Frontend sends:
    {
        "challenge_id": 1,
        "credential": {...}
    }
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    data = _json_body(request)

    challenge_id = data.get("challenge_id")
    credential = data.get("credential")

    if not challenge_id or not credential:
        return JsonResponse(
            {"error": "challenge_id and credential are required"},
            status=400,
        )

    challenge = PasskeyChallenge.objects.select_related("user").filter(
        id=challenge_id,
        challenge_type="registration",
        created_at__gte=timezone.now() - timedelta(minutes=10),
    ).first()

    if challenge is None:
        return JsonResponse(
            {"error": "Passkey registration challenge expired or invalid"},
            status=400,
        )

    passkey_config = _passkey_settings()

    try:
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(challenge.challenge),
            expected_rp_id=passkey_config["rp_id"],
            expected_origin=passkey_config["origin"],
            require_user_verification=True,
        )
    except Exception as error:
        challenge.delete()
        return JsonResponse(
            {"error": f"Passkey verification failed: {str(error)}"},
            status=400,
        )

    credential_id = _bytes_to_base64url(verification.credential_id)
    public_key = _bytes_to_base64url(verification.credential_public_key)

    if PasskeyCredential.objects.filter(credential_id=credential_id).exists():
        challenge.delete()
        return JsonResponse(
            {"error": "This passkey is already registered"},
            status=400,
        )

    transports = credential.get("response", {}).get("transports", [])

    PasskeyCredential.objects.create(
        user=challenge.user,
        credential_id=credential_id,
        public_key=public_key,
        sign_count=verification.sign_count,
        device_type=str(getattr(verification, "credential_device_type", "")),
        backed_up=getattr(verification, "credential_backed_up", False),
        transports=transports,
    )

    challenge.delete()

    return JsonResponse(
        {
            "message": "Passkey registered successfully",
            "verified": True,
        },
        status=201,
    )


@csrf_exempt
def passkey_login_options(request):
    """
    Creates passkey login options.

    Frontend sends:
    {
        "username_or_email": "..."
    }
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    data = _json_body(request)

    identifier = (
        data.get("username_or_email")
        or data.get("username")
        or data.get("email")
        or ""
    )

    if not identifier:
        return JsonResponse(
            {"error": "Username or email is required"},
            status=400,
        )

    user = _get_user_from_identifier(identifier)

    if user is None:
        return JsonResponse({"error": "Account not found"}, status=404)

    if not user.is_active:
        return JsonResponse(
            {"error": "Please verify your email before logging in."},
            status=403,
        )

    user_passkeys = PasskeyCredential.objects.filter(user=user)

    if not user_passkeys.exists():
        return JsonResponse(
            {"error": "No passkey found for this account"},
            status=404,
        )

    passkey_config = _passkey_settings()

    allow_credentials = [
        PublicKeyCredentialDescriptor(
            id=base64url_to_bytes(passkey.credential_id)
        )
        for passkey in user_passkeys
    ]

    options = generate_authentication_options(
        rp_id=passkey_config["rp_id"],
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.REQUIRED,
        timeout=60000,
    )

    options_json = json.loads(options_to_json(options))

    PasskeyChallenge.objects.filter(
        user=user,
        challenge_type="authentication",
        created_at__lt=timezone.now() - timedelta(minutes=10),
    ).delete()

    challenge = PasskeyChallenge.objects.create(
        user=user,
        challenge=options_json["challenge"],
        challenge_type="authentication",
    )

    return JsonResponse(
        {
            "challenge_id": challenge.id,
            "options": options_json,
        },
        status=200,
    )


@csrf_exempt
def passkey_login_verify(request):
    """
    Verifies passkey login.

    Frontend sends:
    {
        "challenge_id": 1,
        "credential": {...}
    }
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    data = _json_body(request)

    challenge_id = data.get("challenge_id")
    credential = data.get("credential")

    if not challenge_id or not credential:
        return JsonResponse(
            {"error": "challenge_id and credential are required"},
            status=400,
        )

    challenge = PasskeyChallenge.objects.select_related("user").filter(
        id=challenge_id,
        challenge_type="authentication",
        created_at__gte=timezone.now() - timedelta(minutes=10),
    ).first()

    if challenge is None:
        return JsonResponse(
            {"error": "Passkey login challenge expired or invalid"},
            status=400,
        )

    credential_id = credential.get("id")

    if not credential_id:
        challenge.delete()
        return JsonResponse(
            {"error": "Credential id is missing"},
            status=400,
        )

    passkey = PasskeyCredential.objects.filter(
        user=challenge.user,
        credential_id=credential_id,
    ).first()

    if passkey is None:
        challenge.delete()
        return JsonResponse(
            {"error": "Passkey credential not found"},
            status=404,
        )

    passkey_config = _passkey_settings()

    try:
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(challenge.challenge),
            expected_rp_id=passkey_config["rp_id"],
            expected_origin=passkey_config["origin"],
            credential_public_key=base64url_to_bytes(passkey.public_key),
            credential_current_sign_count=passkey.sign_count,
            require_user_verification=True,
        )
    except Exception as error:
        challenge.delete()
        return JsonResponse(
            {"error": f"Passkey login failed: {str(error)}"},
            status=400,
        )

    passkey.sign_count = verification.new_sign_count
    passkey.device_type = str(getattr(verification, "credential_device_type", ""))
    passkey.backed_up = getattr(verification, "credential_backed_up", False)
    passkey.save(update_fields=["sign_count", "device_type", "backed_up"])

    django_login(request, challenge.user)

    user_data = _user_payload(challenge.user)

    challenge.delete()

    return JsonResponse(
        {
            "message": "Passkey login successful",
            "verified": True,
            "user": user_data,
        },
        status=200,
    )