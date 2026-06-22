from django.shortcuts import render
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Note, VoiceNote
from .models import Note, VoiceNote, NoteAnalysis
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
    
@csrf_exempt
def analyze_note(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        note_id = data.get("note_id")

        if not note_id:
            return JsonResponse({"error": "Note ID is required"}, status=400)

        note = Note.objects.get(id=note_id)

        content = note.content.strip()

        if not content:
            return JsonResponse({"error": "Note content is empty"}, status=400)

        # Simple temporary analysis logic
        sentences = [s.strip() for s in content.replace("!", ".").replace("?", ".").split(".") if s.strip()]

        summary = sentences[0] if sentences else content[:120]

        key_points = sentences[:3]

        action_keywords = ["need to", "must", "should", "todo", "to do", "call", "finish", "submit", "pay", "meet"]
        action_items = [
            sentence for sentence in sentences
            if any(keyword in sentence.lower() for keyword in action_keywords)
        ]

        negative_words = ["sad", "angry", "stress", "worried", "fear", "bad", "hurt", "problem"]
        positive_words = ["happy", "good", "great", "excited", "grateful", "better"]

        lower_content = content.lower()

        if any(word in lower_content for word in negative_words):
            emotional_tone = "concerned"
        elif any(word in lower_content for word in positive_words):
            emotional_tone = "positive"
        else:
            emotional_tone = "neutral"

        risk_words = ["suicide", "kill myself", "hurt myself", "emergency", "danger"]
        risk_level = "high" if any(word in lower_content for word in risk_words) else "normal"

        analysis, created = NoteAnalysis.objects.update_or_create(
            written_note=None,
            voice_note=None,
            defaults={
                "summary": summary,
                "key_points": key_points,
                "action_items": action_items,
                "emotional_tone": emotional_tone,
                "risk_level": risk_level,
            }
        )

        return JsonResponse({
            "message": "Note analyzed successfully",
            "analysis": {
                "summary": summary,
                "key_points": key_points,
                "action_items": action_items,
                "emotional_tone": emotional_tone,
                "risk_level": risk_level,
            }
        }, status=200)

    except Note.DoesNotExist:
        return JsonResponse({"error": "Note not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
