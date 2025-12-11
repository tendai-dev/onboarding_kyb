# Enhanced Risk Assessment (ERA) Workflow Logic

## Overview

The Enhanced Risk Assessment (ERA) is a comprehensive risk evaluation process that should **only** be triggered for cases classified as **High** or **Critical** risk. Low-risk cases should not require this enhanced workflow.

## Current Implementation Analysis

### 1. Risk Level Enumeration

**Backend Definition** (`services/onboarding-api/src/Domain/Risk/ValueObjects/RiskValueObjects.cs`):
```csharp
public enum RiskLevel
{
    Unknown = 0,
    Low = 1,
    MediumLow = 2,
    Medium = 3,
    MediumHigh = 4,
    High = 5
}
```

**Note**: There is no explicit "Critical" level in the enum, but the frontend uses "CRITICAL" as a string value.

### 2. Risk Assessment Creation

**Location**: `services/onboarding-api/src/Application/Risk/Commands/RiskCommandHandlers.cs`

- Risk assessments are created **manually** by authorized personnel
- All risk classifications must be done through **manual review** (no automatic calculation)
- When created, risk level defaults to `Unknown` until manually classified
- The system does **NOT automatically trigger ERA** based on risk level

### 3. Frontend Logic - Enhanced Risk Analysis Fields

**Location**: `admin/src/app/review/[id]/page.tsx`

**Conditional Display** (Lines 4233-4237):
```typescript
{(manualRiskLevel === 'HIGH' ||
  manualRiskLevel === 'CRITICAL' ||
  riskAssessment?.overallRiskLevel === 'HIGH' ||
  riskAssessment?.overallRiskLevel === 'CRITICAL') && (
  // Enhanced Risk Analysis fields shown here
)}
```

**Validation** (Lines 2538-2550):
```typescript
// Validate enhanced risk analysis fields for HIGH/CRITICAL
if (
  (manualRiskLevel === 'HIGH' || manualRiskLevel === 'CRITICAL') &&
  !riskFactors.trim()
) {
  showToast(
    'Validation Error',
    'Please provide risk factors identified for high/critical risk assessments',
    'error',
    5000
  );
  return;
}
```

**Auto-Clear Logic** (Lines 2714-2720):
```typescript
// Clear enhanced risk analysis fields when risk level changes away from HIGH/CRITICAL
if (manualRiskLevel && manualRiskLevel !== 'HIGH' && manualRiskLevel !== 'CRITICAL') {
  setRiskFactors('');
  setMitigationMeasures('');
  setAdditionalNotes('');
}
```

### 4. Enhanced Risk Assessment Form Access

**Location**: `admin/src/app/risk-assessment/[id]/page.tsx`

**Current State**: 
- The form is accessible via `/risk-assessment/{assessmentId}`
- Access is **NOT currently gated** by risk level
- Any risk assessment can be opened, regardless of risk level
- The form is titled "Mukuru Group High-Risk Assessment and Approval Form"

**Access Points**:
1. From Risk Review page: `router.push(\`/risk-assessment/${row.id}\`)` (Line 399 in risk-review/page.tsx)
2. From Review page: Link to "View Detailed Risk Assessment" (Line 4257 in review/[id]/page.tsx)

### 5. Risk Review Page Filtering

**Location**: `admin/src/app/risk-review/page.tsx`

**High Risk Tab Filter** (Lines 175-176):
```typescript
} else if (activeTab === 'High Risk') {
  matchesTab = assessment.overallRiskLevel === 'High' || assessment.overallRiskLevel === 'Critical';
}
```

**High Risk Count** (Line 193):
```typescript
const highRisk = assessments.filter((a) => a.overallRiskLevel === 'High' || a.overallRiskLevel === 'Critical').length;
```

## Issues Identified

### ❌ **Problem 1: No Access Control on ERA Form**

The Enhanced Risk Assessment form (`/risk-assessment/[id]`) is **not gated** by risk level. Currently:
- Any risk assessment can access the form
- Low-risk cases can be opened and filled out
- No validation prevents Low-risk cases from using the form

### ❌ **Problem 2: No Backend Enforcement**

The backend does not enforce that ERA should only be for High/Critical cases:
- Risk assessment creation doesn't check risk level
- No validation in the API layer
- The form can be saved regardless of risk level

