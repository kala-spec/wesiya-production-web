from django.shortcuts import render
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Note
import json


@csrf_exempt
def create_note(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        user_id = data.get("user_id")
        title = data.get("title", "").strip()
        content = data.get("content", "").strip()

        if not user_id or not content:
            return JsonResponse({"error": "User ID and content are required"}, status=400)

        user = User.objects.get(id=user_id)

        note = Note.objects.create(
            user=user,
            title=title,
            content=content
        )

        return JsonResponse({
            "message": "Note created successfully",
            "note": {
                "id": note.id,
                "title": note.title,
                "content": note.content,
                "created_at": note.created_at.isoformat(),
            }
        }, status=201)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_user_notes(request, user_id):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    try:
        user = User.objects.get(id=user_id)
        notes = Note.objects.filter(user=user).order_by("-created_at")

        notes_data = []

        for note in notes:
            notes_data.append({
                "id": note.id,
                "title": note.title,
                "content": note.content,
                "created_at": note.created_at.isoformat(),
                "updated_at": note.updated_at.isoformat(),
            })

        return JsonResponse({
            "notes": notes_data
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# Create your views here.
