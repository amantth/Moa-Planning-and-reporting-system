# Office Deletion Backend Fix

This document explains the backend fixes implemented to resolve the 500 server errors when deleting offices (units) with dependencies.

## Problem

The original implementation used `PROTECT` foreign key constraints, which prevented deletion of units that had associated data (users, plans, reports, indicators, child units). This caused 500 server errors when trying to delete units with dependencies.

## Solution

### 1. Model Changes

Updated foreign key constraints in `plans/models.py`:

- **Unit.parent**: Changed from `PROTECT` to `SET_NULL` to allow parent units to be deleted
- **UserProfile.unit**: Changed from `PROTECT` to `SET_NULL` to allow units to be deleted while preserving user accounts

### 2. Enhanced UnitViewSet

Added comprehensive deletion functionality in `plans/views/units.py`:

#### New Methods:
- `destroy()`: Enhanced delete with dependency checking and cascade options
- `_regular_delete_unit()`: Attempt regular deletion with dependency validation
- `_cascade_delete_unit()`: Perform cascade deletion by handling dependencies
- `_check_unit_dependencies()`: Check what dependencies exist for a unit
- `usage()`: API endpoint to get usage information (GET `/units/{id}/usage/`)
- `force_delete()`: API endpoint for force deletion (DELETE `/units/{id}/force_delete/`)
- `cascade_delete()`: API endpoint for cascade deletion (DELETE `/units/{id}/cascade_delete/`)

#### Deletion Strategies:

1. **Regular Delete** (`DELETE /units/{id}/`):
   - Checks for dependencies
   - Returns 400 error with dependency details if dependencies exist
   - Suggests using cascade or force parameters
   - Only deletes if no dependencies

2. **Cascade Delete** (`DELETE /units/{id}/?cascade=true` or `DELETE /units/{id}/force_delete/`):
   - Handles all dependencies automatically:
     - Reassigns users to no unit (unit = None)
     - Reassigns child units to no parent (parent = None)
     - Deletes all indicators owned by the unit
     - Deletes all annual plans (DRAFT and others)
     - Deletes all quarterly reports (DRAFT and others)
   - Uses database transactions for atomicity
   - Logs all actions for audit trail

### 3. API Endpoints

The following endpoints are now available:

```
GET    /api/units/{id}/usage/           # Check dependencies
DELETE /api/units/{id}/                 # Regular delete (fails if dependencies)
DELETE /api/units/{id}/?cascade=true    # Cascade delete
DELETE /api/units/{id}/?force=true      # Force delete (same as cascade)
DELETE /api/units/{id}/force_delete/    # Force delete endpoint
DELETE /api/units/{id}/cascade_delete/  # Cascade delete endpoint
```

### 4. Permission Requirements

- Only `SUPERADMIN` and `STRATEGIC_AFFAIRS` roles can delete units
- All deletion operations require authentication
- Actions are logged in the audit trail

## Installation Steps

### 1. Apply Model Changes

Run the database migration:

```bash
cd agri_project-main
python manage.py migrate
```

### 2. Test the Functionality

Use the management command to test deletion:

```bash
# Check dependencies only
python manage.py test_unit_deletion --unit-id 1 --check-only

# Perform cascade deletion
python manage.py test_unit_deletion --unit-id 1 --cascade
```

### 3. Frontend Integration

The frontend is already configured to use these endpoints:

- Regular delete: `DELETE /api/units/{id}/`
- Force delete: `DELETE /api/units/{id}/?cascade=true`
- Usage check: `GET /api/units/{id}/usage/` (fallback)

## Error Handling

The backend now provides proper JSON error responses instead of HTML error pages:

### Regular Delete with Dependencies:
```json
{
  "error": "Cannot delete unit due to existing dependencies: 4 user(s), 3 annual plan(s), 2 quarterly report(s). Use cascade=true or force=true to remove dependencies.",
  "dependencies": {
    "has_dependencies": true,
    "users_count": 4,
    "plans_count": 3,
    "reports_count": 2,
    "indicators_count": 1,
    "child_units_count": 0
  },
  "suggestion": "Use ?cascade=true or ?force=true to handle dependencies automatically"
}
```

### Successful Cascade Delete:
```json
{
  "message": "Unit \"Test Office\" and all dependencies deleted successfully",
  "dependencies_removed": {
    "users_count": 4,
    "plans_count": 3,
    "reports_count": 2,
    "indicators_count": 1,
    "child_units_count": 0
  }
}
```

## Security Considerations

1. **Data Loss Warning**: Cascade deletion permanently removes data. Use with caution.
2. **Audit Trail**: All deletion actions are logged in the WorkflowAudit table.
3. **Permissions**: Only authorized roles can perform deletions.
4. **Transactions**: All cascade operations use database transactions for consistency.

## Testing

After applying the changes:

1. **Test Regular Delete**: Try deleting a unit with dependencies - should get clear error message
2. **Test Force Delete**: Use cascade=true parameter - should succeed and remove all dependencies
3. **Test Usage Endpoint**: Check `/api/units/{id}/usage/` for dependency information
4. **Verify Audit Logs**: Check WorkflowAudit table for logged actions

## Rollback

If needed, you can rollback the migration:

```bash
python manage.py migrate plans 0001_initial
```

Note: This will restore the PROTECT constraints, so deletion will fail again with dependencies.
