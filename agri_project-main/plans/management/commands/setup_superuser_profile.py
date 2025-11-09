"""
Management command to create a UserProfile for a superuser.

Usage:
    python manage.py setup_superuser_profile <username> [--role ROLE] [--unit-id UNIT_ID]
    
Examples:
    python manage.py setup_superuser_profile admin
    python manage.py setup_superuser_profile admin --role SUPERADMIN
    python manage.py setup_superuser_profile admin --unit-id 1
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from plans.models import Unit, UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a UserProfile for a superuser'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument(
            '--role',
            type=str,
            choices=['SUPERADMIN', 'STRATEGIC_AFFAIRS', 'STATE_MINISTER', 'ADVISOR'],
            default='SUPERADMIN',
            help='Role for the user profile (default: SUPERADMIN)'
        )
        parser.add_argument(
            '--unit-id',
            type=int,
            help='ID of the unit to assign. If not provided, will create or use a default Strategic Affairs Office unit.'
        )

    def handle(self, *args, **options):
        username = options['username']
        role = options['role']
        unit_id = options.get('unit_id')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist.')

        # Check if profile already exists
        if hasattr(user, 'profile'):
            self.stdout.write(
                self.style.WARNING(
                    f'User "{username}" already has a profile with role "{user.profile.role}" and unit "{user.profile.unit.name}".'
                )
            )
            if input('Do you want to update it? (yes/no): ') != 'yes':
                self.stdout.write(self.style.SUCCESS('Operation cancelled.'))
                return
            
            # Update existing profile
            if unit_id:
                try:
                    unit = Unit.objects.get(id=unit_id)
                except Unit.DoesNotExist:
                    raise CommandError(f'Unit with ID {unit_id} does not exist.')
                user.profile.unit = unit
            else:
                # Get or create default Strategic Affairs Office
                unit, _ = Unit.objects.get_or_create(
                    name='Strategic Affairs Office',
                    defaults={'type': 'STRATEGIC_AFFAIRS'}
                )
                user.profile.unit = unit
            
            user.profile.role = role
            user.profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated profile for "{username}" with role "{role}" and unit "{user.profile.unit.name}".'
                )
            )
            return

        # Get or create unit
        if unit_id:
            try:
                unit = Unit.objects.get(id=unit_id)
            except Unit.DoesNotExist:
                raise CommandError(f'Unit with ID {unit_id} does not exist.')
        else:
            # Create or get default Strategic Affairs Office
            unit, created = Unit.objects.get_or_create(
                name='Strategic Affairs Office',
                defaults={'type': 'STRATEGIC_AFFAIRS'}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created default unit: "{unit.name}"')
                )

        # Create profile
        profile = UserProfile.objects.create(
            user=user,
            role=role,
            unit=unit
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created profile for "{username}" with role "{role}" and unit "{unit.name}".'
            )
        )

