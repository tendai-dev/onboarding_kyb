import type { ReactNode, RefObject } from "react";
import type { MenuRootProviderProps, RecipeVariantProps } from "@chakra-ui/react";
import type { servicesMenuRecipe } from "../../../configs/themes/servicesMenu.recipe";
/**
 * Variant props from recipe
 */
export type ServicesMenuVariantProps = RecipeVariantProps<typeof servicesMenuRecipe>;
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
export interface FooterLink {
    id: string | number;
    label: string;
    description: string;
    icon: ReactNode;
    isActive?: boolean;
    onClick: () => void;
}
export interface ServicesMenuProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, ServicesMenuVariantProps {
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
export {};
//# sourceMappingURL=ServicesMenu.types.d.ts.map