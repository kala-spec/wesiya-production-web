from django.urls import path
from . import views

urlpatterns = [
    path("users/", views.get_users_for_super_admin),
]