### ⚠️ **Problem 3: Inconsistent Risk Level Values**

- Backend enum uses: `Low`, `MediumLow`, `Medium`, `MediumHigh`, `High`
- Frontend uses: `'LOW'`, `'HIGH'`, `'CRITICAL'` (uppercase strings)
- No explicit "Critical" in backend enum, but frontend references it

## Recommended Solutions

### 1. Add Access Control to ERA Form

**File**: `admin/src/app/risk-assessment/[id]/page.tsx`

Add risk level check on page load:

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (assessmentId) {
        const assessment = await riskApiService.getRiskAssessmentById(assessmentId);
        setRiskAssessment(assessment);
        
        // ENFORCEMENT: Only allow High or Critical risk cases
        const riskLevel = assessment.overallRiskLevel?.toUpperCase();
        if (riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL') {
          setError('Enhanced Risk Assessment is only available for High or Critical risk cases.');
          router.push('/risk-review');
          return;
        }
        
        // Pre-fill entity name if available
        if ((assessment as any).entityName) {
          setFullEntityName((assessment as any).entityName);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading risk assessment:', err);
      setError('Failed to load risk assessment');
      setLoading(false);
    }
  };

  loadData();
}, [assessmentId, router]);
```

### 2. Gate Access from Risk Review Page

**File**: `admin/src/app/risk-review/page.tsx`

Only show "Review" button for High/Critical cases:

```typescript
const actionColumn = {
  header: 'ACTIONS',
  width: '100px',
  render: (row: RiskReviewItem) => {
    const riskLevel = row.overallRiskLevel?.toUpperCase();
    const isHighOrCritical = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
    
    if (!isHighOrCritical) {
      return (
        <Typography fontSize="sm" color="mukuru.grey.medium">
          N/A
        </Typography>
      );
    }
    
    return (
      <Button
        size="sm"
        variant="primary"
        onClick={() => router.push(`/risk-assessment/${row.id}`)}
      >
        Review
      </Button>
    );
  },
};
```

### 3. Add Backend Validation

**File**: `services/onboarding-api/src/Presentation/Controllers/Risk/RiskAssessmentController.cs`

Add validation when accessing ERA endpoints:

```csharp
// Check if risk level requires ERA
if (assessment.OverallRiskLevel != RiskLevel.High)
{
    return BadRequest(new { 
        error = "Enhanced Risk Assessment is only available for High or Critical risk cases." 
    });
}
```

### 4. Update Risk Review Page Filtering

**File**: `admin/src/app/risk-review/page.tsx`

Ensure only High/Critical cases appear in the list that can access ERA:

```typescript
// Filter to only show High/Critical cases for ERA access
const highRiskAssessments = assessments.filter(
  (a) => {
    const level = a.overallRiskLevel?.toUpperCase();
    return level === 'HIGH' || level === 'CRITICAL';
  }
);
```

## Current Workflow

1. **Risk Assessment Created**: Manual creation, starts with `Unknown` risk level
2. **Risk Level Set**: Reviewer manually sets risk level (Low, Medium, High, etc.)
3. **Enhanced Analysis Fields**: Only shown if risk level is HIGH or CRITICAL (in review page)
4. **ERA Form Access**: Currently **unrestricted** - any assessment can access it
5. **Form Submission**: No validation prevents Low-risk cases from submitting

## Desired Workflow

1. **Risk Assessment Created**: Manual creation
2. **Risk Level Set**: Reviewer sets risk level
3. **ERA Access Check**: 
   - If **High/Critical**: Show "Review" button → Allow access to ERA form
   - If **Low/Medium**: No "Review" button → No ERA form access
4. **ERA Form**: Only accessible for High/Critical cases
5. **Form Submission**: Backend validates risk level before accepting submission

## Summary

**Current State**: 
- ✅ Enhanced risk analysis fields are conditionally shown (UI level)
- ✅ Validation requires risk factors for High/Critical (UI level)
- ❌ ERA form access is **NOT gated** by risk level
- ❌ No backend enforcement

**Required Changes**:
1. Add risk level check when loading ERA form
2. Gate "Review" button in Risk Review page
3. Add backend validation for ERA endpoints
4. Ensure consistent risk level values (standardize on backend enum)

