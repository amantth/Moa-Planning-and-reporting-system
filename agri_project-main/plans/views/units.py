"""
Unit management views for the plans app using Django REST Framework.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.contrib.auth.models import User

from ..models import Unit, Indicator, AnnualPlan, QuarterlyReport, UserProfile, WorkflowAudit
from ..serializers import UnitSerializer, IndicatorNestedSerializer, AnnualPlanListSerializer, QuarterlyReportListSerializer
from .base import BaseViewSet, can_user_access_unit, get_user_profile


class UnitViewSet(BaseViewSet):
    """Unit management API endpoints."""
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = []  # Allow any authenticated user
    
    def get_queryset(self):
        """Filter units based on user role."""
        # Handle anonymous users
        if not self.request.user.is_authenticated:
            return Unit.objects.none()
            
        profile = get_user_profile(self.request.user)
        
        # Handle case where profile doesn't exist
        if not profile:
            return Unit.objects.all()  # Allow viewing all units if no profile
        
        if profile.role == 'SUPERADMIN':
            return Unit.objects.all()
        else:
            return Unit.objects.filter(id=profile.unit.id)
    
    def perform_create(self, serializer):
        """Handle unit creation with validation."""
        from rest_framework.exceptions import PermissionDenied, ValidationError
        from django.db import IntegrityError
        
        profile = get_user_profile(self.request.user)
        
        if not profile:
            raise PermissionDenied('User profile not found. Please contact administrator.')
        
        # Check if unit name already exists
        name = self.request.data.get('name')
        if name:
            if Unit.objects.filter(name=name).exists():
                raise ValidationError({
                    'name': [f'A unit with name "{name}" already exists.']
                })
        
        try:
            serializer.save()
        except IntegrityError as e:
            # Handle unique constraint violation
            if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                raise ValidationError({
                    'name': [f'A unit with this name already exists.']
                })
            raise
        
        # Log the action (use the created unit)
        if serializer.instance:
            self.log_action(
                serializer.instance,
                'CREATE',
                message=f"Created unit: {serializer.instance.name}"
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Get unit details with related data."""
        unit = self.get_object()
        
        if not can_user_access_unit(request.user, unit):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get related data
        indicators = unit.indicators.filter(active=True)
        annual_plans = unit.annual_plans.order_by('-year')[:5]
        quarterly_reports = unit.quarterly_reports.order_by('-year', '-quarter')[:5]
        
        # Serialize the main unit
        unit_serializer = self.get_serializer(unit)
        
        # Serialize related data
        indicators_data = IndicatorNestedSerializer(indicators, many=True).data
        annual_plans_data = AnnualPlanListSerializer(annual_plans, many=True).data
        quarterly_reports_data = QuarterlyReportListSerializer(quarterly_reports, many=True).data
        
        response_data = unit_serializer.data
        response_data.update({
            'indicators': indicators_data,
            'annual_plans': annual_plans_data,
            'quarterly_reports': quarterly_reports_data,
        })
        
        return Response(response_data)
    
    @action(detail=True, methods=['get'])
    def indicators(self, request, pk=None):
        """Get indicators for a specific unit."""
        unit = self.get_object()
        
        if not can_user_access_unit(request.user, unit):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        indicators = unit.indicators.filter(active=True)
        serializer = IndicatorNestedSerializer(indicators, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def annual_plans(self, request, pk=None):
        """Get annual plans for a specific unit."""
        unit = self.get_object()
        
        if not can_user_access_unit(request.user, unit):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        year = request.query_params.get('year')
        queryset = unit.annual_plans.all()
        
        if year:
            queryset = queryset.filter(year=year)
        
        queryset = queryset.order_by('-year')[:10]  # Limit to 10 most recent
        serializer = AnnualPlanListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def quarterly_reports(self, request, pk=None):
        """Get quarterly reports for a specific unit."""
        unit = self.get_object()
        
        if not can_user_access_unit(request.user, unit):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        year = request.query_params.get('year')
        quarter = request.query_params.get('quarter')
        
        queryset = unit.quarterly_reports.all()
        
        if year:
            queryset = queryset.filter(year=year)
        if quarter:
            queryset = queryset.filter(quarter=quarter)
        
        queryset = queryset.order_by('-year', '-quarter')[:10]  # Limit to 10 most recent
        serializer = QuarterlyReportListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get statistics for a specific unit."""
        unit = self.get_object()
        
        if not can_user_access_unit(request.user, unit):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.utils import timezone
        current_year = timezone.now().year
        
        stats = {
            'indicators_count': unit.indicators.filter(active=True).count(),
            'annual_plans_count': unit.annual_plans.filter(year=current_year).count(),
            'quarterly_reports_count': unit.quarterly_reports.filter(year=current_year).count(),
            'pending_approvals': unit.annual_plans.filter(
                year=current_year,
                status='SUBMITTED'
            ).count(),
        }
        
        return Response(stats)
    
    def destroy(self, request, *args, **kwargs):
        """Enhanced delete with dependency checking and cascade options."""
        unit = self.get_object()
        
        # Check permissions
        profile = get_user_profile(request.user)
        if not profile or profile.role not in ['SUPERADMIN', 'STRATEGIC_AFFAIRS']:
            return Response(
                {'error': 'You do not have permission to delete units'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check for cascade parameter
        cascade = request.query_params.get('cascade', 'false').lower() == 'true'
        force = request.query_params.get('force', 'false').lower() == 'true'
        
        try:
            if cascade or force:
                return self._cascade_delete_unit(unit, request.user)
            else:
                return self._regular_delete_unit(unit, request.user)
        except Exception as e:
            return Response(
                {'error': f'Failed to delete unit: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _regular_delete_unit(self, unit, user):
        """Attempt regular deletion with dependency checking."""
        # Check for dependencies
        dependencies = self._check_unit_dependencies(unit)
        
        if dependencies['has_dependencies']:
            error_msg = "Cannot delete unit due to existing dependencies: "
            dep_list = []
            if dependencies['users_count'] > 0:
                dep_list.append(f"{dependencies['users_count']} user(s)")
            if dependencies['plans_count'] > 0:
                dep_list.append(f"{dependencies['plans_count']} annual plan(s)")
            if dependencies['reports_count'] > 0:
                dep_list.append(f"{dependencies['reports_count']} quarterly report(s)")
            if dependencies['indicators_count'] > 0:
                dep_list.append(f"{dependencies['indicators_count']} indicator(s)")
            if dependencies['child_units_count'] > 0:
                dep_list.append(f"{dependencies['child_units_count']} child unit(s)")
            
            error_msg += ", ".join(dep_list)
            error_msg += ". Use cascade=true or force=true to remove dependencies."
            
            return Response(
                {
                    'error': error_msg,
                    'dependencies': dependencies,
                    'suggestion': 'Use ?cascade=true or ?force=true to handle dependencies automatically'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # No dependencies, safe to delete
        unit_name = unit.name
        unit.delete()
        
        # Log the action
        self.log_action(unit, 'DELETE', message=f"Deleted unit: {unit_name}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @transaction.atomic
    def _cascade_delete_unit(self, unit, user):
        """Perform cascade deletion by handling dependencies."""
        unit_name = unit.name
        dependencies = self._check_unit_dependencies(unit)
        
        # Log what we're about to delete
        self.log_action(
            unit, 
            'DELETE', 
            message=f"Starting cascade deletion of unit: {unit_name} with {dependencies}"
        )
        
        try:
            # Step 1: Handle user profiles - reassign to None or delete profiles
            user_profiles = UserProfile.objects.filter(unit=unit)
            for profile in user_profiles:
                profile.unit = None  # Remove unit assignment
                profile.save()
            
            # Step 2: Handle child units - set parent to None
            child_units = Unit.objects.filter(parent=unit)
            for child in child_units:
                child.parent = None
                child.save()
            
            # Step 3: Handle indicators - delete or reassign
            indicators = Indicator.objects.filter(owner_unit=unit)
            for indicator in indicators:
                # Delete the indicator (this will cascade to related targets/entries)
                indicator.delete()
            
            # Step 4: Handle annual plans - delete DRAFT, keep others but remove unit reference
            annual_plans = AnnualPlan.objects.filter(unit=unit)
            for plan in annual_plans:
                if plan.status == 'DRAFT':
                    plan.delete()  # Safe to delete draft plans
                else:
                    # For submitted/approved plans, we need to handle carefully
                    # Option 1: Delete anyway (data loss)
                    # Option 2: Set unit to None (orphan the plan)
                    # For now, we'll delete all plans in cascade mode
                    plan.delete()
            
            # Step 5: Handle quarterly reports - similar to annual plans
            quarterly_reports = QuarterlyReport.objects.filter(unit=unit)
            for report in quarterly_reports:
                if report.status == 'DRAFT':
                    report.delete()
                else:
                    # Delete all reports in cascade mode
                    report.delete()
            
            # Step 6: Delete the unit itself
            unit.delete()
            
            # Log successful deletion
            WorkflowAudit.objects.create(
                actor=user,
                unit=None,  # Unit is deleted
                action='DELETE',
                message=f"Successfully cascade deleted unit: {unit_name} and all dependencies"
            )
            
            return Response({
                'message': f'Unit "{unit_name}" and all dependencies deleted successfully',
                'dependencies_removed': dependencies
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log the error
            self.log_action(
                unit, 
                'DELETE', 
                message=f"Failed to cascade delete unit: {unit_name}. Error: {str(e)}"
            )
            raise e
    
    def _check_unit_dependencies(self, unit):
        """Check what dependencies exist for a unit."""
        users_count = UserProfile.objects.filter(unit=unit).count()
        plans_count = AnnualPlan.objects.filter(unit=unit).count()
        reports_count = QuarterlyReport.objects.filter(unit=unit).count()
        indicators_count = Indicator.objects.filter(owner_unit=unit).count()
        child_units_count = Unit.objects.filter(parent=unit).count()
        
        return {
            'has_dependencies': any([
                users_count > 0,
                plans_count > 0,
                reports_count > 0,
                indicators_count > 0,
                child_units_count > 0
            ]),
            'users_count': users_count,
            'plans_count': plans_count,
            'reports_count': reports_count,
            'indicators_count': indicators_count,
            'child_units_count': child_units_count
        }
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get usage information for a unit (dependencies)."""
        unit = self.get_object()
        
        # Check permissions
        profile = get_user_profile(request.user)
        if not profile:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        dependencies = self._check_unit_dependencies(unit)
        
        return Response({
            'unit_id': unit.id,
            'unit_name': unit.name,
            'dependencies': dependencies,
            'can_delete_safely': not dependencies['has_dependencies']
        })
    
    @action(detail=True, methods=['delete'])
    def force_delete(self, request, pk=None):
        """Force delete a unit with all dependencies."""
        unit = self.get_object()
        
        # Check permissions
        profile = get_user_profile(request.user)
        if not profile or profile.role not in ['SUPERADMIN', 'STRATEGIC_AFFAIRS']:
            return Response(
                {'error': 'You do not have permission to force delete units'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return self._cascade_delete_unit(unit, request.user)
    
    @action(detail=True, methods=['delete'])
    def cascade_delete(self, request, pk=None):
        """Cascade delete a unit with all dependencies."""
        return self.force_delete(request, pk)
