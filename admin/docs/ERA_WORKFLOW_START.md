# Enhanced Risk Assessment (ERA) Workflow - Starting in Review Step

## Overview

The Enhanced Risk Assessment (ERA) workflow **starts in the Review Step** (Step 3: Risk Assessment) of the review process. This ensures that the ERA process is initiated as part of the standard review workflow, not as a separate process.

## Workflow Flow

### 1. Review Step - Risk Assessment (Step 3)

**Location**: `/review/[id]` - Step 3: Risk Assessment

**Process**:
1. Reviewer opens the work item in review mode
2. Navigates to Step 3: Risk Assessment
3. Sets the risk level manually (Low, Medium, High, Critical)
4. Provides justification for the risk level

### 2. Enhanced Risk Analysis Fields (In Review Step)

**When Shown**: Only when risk level is set to **HIGH** or **CRITICAL**

**Fields Displayed**:
- **Risk Factors Identified**: Text area to list specific risk factors
- **Mitigation Measures**: Text area to describe mitigation measures
- **Additional Notes**: Text area for additional notes

**Button**: "Complete Enhanced Risk Assessment" 
- Links directly to `/risk-assessment/{assessmentId}`
- Only enabled when risk assessment ID exists
- Only shown for High/Critical cases

### 3. Enhanced Risk Assessment Form

**Location**: `/risk-assessment/[id]`

**Access**:
- Directly from Review Step via "Complete Enhanced Risk Assessment" button
- From Risk Review page (only for High/Critical cases)
- **Enforced**: Form redirects if accessed by Low/Medium risk cases

**Form Sections**:
1. Partner/Customer Details
2. Mukuru Details
3. Enhanced Due Diligence Findings
4. Adverse Media Assessment
5. Recommendations (2nd line of defence) - with SignNow signatures
6. Approvals and Risk Acceptances - with SignNow signatures

## Enforcement Logic

### Frontend Enforcement

1. **Review Step** (`/review/[id]`):
   - Enhanced analysis fields only shown for High/Critical
   - "Complete Enhanced Risk Assessment" button only shown for High/Critical
   - Button disabled until risk assessment is saved

2. **ERA Form** (`/risk-assessment/[id]`):
   - Checks risk level on page load
   - Redirects to Risk Review if not High/Critical
   - Shows error message explaining restriction

3. **Risk Review Page** (`/risk-review`):
   - "Review" button only shown for High/Critical cases
   - Low/Medium cases show "N/A"

### Backend Enforcement

**Current State**: 
- Risk assessments are created manually
- Risk level is set manually (no automatic calculation)
- No backend validation currently prevents Low-risk ERA access

**Recommended**: Add backend validation to enforce High/Critical requirement

## User Journey

### For High/Critical Risk Cases:

1. **Review Step**:
   ```
   Reviewer → Step 3: Risk Assessment
   → Sets risk level to HIGH/CRITICAL
   → Fills in enhanced risk analysis fields
   → Clicks "Save Risk Assessment"
   ```

2. **Enhanced Risk Analysis** (Still in Review Step):
   ```
   → Enhanced analysis fields appear
   → Reviewer fills in:
     - Risk Factors Identified
     - Mitigation Measures  
     - Additional Notes
   → Clicks "Complete Enhanced Risk Assessment" button
   ```

3. **ERA Form**:
   ```
   → Redirected to /risk-assessment/{id}
   → Completes full ERA form:
     - Partner/Customer Details
     - Mukuru Details
     - EDD Findings
     - Adverse Media Assessment
     - Recommendations (with SignNow signatures)
     - Approvals (with SignNow signatures)
   → Saves form
   → PDF generated and uploaded to SignNow
   → Sends signature invites to approvers
   ```

### For Low/Medium Risk Cases:

1. **Review Step**:
   ```
   Reviewer → Step 3: Risk Assessment
   → Sets risk level to LOW/MEDIUM
   → Provides justification
   → Clicks "Save Risk Assessment"
   ```

2. **No Enhanced Analysis**:
   ```
   → Enhanced analysis fields do NOT appear
   → No "Complete Enhanced Risk Assessment" button
   → Workflow completes without ERA
   ```

## Key Points

✅ **ERA starts in Review Step** - The workflow is initiated from Step 3: Risk Assessment

✅ **Only High/Critical** - Enhanced analysis fields and ERA form only available for High/Critical cases

✅ **Seamless Flow** - Button in Review Step directly links to ERA form

✅ **Enforced Access** - Multiple layers of enforcement prevent Low/Medium cases from accessing ERA

✅ **SignNow Integration** - Signatures are handled via SignNow for all 7 approvers

## Technical Implementation

### Review Step Integration

**File**: `admin/src/app/review/[id]/page.tsx`

- Step 3: Risk Assessment loads risk assessment data
- Conditional rendering based on risk level
- Button links to ERA form using assessment ID
- Enhanced analysis fields saved as part of risk assessment notes

### ERA Form Access

**File**: `admin/src/app/risk-assessment/[id]/page.tsx`

- Validates risk level on page load
- Redirects if not High/Critical
- Full form with all sections
- SignNow signature integration for all approvers

### Risk Review Page

**File**: `admin/src/app/risk-review/page.tsx`

- Filters to show High/Critical cases
- "Review" button only for High/Critical
- Links to ERA form for detailed assessment

## Summary

The Enhanced Risk Assessment workflow is **fully integrated into the Review Step**, ensuring that:

1. Reviewers start the ERA process from the standard review workflow
2. Only High/Critical cases trigger the enhanced workflow
3. The process flows seamlessly from review → enhanced analysis → full ERA form
4. All enforcement is in place to prevent Low/Medium cases from accessing ERA

The workflow is now properly gated and starts in the review step as intended.

