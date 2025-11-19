import { Checkbox as ChakraCheckbox, type RecipeVariantProps } from "@chakra-ui/react";
import { checkboxRecipe } from "../../../configs/themes/checkbox.recipe";
import type { PropsWithChildren, RefObject } from "react";
/**
 * Variant props from recipe
 */
export type CheckboxVariantProps = RecipeVariantProps<typeof checkboxRecipe>;
/**
 * Props for Checkbox component
 */
export interface CheckboxProps extends PropsWithChildren<Omit<ChakraCheckbox.RootProps, "size">>, CheckboxVariantProps {
    rootRef?: RefObject<HTMLLabelElement | null>;
}
//# sourceMappingURL=Checkbox.types.d.ts.map