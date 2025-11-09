"""Authentication and user viewsets for the plans app.

This file contained several missing imports and undefined names. The patch
below adds the required imports and organizes the view classes to match the
project's `BaseViewSet` helpers found in `plans.views.base`.
"""

from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied

from plans.serializers import (
    UserSerializer,
    UnitSerializer,
    UserProfileSerializer,
    UnitNestedSerializer,
)

from ..models import Unit, UserProfile, Indicator, AnnualPlan
from .base import (
    BaseViewSet,
    get_user_profile,
    can_user_access_unit,
    log_workflow_action,
)


def _get_or_create_default_unit():
    """Return an existing Unit or create a sensible default if none exist.

    This prevents IntegrityError when creating UserProfile.unit which is
    non-nullable.
    """
    unit = Unit.objects.first()
    if unit:
        return unit
    # Try to create a default unit; use get_or_create to avoid races
    default_name = "Default Unit"
    unit, _ = Unit.objects.get_or_create(name=default_name, defaults={"type": "STRATEGIC"})
    return unit


class LoginView(APIView):
    # Disable DRF authentication for this view so invalid Authorization
    # headers (e.g. stale token from Postman) don't cause an early 401.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Look up user by email then authenticate with username
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=user_obj.username, password=password)

        if user is not None and user.is_active:
            login(request, user)

            # Get or create user profile (default to a sensible role if missing)
            profile, _created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': 'STRATEGIC_AFFAIRS',
                    'unit': _get_or_create_default_unit(),
                },
            )

            # Log the login action if unit is available. Use an existing
            # short action code ('UPDATE') because WorkflowAudit.action is
            # limited to 10 characters (choices are: CREATE,SUBMIT,APPROVE,
            # REJECT,IMPORT,UPDATE).
            if profile and profile.unit:
                log_workflow_action(user, profile.unit, 'UPDATE', message="User logged in")

            return Response({
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data,
                'message': 'Login successful',
            })

        return Response({'error': 'Invalid credentials or inactive account'}, status=status.HTTP_400_BAD_REQUEST)


class RegistrationView(APIView):
    # Allow unauthenticated users to register. Disable default DRF
    # authentication for this endpoint to avoid 'Invalid token.' errors
    # when callers include an invalid Authorization header.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        role = request.data.get('role', 'STRATEGIC_AFFAIRS')
        unit_id = request.data.get('unit_id')

        # Validate required fields
        if not all([username, email, password, first_name, last_name]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

            # Get unit if provided, otherwise use a default unit (create if missing)
            unit = None
            if unit_id:
                unit = Unit.objects.filter(id=unit_id).first()
            if not unit:
                unit = _get_or_create_default_unit()

            # Create user profile
            profile = UserProfile.objects.create(user=user, role=role, unit=unit)

            # Authenticate and login user
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)

            # Log the registration. Use 'CREATE' (fits ACTION_CHOICES and
            # the 10-char column limit) instead of a longer custom code.
            if unit:
                log_workflow_action(user, unit, 'CREATE', message="New user registered")

            return Response({
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data,
                'message': 'Registration successful',
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        profile = get_user_profile(request.user)
        if profile and profile.unit:
            # Use 'UPDATE' for logout events to respect the action length
            # constraint on WorkflowAudit.action.
            log_workflow_action(request.user, profile.unit, 'UPDATE', message="User logged out")

        logout(request)
        return Response({'message': 'Logout successful'})


# =============================================================================
# MODEL VIEWSETS (inheriting from BaseViewSet)
# =============================================================================


class UserViewSet(BaseViewSet):
    """ViewSet for User model with profile integration."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    def get_queryset(self):
        """Users can only see their own profile unless SUPERADMIN"""
        queryset = super().get_queryset()
        profile = self.get_user_profile()

        if profile.role != 'SUPERADMIN':
            # Users can only see themselves
            queryset = queryset.filter(id=self.request.user.id)

        return queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user information with profile."""
        user = request.user
        profile = self.get_user_profile()

        return Response({'user': UserSerializer(user).data, 'profile': UserProfileSerializer(profile).data})


class UnitViewSet(BaseViewSet):
    """ViewSet for Unit model."""
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

    def get_queryset(self):
        """SUPERADMIN sees all units, others see only their unit"""
        queryset = super().get_queryset()
        profile = self.get_user_profile()

        if profile.role != 'SUPERADMIN':
            queryset = queryset.filter(id=profile.unit.id)

        return queryset

    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Get users belonging to this unit."""
        unit = self.get_object()
        if not self.can_access_unit(unit):
            raise PermissionDenied("You don't have access to this unit")

        users = UserProfile.objects.filter(unit=unit).select_related('user')
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)


class UserProfileViewSet(BaseViewSet):
    """ViewSet for UserProfile model."""
    queryset = UserProfile.objects.all().select_related('user', 'unit')
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        """SUPERADMIN sees all profiles, others see only profiles in their unit"""
        queryset = super().get_queryset()
        profile = self.get_user_profile()

        if profile.role != 'SUPERADMIN':
            queryset = queryset.filter(unit=profile.unit)

        return queryset

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's profile."""
        profile = self.get_user_profile()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class IndicatorViewSet(BaseViewSet):
    """ViewSet for Indicator model."""
    queryset = Indicator.objects.all()
    # serializer_class should be set to IndicatorSerializer if defined

    def perform_create(self, serializer):
        profile = self.get_user_profile()
        serializer.save(owner_unit=profile.unit)
        self.log_action(profile.unit, 'INDICATOR_CREATED', message=f"Created indicator: {getattr(serializer.instance, 'name', '')}")


class AnnualPlanViewSet(BaseViewSet):
    """ViewSet for AnnualPlan model."""
    queryset = AnnualPlan.objects.all()
    # serializer_class should be set to AnnualPlanSerializer if defined

    def perform_create(self, serializer):
        profile = self.get_user_profile()
        instance = serializer.save(unit=profile.unit)
        self.log_action(profile.unit, 'ANNUAL_PLAN_CREATED', context_plan=instance, message=f"Created annual plan for {instance.year}")