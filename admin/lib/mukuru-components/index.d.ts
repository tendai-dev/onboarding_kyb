import * as react from 'react';
import react__default, { PropsWithChildren, RefObject, ReactNode, BaseHTMLAttributes, HTMLAttributes, AnchorHTMLAttributes } from 'react';
import * as _chakra_ui_react from '@chakra-ui/react';
import { Switch as Switch$1, RecipeVariantProps, MenuRootProviderProps, HTMLChakraProps, ButtonProps as ButtonProps$1, RadioGroup as RadioGroup$1, Checkbox as Checkbox$1, StackProps, IconProps as IconProps$1, DrawerRootProps, Tooltip as Tooltip$1, Card as Card$1 } from '@chakra-ui/react';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { mobileSidebarRecipe } from 'configs/themes/mobileSidebar.recipe';
import { linkRecipe } from 'configs/themes/link.recipe';
import { ThemeProviderProps } from 'next-themes';

declare const switchSlotRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "indicator" | "control" | "label" | "thumb", {
    variant: {
        solid: {
            control: {
                borderRadius: "full";
                bg: "bg.emphasized";
                focusVisibleRing: "outside";
                _checked: {
                    bg: "mukuru.orange.200";
                };
            };
            thumb: {
                bg: "white";
                width: "var(--switch-height)";
                height: "var(--switch-height)";
                scale: "0.8";
                boxShadow: "sm";
                _checked: {
                    bg: "colorPalette.contrast";
                };
            };
        };
        raised: {
            control: {
                borderRadius: "full";
                height: "calc(var(--switch-height) / 2)";
                bg: "bg.muted";
                boxShadow: "inset";
                _checked: {
                    bg: "colorPalette.solid/60";
                };
            };
            thumb: {
                width: "var(--switch-height)";
                height: "var(--switch-height)";
                position: "relative";
                top: "calc(var(--switch-height) * -0.25)";
                bg: "white";
                boxShadow: "xs";
                focusVisibleRing: "outside";
                _checked: {
                    bg: "colorPalette.solid";
                };
            };
        };
    };
    size: {
        xs: {
            root: {
                "--switch-width": "sizes.6";
                "--switch-height": "sizes.3";
                "--switch-indicator-font-size": "fontSizes.xs";
            };
        };
        sm: {
            root: {
                "--switch-width": "sizes.8";
                "--switch-height": "sizes.4";
                "--switch-indicator-font-size": "fontSizes.xs";
            };
        };
        md: {
            root: {
                "--switch-width": "sizes.10";
                "--switch-height": "sizes.5";
                "--switch-indicator-font-size": "fontSizes.sm";
            };
        };
        lg: {
            root: {
                "--switch-width": "sizes.12";
                "--switch-height": "sizes.6";
                "--switch-indicator-font-size": "fontSizes.md";
            };
        };
    };
}>;

/**
 * Variant props from recipe
 */
type CheckboxVariantProps$1 = RecipeVariantProps<typeof switchSlotRecipe>;
/**
 * Props for Checkbox component
 */
interface SwitchProps extends PropsWithChildren<Omit<Switch$1.RootProps, "size">>, CheckboxVariantProps$1 {
    rootRef?: RefObject<HTMLLabelElement | null>;
}

/**
 * The Switch component lets users toggle a setting between two states (on/off). It’s best for immediate system actions and should reflect changes in real time.
 */
declare const Switch: react.ForwardRefExoticComponent<SwitchProps & react.RefAttributes<HTMLInputElement>>;

declare const menuRecipe: _chakra_ui_react.SlotRecipeDefinition<"indicator" | "content" | "separator" | "item" | "itemIndicator" | "positioner" | "trigger" | "itemGroup" | "arrow" | "arrowTip" | "contextTrigger" | "itemGroupLabel" | "itemText" | "triggerItem" | "itemCommand" | "activeItem", _chakra_ui_react.SlotRecipeVariantRecord<"indicator" | "content" | "separator" | "item" | "itemIndicator" | "positioner" | "trigger" | "itemGroup" | "arrow" | "arrowTip" | "contextTrigger" | "itemGroupLabel" | "itemText" | "triggerItem" | "itemCommand" | "activeItem">>;

/**
 * Variant props from recipe
 */
type SelectionMenuVariantProps = RecipeVariantProps<typeof menuRecipe>;
type SelectionMenuItem = {
    id: number | string;
    label: string;
    value: string;
    icon?: ReactNode;
    disabled?: boolean;
    onSelect?: () => void;
};
/**
 * Props for Menu component
 */
interface SelectionMenuProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, SelectionMenuVariantProps {
    activeId?: string | number;
    onToggle?: () => void;
    icon?: ReactNode;
    label?: string;
    menuItems?: SelectionMenuItem[];
    open?: boolean;
    rootRef?: RefObject<HTMLElement | null>;
}

/**
 * The Selection Menu component provides a simple list of selectable options in a vertical layout. It is usually placed in the Navigation Bar and highlights the currently active option for clarity. This component is designed to support any scenario where users need to choose between a small set of related options.
 */
declare const SelectionMenu: react.ForwardRefExoticComponent<SelectionMenuProps & react.RefAttributes<HTMLButtonElement>>;

declare const servicesMenuRecipe: _chakra_ui_react.SlotRecipeDefinition<"content" | "grid" | "icon" | "item" | "trigger" | "activeItem" | "gridItem" | "singleItem" | "footerLink" | "footerLabel", _chakra_ui_react.SlotRecipeVariantRecord<"content" | "grid" | "icon" | "item" | "trigger" | "activeItem" | "gridItem" | "singleItem" | "footerLink" | "footerLabel">>;

/**
 * Variant props from recipe
 */
type ServicesMenuVariantProps = RecipeVariantProps<typeof servicesMenuRecipe>;
/**
 * Props for ServicesMenu component
 */
