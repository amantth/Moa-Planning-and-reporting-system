"""
Import/Export views for the plans app using Django REST Framework.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from django.db import transaction
import csv
import pandas as pd
import io

from ..models import ImportBatch, AnnualPlan, QuarterlyReport, Indicator, WorkflowAudit, Unit, AnnualPlanTarget, QuarterlyIndicatorEntry
from ..serializers import ImportBatchSerializer
from .base import BaseViewSet, get_user_profile


class ImportExportViewSet(BaseViewSet):
    """Import/Export API endpoints."""
    queryset = ImportBatch.objects.all()
    serializer_class = ImportBatchSerializer
    permission_classes = []  # Allow any authenticated user
    
    def get_queryset(self):
        """Filter imports based on user access."""
        # Handle anonymous users
        if not self.request.user.is_authenticated:
            return ImportBatch.objects.none()
            
        profile = get_user_profile(self.request.user)
        
        # Handle case where profile doesn't exist
        if not profile:
            return ImportBatch.objects.all()
        
        if profile.role == 'SUPERADMIN':
            return ImportBatch.objects.all()
        else:
            return ImportBatch.objects.filter(unit=profile.unit)
    
    @action(detail=False, methods=['post'], url_path='import_data')
    def import_data(self, request):
        """Handle Excel/CSV import for plans and reports."""
        # Handle anonymous users
        if not self.request.user.is_authenticated:
            return Response({
                'error': 'Authentication required.'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        profile = get_user_profile(request.user)
        if not profile:
            return Response({
                'error': 'User profile not found.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get parameters
        file_obj = request.FILES.get('file')
        source = request.data.get('source', 'ANNUAL')  # ANNUAL or QUARTERLY
        unit_id = request.data.get('unit_id')
        year = request.data.get('year')
        quarter = request.data.get('quarter')
        
        # Validate inputs
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not unit_id:
            return Response({'error': 'Unit ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not year:
            return Response({'error': 'Year is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            unit = Unit.objects.get(id=unit_id)
        except Unit.DoesNotExist:
            return Response({'error': 'Unit not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        if profile.role != 'SUPERADMIN' and profile.unit != unit:
            return Response({'error': 'You do not have permission to import data for this unit'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Read the file
            file_extension = file_obj.name.split('.')[-1].lower()
            
            if file_extension in ['xlsx', 'xls']:
                df = pd.read_excel(file_obj)
            elif file_extension == 'csv':
                df = pd.read_csv(file_obj)
            else:
                return Response({'error': 'Unsupported file format. Please upload .xlsx, .xls, or .csv'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Process the data based on source type
            with transaction.atomic():
                if source == 'ANNUAL':
                    result = self._process_annual_plan(df, unit, year, request.user)
                elif source == 'QUARTERLY':
                    if not quarter:
                        return Response({'error': 'Quarter is required for quarterly reports'}, 
                                      status=status.HTTP_400_BAD_REQUEST)
                    result = self._process_quarterly_report(df, unit, year, quarter, request.user)
                else:
                    return Response({'error': 'Invalid source type'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Create import batch record
                import_batch = ImportBatch.objects.create(
                    unit=unit,
                    uploaded_by=request.user,
                    file_name=file_obj.name,
                    source=source,
                    status='COMPLETED',
                    records_processed=result.get('processed', 0),
                    records_failed=result.get('failed', 0)
                )
                
                return Response({
                    'message': 'Import completed successfully',
                    'processed': result.get('processed', 0),
                    'failed': result.get('failed', 0),
                    'errors': result.get('errors', [])
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': f'Import failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _process_annual_plan(self, df, unit, year, user):
        """Process annual plan data from DataFrame."""
        processed = 0
        failed = 0
        errors = []
        
        # Get or create annual plan
        annual_plan, created = AnnualPlan.objects.get_or_create(
            unit=unit,
            year=year,
            defaults={'created_by': user, 'status': 'DRAFT'}
        )
        
        # Expected columns: indicator_code, target_value, baseline_value, remarks
        for index, row in df.iterrows():
            try:
                indicator_code = str(row.get('indicator_code', '')).strip()
                if not indicator_code:
                    continue
                
                # Find indicator
                try:
                    indicator = Indicator.objects.get(code=indicator_code)
                except Indicator.DoesNotExist:
                    errors.append(f"Row {index + 2}: Indicator '{indicator_code}' not found")
                    failed += 1
                    continue
                
                # Create or update target
                target, created = AnnualPlanTarget.objects.update_or_create(
                    annual_plan=annual_plan,
                    indicator=indicator,
                    defaults={
                        'target_value': float(row.get('target_value', 0)),
                        'baseline_value': float(row.get('baseline_value', 0)),
                        'remarks': str(row.get('remarks', ''))
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                failed += 1
        
        return {'processed': processed, 'failed': failed, 'errors': errors}
    
    def _process_quarterly_report(self, df, unit, year, quarter, user):
        """Process quarterly report data from DataFrame."""
        processed = 0
        failed = 0
        errors = []
        
        # Get or create quarterly report
        quarterly_report, created = QuarterlyReport.objects.get_or_create(
            unit=unit,
            year=year,
            quarter=quarter,
            defaults={'created_by': user, 'status': 'DRAFT'}
        )
        
        # Expected columns: indicator_code, achieved_value, remarks
        for index, row in df.iterrows():
            try:
                indicator_code = str(row.get('indicator_code', '')).strip()
                if not indicator_code:
                    continue
                
                # Find indicator
                try:
                    indicator = Indicator.objects.get(code=indicator_code)
                except Indicator.DoesNotExist:
                    errors.append(f"Row {index + 2}: Indicator '{indicator_code}' not found")
                    failed += 1
                    continue
                
                # Create or update entry
                entry, created = QuarterlyIndicatorEntry.objects.update_or_create(
                    quarterly_report=quarterly_report,
                    indicator=indicator,
                    defaults={
                        'achieved_value': float(row.get('achieved_value', 0)),
                        'remarks': str(row.get('remarks', ''))
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                failed += 1
        
        return {'processed': processed, 'failed': failed, 'errors': errors}
    
    @action(detail=False, methods=['get'], url_path='export_options')
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
    
    @action(detail=False, methods=['get'], url_path='export_annual_plans')
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
    
    @action(detail=False, methods=['get'], url_path='export_quarterly_reports')
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
    
    @action(detail=False, methods=['get'], url_path='export_indicators')
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
    
    @action(detail=False, methods=['get'], url_path='export_audit_log')
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
    
    @action(detail=False, methods=['get'], url_path='recent_imports')
    def recent_imports(self, request):
        """Get recent imports for the user's unit."""
        profile = get_user_profile(request.user)
        
        recent_imports = ImportBatch.objects.filter(
            unit=profile.unit
        ).order_by('-uploaded_at')[:10]
        
        serializer = ImportBatchSerializer(recent_imports, many=True)
        return Response(serializer.data)