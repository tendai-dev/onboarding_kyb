import type { RecipeVariantProps, MenuRootProviderProps } from "@chakra-ui/react";
import type React from "react";
import type { typeAheadRecipe } from "../../../configs/themes/typeAhead.recipe";
/**
 * Variant props from recipe
 */
export type TypeAheadVariantProps = RecipeVariantProps<typeof typeAheadRecipe>;
/**
 * Props for TypeAhead component
 */
export interface TypeAheadProps extends TypeAheadVariantProps, Omit<MenuRootProviderProps, "value" | "children" | "variant"> {
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
    renderOption?: (option: TypeAheadOption) => React.ReactNode;
    disabled?: boolean;
    error?: boolean;
    assistiveText?: string;
}
export interface TypeAheadOption {
    label: string;
    value: string;
    type?: string;
    disabled?: boolean;
    onSelect?: () => void;
}
//# sourceMappingURL=TypeAhead.types.d.ts.map