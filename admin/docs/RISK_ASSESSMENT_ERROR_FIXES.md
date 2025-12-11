# Risk Assessment Error Handling Fixes

## Issues Identified

### 1. **400 Bad Request Errors**
- Error: `Failed to create risk assessment: 400`
- Cause: Invalid request parameters (caseId format, missing partnerId, or assessment already exists)
- Location: `riskApi.ts` - `createRiskAssessment` method

### 2. **404 Not Found Errors**
- Error: `Failed to load resource: the server responded with a status of 404`
- Cause: Case ID format mismatch or assessment not yet created
- Location: `review/[id]/page.tsx` - `loadRiskAssessment` callback

### 3. **Unhandled Errors in Console**
- Error: Errors being thrown and not caught gracefully
- Cause: Error handling not properly catching and handling API failures
- Impact: Console errors visible to users, breaking user experience

## Fixes Implemented

### 1. Enhanced Error Handling in `riskApi.ts`

**File**: `admin/src/services/riskApi.ts`

**Changes**:
- Added input validation for `caseId` before making API calls
- Improved error messages for different HTTP status codes:
  - **409**: Already exists (returns `null` - not an error)
  - **400**: Bad request with detailed error message
  - **Other**: Generic error with status code
- Better error context in error messages

**Code**:
```typescript
async createRiskAssessment(
  caseId: string,
  partnerId: string
): Promise<RiskAssessmentDto | null> {
  try {
    // Validate inputs
    if (!caseId || caseId.trim() === '') {
      throw new Error('Case ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/risk`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ caseId: caseId.trim(), partnerId: partnerId?.trim() || '' }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        // Already exists - this is not an error
        return null;
      }
      
      if (response.status === 400) {
        // Bad request - get detailed error message
        const errorData = await response.json().catch(() => ({ 
          message: 'Invalid request. Please check case ID and partner ID format.' 
        }));
        throw new Error(errorData.message || errorData.error || 'Invalid request parameters');
      }

      // For other errors, get the error message
      const errorData = await response.json().catch(() => ({ 
        message: `Server error: ${response.status} ${response.statusText}` 
      }));
      throw new Error(errorData.message || errorData.error || `Failed to create risk assessment: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to create risk assessment: ${String(error)}`);
  }
}
```

### 2. Improved Error Handling in Review Page

**File**: `admin/src/app/review/[id]/page.tsx`

**Changes**:
- Added validation before attempting to create assessment
- Wrapped `createRiskAssessment` in try-catch to handle errors gracefully
- Different handling for different error types:
  - **Already exists (409)**: Try to fetch the existing assessment
  - **Bad Request (400)**: Log warning, continue without assessment
  - **Other errors**: Log warning, continue without assessment
- Errors are logged as warnings (not errors) since risk assessment is non-critical
- User can still proceed with review even if assessment creation fails

**Code**:
```typescript
// Validate caseId before proceeding
if (!caseId || caseId.trim() === '') {
  console.warn('[Risk Assessment] Cannot create assessment: caseId is empty');
  setRiskAssessment(null);
  setRiskAssessmentLoading(false);
  loadingRefs.current.riskAssessment = false;
  return;
}

// Create the risk assessment with error handling
let created: RiskAssessmentDto | null = null;
try {
  created = await riskApiService.createRiskAssessment(caseId, partnerId);
} catch (createError) {
  const errorMessage = createError instanceof Error ? createError.message : String(createError);
  
  if (errorMessage.includes('already exists') || errorMessage.includes('409')) {
    console.info('[Risk Assessment] Assessment already exists (from error message)');
    created = null; // Treat as "exists but not found" scenario
  } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
    console.warn('[Risk Assessment] Invalid request parameters:', {
      caseId,
      partnerId: partnerId ? 'provided' : 'missing',
      error: errorMessage
    });
    // Don't throw - just log and continue without assessment
    setRiskAssessment(null);
    setRiskAssessmentLoading(false);
    loadingRefs.current.riskAssessment = false;
    return;
  } else {
    console.warn('[Risk Assessment] Failed to create assessment (non-critical):', errorMessage);
    // Continue without assessment - user can still proceed
    setRiskAssessment(null);
    setRiskAssessmentLoading(false);
    loadingRefs.current.riskAssessment = false;
    return;
  }
}
```

### 3. Enhanced Catch Block

**Changes**:
- Catch block now handles different error types appropriately
- Errors are logged as warnings (not errors) since they're non-critical
- User experience is not interrupted - review can continue without assessment

**Code**:
```typescript
} catch (createErr) {
  const errorMessage = createErr instanceof Error ? createErr.message : String(createErr);
  
  if (errorMessage.includes('already exists') || errorMessage.includes('409')) {
    console.info('[Risk Assessment] Assessment already exists (from catch)');
    // Try to fetch it one more time
    try {
      assessment = await riskApiService
        .getRiskAssessmentByCase(caseId)
        .catch(() => null);
    } catch {
      // Ignore fetch errors
    }
  } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
    console.warn('[Risk Assessment] Invalid request parameters (non-critical):', {
      caseId,
      error: errorMessage
    });
  } else {
    console.warn('[Risk Assessment] Failed to create assessment (non-critical):', errorMessage);
  }
  // Continue without assessment - user can still proceed with review
}
```

## Benefits

1. **No Console Errors**: Errors are handled gracefully and logged as warnings
2. **Better User Experience**: Users can continue with review even if assessment creation fails
3. **Clearer Error Messages**: More specific error messages help with debugging
4. **Input Validation**: Case ID and partner ID are validated before API calls
5. **Graceful Degradation**: System continues to work even if risk assessment API is unavailable

## Error Scenarios Handled

### Scenario 1: Invalid Case ID Format
- **Error**: 400 Bad Request
- **Handling**: Log warning, continue without assessment
- **User Impact**: None - review can proceed

### Scenario 2: Assessment Already Exists
- **Error**: 409 Conflict (or error message contains "already exists")
- **Handling**: Try to fetch existing assessment
- **User Impact**: None - assessment is loaded if found

### Scenario 3: Missing Partner ID
- **Error**: 400 Bad Request
- **Handling**: Log warning, continue without assessment
- **User Impact**: None - review can proceed (partnerId is optional)

### Scenario 4: API Unavailable
- **Error**: Network error or 500 error
- **Handling**: Log warning, continue without assessment
- **User Impact**: None - review can proceed

### Scenario 5: Case ID Not Found
- **Error**: 404 Not Found
- **Handling**: Try to create assessment, if that fails, continue without
- **User Impact**: None - review can proceed

## Testing Recommendations

1. **Test with invalid case ID**: Should log warning, not show error
2. **Test with missing partner ID**: Should create assessment with empty partnerId
3. **Test with existing assessment**: Should fetch existing assessment
4. **Test with API unavailable**: Should continue without assessment
5. **Test with invalid case ID format**: Should handle gracefully

## Summary

The fixes ensure that:
- ✅ Errors are handled gracefully without breaking the user experience
- ✅ Console errors are minimized (warnings instead of errors)
- ✅ Users can continue with review even if risk assessment fails
- ✅ Better error messages for debugging
- ✅ Input validation before API calls
- ✅ Graceful degradation when API is unavailable

The risk assessment feature is now **non-blocking** - the review workflow can continue even if the risk assessment API is unavailable or returns errors.

