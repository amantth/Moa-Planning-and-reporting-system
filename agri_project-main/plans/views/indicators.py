"""
Indicator management views for the plans app using Django REST Framework.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied

from ..models import Indicator
from ..serializers import IndicatorSerializer, IndicatorValidationSerializer
from .base import BaseViewSet, can_user_access_unit, get_user_profile


class IndicatorViewSet(BaseViewSet):
    """Indicator management API endpoints."""
    queryset = Indicator.objects.all()
    serializer_class = IndicatorSerializer
    
    def get_queryset(self):
        """Filter indicators based on user role."""
        profile = get_user_profile(self.request.user)
        if not profile:
            return Indicator.objects.none()
        if profile.role == 'SUPERADMIN':
            return Indicator.objects.all()
        return Indicator.objects.filter(owner_unit=profile.unit)
    
    def perform_create(self, serializer):
        """Set owner_unit automatically when creating."""
        from rest_framework.exceptions import PermissionDenied, ValidationError
        from django.db import IntegrityError
        
        profile = get_user_profile(self.request.user)
        
        if not profile:
            raise PermissionDenied('User profile not found. Please contact administrator.')
        
        # Check if owner_unit_id is provided in request data
        owner_unit_id = self.request.data.get('owner_unit_id')
        code = self.request.data.get('code')
        
        # Determine which unit to use
        from ..models import Unit
        target_unit = None
        
        if owner_unit_id:
            # Validate that user has permission to create indicator for this unit
            try:
                requested_unit = Unit.objects.get(id=owner_unit_id)
                if profile.role == 'SUPERADMIN' or requested_unit == profile.unit:
                    target_unit = requested_unit
                else:
                    # User doesn't have permission, use their own unit
                    target_unit = profile.unit
            except Unit.DoesNotExist:
                # Invalid owner_unit_id, use user's unit
                target_unit = profile.unit
        else:
            # No owner_unit_id provided, use user's unit
            target_unit = profile.unit
        
        # Check if indicator code already exists for this unit
        if code and target_unit:
            if Indicator.objects.filter(code=code, owner_unit=target_unit).exists():
                raise ValidationError({
                    'code': [f'An indicator with code "{code}" already exists for this unit.']
                })
        
        try:
            serializer.save(owner_unit=target_unit)
        except IntegrityError as e:
            # Handle unique constraint violation
            if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                raise ValidationError({
                    'code': [f'An indicator with this code already exists for this unit.']
                })
            raise
        
        # Log the action
        self.log_action(
            serializer.instance.owner_unit,
            'CREATE',
            message=f"Created indicator: {serializer.instance.code}"
        )
    
    def perform_update(self, serializer):
        """Log updates and handle custom logic."""
        old_instance = self.get_object()
        serializer.save()
        
        # Log the action
        self.log_action(
            serializer.instance.owner_unit,
            'UPDATE',
            message=f"Updated indicator: {serializer.instance.code}"
        )
    
    def perform_destroy(self, instance):
        """Log deletion."""
        self.log_action(
            instance.owner_unit,
            'DELETE',
            message=f"Deleted indicator: {instance.code}"
        )
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        """Validate indicator code uniqueness within unit."""
        serializer = IndicatorValidationSerializer(data=request.data)
        if serializer.is_valid():
            return Response({'valid': True, 'message': 'Code is available'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_unit(self, request):
        """Get indicators filtered by unit."""
        unit_id = request.query_params.get('unit_id')
        if not unit_id:
            return Response({'error': 'unit_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from ..models import Unit
        try:
            unit = Unit.objects.get(id=unit_id)
            if not can_user_access_unit(request.user, unit):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            indicators = Indicator.objects.filter(owner_unit=unit, active=True)
            serializer = self.get_serializer(indicators, many=True)
            return Response(serializer.data)
        except Unit.DoesNotExist:
            return Response({'error': 'Unit not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle indicator active status."""
        indicator = self.get_object()
        
        if not can_user_access_unit(request.user, indicator.owner_unit):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        indicator.active = not indicator.active
        indicator.save()
        
        action_text = 'activated' if indicator.active else 'deactivated'
        self.log_action(
            indicator.owner_unit,
            'UPDATE',
            message=f"Indicator {indicator.code} {action_text}"
        )
        
        serializer = self.get_serializer(indicator)
        return Response(serializer.data)