type ServiceMenuItem = {
    id: number | string;
    label: string;
    link: string;
    icon: ReactNode;
    description: string;
    onClick?: () => void;
};
interface FooterLink {
    id: string | number;
    label: string;
    description: string;
    icon: ReactNode;
    isActive?: boolean;
    onClick: () => void;
}
interface ServicesMenuProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, ServicesMenuVariantProps {
    activeId?: string | number;
    onToggle?: () => void;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    label?: string;
    services: ServiceMenuItem[];
    open?: boolean;
    rootRef?: RefObject<HTMLElement | null>;
    footerLink?: FooterLink;
}

/**
 * The Services Menu component allows users to switch between products or services, such as Aggregator Portal and Admin Portal. It is usually placed in the Navigation Bar and opens a panel showing available services. The menu supports icons, labels, and optional descriptions, and can link to both internal and external destinations.
 */
declare const ServicesMenu: react.ForwardRefExoticComponent<ServicesMenuProps & react.RefAttributes<HTMLButtonElement>>;

declare const profileMenuRecipe: _chakra_ui_react.SlotRecipeDefinition<"content" | "avatar" | "item" | "fullName" | "avatarFallback", _chakra_ui_react.SlotRecipeVariantRecord<"content" | "avatar" | "item" | "fullName" | "avatarFallback">>;

/**
 * Variant props from recipe
 */
type ProfileMenuVariantProps = RecipeVariantProps<typeof profileMenuRecipe>;
/**
 * Props for ProfileMenu component
 */
type ProfileMenuItem = {
    id: number | string;
    label: string;
    value: string;
    disabled?: boolean;
    icon?: ReactNode;
    onSelect?: () => void;
};
interface ProfileMenuProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, ProfileMenuVariantProps {
    user: string;
    menuItems?: ProfileMenuItem[];
}

/**
 * The Profile Menu component provides user-related actions such as viewing profile details and logging out. It appears on the right side of the Navigation Bar. The trigger is always the user’s avatar or initials, taken from the user data.
 * Clicking the trigger opens a small menu/panel with user information and actions.
 */
declare const ProfileMenu: react.ForwardRefExoticComponent<ProfileMenuProps & react.RefAttributes<HTMLButtonElement>>;

type MukuruLogoProps = HTMLChakraProps<"img"> & {
    inverse?: boolean;
};

/**
 * The MukuruLogo renders the official Mukuru brand mark, with built-in support for light and dark backgrounds. Use the `inverse` prop to switch between the primary (orange) and inverse (white) versions.
 */
declare const MukuruLogo: ({ inverse, ...props }: MukuruLogoProps) => react_jsx_runtime.JSX.Element;

declare const buttonRecipe: _chakra_ui_react.RecipeDefinition<{
    size: {
        sm: {
            borderRadius: "36px";
            height: "32px";
            fontSize: "14px";
            minW: "117px";
            px: "16px";
            py: "4px";
            gap: "10px";
            "--madera-offset": "-1.5px";
            "--helvetica-offset": "0px";
            "--arial-offset": "0px";
            "& span": {
                transform: "translateY(var(--madera-offset))";
                display: "inline-block";
                lineHeight: "1";
            };
            "& svg": {
                flexShrink: number;
                transform: "translateY(1px)";
            };
        };
        md: {
            borderRadius: "36px";
            height: "48px";
            fontSize: "18px";
            px: "20px";
            py: "14px";
            gap: "10px";
            "--madera-offset": "-3px";
            "--helvetica-offset": "0px";
            "--arial-offset": "0px";
            "& span": {
                transform: "translateY(var(--madera-offset))";
                display: "inline-block";
                lineHeight: "1";
            };
            "& svg": {
                flexShrink: number;
                transform: "translateY(2px)";
            };
        };
        icon: {
            borderRadius: "50%";
            width: "36px";
            height: "36px";
            p: "0";
            gap: "0";
        };
    };
    variant: {
        primary: {
            backgroundColor: "mukuru.primary";
            color: "mukuru.white";
            border: "2px solid transparent";
            _hover: {
                backgroundColor: "mukuru.buttons.inactive.orange";
                color: "mukuru.white";
                border: "2px solid inherit";
                _disabled: {
                    backgroundColor: "mukuru.grey.light";
                    color: "mukuru.grey.mediumDark";
                    border: "2px solid transparent";
                };
                _dark: {
                    color: "mukuru.primary";
                };
            };
            _focusVisible: {
                boxShadow: "inset 0 0 0 3px mukuru.buttons.inactive.orange";
                outline: "none";
            };
            _active: {
                backgroundColor: "#D13F11";
            };
            _disabled: {
                backgroundColor: "mukuru.grey.light";
                color: "mukuru.grey.medium";
                border: "2px solid transparent";
                cursor: "not-allowed";
                opacity: number;
            };
            _dark: {
                backgroundColor: "mukuru.white";
                color: "mukuru.primary";
            };
        };
        secondary: {
            backgroundColor: "inherit";
            color: "mukuru.primary";
            border: "2px solid #FC4F1E";
            _hover: {
                backgroundColor: "mukuru.buttons.inactive.orange";
                color: "mukuru.primary";
                border: "2px solid mukuru.primary";
                _disabled: {
                    backgroundColor: "mukuru.grey.light";
                    color: "mukuru.grey.medium";
                    border: "2px solid #F4F4F4";
                };
                _dark: {
                    border: "1px solid white";
                };
            };
            _active: {
                backgroundColor: "mukuru.primary";
                color: "mukuru.white";
                border: "2px solid #E74A1F";
            };
            _focusVisible: {
                boxShadow: "0 0 0 3px rgba(252, 79, 30, 0.5)";
                outline: "none";
            };
            _disabled: {
                backgroundColor: "mukuru.lighterGrey";
                color: "mukuru.darkGrey";
                border: "2px solid #F4F4F4";
                cursor: "not-allowed";
                opacity: number;
            };
            _dark: {
                backgroundColor: "inherit";
                color: "mukuru.white";
                border: "1px solid white";
            };
        };
        ghost: {
            backgroundColor: "transparent";
            color: "mukuru.grey.mediumDark";
            border: "1.5px solid #1A1A1A";
            _hover: {
                backgroundColor: "#ECECEC80";
                color: "mukuru.black";
                borderColor: "transparent";
                _disabled: {
                    backgroundColor: "mukuru.grey.light";
                    color: "mukuru.grey.medium";
                    borderColor: "transparent";
                };
            };
            _active: {
                backgroundColor: "#E0E0E0";
                color: "mukuru.black";
                border: "1.5px solid #1A1A1A";
            };
            _focusVisible: {
                boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.3)";
                outline: "none";
            };
            _disabled: {
                backgroundColor: "#DADADA";
                color: "#989898";
                border: "2px solid transparent";
                cursor: "not-allowed";
                opacity: number;
            };
        };
    };
}>;

