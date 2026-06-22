from django.shortcuts import render
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import TrustedContact
import json


@csrf_exempt
def create_trusted_contact(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        user_id = data.get("user_id")
        full_name = data.get("full_name", "").strip()
        phone = data.get("phone", "").strip()
        email = data.get("email", "").strip().lower()
        relationship = data.get("relationship", "").strip()
        access_code = data.get("access_code", "").strip()

        if not user_id or not full_name or not access_code:
            return JsonResponse(
                {"error": "User ID, full name, and access code are required"},
                status=400
            )

        user = User.objects.get(id=user_id)

        trusted_contact = TrustedContact.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            email=email,
            relationship=relationship,
            access_code=access_code,
        )

        return JsonResponse({
            "message": "Trusted contact created successfully",
            "trusted_contact": {
                "id": trusted_contact.id,
                "full_name": trusted_contact.full_name,
                "phone": trusted_contact.phone,
                "email": trusted_contact.email,
                "relationship": trusted_contact.relationship,
                "access_code": trusted_contact.access_code,
            }
        }, status=201)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_trusted_contacts(request, user_id):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    try:
        user = User.objects.get(id=user_id)
        contacts = TrustedContact.objects.filter(user=user).order_by("-created_at")

        contacts_data = []

        for contact in contacts:
            contacts_data.append({
                "id": contact.id,
                "full_name": contact.full_name,
                "phone": contact.phone,
                "email": contact.email,
                "relationship": contact.relationship,
                "access_code": contact.access_code,
                "can_view_notes": contact.can_view_notes,
                "can_view_profile": contact.can_view_profile,
                "created_at": contact.created_at.isoformat(),
            })

        return JsonResponse({"trusted_contacts": contacts_data}, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500) 
