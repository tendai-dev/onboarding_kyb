# Mukuru Components Status

## ✅ Currently Used Mukuru Components

### Core Components
- ✅ **Button** - Used throughout
- ✅ **Typography** - Replaced Text/Heading
- ✅ **Card** - Used in dashboards
- ✅ **Modal** (ModalHeader, ModalBody, ModalFooter) - Available in imports

### Form Components
- ✅ **Checkbox** - Used in DynamicForm
- ✅ **Radio** & **RadioGroup** - Used in DynamicForm
- ✅ **Dropdown** - Used in DynamicForm
- ✅ **TypeAhead** - Available in imports
- ❌ **Switch** - Excluded (compatibility issues, using Chakra UI Switch)

### UI Components
- ✅ **Tag** - Used in forms
- ✅ **Tooltip** - Used in forms
- ✅ **AlertBar** - Used in DynamicForm
- ✅ **MukuruLogo** - Used in pages

### Theme
- ✅ **mukuruSystem** - Applied in providers
- ✅ **GlobalStyles** - Available
- ✅ **ColorModeProvider** - Available
- ✅ **MukuruComponentProvider** - Available

---

## 🚫 Available But NOT Yet Used

### Navigation Components (High Priority)
- ❌ **Navbar** - Full navigation bar component
- ❌ **PortalNavigationSidebar** - Sidebar navigation
- ❌ **MobileSidebar** - Mobile navigation
- ❌ **ProfileMenu** - User profile dropdown
- ❌ **ServicesMenu** - Services navigation menu
- ❌ **SelectionMenu** - Selection menu component

### Data Display Components
- ❌ **DataTable** - Table component with sorting/filtering
- ❌ **Pagination** - Pagination controls
- ❌ **Filters** - Filter component

### Form Components
- ❌ **MultiSelectDropdown** - Multi-select dropdown
- ❌ **PhoneInput** - Phone number input with validation
- ❌ **Search** - Search input component
- ❌ **SortDropdown** - Sort dropdown component
- ❌ **Link** - Link component (currently using Chakra UI Link)

### UI Components
- ❌ **IconWrapper** - Icon wrapper component

### Icons (100+ Available)
All Mukuru icons are available but not systematically used:
- AddIcon, ArrowDownIcon, ArrowLeftIcon, etc.
- See full list in package exports

---

## 🔄 Still Using Chakra UI (Could Be Replaced)

### Layout Components (7107+ usages)
- **Box** - Used extensively (could use Mukuru Card or custom wrapper)
- **Container** - Used in layouts
- **VStack** - Vertical stack (Chakra UI only)
- **HStack** - Horizontal stack (Chakra UI only)
- **Flex** - Flexbox layout (Chakra UI only)
- **SimpleGrid** - Grid layout (Chakra UI only)
- **Stack** - Generic stack (Chakra UI only)
- **Wrap** - Wrap layout (Chakra UI only)

### Form Components
- **Input** - Text input (no direct Mukuru replacement, but could use with styling)
- **Textarea** - Text area (no direct Mukuru replacement)
- **Select** - Select dropdown (using Mukuru Dropdown instead)

### UI Components
- **Spinner** - Loading spinner (Chakra UI only)
- **Icon** - Icon component (could use Mukuru IconWrapper)
- **Badge** - Badge component (could use Mukuru Tag)
- **Alert** (AlertTitle, AlertDescription) - Using Mukuru AlertBar instead

### Typography
- **Text** - Replaced with Mukuru Typography ✅
- **Heading** - Replaced with Mukuru Typography ✅

---

## 📋 Recommended Next Steps

### Priority 1: Navigation Components
Replace Chakra UI navigation with Mukuru navigation:
1. **Navbar** - Replace custom navigation
2. **PortalNavigationSidebar** - Replace AdminSidebar
3. **ProfileMenu** - Add user menu
4. **ServicesMenu** - Add services menu

### Priority 2: Data Components
1. **DataTable** - Replace custom tables
2. **Pagination** - Add pagination to lists
3. **Filters** - Add filtering capabilities

### Priority 3: Form Enhancements
1. **PhoneInput** - Replace phone number inputs
2. **MultiSelectDropdown** - For multi-select fields
3. **Search** - Replace search inputs

### Priority 4: Icons
Systematically replace react-icons with Mukuru icons where available.

---

## ⚠️ Notes

- **Switch** component is excluded due to compatibility issues with Chakra UI v3
- Layout components (Box, VStack, HStack, etc.) don't have direct Mukuru equivalents - these are Chakra UI primitives that work well with Mukuru theme
- Some components may need custom wrappers or styling to match Mukuru design system

