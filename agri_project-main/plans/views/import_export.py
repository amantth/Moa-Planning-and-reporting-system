"""
Import/Export views for the plans app using Django REST Framework.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
import csv

from ..models import ImportBatch, AnnualPlan, QuarterlyReport, Indicator, WorkflowAudit, Unit
from ..serializers import ImportBatchSerializer
from .base import BaseViewSet, get_user_profile, can_user_access_unit


class ImportExportViewSet(BaseViewSet):
    """Import/Export API endpoints."""
    queryset = ImportBatch.objects.all()
    serializer_class = ImportBatchSerializer
    
    def get_queryset(self):
        """Filter imports based on user access."""
        profile = get_user_profile(self.request.user)
        
        if profile.role == 'SUPERADMIN':
            return ImportBatch.objects.all()
        else:
            return ImportBatch.objects.filter(unit=profile.unit)
    
    @action(detail=False, methods=['post'])
    def import_data(self, request):
        """Handle Excel import for plans and reports."""
        profile = get_user_profile(request.user)
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        source = request.data.get('source', 'ANNUAL')
        unit_id = request.data.get('unit_id')
        year = request.data.get('year')
        quarter = request.data.get('quarter')
        
        if not all([unit_id, year]):
            return Response(
                {'error': 'Missing required fields: unit_id, year'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if source == 'QUARTERLY' and not quarter:
            return Response(
                {'error': 'Quarter is required for quarterly reports'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            unit = Unit.objects.get(id=unit_id)
            if not can_user_access_unit(request.user, unit):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Unit.DoesNotExist:
            return Response(
                {'error': 'Invalid unit_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create import batch record
        import_batch = ImportBatch.objects.create(
            source=source,
            file=file,
            unit=unit,
            year=int(year),
            quarter=int(quarter) if quarter else None,
            uploaded_by=request.user,
            notes=f'Uploaded via web interface'
        )
        
        # Basic file validation - actual processing would go here
        # For now, we'll just record the upload
        import_batch.records_inserted = 0
        import_batch.records_updated = 0
        import_batch.save()
        
        # Log the action
        from .base import log_workflow_action
        log_workflow_action(
            request.user,
            unit,
            'IMPORT',
            message=f"Uploaded {source} data for year {year}"
        )
        
        return Response({
            'message': 'File uploaded successfully. Processing will be implemented.',
            'batch_id': import_batch.id,
            'status': 'uploaded'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def export_options(self, request):
        """Get available export options."""
        return Response({
            'annual_plans': {
                'endpoint': '/api/import-export/export-annual-plans/',
                'parameters': ['year'],
                'description': 'Export annual plans for a specific year'
            },
            'quarterly_reports': {
                'endpoint': '/api/import-export/export-quarterly-reports/',
                'parameters': ['year', 'quarter'],
                'description': 'Export quarterly reports for a specific year/quarter'
            },
            'indicators': {
                'endpoint': '/api/import-export/export-indicators/',
                'parameters': [],
                'description': 'Export all indicators'
            },
            'audit_log': {
                'endpoint': '/api/import-export/export-audit-log/',
                'parameters': [],
                'description': 'Export audit log'
            }
        })
    
    @action(detail=False, methods=['get'])
    def export_annual_plans(self, request):
        """Export all annual plans for a year."""
        profile = get_user_profile(request.user)
        year = request.query_params.get('year', timezone.now().year)
        
        # Get accessible units
        if profile.role == 'SUPERADMIN':
            accessible_units = Unit.objects.all()
        else:
            accessible_units = [profile.unit]
        
        # Get annual plans
        annual_plans = AnnualPlan.objects.filter(
            year=year,
            unit__in=accessible_units
        ).select_related('unit', 'created_by')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="annual_plans_{year}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Unit', 'Year', 'Status', 'Created By', 'Submitted At', 'Approved By', 'Approved At'
        ])
        
        for plan in annual_plans:
            writer.writerow([
                plan.unit.name,
                plan.year,
                plan.get_status_display(),
                plan.created_by.username,
                plan.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if plan.submitted_at else '',
                plan.approved_by.username if plan.approved_by else '',
                plan.approved_at.strftime('%Y-%m-%d %H:%M:%S') if plan.approved_at else ''
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_quarterly_reports(self, request):
        """Export quarterly reports for a year/quarter."""
        profile = get_user_profile(request.user)
        year = request.query_params.get('year', timezone.now().year)
        quarter = request.query_params.get('quarter')
        
        # Get accessible units
        if profile.role == 'SUPERADMIN':
            accessible_units = Unit.objects.all()
        else:
            accessible_units = [profile.unit]
        
        # Get quarterly reports
        queryset = QuarterlyReport.objects.filter(
            year=year,
            unit__in=accessible_units
        ).select_related('unit', 'created_by')
        
        if quarter:
            queryset = queryset.filter(quarter=quarter)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        filename = f"quarterly_reports_{year}"
        if quarter:
            filename += f"_Q{quarter}"
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Unit', 'Year', 'Quarter', 'Status', 'Created By', 'Submitted At', 'Approved By', 'Approved At'
        ])
        
        for report in queryset:
            writer.writerow([
                report.unit.name,
                report.year,
                report.get_quarter_display(),
                report.get_status_display(),
                report.created_by.username,
                report.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if report.submitted_at else '',
                report.approved_by.username if report.approved_by else '',
                report.approved_at.strftime('%Y-%m-%d %H:%M:%S') if report.approved_at else ''
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_indicators(self, request):
        """Export all indicators."""
        profile = get_user_profile(request.user)
        
        # Get accessible units
        if profile.role == 'SUPERADMIN':
            accessible_units = Unit.objects.all()
        else:
            accessible_units = [profile.unit]
        
        # Get indicators
        indicators = Indicator.objects.filter(
            owner_unit__in=accessible_units
        ).select_related('owner_unit')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="indicators.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Code', 'Name', 'Description', 'Owner Unit', 'Unit of Measure', 'Active'
        ])
        
        for indicator in indicators:
            writer.writerow([
                indicator.code,
                indicator.name,
                indicator.description or '',
                indicator.owner_unit.name,
                indicator.unit_of_measure or '',
                'Yes' if indicator.active else 'No'
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_audit_log(self, request):
        """Export audit log."""
        profile = get_user_profile(request.user)
        
        # Get accessible units
        if profile.role == 'SUPERADMIN':
            accessible_units = Unit.objects.all()
        else:
            accessible_units = [profile.unit]
        
        # Get audit logs
        audit_logs = WorkflowAudit.objects.filter(
            unit__in=accessible_units
        ).select_related('actor', 'unit', 'context_plan', 'context_report').order_by('-created_at')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_log.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Actor', 'Unit', 'Action', 'Context Plan', 'Context Report', 'Message', 'Created At'
        ])
        
        for log in audit_logs:
            writer.writerow([
                log.actor.username,
                log.unit.name,
                log.get_action_display(),
                f"{log.context_plan.unit.name} - {log.context_plan.year}" if log.context_plan else '',
                f"{log.context_report.unit.name} - Q{log.context_report.quarter} {log.context_report.year}" if log.context_report else '',
                log.message or '',
                log.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def recent_imports(self, request):
        """Get recent imports for the user's unit."""
        profile = get_user_profile(request.user)
        
        recent_imports = ImportBatch.objects.filter(
            unit=profile.unit
        ).order_by('-uploaded_at')[:10]
        
        serializer = ImportBatchSerializer(recent_imports, many=True)
        return Response(serializer.data)