// Centralized Mukuru component imports
// Use this file to import all Mukuru components consistently
// NOTE: Switch is excluded due to compatibility issues with Chakra UI v3
// Webpack is configured to ignore switch.recipe.js to prevent runtime errors

export {
  // Core Components
  Button,
  Typography,
  Card,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  
  // Form Components
  Checkbox,
  Radio,
  RadioGroup,
  Dropdown,
  TypeAhead,
  PhoneInput,
  MultiSelectDropdown,
  Search,
  SortDropdown,
  // Switch - excluded, use Chakra UI Switch instead
  
  // Navigation
  Navbar,
  PortalNavigationSidebar,
  MobileSidebar,
  ProfileMenu,
  ServicesMenu,
  SelectionMenu,
  
  // Data Display Components
  DataTable,
  Pagination,
  Filters,
  
  // UI Components
  Tag,
  Link,
  Tooltip,
  AlertBar,
  IconWrapper,
  MukuruLogo,
  
  // Theme
  mukuruSystem,
  GlobalStyles,
  ColorModeProvider,
  MukuruComponentProvider
} from "@mukuru/mukuru-react-components";

// Export commonly used icons
export {
  SearchIcon,
  SettingsIcon,
  UserIcon,
  LogoutIcon,
  MenuIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  EditIcon,
  DeleteIcon,
  AddIcon,
  CloseIcon,
  CheckIcon,
  WarningIcon,
  InfoIcon,
  ErrorIcon,
  NotificationIcon,
  MailIcon,
  PhoneIcon,
  FileOpenIcon,
  DocumentIcon,
  DownloadIcon,
  UploadIcon,
  FilterIcon,
  MoreIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AppIcon,
  ProductIcon,
  PartnerIcon,
  HelpIcon
} from "@mukuru/mukuru-react-components";

// Re-export all icons (excluding Switch)
// NOTE: We cannot use export * because it would include the problematic Switch component
// Import icons individually if needed, or import directly from @mukuru/mukuru-react-components

// Import Tabs and Input components from wrapper file
// NOTE: These components are not yet exported from the main npm package (@mukuru/mukuru-react-components@1.0.44)
// We use wrapper components that match Mukuru styling
// Once Input and Tabs are added to the package exports, we can import them from "@mukuru/mukuru-react-components" above
export {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsIndicator,
  TabsContent,
  Input
} from "./mukuruComponentWrappers";

