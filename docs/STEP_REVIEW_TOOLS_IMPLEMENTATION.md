# Step Review Tools Implementation

## Overview
This document describes the implementation of step review tools that allow reviewers to mark wizard steps as completed, verified, and approved during the review process.

## Features

### 1. Review Status Tracking
- **Completed**: Indicates all information for a step has been reviewed
- **Verified**: Indicates information has been verified and is accurate
- **Approved**: Indicates step is approved and ready to proceed
- Each status tracks:
  - Boolean flag
  - Timestamp when marked
  - User ID who marked it

### 2. Notes Support
- Optional notes field for each step
- Allows reviewers to add observations or comments
- Debounced updates (1 second) to reduce API calls
- Character count indicator

### 3. Visual Indicators
- Status badges in step navigation (colored dots)
- Tags below step titles showing status
- Color-coded review controls
- Date stamps for each status

## Architecture

### Backend

#### Database Schema
- **Table**: `work_item_step_reviews` (schema: `work_queue`)
- **Key Fields**:
  - `id` (UUID, primary key)
  - `work_item_id` (UUID, foreign key to work_items)
  - `step_id` (string, wizard step identifier)
  - `completed`, `verified`, `approved` (boolean flags)
  - `completed_at`, `verified_at`, `approved_at` (timestamps)
  - `completed_by`, `verified_by`, `approved_by` (user identifiers)
  - `notes` (text, optional)
  - `created_at`, `updated_at` (timestamps)

#### API Endpoints
1. **GET** `/api/workqueue/{id}/step-review`
   - Returns all step review statuses for a work item
   - Response: `Dictionary<string, StepReviewStatusDto>`

2. **PUT** `/api/workqueue/{id}/step-review/{stepId}`
   - Updates step review status
   - Request body: `{ field: "completed"|"verified"|"approved", value: boolean, notes?: string }`
   - Updates the specified field and optionally notes

#### Domain Model
- **Entity**: `WorkItemStepReview`
- **Commands**: `UpdateStepReviewStatusCommand`
- **Queries**: `GetStepReviewStatusQuery`
- **Handlers**: `UpdateStepReviewStatusCommandHandler`, `GetStepReviewStatusQueryHandler`

### Frontend

#### Components
- **WizardStepContent**: Displays review controls for each step
  - Three checkboxes for completed/verified/approved
  - Notes textarea
  - Visual feedback and status indicators

#### State Management
- `stepReviewStatus`: Record of review status per step
- Optimistic updates for better UX
- Automatic rollback on API errors
- localStorage fallback if backend fails

#### API Integration
- `getStepReviewStatus(workItemId)`: Fetches all step reviews
- `updateStepReviewStatus(workItemId, stepId, field, value, notes?)`: Updates status
- Debounced notes updates (1 second delay)

## Database Migration

### Migration File
`20250115000000_AddWorkItemStepReviews.cs`

### To Apply Migration
```bash
cd services/onboarding-api
dotnet ef database update --context WorkQueueDbContext
```

### Migration Details
- Creates `work_item_step_reviews` table
- Adds indexes on `work_item_id` and unique index on `(work_item_id, step_id)`
- Foreign key constraint with cascade delete

## Usage

### For Reviewers
1. Navigate to a review page
2. Select a wizard step
3. Review the step's requirements
4. Mark step as:
   - **Completed**: All information reviewed
   - **Verified**: Information verified and accurate
   - **Approved**: Step approved and ready
5. Optionally add notes
6. Status is automatically saved

### Visual Feedback
- Green dot/badge = Completed
- Blue dot/badge = Verified
- Orange dot/badge = Approved
- Status tags appear below step titles
- Date stamps show when each status was marked

## Error Handling

### Frontend
- Optimistic updates for immediate feedback
- Automatic rollback on API errors
- Toast notifications for status updates
- Silent failures for notes (to avoid interrupting typing)
- localStorage fallback if backend unavailable

### Backend
- Validates work item exists
- Validates field names
- Logs all updates for audit trail
- Returns descriptive error messages

## Performance Considerations

### Debouncing
- Notes updates are debounced (1 second)
- Reduces API calls during typing
- Immediate UI updates for better UX

### Caching
- Review status loaded once on page load
- Optimistic updates reduce perceived latency
- localStorage backup for offline scenarios

## Future Enhancements

### Optional Features
1. **Validation Rules**
   - Require verification before approval
   - Prevent unmarking if later steps depend on it
   - Business logic validation

2. **History Tracking**
   - Track all status changes over time
   - Show who changed what and when
   - Audit trail for compliance

3. **Notifications**
   - Notify when steps are marked
   - Alert on status changes
   - Email summaries

4. **Bulk Operations**
   - Mark multiple steps at once
   - Copy notes between steps
   - Template notes

## Testing Checklist

- [ ] Mark step as completed
- [ ] Mark step as verified
- [ ] Mark step as approved
- [ ] Add notes to step
- [ ] Verify status persists after page refresh
- [ ] Test with multiple users (shared status)
- [ ] Test error scenarios (network failures)
- [ ] Test localStorage fallback
- [ ] Verify debouncing works for notes
- [ ] Check visual indicators display correctly

## Files Modified

### Backend
- `Domain/WorkQueue/Aggregates/WorkItemStepReview.cs` (new)
- `Infrastructure/Persistence/WorkQueue/WorkQueueDbContext.cs`
- `Infrastructure/Migrations/WorkQueue/20250115000000_AddWorkItemStepReviews.cs` (new)
- `Application/WorkQueue/Commands/WorkItemCommands.cs`
- `Application/WorkQueue/Commands/WorkItemCommandHandlers.cs`
- `Application/WorkQueue/Queries/GetWorkItemsQuery.cs`
- `Presentation/Controllers/WorkQueue/WorkQueueController.cs`

### Frontend
- `admin/src/app/review/[id]/page.tsx`
- `admin/src/services/api/workQueueApi.ts`

## Support

For issues or questions, refer to:
- Backend API documentation
- Frontend component documentation
- Database schema documentation

