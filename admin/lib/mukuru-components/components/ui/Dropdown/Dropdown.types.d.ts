import { MenuRootProviderProps, RecipeVariantProps } from "@chakra-ui/react";
import { dropdownRecipe } from "../../../configs/themes/dropdown.recipe";
export type DropdownVariantProps = RecipeVariantProps<typeof dropdownRecipe>;
export interface DropdownOption {
    label: string;
    value: string;
    disabled?: boolean;
    type?: string;
    onSelect?: () => void;
}
export interface DropdownProps extends Omit<MenuRootProviderProps, "variant" | "children" | "value">, DropdownVariantProps {
    items: DropdownOption[];
    placeholder?: string;
    label?: string;
    searchPlaceholder?: string;
    helpText?: string;
    onSearchChange?: (query: string) => void;
    onSelectionChange?: (value: string) => void;
    defaultValue?: string;
}
//# sourceMappingURL=Dropdown.types.d.ts.map