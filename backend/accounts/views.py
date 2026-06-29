from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
import json


@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        username = data.get("username", "").strip().lower()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not username or not email or not password:
            return JsonResponse(
                {"error": "Username, email, and password are required"},
                status=400
            )

        if len(password) < 6:
            return JsonResponse(
                {"error": "Password must be at least 6 characters"},
                status=400
            )

        if User.objects.filter(username__iexact=username).exists():
            return JsonResponse(
                {"error": "Username already exists"},
                status=400
            )

        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse(
                {"error": "Email already exists"},
                status=400
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        return JsonResponse({
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }, status=201)

    except IntegrityError:
        return JsonResponse(
            {"error": "Username or email already exists"},
            status=400
        )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        data = json.loads(request.body)

        username = data.get("username", "").strip().lower()
        password = data.get("password", "")

        if not username or not password:
            return JsonResponse(
                {"error": "Username and password are required"},
                status=400
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return JsonResponse(
                {"error": "Invalid username or password"},
                status=400
            )

        return JsonResponse({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_superuser": user.is_superuser,
            }
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)