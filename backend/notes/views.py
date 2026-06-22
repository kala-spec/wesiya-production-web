from django.shortcuts import render
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Note, VoiceNote
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

@csrf_exempt
def upload_voice_note(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        user_id = request.POST.get("user_id")
        title = request.POST.get("title", "").strip()
        audio_file = request.FILES.get("audio_file")

        if not user_id or not audio_file:
            return JsonResponse({"error": "User ID and audio file are required"}, status=400)

        user = User.objects.get(id=user_id)

        voice_note = VoiceNote.objects.create(
            user=user,
            title=title,
            audio_file=audio_file
        )

        return JsonResponse({
            "message": "Voice note uploaded successfully",
            "voice_note": {
                "id": voice_note.id,
                "title": voice_note.title,
                "audio_url": request.build_absolute_uri(voice_note.audio_file.url),
                "created_at": voice_note.created_at.isoformat(),
            }
        }, status=201)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_user_voice_notes(request, user_id):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    try:
        user = User.objects.get(id=user_id)
        voice_notes = VoiceNote.objects.filter(user=user).order_by("-created_at")

        voice_notes_data = []

        for voice_note in voice_notes:
            voice_notes_data.append({
                "id": voice_note.id,
                "title": voice_note.title,
                "audio_url": request.build_absolute_uri(voice_note.audio_file.url),
                "created_at": voice_note.created_at.isoformat(),
            })

        return JsonResponse({
            "voice_notes": voice_notes_data
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
