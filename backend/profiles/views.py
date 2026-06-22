from django.shortcuts import render
from datetime import datetime
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile
import json


def get_profile(request, user_id):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    try:
        user = User.objects.get(id=user_id)
        profile, created = UserProfile.objects.get_or_create(user=user)

        return JsonResponse({
            "profile": {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": profile.full_name,
                "phone": profile.phone,
                "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else "",
                "height": profile.height,
                "emergency_note": profile.emergency_note,
            }
        })

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


@csrf_exempt
def update_profile(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        user_id = data.get("user_id")
        if not user_id:
            return JsonResponse({"error": "User ID is required"}, status=400)

        user = User.objects.get(id=user_id)
        profile, created = UserProfile.objects.get_or_create(user=user)

        profile.full_name = data.get("full_name", "").strip()
        profile.phone = data.get("phone", "").strip()
        profile.height = data.get("height", "").strip()
        profile.emergency_note = data.get("emergency_note", "").strip()

        date_of_birth = data.get("date_of_birth", "").strip()

        if date_of_birth:
         profile.date_of_birth = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        else:
         profile.date_of_birth = None

        profile.save()

        return JsonResponse({
            "message": "Profile updated successfully",
            "profile": {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": profile.full_name,
                "phone": profile.phone,
                "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else "",
                "height": profile.height,
                "emergency_note": profile.emergency_note,
            }
        })

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
