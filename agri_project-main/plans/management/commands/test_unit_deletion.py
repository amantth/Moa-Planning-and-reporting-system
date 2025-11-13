"""
Management command to test unit deletion functionality.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from plans.models import Unit, UserProfile, AnnualPlan, QuarterlyReport, Indicator


class Command(BaseCommand):
    help = 'Test unit deletion functionality with various scenarios'

    def add_arguments(self, parser):
        parser.add_argument(
            '--unit-id',
            type=int,
            help='ID of the unit to test deletion on',
        )
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check dependencies without deleting',
        )
        parser.add_argument(
            '--cascade',
            action='store_true',
            help='Perform cascade deletion',
        )

    def handle(self, *args, **options):
        unit_id = options.get('unit_id')
        check_only = options.get('check_only', False)
        cascade = options.get('cascade', False)

        if not unit_id:
            self.stdout.write(
                self.style.ERROR('Please provide --unit-id parameter')
            )
            return

        try:
            unit = Unit.objects.get(id=unit_id)
        except Unit.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Unit with ID {unit_id} does not exist')
            )
            return

        self.stdout.write(f'Testing deletion for unit: {unit.name} (ID: {unit.id})')

        # Check dependencies
        dependencies = self.check_dependencies(unit)
        
        self.stdout.write('\nDependency Analysis:')
        self.stdout.write(f'  Users: {dependencies["users_count"]}')
        self.stdout.write(f'  Annual Plans: {dependencies["plans_count"]}')
        self.stdout.write(f'  Quarterly Reports: {dependencies["reports_count"]}')
        self.stdout.write(f'  Indicators: {dependencies["indicators_count"]}')
        self.stdout.write(f'  Child Units: {dependencies["child_units_count"]}')
        self.stdout.write(f'  Has Dependencies: {dependencies["has_dependencies"]}')

        if check_only:
            self.stdout.write('\nCheck complete. No deletion performed.')
            return

        if dependencies['has_dependencies'] and not cascade:
            self.stdout.write(
                self.style.WARNING(
                    '\nUnit has dependencies. Use --cascade to force deletion.'
                )
            )
            return

        # Perform deletion
        if cascade:
            self.stdout.write('\nPerforming cascade deletion...')
            try:
                with transaction.atomic():
                    self.cascade_delete_unit(unit)
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully deleted unit: {unit.name}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to delete unit: {str(e)}')
                )
        else:
            self.stdout.write('\nPerforming regular deletion...')
            try:
                unit.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully deleted unit: {unit.name}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to delete unit: {str(e)}')
                )

    def check_dependencies(self, unit):
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

    def cascade_delete_unit(self, unit):
        """Perform cascade deletion by handling dependencies."""
        # Step 1: Handle user profiles - set unit to None
        user_profiles = UserProfile.objects.filter(unit=unit)
        for profile in user_profiles:
            profile.unit = None
            profile.save()
            self.stdout.write(f'  Reassigned user: {profile.user.username}')

        # Step 2: Handle child units - set parent to None
        child_units = Unit.objects.filter(parent=unit)
        for child in child_units:
            child.parent = None
            child.save()
            self.stdout.write(f'  Reassigned child unit: {child.name}')

        # Step 3: Handle indicators - delete them
        indicators = Indicator.objects.filter(owner_unit=unit)
        for indicator in indicators:
            indicator.delete()
            self.stdout.write(f'  Deleted indicator: {indicator.name}')

        # Step 4: Handle annual plans - delete all
        annual_plans = AnnualPlan.objects.filter(unit=unit)
        for plan in annual_plans:
            plan.delete()
            self.stdout.write(f'  Deleted annual plan: {plan.year} - {plan.status}')

        # Step 5: Handle quarterly reports - delete all
        quarterly_reports = QuarterlyReport.objects.filter(unit=unit)
        for report in quarterly_reports:
            report.delete()
            self.stdout.write(f'  Deleted quarterly report: Q{report.quarter} {report.year} - {report.status}')

        # Step 6: Delete the unit itself
        unit_name = unit.name
        unit.delete()
        self.stdout.write(f'  Deleted unit: {unit_name}')
