# Create Functionality Implementation Guide

## Overview
This guide documents the implementation of create/edit/delete functionality for all entities in the Planning Performance System.

## Completed ✅

### Backend
1. **User Management API** (`plans/views/users.py`)
   - `POST /api/users/create_user/` - Create user with profile
   - `PUT /api/users/{id}/update_user/` - Update user
   - `DELETE /api/users/{id}/delete_user/` - Deactivate user
   - `GET /api/users/list_with_profiles/` - List users with profiles

2. **Service Functions** (Frontend)
   - `users-service.ts` - Complete CRUD operations
   - `units-service.ts` - Complete CRUD operations
   - `indicators-service.ts` - Complete CRUD operations
   - `plans-service.ts` - Complete CRUD + workflow operations
   - `reports-service.ts` - Complete CRUD + workflow operations

3. **Frontend Pages**
   - `Users.tsx` - Complete with create/edit/delete dialogs

## Implementation Pattern

### For Each Entity (Offices, Indicators, Plans, Reports)

1. **Add Create Button** to the page header
2. **Create Dialog Component** with form fields
3. **Use React Query Mutations** for create/update/delete
4. **Add Edit/Delete Actions** to table rows
5. **Handle Permissions** based on user role

### Example Pattern (from Users.tsx):

```tsx
// 1. State management
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<any>(null);
const [formData, setFormData] = useState<CreateData>({...});

// 2. Mutations
const createMutation = useMutation({
  mutationFn: createEntity,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["entities"] });
    setIsCreateDialogOpen(false);
    toast.success("Created successfully");
  },
});

// 3. Create Dialog
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent>
    {/* Form fields */}
    <Button onClick={handleCreate}>Create</Button>
  </DialogContent>
</Dialog>

// 4. Table Actions
<Button onClick={() => handleEdit(item)}>Edit</Button>
<Button onClick={() => handleDelete(item.id)}>Delete</Button>
```

## Remaining Tasks

### 1. Offices Page (Offices.tsx)
- Add "Create Office" button
- Create dialog with fields: name, type, parent
- Add edit/delete actions
- Use `createUnit`, `updateUnit`, `deleteUnit` from `units-service.ts`

### 2. Indicators Page (Indicators.tsx)
- Add "Create Indicator" button
- Create dialog with fields: code, name, description, owner_unit_id, unit_of_measure
- Add edit/delete actions
- Use `createIndicator`, `updateIndicator`, `deleteIndicator` from `indicators-service.ts`

### 3. Plans Page (Plans.tsx)
- Add "Create Annual Plan" button
- Create dialog with fields: year, unit_id
- Add "Add Target" functionality for each plan
- Add submit/approve/reject actions
- Use functions from `plans-service.ts`

### 4. Reports Page (Reports.tsx)
- Add "Create Quarterly Report" button
- Create dialog with fields: year, quarter, unit_id
- Add "Add Entry" functionality for each report
- Add submit/approve/reject actions
- Use functions from `reports-service.ts`

### 5. Upload Page (Upload.tsx)
- Implement file upload for Excel/CSV
- Use `POST /api/import-export/import_data/`
- Show upload progress
- Display import results

## Backend Endpoints Reference

### Users
- `POST /api/users/create_user/`
- `PUT /api/users/{id}/update_user/`
- `DELETE /api/users/{id}/delete_user/`

### Units (Offices)
- `POST /api/units/` - Already available via ViewSet
- `PUT /api/units/{id}/` - Already available
- `DELETE /api/units/{id}/` - Already available

### Indicators
- `POST /api/indicators/` - Already available via ViewSet
- `PUT /api/indicators/{id}/` - Already available
- `DELETE /api/indicators/{id}/` - Already available

### Annual Plans
- `POST /api/annual-plans/` - Already available via ViewSet
- `PUT /api/annual-plans/{id}/` - Already available
- `DELETE /api/annual-plans/{id}/` - Already available
- `POST /api/annual-plans/{id}/submit/` - Submit for approval
- `POST /api/annual-plans/{id}/approve/` - Approve plan
- `POST /api/annual-plans/{id}/reject/` - Reject plan
- `POST /api/annual-plans/{id}/add_target/` - Add target to plan

### Quarterly Reports
- `POST /api/quarterly-reports/` - Already available via ViewSet
- `PUT /api/quarterly-reports/{id}/` - Already available
- `DELETE /api/quarterly-reports/{id}/` - Already available
- `POST /api/quarterly-reports/{id}/submit/` - Submit for approval
- `POST /api/quarterly-reports/{id}/approve/` - Approve report
- `POST /api/quarterly-reports/{id}/reject/` - Reject report
- `POST /api/quarterly-reports/{id}/add_entry/` - Add entry to report

### Import/Export
- `POST /api/import-export/import_data/` - Upload Excel/CSV
- `GET /api/import-export/export_annual_plans/` - Export plans
- `GET /api/import-export/export_quarterly_reports/` - Export reports
- `GET /api/import-export/export_indicators/` - Export indicators

## Permission Checks

- **SUPERADMIN**: Can create/edit/delete all entities
- **STRATEGIC_AFFAIRS**: Can create users, approve plans/reports
- **STATE_MINISTER**: Can create plans/reports for their unit
- **ADVISOR**: Can create plans/reports for their unit

## Testing Checklist

For each entity:
- [ ] Create new entity
- [ ] Edit existing entity
- [ ] Delete/deactivate entity
- [ ] Validate required fields
- [ ] Check permission restrictions
- [ ] Test error handling
- [ ] Verify data refresh after mutations

## Notes

- All backend ViewSets already support standard CRUD operations
- User creation requires special endpoint due to UserProfile relationship
- Plans and Reports have workflow states (DRAFT → SUBMITTED → APPROVED/REJECTED)
- File uploads for evidence use FormData with multipart/form-data

