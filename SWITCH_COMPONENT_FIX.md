# Switch Component Compatibility Fix

## Issue
The Mukuru Switch component is incompatible with Chakra UI v3.28.0, causing a runtime error:
```
switchAnatomy.keys is not a function
```

## Solution Applied
Replaced Mukuru Switch with Chakra UI Switch in all DynamicForm components.

### Changes Made:
1. **admin/src/components/DynamicForm.tsx**
   - Removed `Switch` from Mukuru imports
   - Added `Switch` from Chakra UI imports
   - Updated Switch usage to Chakra UI API: `<Switch.Root>` with `<Switch.Control>` and `<Switch.Thumb>`

2. **partner/src/components/DynamicForm.tsx**
   - Same changes as admin DynamicForm

3. **mukuruImports.ts files**
   - Removed Switch from exports (commented out with explanation)

## Next Steps
1. **Restart the dev server** - The .next cache has been cleared
2. **Refresh the browser** - The error should be resolved

## Note
Other files (usePWA.tsx, EnhancedUX.tsx) already use Chakra UI Switch correctly, so no changes needed there.

## Future
When Mukuru updates their Switch component to be compatible with Chakra UI v3, we can switch back to using it from the Mukuru package.

