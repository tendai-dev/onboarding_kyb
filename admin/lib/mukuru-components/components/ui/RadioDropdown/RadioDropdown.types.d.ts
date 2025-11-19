import type { MenuRootProviderProps, RecipeVariantProps } from "@chakra-ui/react";
import type { radioDropdownRecipe } from "../../../configs/themes/radioDropdown.recipe";
/**
 * Variant props from recipe
 */
export type RadioDropdownVariantProps = RecipeVariantProps<typeof radioDropdownRecipe>;
/**
 * Props for RadioDropdown component
 */
export interface RadioDropdownOption {
    label: string;
    value: string;
    disabled?: boolean;
}
export interface RadioDropdownGroup {
    label?: string;
    options: RadioDropdownOption[];
}
export interface RadioDropdownProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, RadioDropdownVariantProps {
    groups: RadioDropdownGroup[];
    label: string;
    onSelectionChange?: (value: string | null) => void;
    defaultValue?: string;
    showClear?: boolean;
    clearLabel?: string;
}
//# sourceMappingURL=RadioDropdown.types.d.ts.map