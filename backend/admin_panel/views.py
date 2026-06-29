import json

from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def get_users_for_super_admin(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)
        admin_user_id = data.get("user_id")

        if not admin_user_id:
            return JsonResponse({"error": "User ID is required"}, status=400)

        admin_user = User.objects.get(id=admin_user_id)

        if not admin_user.is_superuser:
            return JsonResponse({"error": "Access denied"}, status=403)

        users = User.objects.all().order_by("-date_joined")

        users_data = []

        total_users = users.count()
        verified_users = 0
        unverified_users = 0
        total_notes = 0
        total_voice_notes = 0

        for user in users:
            profile = getattr(user, "profile", None)

            full_name = ""
            phone = ""
            location = ""
            country = ""
            city = ""

            if profile:
                full_name = getattr(profile, "full_name", "") or ""
                phone = getattr(profile, "phone", "") or ""
                location = getattr(profile, "location", "") or ""
                country = getattr(profile, "country", "") or ""
                city = getattr(profile, "city", "") or ""

            notes_count = user.notes.count() if hasattr(user, "notes") else 0
            voice_notes_count = (
                user.voice_notes.count() if hasattr(user, "voice_notes") else 0
            )

            is_verified = user.is_active
            verification_status = "Completed" if is_verified else "Not completed"

            if is_verified:
                verified_users += 1
            else:
                unverified_users += 1

            total_notes += notes_count
            total_voice_notes += voice_notes_count

            users_data.append({
                "id": user.id,
                "name": full_name or user.get_full_name() or user.username,
                "username": user.username,
                "email": user.email,
                "phone": phone,
                "location": location,
                "country": country,
                "city": city,
                "is_superuser": user.is_superuser,
                "is_verified": is_verified,
                "verification_status": verification_status,
                "notes_count": notes_count,
                "voice_notes_count": voice_notes_count,
                "total_saved_items": notes_count + voice_notes_count,
                "date_joined": user.date_joined.isoformat(),
            })

        return JsonResponse({
            "stats": {
                "total_users": total_users,
                "verified_users": verified_users,
                "unverified_users": unverified_users,
                "total_notes": total_notes,
                "total_voice_notes": total_voice_notes,
                "total_saved_items": total_notes + total_voice_notes,
            },
            "users": users_data,
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "Admin user not found"}, status=404)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)