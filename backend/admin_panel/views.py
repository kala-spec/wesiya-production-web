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

        for user in users:
            profile = getattr(user, "profile", None)

            full_name = ""
            phone = ""
            location = ""

            if profile:
                full_name = getattr(profile, "full_name", "") or ""
                phone = getattr(profile, "phone", "") or ""
                location = getattr(profile, "location", "") or ""

            users_data.append({
                "id": user.id,
                "name": full_name or user.get_full_name() or user.username,
                "username": user.username,
                "email": user.email,
                "phone": phone,
                "location": location,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined.isoformat(),
            })

        return JsonResponse({
            "users": users_data
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "Admin user not found"}, status=404)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)