import type { ReactNode } from "react";
import type { DrawerRootProps, RecipeVariantProps } from "@chakra-ui/react";
import { mobileSidebarRecipe } from "configs/themes/mobileSidebar.recipe";
/**
 * Navigation item structure for mobile sidebar
 */
export interface MobileNavigationItem {
    id: string | number;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    children?: MobileNavigationItem[];
    isExpanded?: boolean;
    isActive?: boolean;
}
/**
 * User profile data for the sidebar
 */
export interface SidebarUser {
    name: string;
    initials?: string;
    avatar?: string;
}
/**
 * Action items (Switch Partner, Log Out, etc.)
 */
export interface SidebarAction {
    id: string | number;
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}
/**
 * Mobile Sidebar variant props (will be defined based on recipe)
 */
export type MobileSidebarVariantProps = RecipeVariantProps<typeof mobileSidebarRecipe>;
/**
 * Service/Partner dropdown configuration
 */
export interface ServiceDropdown {
    currentService: string;
    services?: Array<{
        id: string | number;
        name: string;
        onClick?: () => void;
    }>;
    isExpanded?: boolean;
    onToggle?: () => void;
    defaultActiveServiceId?: string | number;
}
/**
 * Props for MobileSidebar component
 */
export interface MobileSidebarProps extends Omit<DrawerRootProps, "children">, MobileSidebarVariantProps {
    /**
     * Whether the sidebar is open
     */
    isOpen: boolean;
    /**
     * Callback when sidebar should close
     */
    onClose: () => void;
    /**
     * Navigation items to display in the sidebar
     */
    navigationItems?: MobileNavigationItem[];
    /**
     * User information for profile section
     */
    user?: SidebarUser;
    /**
     * Service/Partner dropdown configuration
     */
    serviceDropdown?: ServiceDropdown;
    /**
     * Profile action (typically "My Profile")
     */
    profileAction?: Pick<SidebarAction, "onClick">;
    /**
     * Action items like "Log Out" (shown at bottom)
     */
    bottomActions?: SidebarAction[];
    /**
     * Help Centre action configuration
     */
    helpCentreAction?: SidebarAction;
    /**
     * Custom content to display at the top of the sidebar (below close button)
     */
    headerContent?: ReactNode;
    /**
     * Custom content to display at the bottom of the sidebar
     */
    footerContent?: ReactNode;
}
//# sourceMappingURL=MobileSidebar.types.d.ts.map