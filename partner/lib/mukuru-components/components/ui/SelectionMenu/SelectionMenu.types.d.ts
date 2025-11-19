import type { ReactNode, RefObject } from "react";
import type { RecipeVariantProps, MenuRootProviderProps } from "@chakra-ui/react";
import type { menuRecipe } from "../../../configs/themes/menu.recipe";
/**
 * Variant props from recipe
 */
export type SelectionMenuVariantProps = RecipeVariantProps<typeof menuRecipe>;
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
export interface SelectionMenuProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, SelectionMenuVariantProps {
    activeId?: string | number;
    onToggle?: () => void;
    icon?: ReactNode;
    label?: string;
    menuItems?: SelectionMenuItem[];
    open?: boolean;
    rootRef?: RefObject<HTMLElement | null>;
}
export {};
//# sourceMappingURL=SelectionMenu.types.d.ts.map