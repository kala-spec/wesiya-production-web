import json

import phonenumbers
from phonenumbers import NumberParseException

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError
from django.http import JsonResponse
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.views.decorators.csrf import csrf_exempt

from profiles.models import UserProfile
from .models import EmailVerificationToken


def normalize_phone_number(phone, country_code=""):
    clean_phone = phone.strip()
    clean_country_code = country_code.strip().upper() if country_code else ""

    try:
        if clean_phone.startswith("+"):
            parsed_phone = phonenumbers.parse(clean_phone, None)
        else:
            if not clean_country_code:
                return None, None, "Please select a country for your phone number."

            parsed_phone = phonenumbers.parse(clean_phone, clean_country_code)

        if not phonenumbers.is_possible_number(parsed_phone):
            return None, None, "Phone number is not possible."

        if not phonenumbers.is_valid_number(parsed_phone):
            return None, None, "Phone number is not valid."

        normalized_phone = phonenumbers.format_number(
            parsed_phone,
            phonenumbers.PhoneNumberFormat.E164
        )

        detected_country_code = phonenumbers.region_code_for_number(parsed_phone)

        return normalized_phone, detected_country_code, None

    except NumberParseException:
        return None, None, "Please enter a valid phone number."


@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        username = (data.get("username") or "").strip().lower()
        email = (data.get("email") or "").strip().lower()
        full_name = (data.get("full_name") or "").strip()
        phone = (data.get("phone") or "").strip()
        country = (data.get("country") or "").strip()
        country_code = (data.get("country_code") or "").strip().upper()
        city = (data.get("city") or "").strip()

        preferred_language = (data.get("preferred_language") or "").strip()
        preferred_language_name = (data.get("preferred_language_name") or "").strip()

        password = data.get("password") or ""
        confirm_password = data.get("confirm_password") or ""

        if not username:
            return JsonResponse({"error": "Username is required"}, status=400)

        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)

        if not full_name:
            return JsonResponse({"error": "Full name is required"}, status=400)

        if not phone:
            return JsonResponse({"error": "Phone number is required"}, status=400)

        if not country:
            return JsonResponse({"error": "Country is required"}, status=400)

        if not city:
            return JsonResponse({"error": "City is required"}, status=400)

        if not password:
            return JsonResponse({"error": "Password is required"}, status=400)

        if not confirm_password:
            return JsonResponse({"error": "Please confirm your password"}, status=400)

        normalized_phone, detected_country_code, phone_error = normalize_phone_number(
            phone,
            country_code
        )

        if phone_error:
            return JsonResponse({"error": phone_error}, status=400)

        if not normalized_phone:
            return JsonResponse({"error": "Invalid phone number"}, status=400)

        if country_code and detected_country_code and country_code != detected_country_code:
            return JsonResponse(
                {
                    "error": (
                        "Phone number country does not match the selected country. "
                        "Please check your phone number."
                    )
                },
                status=400
            )

        final_country_code = detected_country_code or country_code

        if password != confirm_password:
            return JsonResponse({"error": "Passwords do not match"}, status=400)

        if len(password) < 8:
            return JsonResponse(
                {"error": "Password must be at least 8 characters"},
                status=400
            )

        if User.objects.filter(username__iexact=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({"error": "Email already exists"}, status=400)

        if UserProfile.objects.filter(phone=normalized_phone).exists():
            return JsonResponse({"error": "Phone number already exists"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=full_name,
        )

        user.is_active = False
        user.save()

        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            phone=normalized_phone,
            country=country,
            country_code=final_country_code,
            city=city,
            preferred_language=preferred_language,
            preferred_language_name=preferred_language_name,
        )

        EmailVerificationToken.objects.filter(user=user, used_at__isnull=True).delete()
        email_token = EmailVerificationToken.objects.create(user=user)

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        verification_link = request.build_absolute_uri(
            f"/api/accounts/verify-email/{uid}/{email_token.token}/"
        )

        print("\n\n===================================")
        print("WESIYA EMAIL VERIFICATION LINK:")
        print(verification_link)
        print("===================================\n\n")

        send_mail(
            subject="Verify your Wesiya email",
            message=(
                f"Hello {full_name or username},\n\n"
                "Welcome to Wesiya.\n\n"
                "Please verify your email by clicking this link:\n\n"
                f"{verification_link}\n\n"
                "After verification, you can login to your account.\n\n"
                "If you did not create this account, you can ignore this email."
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@wesiya.local"),
            recipient_list=[email],
            fail_silently=False,
        )

        return JsonResponse({
            "message": "Account created. Please check your email to verify your account.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone": normalized_phone,
                "country": country,
                "country_code": final_country_code,
                "city": city,
                "preferred_language": preferred_language,
                "preferred_language_name": preferred_language_name,
                "is_active": user.is_active,
            }
        }, status=201)

    except IntegrityError:
        return JsonResponse(
            {"error": "Username, email, or phone number already exists"},
            status=400
        )

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def verify_email(request, uidb64, token):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    try:
        user_id = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=user_id)

        if user.is_active:
            return JsonResponse({
                "message": "Email is already verified. You can login."
            }, status=200)

        email_token = EmailVerificationToken.objects.filter(
            user=user,
            token=token,
            used_at__isnull=True
        ).first()

        if not email_token:
            return JsonResponse({"error": "Invalid verification link"}, status=400)

        if email_token.is_expired():
            return JsonResponse({"error": "Verification link expired"}, status=400)

        user.is_active = True
        user.save()

        email_token.mark_used()

        return JsonResponse({
            "message": "Email verified successfully. You can now login."
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception:
        return JsonResponse({"error": "Invalid verification link"}, status=400)


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        identifier = (data.get("username") or "").strip().lower()
        password = data.get("password") or ""

        if not identifier or not password:
            return JsonResponse(
                {"error": "Username/email and password are required"},
                status=400
            )

        user = (
            User.objects.filter(username__iexact=identifier).first()
            or User.objects.filter(email__iexact=identifier).first()
        )

        if user is None:
            return JsonResponse(
                {"error": "Invalid username/email or password"},
                status=400
            )

        if not user.check_password(password):
            return JsonResponse(
                {"error": "Invalid username/email or password"},
                status=400
            )

        if not user.is_active:
            return JsonResponse(
                {"error": "Please verify your email before logging in."},
                status=403
            )

        profile = getattr(user, "profile", None)

        return JsonResponse({
            "message": "Login successful",
            "user": {
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
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)