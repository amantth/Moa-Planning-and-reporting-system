"""
User management views for the plans app using Django REST Framework.
"""
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import UserProfile, Unit
from ..serializers import UserSerializer, UserProfileSerializer
from .base import BaseViewSet, get_user_profile

User = get_user_model()


class UserViewSet(BaseViewSet):
    """User management API endpoints."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        """Filter users based on user role."""
        # Handle anonymous users
        if not self.request.user.is_authenticated:
            return User.objects.none()
            
        profile = get_user_profile(self.request.user)
        
        # Handle case where profile doesn't exist
        if not profile:
            return User.objects.none()
        
        if profile.role == 'SUPERADMIN':
            return User.objects.all().select_related('profile__unit')
        else:
            # Non-superadmins can only see users in their unit
            return User.objects.filter(profile__unit=profile.unit).select_related('profile__unit')
    
    @action(detail=False, methods=['get'], url_path='list-with-profiles')
    def list_with_profiles(self, request):
        """List users with their profiles."""
        queryset = self.get_queryset()
        users_data = []
        
        for user in queryset:
            try:
                profile_data = None
                if hasattr(user, 'profile') and user.profile:
                    profile_data = UserProfileSerializer(user.profile).data
                
                user_data = {
                    'user': UserSerializer(user).data,
                    'profile': profile_data
                }
                users_data.append(user_data)
            except Exception as e:
                # Skip users that cause errors (e.g., missing profile)
                continue
        
        return Response(users_data)
    
    @action(detail=False, methods=['post'], url_path='create-user')
    def create_user(self, request):
        """Create a new user with profile."""
        profile = get_user_profile(request.user)
        
        if not profile:
            return Response(
                {'error': 'User profile not found. Please contact administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only superadmins and strategic affairs can create users
        if profile.role not in ['SUPERADMIN', 'STRATEGIC_AFFAIRS']:
            return Response(
                {'error': 'Insufficient permissions to create users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        role = request.data.get('role', '').strip()
        unit_id = request.data.get('unit_id')
        
        # Validate required fields
        if not username:
            return Response(
                {'error': 'Username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not role:
            return Response(
                {'error': 'Role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not unit_id or unit_id == 0:
            return Response(
                {'error': 'Unit is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate unit access
        try:
            unit = Unit.objects.get(id=unit_id)
            if profile.role != 'SUPERADMIN' and unit != profile.unit:
                return Response(
                    {'error': 'Cannot assign user to a different unit'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Unit.DoesNotExist:
            return Response(
                {'error': 'Invalid unit_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            
            # Create profile
            UserProfile.objects.create(
                user=user,
                role=role,
                unit=unit
            )
            
            # Log the action
            from .base import log_workflow_action
            log_workflow_action(
                request.user,
                unit,
                'CREATE',
                message=f"Created user: {username} with role {role}"
            )
        
        return Response(
            {
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(user.profile).data,
                'message': 'User created successfully'
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['put', 'patch'], url_path='update-user')
    def update_user(self, request, pk=None):
        """Update user and profile."""
        user = self.get_object()
        profile = get_user_profile(request.user)
        user_profile = getattr(user, 'profile', None)
        
        if not profile:
            return Response(
                {'error': 'User profile not found. Please contact administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user_profile:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if profile.role != 'SUPERADMIN':
            if user_profile.unit != profile.unit:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Update user fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name'] or ''
        if 'last_name' in request.data:
            user.last_name = request.data['last_name'] or ''
        if 'email' in request.data:
            email = request.data['email']
            if not email or not email.strip():
                return Response(
                    {'error': 'Email is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            email = email.strip()
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response(
                    {'error': 'Email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = email
        if 'is_active' in request.data:
            if profile.role != 'SUPERADMIN':
                return Response(
                    {'error': 'Only superadmins can change user active status'},
                    status=status.HTTP_403_FORBIDDEN
                )
            user.is_active = request.data['is_active']
        if 'password' in request.data and request.data['password']:
            password = request.data['password'].strip()
            if password:
                user.set_password(password)
        user.save()
        
        # Update profile
        if 'role' in request.data:
            if profile.role != 'SUPERADMIN':
                return Response(
                    {'error': 'Only superadmins can change user roles'},
                    status=status.HTTP_403_FORBIDDEN
                )
            user_profile.role = request.data['role']
        
        if 'unit_id' in request.data:
            if profile.role != 'SUPERADMIN':
                return Response(
                    {'error': 'Only superadmins can change user units'},
                    status=status.HTTP_403_FORBIDDEN
                )
            try:
                unit = Unit.objects.get(id=request.data['unit_id'])
                user_profile.unit = unit
            except Unit.DoesNotExist:
                return Response(
                    {'error': 'Invalid unit_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        user_profile.save()
        
        from .base import log_workflow_action
        log_workflow_action(
            request.user,
            user_profile.unit,
            'UPDATE',
            message=f"Updated user: {user.username}"
        )
        
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(user_profile).data,
            'message': 'User updated successfully'
        })
    
    @action(detail=True, methods=['delete'], url_path='delete-user')
    def delete_user(self, request, pk=None):
        """Delete a user (deactivate instead of hard delete)."""
        user = self.get_object()
        profile = get_user_profile(request.user)
        user_profile = getattr(user, 'profile', None)
        
        if not profile:
            return Response(
                {'error': 'User profile not found. Please contact administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user_profile:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if profile.role != 'SUPERADMIN':
            if user_profile.unit != profile.unit:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Deactivate instead of delete
        user.is_active = False
        user.save()
        
        from .base import log_workflow_action
        log_workflow_action(
            request.user,
            user_profile.unit,
            'UPDATE',
            message=f"Deactivated user: {user.username}"
        )
        
        return Response(
            {'message': 'User deactivated successfully'},
            status=status.HTTP_200_OK
        )
