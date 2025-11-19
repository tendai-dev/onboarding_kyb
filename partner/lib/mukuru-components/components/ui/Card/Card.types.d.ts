import type { Card as ChakraCard } from "@chakra-ui/react";
import type { RecipeVariantProps } from "@chakra-ui/react";
import type { cardRecipe } from "../../../configs/themes/card.recipe";
/**
 * Variant props from recipe
 */
export type CardVariantProps = RecipeVariantProps<typeof cardRecipe>;
/**
 * Props for Card component
 */
export interface CardProps extends ChakraCard.RootProps, CardVariantProps {
}
//# sourceMappingURL=Card.types.d.ts.map