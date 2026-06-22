from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "message": "Wesiya backend is running"
    })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/accounts/", include("accounts.urls")),
    path("api/notes/", include("notes.urls")),
]