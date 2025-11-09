"""
Management command to create default organizational units.

Usage:
    python manage.py create_default_units
"""
from django.core.management.base import BaseCommand
from plans.models import Unit


class Command(BaseCommand):
    help = 'Create default organizational units'

    def handle(self, *args, **options):
        default_units = [
            {
                'name': 'Strategic Affairs Office',
                'type': 'STRATEGIC_AFFAIRS',
                'parent': None
            },
            {
                'name': 'State Minister Office',
                'type': 'STATE_MINISTER',
                'parent': None
            },
            {
                'name': 'State Minister Advisor Office',
                'type': 'ADVISOR',
                'parent': None
            }
        ]

        created_count = 0
        for unit_data in default_units:
            unit, created = Unit.objects.get_or_create(
                name=unit_data['name'],
                defaults={
                    'type': unit_data['type'],
                    'parent': unit_data['parent']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created unit: "{unit.name}" ({unit.get_type_display()})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Unit already exists: "{unit.name}"')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\nCreated {created_count} new unit(s).')
        )