type ButtonVariantProps = RecipeVariantProps<typeof buttonRecipe>;
interface ButtonProps extends Omit<ButtonProps$1, "color" | "size" | "variant">, ButtonVariantProps {
    children?: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: ReactNode;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

/**
 * The Button component extends Chakra’s native button with SDS-specific styles and variants.
 * It supports `variant`, `size`, `loading`, and `icon` props.
 *
 * Buttons follow SDS theming and accessibility standards, with consistent icon and text alignment
 * across sizes and states.
 */
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;

declare const typographyRecipe: _chakra_ui_react.RecipeDefinition<{
    levels: {
        h1: {
            textStyle: "headline1";
        };
        h2: {
            textStyle: "headline2";
        };
        h3: {
            textStyle: "headline3";
        };
        h4: {
            textStyle: "headline4";
        };
        h5: {
            textStyle: "headline5";
        };
        h6: {
            textStyle: "headline6";
        };
        p: {
            textStyle: "normal";
        };
        span: {
            textStyle: "normal";
        };
    };
    size: {
        base: {
            value: {
                fontSize: string;
                lineHeight: string;
                letterSpacing: string;
            };
        };
        xs: {
            value: {
                fontSize: string;
                lineHeight: string;
                letterSpacing: string;
            };
        };
        sm: {
            value: {
                fontSize: string;
                lineHeight: string;
                letterSpacing: string;
            };
        };
    };
}>;

/**
 * Variant props from recipe
 */
type TypographyVariantProps = RecipeVariantProps<typeof typographyRecipe>;
/**
 * Props for Typography component
 */
interface TypographyProps extends HTMLChakraProps<"p">, TypographyVariantProps {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: number | string;
}

/**
 *  The Typography component wraps Chakra’s primitive text elements with SDS typography styles. It uses Madera as the primary font with `'Madera', 'Helvetica Neue', 'Arial', sans-serif'` as fallbacks for consistent rendering across platforms and supports`fontSize`, `fontWeight`, and `lineHeight` tokens as defined in the Figma design system.
 *
 * The Madera font is self-hosted and should be loaded via our global styles. Make sure the fallback stack is applied in CSS and theme configuration to ensure graceful degradation.
 *
 */
declare const Typography: react.ForwardRefExoticComponent<TypographyProps & react.RefAttributes<HTMLElement>>;

declare const radioRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "label" | "item" | "itemIndicator" | "itemText" | "itemControl", {
    size: {
        sm: {
            itemControl: {
                width: "16px";
                height: "16px";
            };
            itemIndicator: {
                width: "16px";
                height: "16px";
                "& .dot": {
                    w: "16px";
                    h: "16px";
                };
            };
            itemText: {
                textStyle: "xs";
            };
            item: {
                gap: "14px";
            };
        };
        md: {
            itemControl: {
                width: "24px";
                height: "24px";
            };
            itemIndicator: {
                width: "24px";
                height: "24px";
            };
            itemText: {
                textStyle: "sm";
                position: "relative";
                top: "-1px";
            };
            item: {
                gap: "22px";
            };
        };
        lg: {
            itemControl: {
                width: "30px";
                height: "30px";
            };
            itemIndicator: {
                width: "30px";
                height: "30px";
            };
            itemText: {
                textStyle: "md";
                position: "relative";
                top: "-1px";
            };
            item: {
                gap: "22px";
            };
        };
    };
}>;

/**
 * Variant props from recipe
 */
type RadioVariantProps = RecipeVariantProps<typeof radioRecipe>;
/**
 * Props for Radio component
 */
interface RadioProps extends PropsWithChildren<RadioGroup$1.ItemProps>, RadioVariantProps {
}

/**
 * The Radio component allows users to select a single option from a group. Selecting a new option automatically deselects the previous one.
 */
declare const Radio: react.ForwardRefExoticComponent<RadioProps & react.RefAttributes<HTMLInputElement>>;
/**
 * Group Wrapper
 */
declare const RadioGroup: ({ children, label, ...props }: {
    children: ReactNode;
    label?: string;
    [key: string]: unknown;
}) => react_jsx_runtime.JSX.Element;

declare const checkboxRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "indicator" | "control" | "label" | "group", {
    size: {
        sm: {
            root: {
                gap: "2";
            };
            label: {
                textStyle: "sm";
            };
            control: {
                boxSize: "14px";
            };
        };
        md: {
            root: {
                gap: "2.5";
            };
            label: {
                textStyle: "md";
            };
            control: {
                boxSize: "20px";
                p: "0.5";
            };
        };
    };
}>;

/**
 * Variant props from recipe
 */
type CheckboxVariantProps = RecipeVariantProps<typeof checkboxRecipe>;
/**
 * Props for Checkbox component
 */
interface CheckboxProps extends PropsWithChildren<Omit<Checkbox$1.RootProps, "size">>, CheckboxVariantProps {
    rootRef?: RefObject<HTMLLabelElement | null>;
}

/**
 * The Checkbox component allows users to select one or more options independently. It supports standard and indeterminate states and can be used individually or in groups.
 */
declare const Checkbox: react.ForwardRefExoticComponent<CheckboxProps & react.RefAttributes<HTMLInputElement>>;

declare const tagRecipe: _chakra_ui_react.RecipeDefinition<{
    variant: {
        success: {
            bg: "mukuru.teal.400";
            color: "mukuru.teal.300";
        };
        warning: {
            bg: "mukuru.orange.400";
            color: "mukuru.orange.200";
        };
        danger: {
            bg: "mukuru.red.400";
            color: "mukuru.red.300";
        };
        info: {
            bg: "mukuru.grey.200";
            color: "mukuru.grey.500";
        };
        alert: {
            bg: "mukuru.yellow.400";
            color: "mukuru.yellow.100";
        };
        solid: {
            bg: "mukuru.teal.300";
            color: "white";
        };
        kyc: {
            bg: "mukuru.teal.300";
            color: "white";
            fontWeight: number;
        };
    };
    size: {
        md: {
            fontSize: "12px";
            px: "3";
            lineHeight: "1.5";
            pt: "1";
            pb: "2";
        };
        lg: {
            fontSize: "14px";
            px: "2.5";
            pb: number;
            minW: "180px";
            justifyContent: "center";
            minH: "50px";
        };
    };
}>;

type TagVariantProps = RecipeVariantProps<typeof tagRecipe>;
interface TagProps extends BaseHTMLAttributes<HTMLSpanElement>, TagVariantProps {
}

declare const Tag: react.ForwardRefExoticComponent<TagProps & react.RefAttributes<HTMLSpanElement>>;

interface NavbarProps extends Omit<StackProps, "children"> {
    leftComponent?: react__default.ReactNode;
    centerComponent?: react__default.ReactNode;
    rightComponent?: react__default.ReactNode;
    sticky?: boolean;
}

/**
 * The Navigation Bar spans the top of the viewport and provides access to key navigation elements. Its structure and content adapt by breakpoint, working together with the Portal Navigation Menu for a consistent experience across desktop, tablet, and mobile.

 * On desktop and tablet landscape (≥769px), the Nav Bar includes the Services Menu on the left, with Switch Partner and Profile on the right. The logo does not appear here — it is part of the Portal Navigation Menu (sidebar).

 * On tablet portrait and mobile (≤768px), the Nav Bar includes the logo on the left, the Services Menu centered, and a hamburger trigger on the right that opens the Drawer. Switch Partner and Profile are consolidated into the Drawer for these breakpoints.
 *
 */
declare const Navbar: react__default.FC<NavbarProps>;

/**
 * The Icon component provides scalable, accessible icons in filled and outline styles. Filled icons are used on the Content website and follow brand colours:
 * `Mukuru orange`, `orange on white`, and `all white`.
 * Outline icons are used on the Customer app and Transactional websites, sourced from Google Material Symbols.
 * Material icons are rounded, weight 300, and available in `16px`, `20px`, `24px`, `40px`, and `48px` sizes,
 * with stroke widths of 1.2 (20px), 1.5 (24px), 2 (40px), and 2.27 (48px). Use ariaLabel when icons are interactive but lack visible text.
 *
 */
declare const IconWrapper: react.ForwardRefExoticComponent<Omit<IconProps$1, "size"> & {
    size?: "16px" | "20px" | "24px" | "40px" | "48px";
} & react.RefAttributes<SVGSVGElement>>;

/**
 * Navigation item structure for mobile sidebar
 */
interface MobileNavigationItem {
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
interface SidebarUser {
    name: string;
    initials?: string;
    avatar?: string;
}
/**
 * Action items (Switch Partner, Log Out, etc.)
 */
interface SidebarAction {
    id: string | number;
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}
/**
 * Mobile Sidebar variant props (will be defined based on recipe)
 */
type MobileSidebarVariantProps = RecipeVariantProps<typeof mobileSidebarRecipe>;
/**
 * Service/Partner dropdown configuration
 */
interface ServiceDropdown {
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
interface MobileSidebarProps extends Omit<DrawerRootProps, "children">, MobileSidebarVariantProps {
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

/**
 * The Mobile/Tablet Navigation Menu provides access to primary navigation within a portal
 * for viewports ≤ 768px. It slides in from the side and consolidates Profile, Switch Partner,
 * and Log Out actions into the same menu, alongside the main navigation items.
 */
declare const MobileSidebar: react__default.ForwardRefExoticComponent<MobileSidebarProps & react__default.RefAttributes<HTMLDivElement>>;

declare const alertBarRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "indicator" | "content" | "title" | "description" | "closeButton" | "contentWrapper" | "textContainer" | "actionContainer" | "action", {
    status: {
        info: {
            root: {
                bg: "mukuru.teal.500";
                borderColor: "mukuru.teal.300";
                color: "mukuru.grey.600";
            };
            indicator: {
                color: "mukuru.teal.300";
            };
            title: {
                color: "mukuru.teal.300";
            };
            closeButton: {
                color: "mukuru.teal.300";
            };
        };
        success: {
            root: {
                bg: "mukuru.green.200";
                borderColor: "mukuru.green.100";
                color: "mukuru.grey.600";
            };
            indicator: {
                color: "mukuru.green.100";
            };
            title: {
                color: "mukuru.green.100";
            };
            closeButton: {
                color: "mukuru.green.100";
            };
        };
        warning: {
            root: {
                bg: "mukuru.yellow.500";
                borderColor: "mukuru.yellow.100";
                color: "mukuru.grey.600";
            };
            indicator: {
                color: "mukuru.yellow.100";
            };
            title: {
                color: "mukuru.yellow.100";
            };
            closeButton: {
                color: "mukuru.yellow.100";
            };
        };
        error: {
            root: {
                bg: "mukuru.red.700";
                borderColor: "mukuru.red.600";
                color: "mukuru.grey.600";
            };
            indicator: {
                color: "mukuru.red.600";
            };
            title: {
                color: "mukuru.red.600";
            };
            closeButton: {
                color: "mukuru.red.600";
            };
        };
    };
}>;

type AlertBarVariantProps = RecipeVariantProps<typeof alertBarRecipe>;
type AlertBarStatus = "info" | "success" | "warning" | "error";
interface AlertBarProps extends Omit<BaseHTMLAttributes<HTMLDivElement>, "title">, AlertBarVariantProps {
    /**
     * The status/type of the alert
     */
    status: AlertBarStatus;
    /**
     * Main title text for the alert
     */
    title: ReactNode;
    /**
     * Optional description text
     */
    description?: ReactNode;
    /**
     * Whether to show an icon for the status
     */
    showIcon?: boolean;
    /**
     * Whether to show a close button
     */
    showClose?: boolean;
    /**
     * Custom action button element
     */
    action?: ReactNode;
    /**
     * Callback when close button is clicked
     */
    onClose?: () => void;
    /**
     * Custom icon to override default status icon
     */
    icon?: ReactNode;
}

/**
 * The AlertBar component is used to display persistent messages for system-level communication.
 * It supports informational, success, warning, and error states, and includes optional icon,
 * close, and action button support. Use it to draw attention to system feedback without
 * disrupting the page layout.
 *
 */
declare const AlertBar: react.ForwardRefExoticComponent<AlertBarProps & react.RefAttributes<HTMLDivElement>>;

declare const portalNavigationSidebarRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "tooltip" | "navigation" | "navigationList" | "navigationItem" | "navigationItemContent" | "navigationItemIcon" | "subNavigationItem" | "divider" | "logoContainer" | "logo" | "toggleButton" | "navigationItemLabel" | "navigationItemExpand" | "subNavigation" | "helpCentre" | "flyoutContent", {
    variant: {
        expanded: {
            navigationItemIcon: {
                display: "flex";
            };
            navigationItemLabel: {
                display: "block";
            };
            navigationItemExpand: {
                display: "flex";
            };
            navigationItemContent: {
                _hover: {
                    backgroundColor: "transparent";
                };
            };
            subNavigation: {
                display: "block";
            };
            subNavigationItem: {
                fontSize: "16px";
                paddingLeft: "48px";
            };
        };
        condensed: {
            logoContainer: {
                justifyContent: "center";
            };
            navigationItem: {
                position: "relative";
                _hover: {
                    "& .flyout-trigger": {
                        display: "block";
                    };
                };
            };
            navigationItemContent: {
                justifyContent: "center";
                padding: "12px 8px";
                position: "relative";
                borderRadius: "20px";
                _hover: {
                    fontWeight: "700";
                    backgroundColor: "mukuru.orange.500";
                };
            };
            navigationItemIcon: {
                display: "flex";
                marginRight: number;
            };
            navigationItemLabel: {
                display: "none";
            };
            navigationItemExpand: {
                display: "none";
            };
            subNavigation: {
                display: "none";
            };
            subNavigationItem: {
                backgroundColor: "transparent";
                padding: "12px 16px";
                width: "100%";
                margin: "0";
                fontSize: "16px";
                textAlign: "left";
                fontWeight: "500";
                justifyContent: "flex-start";
                borderRadius: "4px";
                _hover: {
                    backgroundColor: "transparent";
                    fontWeight: "700";
                };
            };
            helpCentre: {
                display: "flex";
                justifyContent: "center";
            };
        };
    };
    state: {
        active: {
            navigationItemContent: {
                backgroundColor: "mukuru.primary";
                color: "mukuru.white";
                _hover: {
                    backgroundColor: "mukuru.primary";
                    color: "mukuru.white";
                };
            };
            subNavigationItem: {
                backgroundColor: "mukuru.buttons.inactive.orange";
                color: "mukuru.primary";
                _hover: {
                    backgroundColor: "mukuru.buttons.inactive.orange";
                    color: "mukuru.primary";
                };
            };
        };
        expanded: {
            navigationItemExpand: {
                transform: "rotate(180deg)";
            };
        };
    };
}>;

type PortalNavigationSidebarVariantProps = RecipeVariantProps<typeof portalNavigationSidebarRecipe>;
interface NavigationSubItem {
    id: string;
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
}
interface NavigationItem {
    id: string;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    subItems?: NavigationSubItem[];
    disabled?: boolean;
}
interface HelpCentreItem {
    id: string;
    label: string;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
}
interface PortalNavigationSidebarProps extends Omit<HTMLAttributes<HTMLElement>, "color">, PortalNavigationSidebarVariantProps {
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

/**
 * The sidebar provides primary navigation for desktop and tablet landscape (≥769px).
 * It supports expanded (icons + labels) and condensed (icons only) layouts, optional sub-navigation, and an optional Help Centre link.
 */
declare const PortalNavigationSidebar: react.ForwardRefExoticComponent<PortalNavigationSidebarProps & react.RefAttributes<HTMLElement>>;

type LinkVariantProps = RecipeVariantProps<typeof linkRecipe>;
interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">, LinkVariantProps {
    children?: ReactNode;
    /**
     * If true, the link will open in a new tab
     * @default false
     */
    external?: boolean;
    /**
     * If true, the link will be disabled
     * @default false
     */
    disabled?: boolean;
    /**
     * The weight of the link
     * @default "default"
     */
    weight?: "default" | "bold";
}

/**
 * The Link component provides inline navigation and contextual actions.
 * It supports two weight styles and is typically used for actions like "Edit", "View", or "Manage".
 *
 */
declare const Link: react.ForwardRefExoticComponent<LinkProps & react.RefAttributes<HTMLAnchorElement>>;

declare const typeAheadRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "label" | "content" | "item" | "trigger" | "itemGroup" | "itemGroupLabel" | "valueText" | "labelContainer" | "infoIcon" | "searchInput" | "indicatorGroup" | "clearButton" | "triggerButton" | "itemSelected" | "noResults" | "assistiveText", {
    variant: {
        default: {
            label: {
                color: "mukuru.grey.mediumDark";
            };
            searchInput: {
                border: "1px solid";
                borderColor: "mukuru.grey.medium";
            };
            assistiveText: {
                color: "mukuru.grey.medium";
            };
        };
        error: {
            label: {
                color: "mukuru.text.error";
            };
            searchInput: {
                border: "3px solid #D10007";
                _focus: {
                    borderColor: "#D10007";
                };
            };
            assistiveText: {
                color: "mukuru.text.error";
            };
        };
    };
}>;

/**
 * Variant props from recipe
 */
type TypeAheadVariantProps = RecipeVariantProps<typeof typeAheadRecipe>;
/**
 * Props for TypeAhead component
 */
interface TypeAheadProps extends TypeAheadVariantProps, Omit<MenuRootProviderProps, "value" | "children" | "variant"> {
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (option: TypeAheadOption | null) => void;
    options?: TypeAheadOption[];
    loading?: boolean;
    placeholder?: string;
    label?: string;
    helpText?: string;
    minSearchLength?: number;
    debounceDelay?: number;
    loadingMessage?: string;
    noResultsMessage?: string;
    renderOption?: (option: TypeAheadOption) => react__default.ReactNode;
    disabled?: boolean;
    error?: boolean;
    assistiveText?: string;
}
interface TypeAheadOption {
    label: string;
    value: string;
    type?: string;
    disabled?: boolean;
    onSelect?: () => void;
}

/**
 * The TypeAhead component provides predictive text input with a dropdown list of suggestions.
 * This is a fully controlled component that delegates all state management to the parent component.
 */
declare const TypeAhead: react__default.FC<TypeAheadProps>;

declare const radioDropdownRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "indicator" | "content" | "radioGroup" | "separator" | "trigger" | "clearButton" | "radioItem" | "radioItemSelected" | "groupLabel", _chakra_ui_react.SlotRecipeVariantRecord<"root" | "indicator" | "content" | "radioGroup" | "separator" | "trigger" | "clearButton" | "radioItem" | "radioItemSelected" | "groupLabel">>;

/**
 * Variant props from recipe
 */
type RadioDropdownVariantProps = RecipeVariantProps<typeof radioDropdownRecipe>;
/**
 * Props for RadioDropdown component
 */
interface RadioDropdownOption {
    label: string;
    value: string;
    disabled?: boolean;
}
interface RadioDropdownGroup {
    label?: string;
    options: RadioDropdownOption[];
}
interface RadioDropdownProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, RadioDropdownVariantProps {
    groups: RadioDropdownGroup[];
    label: string;
    onSelectionChange?: (value: string | null) => void;
    defaultValue?: string;
    showClear?: boolean;
    clearLabel?: string;
}

/**
 * The RadioDropdown component allows users to select a single option from a predefined list. It supports grouped sections, and radio-menu variants for sorting and filtering.
 *
 */
declare const RadioDropdown: {
    ({ groups, label, onSelectionChange, defaultValue, showClear, clearLabel, }: RadioDropdownProps): react_jsx_runtime.JSX.Element;
    displayName: string;
};

declare const dropdownRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "label" | "content" | "item" | "trigger" | "itemGroup" | "itemGroupLabel" | "valueText" | "labelContainer" | "infoIcon" | "searchInput" | "indicatorGroup" | "clearButton" | "triggerButton" | "itemSelected" | "noResults", _chakra_ui_react.SlotRecipeVariantRecord<"root" | "label" | "content" | "item" | "trigger" | "itemGroup" | "itemGroupLabel" | "valueText" | "labelContainer" | "infoIcon" | "searchInput" | "indicatorGroup" | "clearButton" | "triggerButton" | "itemSelected" | "noResults">>;

type DropdownVariantProps = RecipeVariantProps<typeof dropdownRecipe>;
interface DropdownOption {
    label: string;
    value: string;
    disabled?: boolean;
    type?: string;
    onSelect?: () => void;
}
interface DropdownProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, DropdownVariantProps {
    items: DropdownOption[];
    placeholder?: string;
    label?: string;
    searchPlaceholder?: string;
    helpText?: string;
    onSearchChange?: (query: string) => void;
    onSelectionChange?: (value: string) => void;
    defaultValue?: string;
}

/**
 * The Dropdown component allows users to select an option from a list of options. It supports grouped sections, and can be used as a searchable dropdown.
 */
declare const Dropdown: react__default.FC<DropdownProps>;

declare const tooltipRecipe: _chakra_ui_react.SlotRecipeDefinition<"content" | "positioner" | "trigger" | "arrow" | "arrowTip", _chakra_ui_react.SlotRecipeVariantRecord<"content" | "positioner" | "trigger" | "arrow" | "arrowTip">>;

/**
 * Variant props from recipe
 */
type TooltipVariantProps = RecipeVariantProps<typeof tooltipRecipe>;
/**
 * Props for Tooltip component
 */
interface TooltipProps extends Tooltip$1.RootProps, TooltipVariantProps {
    showArrow?: boolean;
    portalled?: boolean;
    portalRef?: react.RefObject<HTMLElement | null>;
    content: react.ReactNode;
    contentProps?: Tooltip$1.ContentProps;
    disabled?: boolean;
}

/**
 * The Tooltip component displays contextual help or supplementary information when users hover over, focus on, or tap an element. It’s often paired with an info icon to explain form fields, labels, or actions without cluttering the UI. Tooltips are accessible, themable, and responsive across breakpoints.
 */
declare const Tooltip: react.ForwardRefExoticComponent<TooltipProps & react.RefAttributes<HTMLDivElement>>;

declare const modalRecipe: _chakra_ui_react.SlotRecipeDefinition<"content" | "body" | "footer" | "header" | "title" | "positioner" | "backdrop" | "closeTrigger", {
    size: {
        small: {
            backdrop: {
                backgroundColor: "rgba(0, 0, 0, 0.6)";
            };
            content: {
                width: "500px";
                maxWidth: "90vw";
                maxHeight: "600px";
                borderRadius: "40px";
            };
        };
        large: {
            backdrop: {
                backgroundColor: "rgba(0, 0, 0, 0.6)";
            };
            content: {
                width: "800px";
                maxWidth: "90vw";
                maxHeight: "600px";
                borderRadius: "40px";
            };
        };
    };
    variant: {
        default: {};
        "with-scroll": {
            body: {
                maxHeight: "400px";
                overflowY: "auto";
            };
        };
    };
}>;

type ModalVariantProps = RecipeVariantProps<typeof modalRecipe>;
interface ModalProps extends ModalVariantProps {
    /**
     * Whether the modal is open
     */
    isOpen: boolean;
    /**
     * Callback fired when the modal is closed
     */
    onClose: () => void;
    /**
     * The content of the modal
     */
    children: ReactNode;
    /**
     * The title/heading of the modal
     */
    title?: string;
    /**
     * Whether to show the close button in the header
     */
    showCloseButton?: boolean;
    /**
     * Footer content (typically buttons like Cancel/Save)
     */
    footer?: ReactNode;
    /**
     * Whether clicking on the backdrop should close the modal
     */
    closeOnBackdropClick?: boolean;
    /**
     * Whether pressing Escape should close the modal
     */
    closeOnEsc?: boolean;
    /**
     * Custom header content (overrides title if provided)
     */
    header?: ReactNode;
    /**
     * Whether the modal content should be scrollable
     */
    scrollable?: boolean;
    /**
     * The size variant of the modal
     */
    size?: "small" | "large";
    /**
     * The variant of the modal
     */
    variant?: "default" | "with-scroll";
}
interface ModalHeaderProps {
    children: ReactNode;
    showCloseButton?: boolean;
    onClose?: () => void;
}
interface ModalBodyProps {
    children: ReactNode;
    scrollable?: boolean;
}
interface ModalFooterProps {
    children: ReactNode;
}

/**
 * Modal Header component
 * Displays the title and optional close button
 */
declare const ModalHeader: react.ForwardRefExoticComponent<ModalHeaderProps & react.RefAttributes<HTMLDivElement>>;
/**
 * Modal Body component
 * Contains the main content of the modal
 */
declare const ModalBody: react.ForwardRefExoticComponent<ModalBodyProps & react.RefAttributes<HTMLDivElement>>;
/**
 * Modal Footer component
 * Contains action buttons and footer content
 */
declare const ModalFooter: react.ForwardRefExoticComponent<ModalFooterProps & react.RefAttributes<HTMLDivElement>>;
/**
 * The Modal component displays content in a focused overlay on top of the main UI.
 * It supports both small and large layouts, and is used for actions such as editing details,
 * confirming changes, or collecting additional information without navigating away.
 *
 * Built on top of Chakra UI v3's Dialog component with SDS-specific styling.
 */
declare const Modal: react.ForwardRefExoticComponent<ModalProps & react.RefAttributes<HTMLDivElement>>;

declare const cardRecipe: _chakra_ui_react.SlotRecipeDefinition<"root" | "body" | "footer" | "header" | "title" | "description", _chakra_ui_react.SlotRecipeVariantRecord<"root" | "body" | "footer" | "header" | "title" | "description">>;

/**
 * Variant props from recipe
 */
type CardVariantProps = RecipeVariantProps<typeof cardRecipe>;
/**
 * Props for Card component
 */
interface CardProps extends Card$1.RootProps, CardVariantProps {
}

/**
 * The Card component is used to display high-level partner or system metrics such as account balances, active users, completed transactions, or top pay-out countries. Cards are visually distinct, responsive, and align to SDS tokens.
 */
declare const Card: react__default.FC<CardProps>;

type ColorModeProviderProps = ThemeProviderProps;
declare function ColorModeProvider(props: ColorModeProviderProps): react_jsx_runtime.JSX.Element;

declare function MukuruComponentProvider(props: ColorModeProviderProps): react_jsx_runtime.JSX.Element;

declare const GlobalStyles: () => react_jsx_runtime.JSX.Element;
//# sourceMappingURL=GlobalStyles.d.ts.map

type IconProps = react__default.SVGProps<SVGSVGElement>;
type IconType = (props: react__default.SVGProps<SVGSVGElement>) => react__default.JSX.Element;

declare const AddIcon: IconType;

declare const AddRecipientIcon: IconType;

declare const AffordableIcon: IconType;

declare const AirtimeIcon: IconType;

declare const AppIcon: IconType;

declare const AppleIcon: IconType;

declare const ArrowDownIcon: IconType;

declare const ArrowLeftIcon: IconType;

declare const ArrowRightIcon: IconType;

declare const ArrowUpIcon: IconType;

declare const AwardIcon: IconType;

declare const CalendarIcon: IconType;

declare const CallIcon: IconType;

declare const CameraIcon: IconType;

declare const CardIcon: IconType;

declare const CautionIcon: IconType;

declare const CheckRateIcon: IconType;

declare const ChevronLeftIcon: IconType;

declare const ChevronRightIcon: IconType;

declare const CloseIcon: IconType;

declare const CoffeeIcon: IconType;

declare const CollectionIcon: IconType;

declare const ContactsIcon: IconType;

declare const CopyIcon: IconType;

declare const CouchIcon: IconType;

declare const DeathCoverIcon: IconType;

declare const DeleteIcon: IconType;

declare const DocumentIcon: IconType;

declare const DownloadIcon: IconType;

declare const DstvIcon: IconType;

declare const EditIcon: IconType;

declare const ElectricityIcon: IconType;

declare const ErrorIcon: IconType;

declare const InfoIcon: IconType;

declare const ExchangeIcon: IconType;

declare const ExpandLessIcon: IconType;

declare const ExpandMoreIcon: IconType;

declare const ExternalAltIcon: IconType;

declare const ExternalIcon: IconType;

declare const FacebookIcon: IconType;

declare const FacebookTwoIcon: IconType;

declare const FileOpenIcon: IconType;

declare const FilterIcon: IconType;

declare const FootPrintIcon: IconType;

declare const ForwardToInboxIcon: IconType;

declare const FreeIcon: IconType;

declare const FuneralCoverIcon: IconType;

declare const GameIcon: IconType;

declare const GroceriesFilledIcon: IconType;

declare const GroceriesIcon: IconType;

declare const GroupsIcon: IconType;

declare const HeadSetIcon: IconType;

declare const HelloIcon: IconType;

declare const HelpIcon: IconType;

declare const ImageIcon: IconType;

declare const IncreaseLimitIcon: IconType;

declare const InfoFilledIcon: IconType;

declare const KeyIcon: IconType;

declare const LightBulbIcon: IconType;

declare const LinkedinIcon: IconType;

declare const LocationIcon: IconType;

declare const LogoutIcon: IconType;

declare const MailIcon: IconType;

declare const MakePaymentIcon: IconType;

declare const ManageIcon: IconType;

declare const MenuIcon: IconType;

declare const MinusIcon: IconType;

declare const MoreIcon: IconType;

declare const NotificationIcon: IconType;

declare const OpenInNewIcon: IconType;

declare const PendingIcon: IconType;

declare const PhoneIcon: IconType;

declare const PhoneInfoIcon: IconType;

declare const PhoneLockIcon: IconType;

declare const PlaceOrderIcon: IconType;

declare const PlantIcon: IconType;

declare const ProfileIcon: IconType;

declare const QuestionIcon: IconType;

declare const ReceiptIcon: IconType;

declare const RecheckIcon: IconType;

declare const RecipientsIcon: IconType;

declare const ReferAFriendIcon: IconType;

declare const RegisterIcon: IconType;

declare const RetryIcon: IconType;

declare const SalaryIcon: IconType;

declare const SearchIcon: IconType;

declare const SecureIcon: IconType;

declare const SendMoneyAltIcon: IconType;

declare const SendMoneyFilledIcon: IconType;

declare const SendMoneyIcon: IconType;

declare const SettingsIcon: IconType;

declare const ShareAltIcon: IconType;

declare const ShareIcon: IconType;

declare const StarIcon: IconType;

declare const TickCircleIcon: IconType;

declare const TickIcon: IconType;

declare const TransferIcon: IconType;

declare const TrophyIcon: IconType;

declare const TwitterIcon: IconType;

declare const UploadIcon: IconType;

declare const UssdIcon: IconType;

declare const VisibleIcon: IconType;

declare const VoucherIcon: IconType;

declare const WaitingIcon: IconType;

declare const WalletIcon: IconType;

declare const WarningIcon: IconType;

declare const WhatsappIcon: IconType;

declare const WidgetIcon: IconType;

declare const AggregatorServicesIcon: IconType;

declare const EnterprisePaymentsIcon: IconType;

declare const PayInIcon: IconType;

declare const PayOutIcon: IconType;

declare const MukuruSun: IconType;

declare const ProductIcon: IconType;

declare const UserIcon: IconType;

declare const PartnerIcon: IconType;

declare const system: _chakra_ui_react.SystemContext;

export { AddIcon, AddRecipientIcon, AffordableIcon, AggregatorServicesIcon, AirtimeIcon, AlertBar, AppIcon, AppleIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, AwardIcon, Button, CalendarIcon, CallIcon, CameraIcon, Card, CardIcon, CautionIcon, CheckRateIcon, Checkbox, ChevronLeftIcon, ChevronRightIcon, CloseIcon, CoffeeIcon, CollectionIcon, ColorModeProvider, ContactsIcon, CopyIcon, CouchIcon, DeathCoverIcon, DeleteIcon, DocumentIcon, DownloadIcon, Dropdown, DstvIcon, EditIcon, ElectricityIcon, EnterprisePaymentsIcon, ErrorIcon, ExchangeIcon, ExpandLessIcon, ExpandMoreIcon, ExternalAltIcon, ExternalIcon, FacebookIcon, FacebookTwoIcon, FileOpenIcon, FilterIcon, FootPrintIcon, ForwardToInboxIcon, FreeIcon, FuneralCoverIcon, GameIcon, GlobalStyles, GroceriesFilledIcon, GroceriesIcon, GroupsIcon, HeadSetIcon, HelloIcon, HelpIcon, IconWrapper, ImageIcon, IncreaseLimitIcon, InfoFilledIcon, InfoIcon, KeyIcon, LightBulbIcon, Link, LinkedinIcon, LocationIcon, LogoutIcon, MailIcon, MakePaymentIcon, ManageIcon, MenuIcon, MinusIcon, MobileSidebar, Modal, ModalBody, ModalFooter, ModalHeader, MoreIcon, MukuruComponentProvider, MukuruLogo, MukuruSun, Navbar, NotificationIcon, OpenInNewIcon, PartnerIcon, PayInIcon, PayOutIcon, PendingIcon, PhoneIcon, PhoneInfoIcon, PhoneLockIcon, PlaceOrderIcon, PlantIcon, PortalNavigationSidebar, ProductIcon, ProfileIcon, ProfileMenu, QuestionIcon, Radio, RadioDropdown, RadioGroup, ReceiptIcon, RecheckIcon, RecipientsIcon, ReferAFriendIcon, RegisterIcon, RetryIcon, SalaryIcon, SearchIcon, SecureIcon, SelectionMenu, SendMoneyAltIcon, SendMoneyFilledIcon, SendMoneyIcon, ServicesMenu, SettingsIcon, ShareAltIcon, ShareIcon, StarIcon, Switch, Tag, TickCircleIcon, TickIcon, Tooltip, TransferIcon, TrophyIcon, TwitterIcon, TypeAhead, Typography, UploadIcon, UserIcon, UssdIcon, VisibleIcon, VoucherIcon, WaitingIcon, WalletIcon, WarningIcon, WhatsappIcon, WidgetIcon, system as mukuruSystem };
export type { AlertBarProps, AlertBarStatus, ButtonProps, ButtonVariantProps, CardProps, CardVariantProps, CheckboxProps, CheckboxVariantProps, ColorModeProviderProps, DropdownProps, HelpCentreItem, IconProps, IconType, LinkProps, LinkVariantProps, MobileNavigationItem, MobileSidebarProps, ModalBodyProps, ModalFooterProps, ModalHeaderProps, ModalProps, ModalVariantProps, MukuruLogoProps, NavbarProps, NavigationItem, NavigationSubItem, PortalNavigationSidebarProps, PortalNavigationSidebarVariantProps, ProfileMenuProps, ProfileMenuVariantProps, RadioDropdownProps, RadioProps, RadioVariantProps, SelectionMenuProps, SelectionMenuVariantProps, ServicesMenuProps, ServicesMenuVariantProps, SidebarAction, SidebarUser, SwitchProps, TagProps, TagVariantProps, TooltipProps, TooltipVariantProps, TypeAheadProps, TypeAheadVariantProps, TypographyProps, TypographyVariantProps };
