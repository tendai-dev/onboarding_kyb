import { Tabs as ChakraTabs, type RecipeVariantProps } from "@chakra-ui/react";
import { tabsSlotRecipe } from "../../../configs/themes/tabs.recipe";
import type { PropsWithChildren, RefObject } from "react";
/**
 * Variant props from recipe
 */
export type TabsVariantProps = RecipeVariantProps<typeof tabsSlotRecipe>;
/**
 * Props for Checkbox component
 */
export interface TabProps extends PropsWithChildren<Omit<ChakraTabs.RootProps, "size">>, TabsVariantProps {
    rootRef?: RefObject<HTMLLabelElement | null>;
}
//# sourceMappingURL=Tabs.types.d.ts.map