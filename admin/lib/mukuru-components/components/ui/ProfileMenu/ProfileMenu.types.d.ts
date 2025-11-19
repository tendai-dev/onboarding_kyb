import type { ReactNode } from "react";
import type { MenuRootProviderProps, RecipeVariantProps } from "@chakra-ui/react";
import type { profileMenuRecipe } from "../../../configs/themes/profileMenu.recipe";
/**
 * Variant props from recipe
 */
export type ProfileMenuVariantProps = RecipeVariantProps<typeof profileMenuRecipe>;
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
export interface ProfileMenuProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, ProfileMenuVariantProps {
    user: string;
    menuItems?: ProfileMenuItem[];
}
export {};
//# sourceMappingURL=ProfileMenu.types.d.ts.map