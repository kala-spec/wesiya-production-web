from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "message": "Wesiya backend is running"
    })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/trusted-access/", include("trusted_access.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/notes/", include("notes.urls")),
    path("api/profiles/", include("profiles.urls")),
    path("api/admin-panel/", include("admin_panel.urls")),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)