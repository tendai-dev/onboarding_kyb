import { Switch as ChakraSwitch, type RecipeVariantProps } from "@chakra-ui/react";
import { switchSlotRecipe } from "../../../configs/themes/switch.recipe";
import type { PropsWithChildren, RefObject } from "react";
/**
 * Variant props from recipe
 */
export type CheckboxVariantProps = RecipeVariantProps<typeof switchSlotRecipe>;
/**
 * Props for Checkbox component
 */
export interface SwitchProps extends PropsWithChildren<Omit<ChakraSwitch.RootProps, "size">>, CheckboxVariantProps {
    rootRef?: RefObject<HTMLLabelElement | null>;
}
//# sourceMappingURL=Switch.types.d.ts.map