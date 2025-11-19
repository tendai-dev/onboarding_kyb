import type { RecipeVariantProps } from "@chakra-ui/react";
import type { portalNavigationSidebarRecipe } from "../../../configs/themes/portalNavigationSidebar.recipe";
import type { HTMLAttributes, ReactNode } from "react";
export type PortalNavigationSidebarVariantProps = RecipeVariantProps<typeof portalNavigationSidebarRecipe>;
export interface NavigationSubItem {
    id: string;
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
}
export interface NavigationItem {
    id: string;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    subItems?: NavigationSubItem[];
    disabled?: boolean;
}
export interface HelpCentreItem {
    id: string;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
}
export interface PortalNavigationSidebarProps extends Omit<HTMLAttributes<HTMLElement>, "color">, PortalNavigationSidebarVariantProps {
    /** Array of navigation items to display */
    navigationItems: NavigationItem[];
    /** Optional Help Centre item shown below a divider */
    helpCentreItem?: HelpCentreItem;
    /** Currently active navigation item ID */
    activeItemId?: string;
    /** Currently active sub-item ID (if applicable) */
    activeSubItemId?: string;
    /** Whether the sidebar is in condensed mode */
    condensed?: boolean;
    /** Callback when sidebar collapse state changes */
    onToggleCollapse?: (collapsed: boolean) => void;
    /** Whether to show the toggle button for condensed mode */
    showToggle?: boolean;
    /** Custom logo component (defaults to MukuruLogo) */
    logo?: ReactNode;
    /** Logo click handler */
    onLogoClick?: () => void;
    /** Width of the expanded sidebar */
    expandedWidth?: string;
    /** Width of the condensed sidebar */
    condensedWidth?: string;
}
//# sourceMappingURL=PortalNavigationSidebar.types.d.ts.map