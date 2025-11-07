"""Authentication and user session views for the plans app."""
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import UserSerializer, UserProfileSerializer
from .base import get_user_profile


User = get_user_model()


class LoginView(ObtainAuthToken):
    """Authenticate a user and return an auth token with profile information."""

    def post(self, request, *args, **kwargs):  # noqa: D401 - DRF handles validation
        identifier = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")

        if not identifier or not password:
            return Response(
                {"error": "Username/email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = (
            User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier))
            .select_related("profile__unit")
            .first()
        )

        if not user or not user.check_password(password):
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = get_user_profile(user)
        if not profile:
            return Response(
                {"error": "User profile not configured. Contact an administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
                "profile": UserProfileSerializer(profile).data,
            }
        )


class LogoutView(APIView):
    """Revoke the current auth token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = getattr(request, "auth", None)
        if token:
            Token.objects.filter(key=str(token)).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """Return the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_user_profile(request.user)
        if not profile:
            return Response(
                {"error": "User profile not configured. Contact an administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "user": UserSerializer(request.user).data,
                "profile": UserProfileSerializer(profile).data,
            }
        )

