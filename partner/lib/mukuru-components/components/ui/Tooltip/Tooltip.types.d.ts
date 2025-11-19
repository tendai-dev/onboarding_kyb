import type { RecipeVariantProps } from "@chakra-ui/react";
import type { tooltipRecipe } from "../../../configs/themes/tooltip.recipe";
import { Tooltip as ChakraTooltip } from "@chakra-ui/react";
import * as React from "react";
/**
 * Variant props from recipe
 */
export type TooltipVariantProps = RecipeVariantProps<typeof tooltipRecipe>;
/**
 * Props for Tooltip component
 */
export interface TooltipProps extends ChakraTooltip.RootProps, TooltipVariantProps {
    showArrow?: boolean;
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement | null>;
    content: React.ReactNode;
    contentProps?: ChakraTooltip.ContentProps;
    disabled?: boolean;
}
//# sourceMappingURL=Tooltip.types.d.ts.map